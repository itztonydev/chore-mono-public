import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, WalletCards } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { HouseholdGate } from "@/components/household-gate";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createExpense, getDashboard, getSession } from "@/lib/api.functions";
import type { HouseholdMember } from "@/lib/api.types";

export const Route = createFileRoute("/expenses")({
  beforeLoad: async () => { try { if (!(await getSession())) throw redirect({ to: "/" }); } catch (error) { if (isRedirect(error)) throw error; throw redirect({ to: "/" }); } },
  head: () => ({ meta: [{ title: "Expenses — Roommate Roulette" }, { name: "description", content: "Track shared expenses, balances, and simplified household debts." }, { property: "og:title", content: "Expenses — Roommate Roulette" }, { property: "og:description", content: "Track shared expenses, balances, and simplified household debts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ExpensesPage,
});

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function ExpensesPage() {
  const fetchDashboard = useServerFn(getDashboard); const addExpense = useServerFn(createExpense); const queryClient = useQueryClient();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  if (query.isLoading) return <AppShell><LoadingState /></AppShell>;
  if (query.error) return <AppShell><ErrorState message={query.error.message} /></AppShell>;
  if (!query.data) return <AppShell><HouseholdGate /></AppShell>;
  const data = query.data;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const amount = Number(values.get("amount"));
    const split = Math.round((amount / Math.max(data.household.members.length, 1)) * 100) / 100;
    const splits = data.household.members.map((member, index) => ({ user_id: member.user_id, split_amount: index === data.household.members.length - 1 ? Math.round((amount - split * index) * 100) / 100 : split }));
    setError(""); setBusy(true);
    try { await addExpense({ data: { payer_id: String(values.get("payer")), amount, description: String(values.get("description")), splits } }); form.reset(); await queryClient.invalidateQueries({ queryKey: ["dashboard"] }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed"); }
    finally { setBusy(false); }
  }
  return <AppShell>
    <PageTitle index="02" title="Expense tracker" description="Zero-sum balances and minimum-cash-flow settlement paths." />
    {error && <div className="mb-6 border border-destructive p-4 font-mono text-xs text-destructive shadow-brutal-red">ERR // {error}</div>}
    <div className="grid border-l border-t border-border lg:grid-cols-[1fr_400px]">
      <section className="border-b border-r border-border bg-surface-dark p-5 md:p-7">
        <div className="mb-6 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase text-accent">Net position</p><h2 className="font-grotesk text-2xl font-bold uppercase">Household balances</h2></div><span className="font-mono text-lg text-accent">{money.format(data.balances.total_household_spend)}</span></div>
        <div className="grid sm:grid-cols-2">{Object.entries(data.balances.net_balances).map(([id, balance]) => <div key={id} className="border border-border p-4"><p className="truncate text-sm">{data.balances.user_names?.[id] ?? id.slice(0, 8)}</p><p className={`mt-2 font-mono text-lg ${balance >= 0 ? "text-accent" : "text-destructive"}`}>{balance >= 0 ? "+" : "−"}{money.format(Math.abs(balance))}</p></div>)}</div>
        <div className="mt-6 space-y-2">{data.debts.simplified_transactions.map((debt, index) => <div key={`${debt.from_user_id}-${debt.to_user_id}-${index}`} className="flex items-center gap-3 border border-border bg-background p-3 font-mono text-xs"><span className="truncate">{debt.from_user_name ?? debt.from_user_id.slice(0, 6)}</span><ArrowRight className="size-4 shrink-0 text-primary" /><span className="truncate">{debt.to_user_name ?? debt.to_user_id.slice(0, 6)}</span><strong className="ml-auto text-secondary">{money.format(debt.amount)}</strong></div>)}</div>
      </section>
      <aside className="border-b border-r border-border bg-background p-5 md:p-7"><p className="font-mono text-[10px] uppercase text-primary">New ledger entry</p><h2 className="mt-1 font-grotesk text-2xl font-bold uppercase">Split expense</h2><ExpenseForm members={data.household.members} busy={busy} onSubmit={submit} /></aside>
    </div>
  </AppShell>;
}

function ExpenseForm({ members, busy, onSubmit }: { members: HouseholdMember[]; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <form className="mt-6 space-y-3" onSubmit={onSubmit}><Input name="description" placeholder="Expense description" required disabled={busy} /><Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required disabled={busy} /><select name="payer" required disabled={busy} className="h-11 w-full border border-input bg-background px-3 font-mono text-xs"><option value="">Who paid?</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.user_full_name ?? member.user_id.slice(0, 8)}</option>)}</select><Button className="w-full" type="submit" disabled={busy}><WalletCards />Split equally</Button></form>;
}