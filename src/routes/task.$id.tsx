import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { DAILY_LIMIT, TASKS, completeTask, currentUser, doneToday, eur, taskLink, useDB } from "@/lib/store";
import { localizedError, useLanguage } from "@/lib/i18n";
import { taskImage } from "@/lib/task-images";

export const Route = createFileRoute("/task/$id")({
  head: () => ({ meta: [{ title: "Mission — PayPoint" }, { name: "description", content: "Réalisez votre mission PayPoint et collez le lien comme preuve." }, { property: "og:title", content: "Mission — PayPoint" }, { property: "og:description", content: "Promouvoir, voter ou regarder, puis envoyer la preuve." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: TaskPage,
});

const ICON = { products: "🛍️", crypto: "🪙", celebrities: "⭐", videos: "🎬" } as const;
const ACTION = {
  products: { fr: "Promouvoir", en: "Promote" },
  crypto: { fr: "Promouvoir", en: "Promote" },
  celebrities: { fr: "Voter", en: "Vote" },
  videos: { fr: "Regarder", en: "Watch" },
} as const;

function TaskPage() {
  const { id } = Route.useParams();
  const db = useDB(); const user = currentUser(db);
  const { language } = useLanguage();
  const fr = language === "fr";
  const task = TASKS.find((x) => x.id === id);
  const image = taskImage(id);
  const [left, setLeft] = useState<number | null>(null);
  const [paste, setPaste] = useState(""); const [err, setErr] = useState(""); const [copied, setCopied] = useState(false);
  useEffect(() => { if (left === null || left <= 0) return; const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); }, [left]);
  if (!db) return null;
  const back = <Link to="/dashboard" className="text-sm text-primary underline">← {fr ? "Retour au tableau de bord" : "Back to dashboard"}</Link>;
  if (!user || !task) return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-xl px-5 py-10">{back}</main></div>;
  const done = doneToday(user, task.id).length > 0;
  const limit = doneToday(user).length >= DAILY_LIMIT;
  const link = taskLink(user.username, task.id);
  const action = ACTION[task.domain][language];
  return (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10">
        {back}
        <div className="mt-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-secondary text-7xl">
            {task.domain === "videos" && left !== null ? <span className="text-2xl font-bold">{left > 0 ? `▶ ${left}s` : "✓"}</span>
              : image ? <img src={image.url} alt={fr ? image.altFr : image.altEn} className="h-full w-full object-cover" />
              : ICON[task.domain]}
          </div>
          <h1 className="font-display mt-4 text-2xl font-bold">{fr ? task.titleFr : task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{fr ? task.descFr : task.desc}</p>
          <p className="mt-2 font-semibold text-primary">+{eur(task.reward)}</p>
          <div className="mt-5">
            {done ? <p className="font-semibold text-primary">✓ {fr ? "Mission terminée — 50 € ajoutés" : "Task done — €50 added"}</p>
              : limit ? <p className="text-sm text-muted-foreground">{fr ? "Limite quotidienne atteinte" : "Daily limit reached"}</p>
              : left === null ? <button className={`${btnCls} w-full`} onClick={() => setLeft(task.seconds)}>{action}</button>
              : left > 0 ? <p className="text-sm">{fr ? "En cours…" : "In progress…"} {left}s</p>
              : <div className="space-y-3">
                  <p className="text-sm font-semibold">{fr ? "1. Copiez ce lien de preuve :" : "1. Copy this proof link:"}</p>
                  <div className="flex gap-2"><input readOnly className={inputCls} value={link} /><button className={btnCls} onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }}>{copied ? "✓" : fr ? "Copier" : "Copy"}</button></div>
                  <p className="text-sm font-semibold">{fr ? "2. Collez-le ici comme preuve :" : "2. Paste it here as proof:"}</p>
                  <input className={inputCls} placeholder={fr ? "Collez le lien" : "Paste the link"} value={paste} onChange={(e) => setPaste(e.target.value)} />
                  {err && <p className="text-sm text-destructive">{err}</p>}
                  <button className={`${btnCls} w-full`} onClick={async () => { const r = await completeTask(task.id, paste); setErr(r ? localizedError(r, language) : ""); }}>{fr ? "Envoyer la preuve" : "Submit proof"}</button>
                </div>}
          </div>
        </div>
      </main>
    </div>
  );
}
