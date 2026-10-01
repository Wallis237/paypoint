import { Link, useNavigate } from "@tanstack/react-router";
import { currentUser, logout, useDB } from "@/lib/store";

export function SiteHeader() {
  const db = useDB();
  const user = currentUser(db);
  const nav = useNavigate();
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary">AfriWork<span className="text-accent">.</span></Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
              <span className="hidden text-muted-foreground sm:inline">@{user.username}</span>
              <button onClick={() => { logout(); nav({ to: "/", replace: true }); }} className="rounded-full border border-border px-4 py-2 hover:bg-secondary">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 hover:text-primary">Sign in</Link>
              <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">Join free</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";
