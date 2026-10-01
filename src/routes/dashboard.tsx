import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { DOMAINS, TASKS, MIN_WITHDRAW, acceptApplication, completeTask, currentUser, fcfa, requestWithdrawal, setSimulateSaturday, useDB, withdrawalOpen, type Domain, type Task } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AfriWork" }, { name: "description", content: "Your AfriWork tasks, balance and withdrawals." }, { property: "og:title", content: "Dashboard — AfriWork" }, { property: "og:description", content: "Complete tasks and withdraw earnings." }] }),
  component: Dashboard,
});

function Dashboard() {
  const db = useDB(); const user = currentUser(db);
  const [tab, setTab] = useState<Domain | "wallet">("products");
  if (!db) return null;
  if (!user) return <Shell><p className="text-center">Please <Link to="/login" className="text-primary underline">sign in</Link>.</p></Shell>;
  const app = user.application;
  if (!app) return <Shell><div className="text-center"><h1 className="font-display text-3xl font-bold">Welcome @{user.username}</h1><p className="mt-2 text-muted-foreground">Apply to a work domain to unlock your tasks.</p><Link to="/apply" className={`${btnCls} mt-6 inline-block`}>Apply now</Link></div></Shell>;
  if (app.status === "pending") return <Shell><div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center"><h1 className="font-display text-3xl font-bold">Application under review</h1><p className="mt-2 text-muted-foreground">Thanks {app.fullName}. We'll review your application shortly.</p><button onClick={acceptApplication} className={`${btnCls} mt-6`}>Demo: approve my application</button></div></Shell>;

  const tabs = DOMAINS.filter((d) => app.domains.includes(d.id));
  const active = tab === "wallet" || app.domains.includes(tab) ? tab : tabs[0].id;
  const earned = TASKS.filter((t) => user.completed.includes(t.id)).reduce((s, t) => s + t.reward, 0);
  return (
    <Shell>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Balance" value={fcfa(user.balance)} big />
        <Stat label="Total earned" value={fcfa(earned)} />
        <Stat label="Tasks completed" value={`${user.completed.length} / ${TASKS.filter((t) => app.domains.includes(t.domain)).length}`} />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((d) => <TabBtn key={d.id} on={active === d.id} onClick={() => setTab(d.id)}>{d.name}</TabBtn>)}
        <TabBtn on={active === "wallet"} onClick={() => setTab("wallet")}>Wallet & withdraw</TabBtn>
      </div>
      <div className="mt-6">
        {active === "wallet" ? <Wallet /> : (
          <div className="grid gap-4 md:grid-cols-2">{TASKS.filter((t) => t.domain === active).map((t) => <TaskCard key={t.id} t={t} done={user.completed.includes(t.id)} />)}</div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-10">{children}</main></div>;
}
function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return <div className={`rounded-2xl p-6 ${big ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}><div className="text-sm opacity-80">{label}</div><div className="font-display mt-1 text-3xl font-bold">{value}</div></div>;
}
function TabBtn({ on, ...p }: { on: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={`rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-foreground text-background" : "border border-border hover:bg-secondary"}`} />;
}

function TaskCard({ t, done }: { t: Task; done: boolean }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const isVideo = t.domain === "videos";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{t.title}</h3><span className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">+{fcfa(t.reward)}</span></div>
      <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
      {isVideo && left !== null && !done && <div className="mt-3 flex aspect-video items-center justify-center rounded-xl bg-foreground text-background">{left > 0 ? `▶ Playing… ${left}s` : "✓ Video finished"}</div>}
      <div className="mt-4">
        {done ? <span className="font-semibold text-primary">✓ Completed — reward added</span>
          : left === null ? <button className={btnCls} onClick={() => setLeft(t.seconds)}>{isVideo ? "Watch video" : "Start task"}</button>
          : left > 0 ? <div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${((t.seconds - left) / t.seconds) * 100}%` }} /></div><p className="mt-2 text-sm">{isVideo ? "Keep watching" : "Performing task"}… {left}s</p></div>
          : <button className={btnCls} onClick={() => completeTask(t.id)}>{isVideo ? "♥ Like & claim" : "Confirm completed"}</button>}
      </div>
    </div>
  );
}

function Wallet() {
  const db = useDB(); const user = currentUser(db)!;
  const [amount, setAmount] = useState(""); const [method, setMethod] = useState("MTN Mobile Money"); const [num, setNum] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const open = withdrawalOpen(db);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="space-y-4 rounded-2xl border border-border bg-card p-6" onSubmit={(e) => { e.preventDefault(); const r = requestWithdrawal(Number(amount), method, num); setMsg(r ? { ok: false, t: r } : { ok: true, t: "Withdrawal requested — it will be sent to your mobile money." }); if (!r) setAmount(""); }}>
        <h2 className="font-display text-2xl font-bold">Withdraw</h2>
        <div className={`rounded-lg p-3 text-sm ${open ? "bg-secondary" : "bg-muted text-muted-foreground"}`}>{open ? "✓ Withdrawal window is OPEN" : "Closed — withdrawals open Saturdays 10:00–15:00"}</div>
        <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}><option>MTN Mobile Money</option><option>Orange Money</option></select>
        <input className={inputCls} placeholder="Mobile money number" value={num} onChange={(e) => setNum(e.target.value)} />
        <input className={inputCls} type="number" placeholder={`Amount (min ${MIN_WITHDRAW} FCFA)`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.t}</p>}
        <button className={btnCls} disabled={!open}>Request withdrawal</button>
        <label className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><input type="checkbox" checked={!!db?.simulateSaturday} onChange={(e) => setSimulateSaturday(e.target.checked)} />Demo: pretend it's Saturday 11:00 (for testing)</label>
      </form>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-bold">History</h2>
        {user.withdrawals.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No withdrawals yet.</p> : (
          <ul className="mt-3 divide-y divide-border">{user.withdrawals.map((w) => <li key={w.id} className="flex justify-between py-3 text-sm"><div><div className="font-semibold">{fcfa(w.amount)}</div><div className="text-muted-foreground">{w.method} · {w.number}</div></div><div className="text-right"><div>{new Date(w.date).toLocaleDateString("fr-FR")}</div><div className="text-accent">{w.status}</div></div></li>)}</ul>
        )}
      </div>
    </div>
  );
}
