import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { signup } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — AfriWork" }, { name: "description", content: "Create a free AfriWork account with a username and password." }, { property: "og:title", content: "Create account — AfriWork" }, { property: "og:description", content: "Join AfriWork for free." }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ u: "", p: "", c: "" });
  const [err, setErr] = useState("");
  return (
    <div className="min-h-screen"><SiteHeader />
      <form className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8" onSubmit={(e) => { e.preventDefault(); const r = signup(f.u, f.p, f.c); if (r) setErr(r); else nav({ to: "/apply" }); }}>
        <h1 className="font-display text-3xl font-bold">Create account</h1>
        <input className={inputCls} placeholder="Username" value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} />
        <input className={inputCls} type="password" placeholder="Password" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} />
        <input className={inputCls} type="password" placeholder="Repeat password" value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })} />
        {f.c && f.p !== f.c && <p className="text-sm text-destructive">Passwords do not match</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={`${btnCls} w-full`}>Sign up — free</button>
        <p className="text-center text-sm">Have an account? <Link to="/login" className="text-primary underline">Sign in</Link></p>
      </form>
    </div>
  );
}
