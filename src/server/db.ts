// File-backed database for PayPoint. The data lives in `.data/paypoint.json`
// so accounts, balances and withdrawals survive reloads and server restarts.
// Reads/writes are synchronous inside a single event-loop turn, which keeps
// every read-modify-write cycle atomic for this single-process dev/preview
// server; swap this module for a hosted database when the app scales.

import fs from "node:fs";
import path from "node:path";

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

export function loadDb(): Db {
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

export function saveDb(db: Db): void {
  fs.mkdirSync(dbDir(), { recursive: true });
  const target = dbFile();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, target);
}

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

// Read access: applies time transitions and persists them when they fired.
export function readDb(): Db {
  const db = loadDb();
  if (applyTimeTransitions(db)) saveDb(db);
  return db;
}

// Write access: runs `fn` and persists whatever it changed, in the same
// synchronous turn so concurrent handlers cannot interleave.
export function mutate<T>(fn: (db: Db) => T): T {
  const db = loadDb();
  applyTimeTransitions(db);
  const result = fn(db);
  saveDb(db);
  return result;
}

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
