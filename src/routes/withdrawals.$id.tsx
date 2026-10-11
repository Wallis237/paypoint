import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { currentUser, DEMO_WITHDRAWAL_MS, eur, finishDemoWithdrawal, useDB } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/withdrawals/$id")({
  validateSearch: (search: Record<string, unknown>): { notification?: "failed" } => ({
    notification: search["notification"] === "failed" ? "failed" : undefined,
  }),
  head: () => ({ meta: [
    { title: "Suivi du retrait démo — PayPoint" },
    { name: "description", content: "Suivez le traitement et la confirmation de votre retrait simulé PayPoint. Aucun paiement réel." },
    { property: "og:title", content: "Suivi du retrait démo — PayPoint" },
    { property: "og:description", content: "Traitement et confirmation des retraits de démonstration PayPoint." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: WithdrawalPage,
});

function WithdrawalPage() {
  const { id } = Route.useParams();
  const { notification } = Route.useSearch();
  const db = useDB();
  const user = currentUser(db);
  const withdrawal = user?.withdrawals.find((w) => w.id === id);
  const { language, t } = useLanguage();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!withdrawal?.demo || withdrawal.status !== "processing") return;
    const tick = () => { setNow(Date.now()); finishDemoWithdrawal(id); };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [id, withdrawal?.demo, withdrawal?.status]);
  const paid = withdrawal?.status === "paid";
  const progress = withdrawal ? Math.min(100, Math.max(0, (now - Date.parse(withdrawal.date)) / DEMO_WITHDRAWAL_MS * 100)) : 0;
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
    <Button asChild variant="ghost" className="mb-8"><Link to="/dashboard" search={{ wallet: true }}><ArrowLeft />{t("returnWallet")}</Link></Button>
    {!db ? null : !user ? <Link to="/login" className="text-primary underline">{t("pleaseSignIn")}</Link> : !withdrawal ? <h1 className="text-xl font-semibold">{t("withdrawalMissing")}</h1> : <>
      <p className="mb-6 rounded-lg border border-border bg-secondary p-4 text-sm font-medium text-secondary-foreground">{t("demoPayoutNotice")}</p>
      {notification === "failed" && <p role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">{t("withdrawalAlertFailed")}</p>}
      <div className="text-center" role="status" aria-live="polite">
        {paid ? <CheckCircle2 className="mx-auto mb-5 size-16 text-primary" /> : <LoaderCircle className="mx-auto mb-5 size-16 animate-spin text-primary motion-reduce:animate-none" />}
        <p className="text-sm text-muted-foreground">{t("withdrawalTracking")}</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{paid ? t("withdrawalPaid") : t("withdrawalPending")}</h1>
        <p className="my-6 font-display text-4xl font-bold text-primary">{eur(withdrawal.amount)}</p>
      </div>
      <ol className="mb-8 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
        {[t("withdrawalReceived"), t("processing"), t("withdrawalSimulated")].map((label, index) => <li key={label} className={index < 2 || paid ? "font-semibold text-primary" : "text-muted-foreground"}><span className="mb-2 block">{index < 2 || paid ? "✓" : "○"}</span>{label}</li>)}
      </ol>
      {!paid && withdrawal.demo && <progress aria-label={t("processing")} max={100} value={progress} className="mb-8 h-2 w-full accent-primary" />}
      <dl className="divide-y divide-border border-y border-border text-sm">
        <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-muted-foreground">{t("paymentMethod")}</dt><dd className="font-semibold">{withdrawal.method}</dd></div>
        <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-muted-foreground">{t("mobileNumber")}</dt><dd className="break-all font-semibold">{withdrawal.number}</dd></div>
        <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-muted-foreground">{t("history")}</dt><dd>{new Date(withdrawal.date).toLocaleString(language === "fr" ? "fr-FR" : "en-GB")}</dd></div>
      </dl>
      <Button asChild size="lg" className="mt-8 h-12 w-full"><Link to="/dashboard" search={{ wallet: true }}><ArrowLeft />{t("returnWallet")}</Link></Button>
    </>}
  </main></div>;
}