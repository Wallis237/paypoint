// Database for PayPoint with two backends behind one async API:
//
// - File (default): `.data/paypoint.json` at the project root. Read/write stays
//   synchronous inside one event-loop turn, which keeps every read-modify-write
//   cycle atomic for the single-process dev/preview server. This is what tests
//   and local development use.
// - MongoDB (when MONGODB_URI is set): used by the Vercel production build,
//   where the filesystem is read-only and instances are isolated, so a file
//   cannot store accounts. Reads and writes go to the `users` and `sessions`
//   collections; each mutation re-reads, diffs and upserts only the documents
//   that changed. Concurrent writes to the *same* document from two instances
//   are last-write-wins — fine at this app's scale, and every individual
//   document stays internally consistent.
//
// Swap in a hosted database with transactions when the app scales.

import fs from "node:fs";
import path from "node:path";

import { MongoClient, type AnyBulkWriteOperation, type Db as MongoDb } from "mongodb";

import {
  DEMO_WITHDRAWAL_MS,
  REVIEW_MS,
  type Application,
  type Proof,
  type User,
  type Withdrawal,
} from "../lib/catalog";

const DB_VERSION = 1;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type StoredUser = {
  username: string;
  passwordHash: string;
  balance: number;
  completed: string[];
  withdrawals: Withdrawal[];
  proofs: Proof[];
  application?: Application;
  simulateSaturday: boolean;
  createdAt: number;
};

export type Session = { username: string; expiresAt: number };

export type Db = {
  version: number;
  users: Record<string, StoredUser>;
  sessions: Record<string, Session>;
};

let cache: Db | null = null;

function mongoUri(): string | undefined {
  return process.env["MONGODB_URI"];
}

function dbDir() {
  // PAYPOINT_DB_DIR lets tests point at an isolated directory; the app
  // itself always uses .data/ at the project root.
  return process.env["PAYPOINT_DB_DIR"] ?? path.join(process.cwd(), ".data");
}

function dbFile() {
  return path.join(dbDir(), "paypoint.json");
}

function emptyDb(): Db {
  return { version: DB_VERSION, users: {}, sessions: {} };
}

function normalizeUser(raw: unknown): StoredUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Partial<StoredUser>;
  if (typeof u.username !== "string" || typeof u.passwordHash !== "string") return null;
  return {
    username: u.username,
    passwordHash: u.passwordHash,
    balance: typeof u.balance === "number" ? u.balance : 0,
    completed: Array.isArray(u.completed) ? u.completed : [],
    withdrawals: Array.isArray(u.withdrawals) ? u.withdrawals : [],
    proofs: Array.isArray(u.proofs) ? u.proofs : [],
    ...(u.application ? { application: u.application } : {}),
    simulateSaturday: u.simulateSaturday === true,
    createdAt: typeof u.createdAt === "number" ? u.createdAt : Date.now(),
  };
}

function normalize(raw: unknown): Db {
  if (!raw || typeof raw !== "object") return emptyDb();
  const r = raw as Partial<Db>;
  const users: Record<string, StoredUser> = {};
  if (r.users && typeof r.users === "object") {
    for (const [key, value] of Object.entries(r.users)) {
      const user = normalizeUser(value);
      if (user) users[key] = user;
    }
  }
  const sessions: Record<string, Session> = {};
  if (r.sessions && typeof r.sessions === "object") {
    for (const [key, value] of Object.entries(r.sessions)) {
      const session = value as Partial<Session> | undefined;
      if (
        session &&
        typeof session.username === "string" &&
        typeof session.expiresAt === "number"
      ) {
        sessions[key] = { username: session.username, expiresAt: session.expiresAt };
      }
    }
  }
  return { version: DB_VERSION, users, sessions };
}

// --- file backend (dev, preview, tests) ------------------------------------

function loadDb(): Db {
  if (cache) return cache;
  let raw: unknown = null;
  try {
    raw = JSON.parse(fs.readFileSync(dbFile(), "utf8"));
  } catch {
    raw = null;
  }
  cache = normalize(raw);
  return cache;
}

function saveDb(db: Db): void {
  fs.mkdirSync(dbDir(), { recursive: true });
  const target = dbFile();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, target);
}

// --- mongodb backend (production when MONGODB_URI is set) ------------------

let client: MongoClient | null = null;

async function mongo(): Promise<MongoDb> {
  const uri = mongoUri();
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
  }
  return client.db("paypoint");
}

