// Targeted tests for the backend added in this change: accounts/sessions,
// applications, task rewards and withdrawals. The cookie layer is mocked so
// each test drives the real api.ts + db.ts code against an isolated temp
// database directory (never the dev .data/ store).

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

function createUser(): User {
  const username = `alice_${Math.random().toString(36).slice(2, 10)}`;
  const result = api.signup({ username, password: "secret12", confirm: "secret12" });
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

  it("signs up, opens a session and never exposes credentials", () => {
    const result = api.signup({ username: "alice_1", password: "secret12", confirm: "secret12" });
    expect(result.error).toBeNull();
    const user = requireUser(result);
    expect(user.username).toBe("alice_1");
    expect(user.balance).toBe(0);
    expect(JSON.stringify(user)).not.toMatch(/password/i);
    expect(api.me()?.username).toBe("alice_1");
  });

  it("rejects invalid and duplicate signups", () => {
    expect(api.signup({ username: "x", password: "secret12", confirm: "secret12" }).error).toBe(
      "Username: 3–20 letters, numbers or _",
    );
    expect(api.signup({ username: "alice_2", password: "short", confirm: "short" }).error).toBe(
      "Password must be at least 6 characters",
    );
    expect(
      api.signup({ username: "alice_2", password: "secret12", confirm: "secret13" }).error,
    ).toBe("Passwords do not match");
    expect(
      api.signup({ username: "alice_3", password: "secret12", confirm: "secret12" }).error,
    ).toBeNull();
    expect(
      api.signup({ username: "alice_3", password: "secret12", confirm: "secret12" }).error,
    ).toBe("Username already taken");
  });

  it("validates login and clears the session on logout", () => {
    const user = createUser();
    session.cookies.clear();
    expect(api.me()).toBeNull();
    expect(api.login({ username: user.username, password: "nope" }).error).toBe(
      "Wrong username or password",
    );
    expect(api.me()).toBeNull();
    expect(api.login({ username: user.username, password: "secret12" }).error).toBeNull();
    expect(api.me()?.username).toBe(user.username);
    expect(api.logout().user).toBeNull();
    expect(api.me()).toBeNull();
  });

  it("persists accounts across a server restart", () => {
    const user = createUser();
    vi.resetModules();
    api = api satisfies Api; // keep the type, swap the instance below
    return import("../server/api").then((reloaded) => {
      api = reloaded;
      expect(api.me()?.username).toBe(user.username);
    });
  });
});

describe("applications", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("stores a pending application and validates input", () => {
    expect(api.submitApplication(appInput(["products"])).error).toBe("Not signed in");
    createUser();
    expect(api.submitApplication(appInput([])).error).toBe("Select at least one domain");
    expect(api.submitApplication({ ...appInput(["products"]), phone: "abc" }).error).toBe(
      "Enter a valid phone number",
    );
    const result = api.submitApplication(appInput(["products", "videos"]));
    expect(result.error).toBeNull();
    expect(requireUser(result).application?.status).toBe("pending");
  });

  it("auto-approves after the review window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-02T09:00:00Z"));
    await loadApi();
    createUser();
    expect(api.submitApplication(appInput(["products"])).error).toBeNull();
    expect(api.me()?.application?.status).toBe("pending");
    vi.setSystemTime(Date.now() + REVIEW_MS + 1000);
    expect(api.me()?.application?.status).toBe("accepted");
  });
});

