// All backend operations for PayPoint: accounts, sessions, applications,
// task rewards and withdrawals. Server-only — this module is loaded through
// dynamic imports inside server-function handlers, so it never reaches the
// browser bundle.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import {
  DAILY_LIMIT,
  DOMAINS,
  MIN_WITHDRAW,
  PAYMENTS,
  TASKS,
  doneToday,
  taskLink,
  today,
  withdrawalOpen,
  type Application,
  type User,
} from "../lib/catalog";
import {
  createSession,
  findSession,
  mutate,
  readDb,
  toPublicUser,
  type Db,
  type StoredUser,
} from "./db";

export const SESSION_COOKIE = "pp_session";
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

export type OpResult = { error: string | null; user: User | null; warning?: string };

async function sendWithdrawalAlert(withdrawal: {
  username: string;
  amount: number;
  id: string;
  method: string;
  number: string;
}): Promise<string | null> {
  const accessKey = process.env["WEB3FORMS_ACCESS_KEY"];
  if (!accessKey) {
    console.error("Withdrawal email alert not sent: WEB3FORMS_ACCESS_KEY is not configured.");
    return "The withdrawal was saved, but its email alert could not be sent.";
  }

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "New withdrawal request — PayPoint",
        from_name: "PayPoint",
        name: `@${withdrawal.username}`,
        message: [
          `User: @${withdrawal.username}`,
          `Amount: ${withdrawal.amount} EUR`,
          `Payment method: ${withdrawal.method}`,
          `Mobile Money number: ${withdrawal.number}`,
          `Withdrawal ID: ${withdrawal.id}`,
          "Note: This is a demo withdrawal request; no real payment was sent.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const result: unknown = await response.json();
    if (
      !response.ok ||
      !result ||
      typeof result !== "object" ||
      !("success" in result) ||
      result.success !== true
    ) {
      console.error("Web3Forms rejected the withdrawal email alert.", { status: response.status });
      return "The withdrawal was saved, but its email alert could not be sent.";
    }
    return null;
  } catch (error) {
    console.error("Failed to send the withdrawal email alert through Web3Forms.", error);
    return "The withdrawal was saved, but its email alert could not be sent.";
  }
}

// --- passwords -------------------------------------------------------------

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// --- session cookies -------------------------------------------------------

function readToken(): string | undefined {
  return getCookie(SESSION_COOKIE);
}

function startSession(token: string): void {
  setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_S,
  });
}

function sessionUser(db: Db): StoredUser | null {
  return findSession(db, readToken());
}

// --- reads -----------------------------------------------------------------

export async function me(): Promise<User | null> {
  const user = sessionUser(await readDb());
  return user ? toPublicUser(user) : null;
}

// --- accounts --------------------------------------------------------------

export async function signup(input: {
  username: string;
  password: string;
  confirm: string;
}): Promise<OpResult> {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    return { error: "Username: 3–20 letters, numbers or _", user: null };
  if (input.password.length < 6)
    return { error: "Password must be at least 6 characters", user: null };
  if (input.password !== input.confirm) return { error: "Passwords do not match", user: null };
  const passwordHash = hashPassword(input.password);

  const outcome = await mutate((db) => {
    if (db.users[username]) return { ok: false as const, error: "Username already taken" };
    const user: StoredUser = {
      username,
      passwordHash,
      balance: 0,
      completed: [],
      withdrawals: [],
      proofs: [],
      simulateSaturday: false,
      createdAt: Date.now(),
    };
    db.users[username] = user;
    const token = createSession(db, username);
    return { ok: true as const, token, user: toPublicUser(user) };
  });

  if (!outcome.ok) return { error: outcome.error, user: null };
  startSession(outcome.token);
  return { error: null, user: outcome.user };
}

export async function login(input: { username: string; password: string }): Promise<OpResult> {
  const username = input.username.trim().toLowerCase();
  const outcome = await mutate((db) => {
    const user = db.users[username];
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      return { ok: false as const, error: "Wrong username or password" };
    }
    const token = createSession(db, user.username);
    return { ok: true as const, token, user: toPublicUser(user) };
  });

  if (!outcome.ok) return { error: outcome.error, user: null };
  startSession(outcome.token);
  return { error: null, user: outcome.user };
}

export async function logout(): Promise<OpResult> {
  const token = readToken();
  await mutate((db) => {
    if (token) delete db.sessions[token];
  });
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { error: null, user: null };
}

// --- applications ----------------------------------------------------------

export async function submitApplication(
  input: Omit<Application, "status" | "submittedAt">,
): Promise<OpResult> {
  if (input.fullName.trim().length < 3) return { error: "Enter your full name", user: null };
  if (!/^\+?\d{8,15}$/.test(input.phone.replace(/\s/g, "")))
    return { error: "Enter a valid phone number", user: null };
  if (!input.domains.length || !input.domains.every((d) => DOMAINS.some((x) => x.id === d))) {
    return { error: "Select at least one domain", user: null };
  }
  if (!input.cv || !input.coverLetter) return { error: "Add your CV and cover letter", user: null };
  if (!PAYMENTS[input.country]?.includes(input.payment))
    return { error: "Choose a payment method", user: null };

  return mutate((db) => {
    const user = sessionUser(db);
    if (!user) return { error: "Not signed in", user: null };
    user.application = {
      fullName: input.fullName.trim().slice(0, 100),
      country: input.country,
      phone: input.phone,
      domains: [...input.domains],
      motivation: input.motivation.slice(0, 500),
      payment: input.payment,
      cv: input.cv,
      coverLetter: input.coverLetter,
      submittedAt: Date.now(),
      status: "pending",
    };
    return { error: null, user: toPublicUser(user) };
  });
}

