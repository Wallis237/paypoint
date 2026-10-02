import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { DOMAINS } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PayPoint — Emplois à distance en Afrique francophone" },
      { name: "description", content: "Travail à distance gratuit en Afrique avec paiement par MTN Mobile Money ou Orange Money." },
      { property: "og:title", content: "PayPoint — Emplois à distance en Afrique francophone" },
      { property: "og:description", content: "Des missions gratuites avec paiement par mobile money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { language, t } = useLanguage();
  const steps = [["1", t("signupStep"), t("signupStepDesc")], ["2", t("applyStep"), t("applyStepDesc")], ["3", t("tasksStep"), t("tasksStepDesc")], ["4", t("withdrawStep"), t("withdrawStepDesc")]];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">{t("freeRemote")}</p>
        <h1 className="font-display max-w-4xl text-5xl font-bold leading-tight md:text-7xl">{t("heroTitle")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{t("heroCopy")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground hover:opacity-90">{t("createFree")}</Link>
          <Link to="/login" className="rounded-full border border-border px-7 py-3.5 font-semibold hover:bg-secondary">{t("haveAccount")}</Link>
        </div>
      </section>
      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold">{t("chooseDomain")}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {DOMAINS.map((d, i) => (
              <div key={d.id} className="rounded-2xl border border-border bg-background p-6">
                <div className="font-display text-4xl font-bold text-accent">0{i + 1}</div>
                <h3 className="mt-3 text-lg font-bold">{language === "fr" ? d.fr : d.name}</h3>
                <p className="mt-3 text-sm">{language === "fr" ? d.descFr : d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-4">
        {steps.map(([n, title, description]) => (
          <div key={n}><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{n}</div><h3 className="mt-3 font-bold">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div>
        ))}
      </section>
      <footer className="border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">© 2026 PayPoint · {t("footer")}</footer>
    </div>
  );
}
