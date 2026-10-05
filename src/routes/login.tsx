import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { login } from "@/lib/store";
import { localizedError, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Connexion — PayPoint" }, { name: "description", content: "Connectez-vous à votre tableau de bord PayPoint." }, { property: "og:title", content: "Connexion — PayPoint" }, { property: "og:description", content: "Accédez à vos missions et à votre solde." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { language, t } = useLanguage();
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  return (
    <div className="min-h-screen"><SiteHeader />
      <form className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8" onSubmit={async (e) => { e.preventDefault(); const r = await login(u, p); if (r) setErr(r); else nav({ to: "/dashboard" }); }}>
        <h1 className="font-display text-3xl font-bold">{t("signIn")}</h1>
        <input className={inputCls} placeholder={t("username")} value={u} onChange={(e) => setU(e.target.value)} />
        <input className={inputCls} type="password" placeholder={t("password")} value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p className="text-sm text-destructive">{localizedError(err, language)}</p>}
        <button className={`${btnCls} w-full`}>{t("signIn")}</button>
        <p className="text-center text-sm">{t("newHere")} <Link to="/signup" className="text-primary underline">{t("createAccount")}</Link></p>
      </form>
    </div>
  );
}
