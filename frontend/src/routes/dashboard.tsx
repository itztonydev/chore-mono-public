import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, Plus, RotateCcw, SkipForward, Undo2, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HouseholdGate } from "@/components/household-gate";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-kit";
import { createChore, createExpense, getDashboard, getSession, rotateChore, undoLastActivity } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    try {
      if (!(await getSession())) throw redirect({ to: "/" });
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Dashboard — Roommate Roulette" }, { name: "description", content: "Current chores, balances, debt simplification, and household activity." }, { property: "og:title", content: "Dashboard — Roommate Roulette" }, { property: "og:description", content: "Current chores, balances, debt simplification, and household activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Dashboard,
});

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function Dashboard() {
  const dashboard = useServerFn(getDashboard); const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => dashboard() });
  const rotate = useServerFn(rotateChore); const undo = useServerFn(undoLastActivity); const addChore = useServerFn(createChore); const addExpense = useServerFn(createExpense);
  const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  if (query.isLoading) return <AppShell><LoadingState /></AppShell>;
  if (query.error) return <AppShell><ErrorState message={query.error.message} /></AppShell>;
  if (!query.data) return <AppShell><HouseholdGate /></AppShell>;
  const data = query.data;
  async function perform(action: () => Promise<unknown>) { setError(""); setNotice(""); try { const result = await action() as { sarcastic_alert?: string | null; message?: string }; setNotice(result.sarcastic_alert || result.message || "Ledger updated."); await refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed"); } }
  return <AppShell>
    <PageTitle index="01" title={data.household.name} description="Live rotation queue and zero-sum expense ledger." action={<div className="font-mono text-xs uppercase text-muted-foreground">Household // {data.household.id.slice(0, 12)}</div>} />
    {(notice || error) && <div className={`mb-6 border p-4 font-mono text-xs ${error ? "border-destructive text-destructive shadow-brutal-red" : "border-accent text-accent shadow-brutal-green"}`}>{error ? "ERR" : "SYS"} // {error || notice}</div>}
    <div className="grid border-l border-t border-border lg:grid-cols-2">
      <section className="border-b border-r border-border bg-background p-5 md:p-7">
        <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase text-secondary">Circular queue</p><h2 className="font-grotesk text-2xl font-bold uppercase">Task rotator</h2></div><span className="font-mono text-xs">{data.chores.length} ACTIVE</span></div>
        <div className="space-y-3">{data.chores.map((chore, index) => <article key={chore.id} className="grid grid-cols-[44px_1fr_auto] items-center border border-border bg-surface"><div className="grid h-full place-items-center border-r border-border font-mono text-xs text-primary">{String(index + 1).padStart(2,"0")}</div><div className="min-w-0 p-4"><h3 className="truncate font-grotesk font-bold uppercase">{chore.title}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">ON DUTY // <span className="text-secondary">{chore.current_assignee_name ?? "Unassigned"}</span></p></div><div className="flex border-l border-border"><Button variant="ghost" size="icon" title="Mark done and rotate" onClick={() => perform(() => rotate({ data: { chore_id: chore.id, completed: true, skip_turn: false } }))}><Check /></Button><Button variant="ghost" size="icon" title="Skip turn" onClick={() => perform(() => rotate({ data: { chore_id: chore.id, completed: false, skip_turn: true } }))}><SkipForward /></Button></div></article>)}</div>
        <ChoreForm members={data.household.members} onSubmit={(payload) => perform(() => addChore({ data: payload }))} />
      </section>
      <section className="border-b border-r border-border bg-surface-dark p-5 md:p-7">
        <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase text-accent">Min-cash-flow graph</p><h2 className="font-grotesk text-2xl font-bold uppercase">Expense tracker</h2></div><div className="text-right"><span className="block font-mono text-lg text-accent">{money.format(data.balances.total_household_spend)}</span><span className="font-mono text-[9px] uppercase text-muted-foreground">Total spend</span></div></div>
        <div className="grid grid-cols-2 border border-border">{Object.entries(data.balances.net_balances).map(([id, balance]) => <div key={id} className="border-b border-r border-border p-4 last:border-b-0"><p className="truncate text-sm">{data.balances.user_names?.[id] ?? id.slice(0,8)}</p><p className={`mt-2 font-mono text-lg ${balance >= 0 ? "text-accent" : "text-destructive"}`}>{balance >= 0 ? "+" : "−"}{money.format(Math.abs(balance))}</p></div>)}</div>
        <div className="my-5 space-y-2">{data.debts.simplified_transactions.map((debt, index) => <div key={`${debt.from_user_id}-${debt.to_user_id}-${index}`} className="flex items-center gap-3 border border-border bg-background p-3 font-mono text-xs"><span className="truncate">{debt.from_user_name ?? debt.from_user_id.slice(0,6)}</span><ArrowRight className="size-4 shrink-0 text-primary"/><span className="truncate">{debt.to_user_name ?? debt.to_user_id.slice(0,6)}</span><strong className="ml-auto text-secondary">{money.format(debt.amount)}</strong></div>)}</div>
        <ExpenseForm members={data.household.members} onSubmit={(payload) => perform(() => addExpense({ data: payload }))} />
      </section>
    </div>
    <section className="mt-8 border border-border bg-surface"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] uppercase text-primary">LIFO stack</p><h2 className="font-grotesk text-2xl font-bold uppercase">Activity log</h2></div><Button variant="outline" onClick={() => perform(() => undo())}><Undo2 /> Undo latest</Button></div>
      <div className="divide-y divide-border">{data.expenses.slice(0,6).map((expense) => <div key={expense.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-medium">{expense.description}</p><p className="font-mono text-[10px] uppercase text-muted-foreground">Paid by {expense.payer_name ?? expense.payer_id.slice(0,8)}</p></div><span className="font-mono text-sm text-secondary">{money.format(expense.amount)}</span><time className="font-mono text-[10px] text-muted-foreground">{new Date(expense.created_at).toLocaleString()}</time></div>)}</div>
    </section>
  </AppShell>;
}

function ChoreForm({ members, onSubmit }: { members: Array<{ user_id: string; user_full_name?: string | null }>; onSubmit: (payload: { title: string; description?: string; initial_assignee_id?: string | null }) => Promise<void> }) {
  return <form className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-[1fr_1fr_auto]" onSubmit={async (event) => { event.preventDefault(); const form = event.currentTarget; const d = new FormData(form); await onSubmit({ title: String(d.get("title")), initial_assignee_id: String(d.get("assignee")) || null }); form.reset(); }}><Input name="title" placeholder="New chore" required/><select name="assignee" className="h-11 border border-input bg-background px-3 font-mono text-xs"><option value="">No initial assignee</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.user_full_name ?? m.user_id.slice(0,8)}</option>)}</select><Button type="submit"><Plus/>Add</Button></form>;
}

function ExpenseForm({ members, onSubmit }: { members: Array<{ user_id: string; user_full_name?: string | null }>; onSubmit: (payload: { payer_id: string; amount: number; description: string; splits: Array<{ user_id: string; split_amount: number }> }) => Promise<void> }) {
  return <form className="grid gap-2 border-t border-border pt-5 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const form = event.currentTarget; const d = new FormData(form); const amount = Number(d.get("amount")); const included = members.map((m) => m.user_id); const split = Math.round((amount / Math.max(included.length,1)) * 100) / 100; const splits = included.map((user_id, i) => ({ user_id, split_amount: i === included.length - 1 ? Math.round((amount - split * i) * 100) / 100 : split })); await onSubmit({ payer_id: String(d.get("payer")), amount, description: String(d.get("description")), splits }); form.reset(); }}><Input name="description" placeholder="Expense description" required/><Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required/><select name="payer" required className="h-11 border border-input bg-background px-3 font-mono text-xs"><option value="">Who paid?</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.user_full_name ?? m.user_id.slice(0,8)}</option>)}</select><Button type="submit"><WalletCards/>Split equally</Button></form>;
}