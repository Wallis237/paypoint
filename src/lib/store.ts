import { useSyncExternalStore } from "react";

export type Domain = "products" | "crypto" | "celebrities" | "videos";

export const DOMAINS: { id: Domain; name: string; fr: string; desc: string }[] = [
  { id: "products", name: "Product Promotion", fr: "Promotion de produits", desc: "Post and promote dresses, tools, perfumes and rare watches." },
  { id: "crypto", name: "Crypto Promotion", fr: "Promotion crypto", desc: "Share and promote rare and emerging crypto coins." },
  { id: "celebrities", name: "Celebrity Votes", fr: "Votes célébrités", desc: "Vote for and promote celebrities and campaigns." },
  { id: "videos", name: "Video Engagement", fr: "Engagement vidéo", desc: "Watch and like videos to earn small commissions." },
];

export type Task = { id: string; domain: Domain; title: string; desc: string; reward: number; seconds: number };

export const TASKS: Task[] = [
  { id: "p1", domain: "products", title: "Promote 'Kente Summer Dress'", desc: "Share the dress post on your social status.", reward: 350, seconds: 8 },
  { id: "p2", domain: "products", title: "Post 'Oud Royal' perfume", desc: "Publish the perfume ad with the provided caption.", reward: 400, seconds: 8 },
  { id: "p3", domain: "products", title: "Promote rare 1970s watch", desc: "Share the vintage watch listing in 2 groups.", reward: 500, seconds: 10 },
  { id: "p4", domain: "products", title: "Promote 'ProFix' tool kit", desc: "Write a short review post for the tool kit.", reward: 300, seconds: 6 },
  { id: "c1", domain: "crypto", title: "Share SAVANA coin launch", desc: "Repost the launch announcement.", reward: 450, seconds: 8 },
  { id: "c2", domain: "crypto", title: "Promote BAOBAB token", desc: "Share the explainer graphic with your network.", reward: 450, seconds: 8 },
  { id: "c3", domain: "crypto", title: "Join KORA community", desc: "Join the community channel and introduce yourself.", reward: 300, seconds: 6 },
  { id: "s1", domain: "celebrities", title: "Vote: Afro Music Awards", desc: "Cast your vote for Best New Artist.", reward: 250, seconds: 5 },
  { id: "s2", domain: "celebrities", title: "Promote actress fan page", desc: "Share the fan page and invite 3 friends.", reward: 350, seconds: 7 },
  { id: "s3", domain: "celebrities", title: "Vote: Fashion Icon 2026", desc: "Vote in the public poll.", reward: 250, seconds: 5 },
  { id: "v1", domain: "videos", title: "Watch & like: Douala street food", desc: "Watch the video fully, then like it.", reward: 150, seconds: 10 },
  { id: "v2", domain: "videos", title: "Watch & like: Dakar fashion week", desc: "Watch the video fully, then like it.", reward: 150, seconds: 10 },
  { id: "v3", domain: "videos", title: "Watch & like: Abidjan comedy", desc: "Watch the video fully, then like it.", reward: 120, seconds: 8 },
  { id: "v4", domain: "videos", title: "Watch & like: Kinshasa music clip", desc: "Watch the video fully, then like it.", reward: 120, seconds: 8 },
];

export const COUNTRIES = ["Cameroon", "Côte d'Ivoire", "Senegal", "DR Congo", "Congo", "Gabon", "Benin", "Togo", "Burkina Faso", "Mali", "Niger", "Guinea", "Chad", "Madagascar", "Rwanda", "Burundi", "Other"];

export type Withdrawal = { id: string; amount: number; method: string; number: string; date: string; status: "processing" | "paid" };
export type Application = { fullName: string; country: string; phone: string; domains: Domain[]; motivation: string; status: "pending" | "accepted" };
export type User = { username: string; password: string; balance: number; completed: string[]; withdrawals: Withdrawal[]; application?: Application };
type DB = { users: Record<string, User>; session: string | null; simulateSaturday: boolean };

const KEY = "afriwork_db";
const empty: DB = { users: {}, session: null, simulateSaturday: false };
let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
  try { cache = { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { cache = { ...empty }; }
  return cache!;
}
function save(db: DB) { cache = { ...db }; localStorage.setItem(KEY, JSON.stringify(cache)); listeners.forEach((l) => l()); }
function update(fn: (db: DB) => void) { const db = structuredClone(load()); fn(db); save(db); }

export function useDB(): DB | null {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, load, () => null);
}
export function currentUser(db: DB | null) { return db?.session ? db.users[db.session] : undefined; }

export function signup(username: string, password: string, confirm: string): string | null {
  const u = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return "Username: 3–20 letters, numbers or _";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (password !== confirm) return "Passwords do not match";
  if (load().users[u]) return "Username already taken";
  update((db) => { db.users[u] = { username: u, password, balance: 0, completed: [], withdrawals: [] }; db.session = u; });
  return null;
}
export function login(username: string, password: string): string | null {
  const u = load().users[username.trim().toLowerCase()];
  if (!u || u.password !== password) return "Wrong username or password";
  update((db) => { db.session = u.username; });
  return null;
}
export function logout() { update((db) => { db.session = null; }); }
export function submitApplication(a: Omit<Application, "status">) {
  update((db) => { const u = db.users[db.session!]; if (u) u.application = { ...a, status: "pending" }; });
}
export function acceptApplication() {
  update((db) => { const u = db.users[db.session!]; if (u?.application) u.application.status = "accepted"; });
}
export function completeTask(id: string) {
  const t = TASKS.find((x) => x.id === id);
  update((db) => { const u = db.users[db.session!]; if (u && t && !u.completed.includes(id)) { u.completed.push(id); u.balance += t.reward; } });
}
export function setSimulateSaturday(v: boolean) { update((db) => { db.simulateSaturday = v; }); }

export function withdrawalOpen(db: DB | null, now = new Date()) {
  if (db?.simulateSaturday) return true;
  const h = now.getHours();
  return now.getDay() === 6 && h >= 10 && h < 15;
}
export const MIN_WITHDRAW = 2000;
export function requestWithdrawal(amount: number, method: string, number: string): string | null {
  const db = load(); const u = currentUser(db);
  if (!u) return "Not signed in";
  if (!withdrawalOpen(db)) return "Withdrawals are only open on Saturdays from 10:00 to 15:00";
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) return `Minimum withdrawal is ${MIN_WITHDRAW} FCFA`;
  if (amount > u.balance) return "Amount is higher than your balance";
  if (!/^\+?\d{8,15}$/.test(number.replace(/\s/g, ""))) return "Enter a valid mobile money number";
  update((d) => { const x = d.users[d.session!]; x.balance -= amount; x.withdrawals.unshift({ id: crypto.randomUUID(), amount, method, number, date: new Date().toISOString(), status: "processing" }); });
  return null;
}
export const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
