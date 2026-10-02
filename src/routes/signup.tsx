import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { signup } from "@/lib/store";
import { localizedError, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Créer un compte — PayPoint" }, { name: "description", content: "Créez gratuitement votre compte PayPoint." }, { property: "og:title", content: "Créer un compte — PayPoint" }, { property: "og:description", content: "Rejoignez PayPoint gratuitement." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const { language, t } = useLanguage();
  const [f, setF] = useState({ u: "", p: "", c: "" });
  const [err, setErr] = useState("");
  return (
    <div className="min-h-screen"><SiteHeader />
      <form className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8" onSubmit={(e) => { e.preventDefault(); const r = signup(f.u, f.p, f.c); if (r) setErr(r); else nav({ to: "/apply" }); }}>
        <h1 className="font-display text-3xl font-bold">{t("createAccount")}</h1>
        <input className={inputCls} placeholder={t("username")} value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} />
        <input className={inputCls} type="password" placeholder={t("password")} value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} />
        <input className={inputCls} type="password" placeholder={t("repeatPassword")} value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })} />
        {f.c && f.p !== f.c && <p className="text-sm text-destructive">{t("passwordsMismatch")}</p>}
        {err && <p className="text-sm text-destructive">{localizedError(err, language)}</p>}
        <button className={`${btnCls} w-full`}>{t("signupFree")}</button>
        <p className="text-center text-sm">{t("alreadyAccount")} <Link to="/login" className="text-primary underline">{t("signIn")}</Link></p>
      </form>
    </div>
  );
}
