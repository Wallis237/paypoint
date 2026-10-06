// Targeted tests for the backend added in this change: accounts/sessions,
// applications, task rewards and withdrawals. The cookie layer is mocked so
// each test drives the real api.ts + db.ts code against an isolated temp
// database directory (never the dev .data/ store). MONGODB_URI is removed for
// the run so the tests always exercise the file backend and never a real
// database, even when the surrounding shell has credentials set.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DAILY_LIMIT,
  DEMO_WITHDRAWAL_MS,
  MIN_WITHDRAW,
  REVIEW_MS,
  TASKS,
  taskLink,
  type Application,
  type Domain,
  type User,
} from "@/lib/catalog";

const session = vi.hoisted(() => ({ cookies: new Map<string, string>() }));

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: (name: string) => session.cookies.get(name),
  setCookie: (name: string, value: string) => void session.cookies.set(name, value),
  deleteCookie: (name: string) => void session.cookies.delete(name),
}));

type Api = typeof import("../server/api");

let api: Api;
let originalDbDir: string | undefined;
const tempDirs: string[] = [];

async function loadApi(): Promise<Api> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paypoint-test-"));
  tempDirs.push(dir);
  process.env["PAYPOINT_DB_DIR"] = dir;
  session.cookies.clear();
  vi.resetModules();
  api = await import("../server/api");
  return api;
}

function requireUser(result: { user: unknown }): User {
  expect(result.user).not.toBeNull();
  return result.user as User;
}

async function createUser(): Promise<User> {
  const username = `alice_${Math.random().toString(36).slice(2, 10)}`;
  const result = await api.signup({ username, password: "secret12", confirm: "secret12" });
  expect(result.error).toBeNull();
  return requireUser(result);
}

const ALL_DOMAINS: Domain[] = ["products", "crypto", "celebrities", "videos"];

function appInput(domains: Domain[]): Omit<Application, "status" | "submittedAt"> {
  return {
    fullName: "Alice Test",
    country: "Cameroon",
    phone: "+237670000001",
    domains,
    motivation: "Hello",
    payment: "MTN Mobile Money",
    cv: "cv.pdf",
    coverLetter: "cover.pdf",
  };
}

const withdrawalId = () => `wd-${Math.random().toString(36).slice(2, 12)}`;
const WD = (id: string) => ({
  amount: 2000,
  method: "MTN Mobile Money",
  number: "+237670000001",
  id,
});

beforeAll(() => {
  originalDbDir = process.env["PAYPOINT_DB_DIR"];
  // Force the file backend: these tests must never talk to a real MongoDB.
  delete process.env["MONGODB_URI"];
});

afterAll(() => {
  if (originalDbDir === undefined) delete process.env["PAYPOINT_DB_DIR"];
  else process.env["PAYPOINT_DB_DIR"] = originalDbDir;
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("accounts and sessions", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("signs up, opens a session and never exposes credentials", async () => {
    const result = await api.signup({
      username: "alice_1",
      password: "secret12",
      confirm: "secret12",
    });
    expect(result.error).toBeNull();
    const user = requireUser(result);
    expect(user.username).toBe("alice_1");
    expect(user.balance).toBe(0);
    expect(JSON.stringify(user)).not.toMatch(/password/i);
    expect((await api.me())?.username).toBe("alice_1");
  });

  it("rejects invalid and duplicate signups", async () => {
    expect(
      (await api.signup({ username: "x", password: "secret12", confirm: "secret12" })).error,
    ).toBe("Username: 3–20 letters, numbers or _");
    expect(
      (await api.signup({ username: "alice_2", password: "short", confirm: "short" })).error,
    ).toBe("Password must be at least 6 characters");
    expect(
      (await api.signup({ username: "alice_2", password: "secret12", confirm: "secret13" })).error,
    ).toBe("Passwords do not match");
    expect(
      (await api.signup({ username: "alice_3", password: "secret12", confirm: "secret12" })).error,
    ).toBeNull();
    expect(
      (await api.signup({ username: "alice_3", password: "secret12", confirm: "secret12" })).error,
    ).toBe("Username already taken");
  });

  it("validates login and clears the session on logout", async () => {
    const user = await createUser();
    session.cookies.clear();
    expect(await api.me()).toBeNull();
    expect((await api.login({ username: user.username, password: "nope" })).error).toBe(
      "Wrong username or password",
    );
    expect(await api.me()).toBeNull();
    expect((await api.login({ username: user.username, password: "secret12" })).error).toBeNull();
    expect((await api.me())?.username).toBe(user.username);
    expect((await api.logout()).user).toBeNull();
    expect(await api.me()).toBeNull();
  });

  it("persists accounts across a server restart", async () => {
    const user = await createUser();
    vi.resetModules();
    api = await import("../server/api");
    expect((await api.me())?.username).toBe(user.username);
  });
});

describe("applications", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("stores a pending application and validates input", async () => {
    expect((await api.submitApplication(appInput(["products"]))).error).toBe("Not signed in");
    await createUser();
    expect((await api.submitApplication(appInput([]))).error).toBe("Select at least one domain");
    expect((await api.submitApplication({ ...appInput(["products"]), phone: "abc" })).error).toBe(
      "Enter a valid phone number",
    );
    const result = await api.submitApplication(appInput(["products", "videos"]));
    expect(result.error).toBeNull();
    expect(requireUser(result).application?.status).toBe("pending");
  });

  it("auto-approves after the review window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-02T09:00:00Z"));
    await loadApi();
    await createUser();
    expect((await api.submitApplication(appInput(["products"]))).error).toBeNull();
    expect((await api.me())?.application?.status).toBe("pending");
    vi.setSystemTime(Date.now() + REVIEW_MS + 1000);
    expect((await api.me())?.application?.status).toBe("accepted");
  });
});

