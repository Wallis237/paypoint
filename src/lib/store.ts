import { useSyncExternalStore } from "react";

export type Domain = "products" | "crypto" | "celebrities" | "videos";

export const DOMAINS: { id: Domain; name: string; fr: string; desc: string; descFr: string }[] = [
  { id: "products", name: "Product Promotion", fr: "Promotion de produits", desc: "Post and promote dresses, tools, perfumes and rare watches.", descFr: "Publiez et promouvez des vêtements, outils, parfums et montres rares." },
  { id: "crypto", name: "Crypto Promotion", fr: "Promotion de cryptomonnaies", desc: "Share and promote rare and emerging crypto coins.", descFr: "Partagez et promouvez des cryptomonnaies rares ou émergentes." },
  { id: "celebrities", name: "Celebrity Votes", fr: "Votes et célébrités", desc: "Vote for and promote celebrities and campaigns.", descFr: "Votez et faites la promotion de célébrités et de campagnes." },
  { id: "videos", name: "Video Engagement", fr: "Engagement vidéo", desc: "Watch and like videos to earn small commissions.", descFr: "Regardez et aimez des vidéos pour gagner de petites commissions." },
];

export type Task = { id: string; domain: Domain; title: string; titleFr: string; desc: string; descFr: string; reward: number; seconds: number };

export const TASKS: Task[] = [
  { id: "p1", domain: "products", title: "Promote Kente Summer Dress", titleFr: "Promouvoir la robe d’été Kente", desc: "Share the dress post on your social status.", descFr: "Partagez la publication de la robe sur votre statut.", reward: 170, seconds: 8 },
  { id: "p2", domain: "products", title: "Post Oud Royal perfume", titleFr: "Publier le parfum Oud Royal", desc: "Publish the perfume ad with the provided caption.", descFr: "Publiez la publicité du parfum avec le texte fourni.", reward: 180, seconds: 8 },
  { id: "p3", domain: "products", title: "Promote rare 1970s watch", titleFr: "Promouvoir une montre rare des années 1970", desc: "Share the vintage watch listing in 2 groups.", descFr: "Partagez l’annonce de la montre dans deux groupes.", reward: 200, seconds: 10 },
  { id: "p4", domain: "products", title: "Promote ProFix tool kit", titleFr: "Promouvoir la boîte à outils ProFix", desc: "Write a short review post for the tool kit.", descFr: "Rédigez un court avis sur la boîte à outils.", reward: 160, seconds: 6 },
  { id: "c1", domain: "crypto", title: "Share SAVANA coin launch", titleFr: "Partager le lancement de SAVANA", desc: "Repost the launch announcement.", descFr: "Republiez l’annonce du lancement.", reward: 190, seconds: 8 },
  { id: "c2", domain: "crypto", title: "Promote BAOBAB token", titleFr: "Promouvoir le jeton BAOBAB", desc: "Share the explainer graphic with your network.", descFr: "Partagez le visuel explicatif avec votre réseau.", reward: 175, seconds: 8 },
  { id: "c3", domain: "crypto", title: "Join KORA community", titleFr: "Rejoindre la communauté KORA", desc: "Join the community channel and introduce yourself.", descFr: "Rejoignez le canal communautaire et présentez-vous.", reward: 155, seconds: 6 },
  { id: "s1", domain: "celebrities", title: "Vote: Afro Music Awards", titleFr: "Voter : Afro Music Awards", desc: "Cast your vote for Best New Artist.", descFr: "Votez pour le prix du meilleur nouvel artiste.", reward: 150, seconds: 5 },
  { id: "s2", domain: "celebrities", title: "Promote actress fan page", titleFr: "Promouvoir la page d’une actrice", desc: "Share the fan page and invite 3 friends.", descFr: "Partagez la page et invitez trois amis.", reward: 165, seconds: 7 },
  { id: "s3", domain: "celebrities", title: "Vote: Fashion Icon 2026", titleFr: "Voter : Icône de la mode 2026", desc: "Vote in the public poll.", descFr: "Participez au vote public.", reward: 160, seconds: 5 },
  { id: "v1", domain: "videos", title: "Watch & like: Douala street food", titleFr: "Regarder et aimer : cuisine de rue à Douala", desc: "Watch the video fully, then like it.", descFr: "Regardez toute la vidéo, puis aimez-la.", reward: 170, seconds: 10 },
  { id: "v2", domain: "videos", title: "Watch & like: Dakar fashion week", titleFr: "Regarder et aimer : Fashion Week de Dakar", desc: "Watch the video fully, then like it.", descFr: "Regardez toute la vidéo, puis aimez-la.", reward: 185, seconds: 10 },
  { id: "v3", domain: "videos", title: "Watch & like: Abidjan comedy", titleFr: "Regarder et aimer : humour à Abidjan", desc: "Watch the video fully, then like it.", descFr: "Regardez toute la vidéo, puis aimez-la.", reward: 150, seconds: 8 },
  { id: "v4", domain: "videos", title: "Watch & like: Kinshasa music clip", titleFr: "Regarder et aimer : clip musical de Kinshasa", desc: "Watch the video fully, then like it.", descFr: "Regardez toute la vidéo, puis aimez-la.", reward: 165, seconds: 8 },
];

