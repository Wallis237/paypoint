// Client-side API layer. Reads go through a reactive TanStack Query cache
// ("me"), writes go through server functions and write the returned user back
// into that cache, so every screen updates without a full reload. The shared
// constants/types are re-exported from ./catalog to keep existing imports
// working.

import { useQuery, type QueryClient } from "@tanstack/react-query";

import * as server from "@/lib/fns";

import type { Application, User } from "./catalog";

export * from "./catalog";

export type DB = { user: User | null; simulateSaturday: boolean };

export const NETWORK_ERROR = "Network error — please try again";

const ME_KEY = ["paypoint", "me"] as const;

let queryClient: QueryClient | undefined;

export function bindQueryClient(client: QueryClient) {
  queryClient = client;
}

function writeMe(result: { user: User | null }) {
  queryClient?.setQueryData(ME_KEY, result);
}

async function mutate(operation: () => Promise<server.OpResult>): Promise<string | null> {
  try {
    const result = await operation();
    writeMe(result);
    return result.error;
  } catch {
    return NETWORK_ERROR;
  }
}

/** Current session, or null while the first fetch is still in flight. */
export function useDB(): DB | null {
  const { data, isPending, isError } = useQuery({
    queryKey: ME_KEY,
    queryFn: () => server.getMe(),
    retry: 1,
  });
  if (isPending) return null;
  if (isError || !data) return { user: null, simulateSaturday: false };
  return { user: data.user, simulateSaturday: data.user?.simulateSaturday ?? false };
}

export function currentUser(db: DB | null) {
  return db?.user ?? undefined;
}

export async function signup(
  username: string,
  password: string,
  confirm: string,
): Promise<string | null> {
  return mutate(() => server.signup({ data: { username, password, confirm } }));
}

export async function login(username: string, password: string): Promise<string | null> {
  return mutate(() => server.login({ data: { username, password } }));
}

export async function logout(): Promise<string | null> {
  return mutate(() => server.logout());
}

export async function submitApplication(
  application: Omit<Application, "status" | "submittedAt">,
): Promise<string | null> {
  return mutate(() => server.submitApplication({ data: application }));
}

export async function acceptApplication(): Promise<string | null> {
  return mutate(() => server.approveApplication());
}

export async function completeTask(id: string, link: string): Promise<string | null> {
  return mutate(() => server.completeTask({ data: { taskId: id, link } }));
}

export async function requestWithdrawal(
  amount: number,
  method: string,
  number: string,
  id: string,
): Promise<string | null> {
  return mutate(() => server.requestWithdrawal({ data: { amount, method, number, id } }));
}

export async function demoWithdrawal(): Promise<{ id: string; error: string | null }> {
  const id = crypto.randomUUID();
  const error = await mutate(() => server.createDemoWithdrawal({ data: { id } }));
  return { id, error };
}

export async function setSimulateSaturday(value: boolean): Promise<string | null> {
  return mutate(() => server.setSimulateSaturday({ data: { value } }));
}

// The server flips demo withdrawals to "paid" once their simulation elapses;
// this just refreshes the cached user so the change becomes visible.
let lastRefresh = 0;
export function finishDemoWithdrawal(_id: string) {
  const now = Date.now();
  if (now - lastRefresh < 500) return;
  lastRefresh = now;
  queryClient?.invalidateQueries({ queryKey: ME_KEY });
}
