import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { COUNTRIES, DOMAINS, currentUser, submitApplication, useDB, type Domain } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/apply")({
  head: () => ({ meta: [{ title: "Candidature — PayPoint" }, { name: "description", content: "Candidatez aux domaines d’activité PayPoint." }, { property: "og:title", content: "Candidature — PayPoint" }, { property: "og:description", content: "Choisissez vos domaines et candidatez." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Apply,
});

function Apply() {
  const db = useDB(); const user = currentUser(db); const nav = useNavigate();
  const [f, setF] = useState({ fullName: "", country: "Cameroon", phone: "", motivation: "" });
  const [domains, setDomains] = useState<Domain[]>([]);
  const [err, setErr] = useState("");
  const { language, t } = useLanguage();
  if (!db) return null;
  if (!user) return <div className="min-h-screen"><SiteHeader /><p className="p-10 text-center"><Link to="/login" className="text-primary underline">{t("pleaseSignIn")}</Link></p></div>;
  return (
    <div className="min-h-screen"><SiteHeader />
      <form className="mx-auto my-12 max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-8" onSubmit={(e) => {
        e.preventDefault();
        if (f.fullName.trim().length < 3) return setErr(language === "fr" ? "Saisissez votre nom complet" : "Enter your full name");
        if (!/^\+?\d{8,15}$/.test(f.phone.replace(/\s/g, ""))) return setErr(language === "fr" ? "Saisissez un numéro valide" : "Enter a valid phone number");
        if (!domains.length) return setErr(language === "fr" ? "Sélectionnez au moins un domaine" : "Select at least one domain");
        submitApplication({ ...f, fullName: f.fullName.trim().slice(0, 100), motivation: f.motivation.slice(0, 500), domains });
        nav({ to: "/dashboard" });
      }}>
        <h1 className="font-display text-3xl font-bold">{t("jobApplication")}</h1>
        <p className="text-sm text-muted-foreground">{t("noPayment")}</p>
        <input className={inputCls} placeholder={t("fullName")} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <select className={inputCls} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
          <input className={inputCls} placeholder={t("phone")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOMAINS.map((d) => { const on = domains.includes(d.id); return (
            <button type="button" key={d.id} onClick={() => setDomains(on ? domains.filter((x) => x !== d.id) : [...domains, d.id])} className={`rounded-xl border p-4 text-left ${on ? "border-primary bg-secondary" : "border-border"}`}>
              <div className="font-bold">{on ? "✓ " : ""}{language === "fr" ? d.fr : d.name}</div><div className="text-xs text-muted-foreground">{language === "fr" ? d.descFr : d.desc}</div>
            </button>); })}
        </div>
        <textarea className={inputCls} rows={3} maxLength={500} placeholder={t("motivation")} value={f.motivation} onChange={(e) => setF({ ...f, motivation: e.target.value })} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnCls}>{t("submitApplication")}</button>
      </form>
    </div>
  );
}
