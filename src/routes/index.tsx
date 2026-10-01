import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { DOMAINS } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AfriWork — Remote jobs for Francophone Africa" },
      { name: "description", content: "Free remote work for Africans: promote products, crypto, vote for celebrities, like videos and get paid via MTN or Orange Money." },
      { property: "og:title", content: "AfriWork — Remote jobs for Francophone Africa" },
      { property: "og:description", content: "Free remote tasks paid to MTN Mobile Money and Orange Money." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">Travail à distance · Remote work · 100% gratuit</p>
        <h1 className="font-display max-w-3xl text-5xl font-bold leading-tight md:text-7xl">Work from anywhere in Africa. Get paid to your mobile money.</h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Join AfriWork for free, apply to a work domain, complete simple tasks and withdraw to MTN Mobile Money or Orange Money every Saturday.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground hover:opacity-90">Create free account</Link>
          <Link to="/login" className="rounded-full border border-border px-7 py-3.5 font-semibold hover:bg-secondary">I have an account</Link>
        </div>
      </section>
      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold">Choose your work domain</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {DOMAINS.map((d, i) => (
              <div key={d.id} className="rounded-2xl border border-border bg-background p-6">
                <div className="font-display text-4xl font-bold text-accent">0{i + 1}</div>
                <h3 className="mt-3 text-lg font-bold">{d.name}</h3>
                <p className="text-sm italic text-muted-foreground">{d.fr}</p>
                <p className="mt-3 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-4">
        {[["1", "Sign up", "Just a username and password."], ["2", "Apply", "Pick your domains and get accepted."], ["3", "Complete tasks", "Your balance grows after each completed task."], ["4", "Withdraw", "Saturdays 10:00–15:00 to MTN or Orange Money."]].map(([n, t, d]) => (
          <div key={n}><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{n}</div><h3 className="mt-3 font-bold">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></div>
        ))}
      </section>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">© 2026 AfriWork · No fees, ever. Nous ne demandons jamais de paiement.</footer>
    </div>
  );
}
