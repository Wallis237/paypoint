import { Link, useNavigate } from "@tanstack/react-router";
import { currentUser, logout, useDB } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

export function SiteHeader() {
  const db = useDB();
  const user = currentUser(db);
  const nav = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-5 sm:py-4">
        <Link to="/" className="font-display text-xl font-bold text-primary sm:text-2xl">PayPoint<span className="text-accent">.</span></Link>
        <nav className="flex items-center gap-1.5 text-xs font-medium sm:gap-3 sm:text-sm">
          <div className="flex rounded-full border border-border p-0.5" aria-label="Langue / Language">
            {(["fr", "en"] as const).map((code) => <button key={code} type="button" onClick={() => setLanguage(code)} className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${language === code ? "bg-foreground text-background" : "text-muted-foreground"}`}>{code}</button>)}
          </div>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-primary">{t("dashboard")}</Link>
              <span className="hidden text-muted-foreground sm:inline">@{user.username}</span>
              <button onClick={async () => { await logout(); nav({ to: "/", replace: true }); }} className="rounded-full border border-border px-4 py-2 hover:bg-secondary">{t("signOut")}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 hover:text-primary">{t("signIn")}</Link>
              <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">{t("joinFree")}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";