describe("tasks", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("gates tasks behind an accepted application and a session", async () => {
    const user = await createUser();
    const link = taskLink(user.username, "p1");
    expect((await api.completeTask("p1", link)).error).toBe("Complete your application first");
    await api.submitApplication(appInput(ALL_DOMAINS));
    expect((await api.completeTask("p1", link)).error).toBe("Complete your application first");
    session.cookies.clear();
    expect((await api.completeTask("p1", link)).error).toBe("Not signed in");
    session.cookies.set("pp_session", "restored");
    await api.login({ username: user.username, password: "secret12" });
    expect((await api.approveApplication()).user?.application?.status).toBe("accepted");
  });

  it("validates proof link and domain, then credits the reward once", async () => {
    const user = await createUser();
    await api.submitApplication(appInput(["products", "videos"]));
    await api.approveApplication();

    expect((await api.completeTask("p1", "https://example.com/wrong")).error).toBe(
      "Paste the exact task link as proof",
    );
    expect((await api.completeTask("c1", taskLink(user.username, "c1"))).error).toBe(
      "This task is not in one of your chosen domains",
    );

    const done = await api.completeTask("p1", taskLink(user.username, "p1"));
    expect(done.error).toBeNull();
    expect(requireUser(done).balance).toBe(50);
    expect(requireUser(done).completed).toHaveLength(1);
    expect(requireUser(done).proofs[0]?.taskId).toBe("p1");

    expect((await api.completeTask("p1", taskLink(user.username, "p1"))).error).toBe(
      "Task already done today",
    );
    expect((await api.me())?.balance).toBe(50);
  });

  it("enforces the daily task limit", async () => {
    const user = await createUser();
    await api.submitApplication(appInput(ALL_DOMAINS));
    await api.approveApplication();
    for (const task of TASKS.slice(0, DAILY_LIMIT)) {
      expect((await api.completeTask(task.id, taskLink(user.username, task.id))).error).toBeNull();
    }
    const nextTask = TASKS[DAILY_LIMIT];
    expect(nextTask).toBeDefined();
    if (!nextTask) return;
    expect((await api.completeTask(nextTask.id, taskLink(user.username, nextTask.id))).error).toBe(
      "Daily task limit reached",
    );
    expect((await api.me())?.balance).toBe(DAILY_LIMIT * 50);
  });
});

describe("withdrawals", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("enforces minimum, format and balance rules while the window is open", async () => {
    await createUser();
    await api.submitApplication(appInput(ALL_DOMAINS));
    await api.approveApplication();
    expect((await api.setSimulateSaturday(true)).user?.simulateSaturday).toBe(true);

    expect((await api.requestWithdrawal({ ...WD(withdrawalId()), amount: 100 })).error).toBe(
      `Minimum withdrawal is ${MIN_WITHDRAW} €`,
    );
    expect((await api.requestWithdrawal({ ...WD(withdrawalId()), method: "" })).error).toBe(
      "Choose a payment method",
    );
    expect((await api.requestWithdrawal({ ...WD(withdrawalId()), number: "abc" })).error).toBe(
      "Enter a valid mobile money number",
    );
    expect((await api.requestWithdrawal(WD(withdrawalId()))).error).toBe(
      "Amount is higher than your balance",
    );
  });

  it("closes the window outside Saturday 10:00–15:00", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-04T12:00:00Z")); // a Wednesday
    await loadApi();
    await createUser();
    await api.submitApplication(appInput(ALL_DOMAINS));
    await api.approveApplication();
    expect((await api.me())?.simulateSaturday).toBe(false);
    expect((await api.requestWithdrawal(WD(withdrawalId()))).error).toBe(
      "Withdrawals are only open on Saturdays from 10:00 to 15:00",
    );
  });

  it("accumulates earnings across days and pays out the balance", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const base = new Date("2026-03-02T12:00:00Z"); // a Monday
    vi.setSystemTime(base);
    await loadApi();
    const user = await createUser();
    await api.submitApplication(appInput(ALL_DOMAINS));
    await api.approveApplication();
    await api.setSimulateSaturday(true);

    const dailyTasks = TASKS.slice(0, DAILY_LIMIT);
    for (let day = 0; day < 5; day++) {
      vi.setSystemTime(base.getTime() + day * 24 * 60 * 60 * 1000);
      for (const task of dailyTasks) {
        expect(
          (await api.completeTask(task.id, taskLink(user.username, task.id))).error,
        ).toBeNull();
      }
    }
    expect((await api.me())?.balance).toBe(5 * DAILY_LIMIT * 50);

    const id = withdrawalId();
    const result = await api.requestWithdrawal({ ...WD(id), method: "Orange Money" });
    expect(result.error).toBeNull();
    expect(requireUser(result).balance).toBe(0);
    expect(requireUser(result).withdrawals.find((w) => w.id === id)?.status).toBe("processing");
    expect((await api.requestWithdrawal({ ...WD(id), method: "Orange Money" })).error).toBe(
      "Invalid withdrawal request",
    );
  });

  it("marks demo payouts paid once the simulation elapses", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const base = new Date("2026-03-02T12:00:00Z");
    vi.setSystemTime(base);
    await loadApi();
    await createUser();
    await api.submitApplication(appInput(ALL_DOMAINS));
    await api.approveApplication();

    const id = withdrawalId();
    expect((await api.createDemoWithdrawal(id)).error).toBeNull();
    expect((await api.me())?.withdrawals.find((w) => w.id === id)?.status).toBe("processing");

    vi.setSystemTime(base.getTime() + DEMO_WITHDRAWAL_MS + 500);
    expect((await api.me())?.withdrawals.find((w) => w.id === id)?.status).toBe("paid");
  });
});