async function loadFromMongo(): Promise<Db> {
  const m = await mongo();
  const [users, sessions] = await Promise.all([
    m.collection("users").find().toArray(),
    m.collection("sessions").find().toArray(),
  ]);
  return normalize({
    users: Object.fromEntries(users.map((doc) => [doc["username"], doc])),
    sessions: Object.fromEntries(sessions.map((doc) => [doc["token"], doc])),
  });
}

async function persistDiff(before: Db, after: Db): Promise<void> {
  const userOps: AnyBulkWriteOperation[] = [];
  for (const [username, user] of Object.entries(after.users)) {
    if (JSON.stringify(user) !== JSON.stringify(before.users[username])) {
      userOps.push({ replaceOne: { filter: { username }, replacement: user, upsert: true } });
    }
  }
  const sessionOps: AnyBulkWriteOperation[] = [];
  const removedTokens: string[] = [];
  for (const [token, session] of Object.entries(after.sessions)) {
    if (JSON.stringify(session) !== JSON.stringify(before.sessions[token])) {
      sessionOps.push({
        replaceOne: { filter: { token }, replacement: { token, ...session }, upsert: true },
      });
    }
  }
  for (const token of Object.keys(before.sessions)) {
    if (!after.sessions[token]) removedTokens.push(token);
  }
  if (!userOps.length && !sessionOps.length && !removedTokens.length) return;
  const m = await mongo();
  if (userOps.length) await m.collection("users").bulkWrite(userOps);
  if (sessionOps.length) await m.collection("sessions").bulkWrite(sessionOps);
  if (removedTokens.length)
    await m.collection("sessions").deleteMany({ token: { $in: removedTokens } });
}

// --- shared time transitions -----------------------------------------------

// Time-based transitions that must happen even when nobody writes:
// applications are auto-approved after the review window and demo withdrawals
// are marked paid once their simulation elapses. Returns true when mutated.
export function applyTimeTransitions(db: Db, now = Date.now()): boolean {
  let changed = false;

  for (const user of Object.values(db.users)) {
    const app = user.application;
    if (app && app.status === "pending" && now >= app.submittedAt + REVIEW_MS) {
      app.status = "accepted";
      changed = true;
    }
    for (const withdrawal of user.withdrawals) {
      if (
        withdrawal.status === "processing" &&
        withdrawal.demo &&
        now >= Date.parse(withdrawal.date) + DEMO_WITHDRAWAL_MS
      ) {
        withdrawal.status = "paid";
        changed = true;
      }
    }
  }

  for (const [token, session] of Object.entries(db.sessions)) {
    if (now >= session.expiresAt) {
      delete db.sessions[token];
      changed = true;
    }
  }

  return changed;
}

// --- public async API -------------------------------------------------------

// Read access: applies time transitions and persists them when they fired.
export async function readDb(): Promise<Db> {
  if (mongoUri()) {
    const db = await loadFromMongo();
    const before = structuredClone(db);
    if (applyTimeTransitions(db)) await persistDiff(before, db);
    return db;
  }
  const db = loadDb();
  if (applyTimeTransitions(db)) saveDb(db);
  return db;
}

// Write access: runs `fn` and persists whatever it changed. On the file
// backend the load→fn→save sequence contains no await, so concurrent handlers
// cannot interleave; on MongoDB the same happens per document via upserts.
export async function mutate<T>(fn: (db: Db) => T): Promise<T> {
  if (mongoUri()) {
    const db = await loadFromMongo();
    const before = structuredClone(db);
    applyTimeTransitions(db);
    const result = fn(db);
    await persistDiff(before, db);
    return result;
  }
  const db = loadDb();
  applyTimeTransitions(db);
  const result = fn(db);
  saveDb(db);
  return result;
}

// --- sessions and shaping ---------------------------------------------------

export function createSession(db: Db, username: string, now = Date.now()): string {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  db.sessions[token] = { username, expiresAt: now + SESSION_TTL_MS };
  return token;
}

export function findSession(db: Db, token: string | undefined): StoredUser | null {
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  const user = db.users[session.username];
  if (!user) return null;
  return user;
}

export function toPublicUser(user: StoredUser): User {
  return {
    username: user.username,
    balance: user.balance,
    completed: [...user.completed],
    withdrawals: user.withdrawals.map((w) => ({ ...w })),
    proofs: user.proofs.map((p) => ({ ...p })),
    ...(user.application
      ? { application: { ...user.application, domains: [...user.application.domains] } }
      : {}),
    simulateSaturday: user.simulateSaturday,
  };
}
