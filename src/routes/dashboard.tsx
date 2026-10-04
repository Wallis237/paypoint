import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { DAILY_LIMIT, DOMAINS, PAYMENTS, REVIEW_MS, TASKS, MIN_WITHDRAW, acceptApplication, currentUser, doneToday, eur, requestWithdrawal, setSimulateSaturday, useDB, withdrawalOpen, type Domain, type Task } from "@/lib/store";
import { localizedError, useLanguage } from "@/lib/i18n";
import { taskImage } from "@/lib/task-images";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — PayPoint" }, { name: "description", content: "Vos missions, votre solde et vos retraits PayPoint." }, { property: "og:title", content: "Tableau de bord — PayPoint" }, { property: "og:description", content: "Réalisez des missions et retirez vos gains." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Dashboard,
});

function Dashboard() {
  const db = useDB(); const user = currentUser(db);
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<Domain | "wallet">("products");
  if (!db) return null;
  if (!user) return <Shell><p className="text-center"><Link to="/login" className="text-primary underline">{t("pleaseSignIn")}</Link></p></Shell>;
  const app = user.application;
  if (!app) return <Shell><div className="text-center"><h1 className="font-display text-3xl font-bold">{t("welcome")} @{user.username}</h1><p className="mt-2 text-muted-foreground">{t("applyUnlock")}</p><Link to="/apply" className={`${btnCls} mt-6 inline-block`}>{t("applyNow")}</Link></div></Shell>;
  if (app.status === "pending") return <Shell><Review submittedAt={app.submittedAt ?? Date.now()} name={app.fullName} /></Shell>;

  const tabs = DOMAINS.filter((d) => app.domains.includes(d.id));
  const active = tab === "wallet" || app.domains.includes(tab) ? tab : (tabs[0]?.id ?? "wallet");
  const earned = user.completed.reduce((s, c) => s + (TASKS.find((x) => x.id === c.split(":").pop())?.reward ?? 0), 0);
  const today = doneToday(user).length;
  return (
    <Shell>
      <p className="mb-6 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">{t("dashHelp")}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("balance")} value={eur(user.balance)} big />
        <Stat label={t("totalEarned")} value={eur(earned)} />
        <Stat label={t("todayTasks")} value={`${today} / ${DAILY_LIMIT}`} />
      </div>
      <div className="mt-4"><div className="flex justify-between text-sm"><span>{t("progressGoal")}</span><span>{eur(Math.min(user.balance, MIN_WITHDRAW))}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (user.balance / MIN_WITHDRAW) * 100)}%` }} /></div></div>
      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((d) => <TabBtn key={d.id} on={active === d.id} onClick={() => setTab(d.id)}>{language === "fr" ? d.fr : d.name}</TabBtn>)}
        <TabBtn on={active === "wallet"} onClick={() => setTab("wallet")}>{t("wallet")}</TabBtn>
      </div>
      <div className="mt-6">
        {active === "wallet" ? <Wallet /> : (
          <div className="grid gap-4 md:grid-cols-2">{TASKS.filter((x) => x.domain === active).map((x) => <TaskCard key={x.id} t={x} done={doneToday(user, x.id).length > 0} limit={today >= DAILY_LIMIT} />)}</div>
        )}
      </div>
    </Shell>
  );
}

function Review({ submittedAt, name }: { submittedAt: number; name: string }) {
  const { t } = useLanguage();
  const [now, setNow] = useState(Date.now());
  const left = Math.max(0, submittedAt + REVIEW_MS - now);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { if (left === 0) acceptApplication(); }, [left]);
  const mm = String(Math.floor(left / 60000)).padStart(2, "0"); const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-3xl font-bold">{t("reviewTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{name}, {t("reviewTimer")}</p>
      <div className="font-display my-6 text-6xl font-bold text-primary">{mm}:{ss}</div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${100 - (left / REVIEW_MS) * 100}%` }} /></div>
      <p className="mt-4 text-sm text-muted-foreground">{t("reviewSteps")}</p>
      <button onClick={acceptApplication} className="mt-6 text-xs text-muted-foreground underline">{t("demoApprove")}</button>
    </div>
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

function TaskCard({ t, done, limit }: { t: Task; done: boolean; limit: boolean }) {
  const { language, t: translate } = useLanguage();
  const image = taskImage(t.id);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {image && <img src={image.url} alt={language === "fr" ? image.altFr : image.altEn} className="mb-4 aspect-video w-full rounded-xl object-cover" />}
      <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{language === "fr" ? t.titleFr : t.title}</h3><span className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">+{eur(t.reward)}</span></div>
      <p className="mt-1 text-sm text-muted-foreground">{language === "fr" ? t.descFr : t.desc}</p>
      <div className="mt-4">
        {done ? <span className="font-semibold text-primary">✓ {translate("doneToday")}</span>
          : limit ? <span className="text-sm text-muted-foreground">{translate("limitReached")}</span>
          : <Link to="/task/$id" params={{ id: t.id }} className={`${btnCls} inline-block`}>{translate("startTask")}</Link>}
      </div>
    </div>
  );
}

function Wallet() {
  const db = useDB(); const user = currentUser(db);
  const { language, t } = useLanguage();
  const country = user?.application?.country ?? "Cameroon";
  const methods: string[] = PAYMENTS[country] ?? ["MTN Mobile Money", "Orange Money"];
  const [amount, setAmount] = useState(""); const [method, setMethod] = useState<string>(user?.application?.payment ?? methods[0] ?? ""); const [num, setNum] = useState(user?.application?.phone ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const open = withdrawalOpen(db);
  if (!user) return null;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="space-y-4 rounded-2xl border border-border bg-card p-6" onSubmit={(e) => { e.preventDefault(); const r = requestWithdrawal(Number(amount), method, num); setMsg(r ? { ok: false, t: localizedError(r, language) } : { ok: true, t: t("withdrawalSuccess") }); if (!r) setAmount(""); }}>
        <h2 className="font-display text-2xl font-bold">{t("withdraw")}</h2>
        <p className="text-sm text-muted-foreground">{t("walletHelp")}</p>
        <div className={`rounded-lg p-3 text-sm ${open ? "bg-secondary" : "bg-muted text-muted-foreground"}`}>{open ? t("withdrawalOpen") : t("withdrawalClosed")}</div>
        <label className="block text-sm font-semibold">{t("paymentMethod")} · {country}<select className={`${inputCls} mt-1`} value={method} onChange={(e) => setMethod(e.target.value)}>{methods.map((m) => <option key={m}>{m}</option>)}</select></label>
        <input className={inputCls} placeholder={t("mobileNumber")} value={num} onChange={(e) => setNum(e.target.value)} />
        <input className={inputCls} type="number" placeholder={`${t("amount")} (min. ${eur(MIN_WITHDRAW)})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.t}</p>}
        <button className={btnCls} disabled={!open}>{t("requestWithdrawal")}</button>
        <label className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><input type="checkbox" checked={!!db?.simulateSaturday} onChange={(e) => setSimulateSaturday(e.target.checked)} />{t("demoSaturday")}</label>
      </form>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-bold">{t("history")}</h2>
        {user.withdrawals.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("noWithdrawals")}</p> : (
          <ul className="mt-3 divide-y divide-border">{user.withdrawals.map((w) => <li key={w.id} className="flex justify-between py-3 text-sm"><div><div className="font-semibold">{eur(w.amount)}</div><div className="text-muted-foreground">{w.method} · {w.number}</div></div><div className="text-right"><div>{new Date(w.date).toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB")}</div><div className="text-accent">{t(w.status)}</div></div></li>)}</ul>
        )}
      </div>
    </div>
  );
}