describe("tasks", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("gates tasks behind an accepted application and a session", () => {
    const user = createUser();
    const link = taskLink(user.username, "p1");
    expect(api.completeTask("p1", link).error).toBe("Complete your application first");
    api.submitApplication(appInput(ALL_DOMAINS));
    expect(api.completeTask("p1", link).error).toBe("Complete your application first");
    session.cookies.clear();
    expect(api.completeTask("p1", link).error).toBe("Not signed in");
    session.cookies.set("pp_session", "restored");
    api.login({ username: user.username, password: "secret12" });
    expect(api.approveApplication().user?.application?.status).toBe("accepted");
  });

  it("validates proof link and domain, then credits the reward once", () => {
    const user = createUser();
    api.submitApplication(appInput(["products", "videos"]));
    api.approveApplication();

    expect(api.completeTask("p1", "https://example.com/wrong").error).toBe(
      "Paste the exact task link as proof",
    );
    expect(api.completeTask("c1", taskLink(user.username, "c1")).error).toBe(
      "This task is not in one of your chosen domains",
    );

    const done = api.completeTask("p1", taskLink(user.username, "p1"));
    expect(done.error).toBeNull();
    expect(requireUser(done).balance).toBe(50);
    expect(requireUser(done).completed).toHaveLength(1);
    expect(requireUser(done).proofs[0]?.taskId).toBe("p1");

    expect(api.completeTask("p1", taskLink(user.username, "p1")).error).toBe(
      "Task already done today",
    );
    expect(api.me()?.balance).toBe(50);
  });

  it("enforces the daily task limit", () => {
    const user = createUser();
    api.submitApplication(appInput(ALL_DOMAINS));
    api.approveApplication();
    for (const task of TASKS.slice(0, DAILY_LIMIT)) {
      expect(api.completeTask(task.id, taskLink(user.username, task.id)).error).toBeNull();
    }
    const nextTask = TASKS[DAILY_LIMIT];
    expect(nextTask).toBeDefined();
    if (!nextTask) return;
    expect(api.completeTask(nextTask.id, taskLink(user.username, nextTask.id)).error).toBe(
      "Daily task limit reached",
    );
    expect(api.me()?.balance).toBe(DAILY_LIMIT * 50);
  });
});

describe("withdrawals", () => {
  beforeEach(async () => {
    await loadApi();
  });

  it("enforces minimum, format and balance rules while the window is open", () => {
    createUser();
    api.submitApplication(appInput(ALL_DOMAINS));
    api.approveApplication();
    expect(api.setSimulateSaturday(true).user?.simulateSaturday).toBe(true);

    expect(api.requestWithdrawal({ ...WD(withdrawalId()), amount: 100 }).error).toBe(
      `Minimum withdrawal is ${MIN_WITHDRAW} €`,
    );
    expect(api.requestWithdrawal({ ...WD(withdrawalId()), method: "" }).error).toBe(
      "Choose a payment method",
    );
    expect(api.requestWithdrawal({ ...WD(withdrawalId()), number: "abc" }).error).toBe(
      "Enter a valid mobile money number",
    );
    expect(api.requestWithdrawal(WD(withdrawalId())).error).toBe(
      "Amount is higher than your balance",
    );
  });

  it("closes the window outside Saturday 10:00–15:00", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-04T12:00:00Z")); // a Wednesday
    await loadApi();
    createUser();
    api.submitApplication(appInput(ALL_DOMAINS));
    api.approveApplication();
    expect(api.me()?.simulateSaturday).toBe(false);
    expect(api.requestWithdrawal(WD(withdrawalId())).error).toBe(
      "Withdrawals are only open on Saturdays from 10:00 to 15:00",
    );
  });

  it("accumulates earnings across days and pays out the balance", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const base = new Date("2026-03-02T12:00:00Z"); // a Monday
    vi.setSystemTime(base);
    await loadApi();
    const user = createUser();
    api.submitApplication(appInput(ALL_DOMAINS));
    api.approveApplication();
    api.setSimulateSaturday(true);

    const dailyTasks = TASKS.slice(0, DAILY_LIMIT);
    for (let day = 0; day < 5; day++) {
      vi.setSystemTime(base.getTime() + day * 24 * 60 * 60 * 1000);
      for (const task of dailyTasks) {
        expect(api.completeTask(task.id, taskLink(user.username, task.id)).error).toBeNull();
      }
    }
    expect(api.me()?.balance).toBe(5 * DAILY_LIMIT * 50);

    const id = withdrawalId();
    const result = api.requestWithdrawal({ ...WD(id), method: "Orange Money" });
    expect(result.error).toBeNull();
    expect(requireUser(result).balance).toBe(0);
    expect(requireUser(result).withdrawals.find((w) => w.id === id)?.status).toBe("processing");
    expect(api.requestWithdrawal({ ...WD(id), method: "Orange Money" }).error).toBe(
      "Invalid withdrawal request",
    );
  });

  it("marks demo payouts paid once the simulation elapses", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const base = new Date("2026-03-02T12:00:00Z");
    vi.setSystemTime(base);
    await loadApi();
    createUser();
    api.submitApplication(appInput(ALL_DOMAINS));
    api.approveApplication();

    const id = withdrawalId();
    expect(api.createDemoWithdrawal(id).error).toBeNull();
    expect(api.me()?.withdrawals.find((w) => w.id === id)?.status).toBe("processing");

    vi.setSystemTime(base.getTime() + DEMO_WITHDRAWAL_MS + 500);
    expect(api.me()?.withdrawals.find((w) => w.id === id)?.status).toBe("paid");
  });
});
