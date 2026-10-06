// Server functions — the only API surface the browser talks to. Each handler
// dynamically imports the server-only modules in ../server so Node APIs (fs,
// crypto, cookies) never end up in the client bundle: TanStack Start strips
// handler bodies from the client build and keeps them only in the server
// build. This file itself must stay outside src/server/ because the client
// imports it to get the RPC stubs.

import { createServerFn } from "@tanstack/react-start";

import type { Application, User } from "@/lib/catalog";

export type OpResult = { error: string | null; user: User | null };
export type MeResult = { user: User | null };

export const getMe = createServerFn({ method: "POST" }).handler(async (): Promise<MeResult> => {
  const { me } = await import("../server/api");
  return { user: await me() };
});

export const signup = createServerFn({ method: "POST" })
  .validator((data: { username: string; password: string; confirm: string }) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { signup: run } = await import("../server/api");
    return run(data);
  });

export const login = createServerFn({ method: "POST" })
  .validator((data: { username: string; password: string }) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { login: run } = await import("../server/api");
    return run(data);
  });

export const logout = createServerFn({ method: "POST" }).handler(async (): Promise<OpResult> => {
  const { logout: run } = await import("../server/api");
  return run();
});

export const submitApplication = createServerFn({ method: "POST" })
  .validator((data: Omit<Application, "status" | "submittedAt">) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { submitApplication: run } = await import("../server/api");
    return run(data);
  });

export const approveApplication = createServerFn({ method: "POST" }).handler(
  async (): Promise<OpResult> => {
    const { approveApplication: run } = await import("../server/api");
    return run();
  },
);

export const completeTask = createServerFn({ method: "POST" })
  .validator((data: { taskId: string; link: string }) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { completeTask: run } = await import("../server/api");
    return run(data.taskId, data.link);
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .validator((data: { amount: number; method: string; number: string; id: string }) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { requestWithdrawal: run } = await import("../server/api");
    return run(data);
  });

export const createDemoWithdrawal = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { createDemoWithdrawal: run } = await import("../server/api");
    return run(data.id);
  });

export const setSimulateSaturday = createServerFn({ method: "POST" })
  .validator((data: { value: boolean }) => data)
  .handler(async ({ data }): Promise<OpResult> => {
    const { setSimulateSaturday: run } = await import("../server/api");
    return run(data.value);
  });
