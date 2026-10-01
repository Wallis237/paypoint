import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, inputCls, btnCls } from "@/components/SiteHeader";
import { login } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — AfriWork" }, { name: "description", content: "Sign in to your AfriWork dashboard." }, { property: "og:title", content: "Sign in — AfriWork" }, { property: "og:description", content: "Access your tasks and balance." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  return (
    <div className="min-h-screen"><SiteHeader />
      <form className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8" onSubmit={(e) => { e.preventDefault(); const r = login(u, p); if (r) setErr(r); else nav({ to: "/dashboard" }); }}>
        <h1 className="font-display text-3xl font-bold">Sign in</h1>
        <input className={inputCls} placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
        <input className={inputCls} type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={`${btnCls} w-full`}>Sign in</button>
        <p className="text-center text-sm">New here? <Link to="/signup" className="text-primary underline">Create account</Link></p>
      </form>
    </div>
  );
}