export async function approveApplication(): Promise<OpResult> {
  return mutate((db) => {
    const user = sessionUser(db);
    if (!user) return { error: "Not signed in", user: null };
    if (user.application) user.application.status = "accepted";
    return { error: null, user: toPublicUser(user) };
  });
}

// --- tasks -----------------------------------------------------------------

export async function completeTask(taskId: string, link: string): Promise<OpResult> {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) return { error: "Unknown task", user: null };

  return mutate((db) => {
    const user = sessionUser(db);
    if (!user) return { error: "Not signed in", user: null };
    const app = user.application;
    if (!app || app.status !== "accepted")
      return { error: "Complete your application first", user: null };
    if (!app.domains.includes(task.domain))
      return { error: "This task is not in one of your chosen domains", user: null };
    if (link.trim() !== taskLink(user.username, task.id))
      return { error: "Paste the exact task link as proof", user: null };
    if (doneToday(user, task.id).length) return { error: "Task already done today", user: null };
    if (doneToday(user).length >= DAILY_LIMIT)
      return { error: "Daily task limit reached", user: null };

    user.completed.push(`${today()}:${task.id}`);
    user.balance += task.reward;
    user.proofs.unshift({ taskId: task.id, date: new Date().toISOString(), link: link.trim() });
    return { error: null, user: toPublicUser(user) };
  });
}

// --- withdrawals -----------------------------------------------------------

const WITHDRAWAL_ID = /^[A-Za-z0-9-]{8,64}$/;

function requireAccepted(user: StoredUser): string | null {
  if (!user.application || user.application.status !== "accepted")
    return "Complete your application first";
  return null;
}

export async function requestWithdrawal(input: {
  amount: number;
  method: string;
  number: string;
  id: string;
}): Promise<OpResult> {
  const result = await mutate((db) => {
    const user = sessionUser(db);
    if (!user) return { error: "Not signed in", user: null };
    const blocked = requireAccepted(user);
    if (blocked) return { error: blocked, user: null };
    if (!withdrawalOpen(user))
      return { error: "Withdrawals are only open on Saturdays from 10:00 to 15:00", user: null };
    if (!Number.isFinite(input.amount) || input.amount < MIN_WITHDRAW)
      return { error: `Minimum withdrawal is ${MIN_WITHDRAW} €`, user: null };
    if (!input.method.trim()) return { error: "Choose a payment method", user: null };
    if (!/^[+]?\d{8,15}$/.test(input.number.replace(/\s/g, "")))
      return { error: "Enter a valid mobile money number", user: null };
    // Request-integrity checks come before state checks: a malformed or already
    // used id (a replayed request) is invalid regardless of the balance.
    if (!WITHDRAWAL_ID.test(input.id) || user.withdrawals.some((w) => w.id === input.id)) {
      return { error: "Invalid withdrawal request", user: null };
    }
    if (input.amount > user.balance)
      return { error: "Amount is higher than your balance", user: null };

    user.balance -= input.amount;
    user.withdrawals.unshift({
      id: input.id,
      amount: input.amount,
      method: input.method,
      number: input.number,
      date: new Date().toISOString(),
      status: "processing",
      demo: true,
    });
    return { error: null, user: toPublicUser(user) };
  });
  if (result.error || !result.user) return result;

  const warning = await sendWithdrawalAlert({
    username: result.user.username,
    amount: input.amount,
    id: input.id,
    method: input.method,
    number: input.number,
  });
  return warning ? { ...result, warning } : result;
}

export async function createDemoWithdrawal(id: string): Promise<OpResult> {
  return mutate((db) => {
    const user = sessionUser(db);
    if (!user) return { error: "Not signed in", user: null };
    const blocked = requireAccepted(user);
    if (blocked) return { error: blocked, user: null };
    if (!WITHDRAWAL_ID.test(id) || user.withdrawals.some((w) => w.id === id)) {
      return { error: "Invalid withdrawal request", user: null };
    }

    const method = user.application?.payment ?? "MTN Mobile Money";
    const number = user.application?.phone ?? "+237600000000";
    user.withdrawals.unshift({
      id,
      amount: MIN_WITHDRAW,
      method,
      number,
      date: new Date().toISOString(),
      status: "processing",
      demo: true,
    });
    return { error: null, user: toPublicUser(user) };
  });
}

// --- demo helpers ----------------------------------------------------------

export async function setSimulateSaturday(value: boolean): Promise<OpResult> {
  return mutate((db) => {
    const user = sessionUser(db);
    if (!user) return { error: "Not signed in", user: null };
    user.simulateSaturday = value;
    return { error: null, user: toPublicUser(user) };
  });
}