export const PAYMENTS: Record<string, string[]> = {
  "Cameroon": ["MTN Mobile Money", "Orange Money"],
  "Côte d'Ivoire": ["Orange Money", "MTN Mobile Money", "Moov Money", "Wave"],
  "Senegal": ["Orange Money", "Wave", "Free Money"],
  "DR Congo": ["M-Pesa", "Orange Money", "Airtel Money"],
  "Congo": ["MTN Mobile Money", "Airtel Money"],
  "Gabon": ["Airtel Money", "Moov Money"],
  "Benin": ["MTN Mobile Money", "Moov Money"],
  "Togo": ["T-Money", "Moov Money"],
  "Burkina Faso": ["Orange Money", "Moov Money"],
  "Mali": ["Orange Money", "Moov Money"],
  "Niger": ["Airtel Money", "Moov Money"],
  "Guinea": ["Orange Money", "MTN Mobile Money"],
  "Chad": ["Airtel Money", "Moov Money"],
  "Madagascar": ["MVola", "Orange Money", "Airtel Money"],
  "Rwanda": ["MTN Mobile Money", "Airtel Money"],
  "Burundi": ["Lumicash", "EcoCash"],
};
export const COUNTRIES = Object.keys(PAYMENTS);
export const DAILY_LIMIT = 2;
export const REVIEW_MS = 10 * 60 * 1000;
export const today = () => new Date().toISOString().slice(0, 10);
export const doneToday = (u: User, id?: string) => u.completed.filter((c) => c.startsWith(today() + ":") && (!id || c.endsWith(":" + id)));

export type Withdrawal = { id: string; amount: number; method: string; number: string; date: string; status: "processing" | "paid" };
export type Application = { fullName: string; country: string; phone: string; domains: Domain[]; motivation: string; payment: string; cv: string; coverLetter: string; submittedAt: number; status: "pending" | "accepted" };
export type Proof = { taskId: string; date: string; file: string; note: string };
export type User = { username: string; password: string; balance: number; completed: string[]; withdrawals: Withdrawal[]; proofs?: Proof[]; application?: Application };
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
export function submitApplication(a: Omit<Application, "status" | "submittedAt">) {
  update((db) => { const u = db.users[db.session!]; if (u) u.application = { ...a, submittedAt: Date.now(), status: "pending" }; });
}
export function acceptApplication() {
  update((db) => { const u = db.users[db.session!]; if (u?.application) u.application.status = "accepted"; });
}
export function completeTask(id: string, proof: { file: string; note: string }): string | null {
  const t = TASKS.find((x) => x.id === id);
  const u0 = currentUser(load());
  if (!u0 || !t) return "Not signed in";
  if (!proof.file) return "Upload a proof screenshot first";
  if (doneToday(u0, id).length) return "Task already done today";
  if (doneToday(u0).length >= DAILY_LIMIT) return "Daily task limit reached";
  update((db) => { const u = db.users[db.session!]!; u.completed.push(`${today()}:${id}`); u.balance += t.reward; (u.proofs ??= []).unshift({ taskId: id, date: new Date().toISOString(), file: proof.file, note: proof.note.slice(0, 300) }); });
  return null;
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
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) return `Minimum withdrawal is ${MIN_WITHDRAW} €`;
  if (amount > u.balance) return "Amount is higher than your balance";
  if (!/^\+?\d{8,15}$/.test(number.replace(/\s/g, ""))) return "Enter a valid mobile money number";
  update((d) => { const x = d.users[d.session!]!; x.balance -= amount; x.withdrawals.unshift({ id: crypto.randomUUID(), amount, method, number, date: new Date().toISOString(), status: "processing" }); });
  return null;
}
export const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
