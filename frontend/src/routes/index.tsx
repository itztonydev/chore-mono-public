import { createFileRoute, isRedirect, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Dice5, LockKeyhole, UserPlus } from "lucide-react";
import { authenticate, getSession } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      if (await getSession()) throw redirect({ to: "/dashboard" });
    } catch (error) {
      if (isRedirect(error)) throw error;
      return;
    }
  },
  head: () => ({ meta: [
    { title: "Sign in — Roommate Roulette" },
    { name: "description", content: "Sign in to rotate chores and settle household expenses." },
    { property: "og:title", content: "Sign in — Roommate Roulette" },
    { property: "og:description", content: "Sign in to rotate chores and settle household expenses." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useServerFn(authenticate);
  const navigate = useNavigate();
  return <main className="grid min-h-screen bg-background lg:grid-cols-[1.15fr_0.85fr]">
    <section className="relative hidden overflow-hidden border-r border-border p-10 lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3 font-grotesk text-lg font-bold uppercase"><span className="grid size-9 place-items-center border border-primary bg-primary text-primary-foreground shadow-brutal-purple"><Dice5 /></span> Roommate Roulette</div>
      <div className="max-w-3xl"><p className="mb-5 font-mono text-xs uppercase text-secondary">[ Household operations console ]</p><h1 className="font-grotesk text-7xl font-bold uppercase leading-[0.95]">Chores rotate.<br/><span className="text-primary">Debts simplify.</span><br/>Peace survives.</h1><p className="mt-7 max-w-xl text-lg text-muted-foreground">One unforgiving ledger for task turns, shared expenses, and the receipts nobody can argue with.</p></div>
      <div className="grid grid-cols-3 border border-border bg-background font-mono text-xs uppercase"><div className="border-r border-border p-4"><span className="block text-secondary">O(1)</span>rotation</div><div className="border-r border-border p-4"><span className="block text-accent">Σ 0</span>balances</div><div className="p-4"><span className="block text-primary">LIFO</span>undo</div></div>
    </section>
    <section className="flex items-center justify-center p-5 md:p-10">
      <div className="w-full max-w-md border border-border bg-surface p-6 shadow-brutal-purple md:p-9">
        <div className="mb-8 flex items-center gap-3 lg:hidden"><Dice5 className="text-primary"/><span className="font-grotesk font-bold uppercase">Roommate Roulette</span></div>
        <p className="font-mono text-xs uppercase text-primary">Access terminal</p><h2 className="mt-2 font-grotesk text-4xl font-bold uppercase">{mode === "login" ? "Sign in" : "Create account"}</h2>
        <form className="mt-8 space-y-5" onSubmit={
          async (event) => { 
            event.preventDefault(); 
            setBusy(true); 
            setError(""); 
            const data = new FormData(event.currentTarget); 
            try { await auth({ 
              data: { 
                mode, 
                email: String(data.get("email")), password: String(data.get("password")), full_name: mode === "register" ? String(data.get("full_name")) : undefined } }); await navigate({ to: "/dashboard", replace: true }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Authentication failed"); } finally { setBusy(false); } }}>
          {mode === "register" && <label className="block"><span className="mb-2 block font-mono text-[11px] uppercase text-muted-foreground">Full name</span><Input name="full_name" autoComplete="name" required /></label>}
          <label className="block"><span className="mb-2 block font-mono text-[11px] uppercase text-muted-foreground">Email address</span><Input name="email" type="email" autoComplete="email" required /></label>
          <label className="block"><span className="mb-2 block font-mono text-[11px] uppercase text-muted-foreground">Password</span><Input name="password" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {error && <div role="alert" className="border border-destructive p-3 font-mono text-xs text-destructive">ERR // {error}</div>}
          <Button className="w-full" size="lg" type="submit" disabled={busy}>{busy ? "Authorizing…" : mode === "login" ? "Enter dashboard" : "Create account"}<ArrowRight /></Button>
        </form>
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-6 flex w-full items-center justify-center gap-2 font-mono text-xs uppercase text-muted-foreground hover:text-secondary">{mode === "login" ? <UserPlus className="size-4"/> : <LockKeyhole className="size-4"/>}{mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}</button>
        <p className="mt-8 border-t border-border pt-4 font-mono text-[10px] uppercase text-muted-foreground">Session protected by server-only HTTP cookie</p>
      </div>
    </section>
  </main>;
}