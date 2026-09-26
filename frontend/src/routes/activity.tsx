import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Undo2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HouseholdGate } from "@/components/household-gate";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-kit";
import { Button } from "@/components/ui/button";
import { getDashboard, getSession, undoLastActivity } from "@/lib/api.functions";

export const Route = createFileRoute("/activity")({
  beforeLoad: async () => { try { if (!(await getSession())) throw redirect({ to: "/" }); } catch (error) { if (isRedirect(error)) throw error; throw redirect({ to: "/" }); } },
  head: () => ({ meta: [{ title: "Activity — Roommate Roulette" }, { name: "description", content: "Review and undo recent household expense activity." }, { property: "og:title", content: "Activity — Roommate Roulette" }, { property: "og:description", content: "Review and undo recent household expense activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ActivityPage,
});

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function ActivityPage() {
  const fetchDashboard = useServerFn(getDashboard); const undo = useServerFn(undoLastActivity); const queryClient = useQueryClient();
  const [notice, setNotice] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  if (query.isLoading) return <AppShell><LoadingState /></AppShell>;
  if (query.error) return <AppShell><ErrorState message={query.error.message} /></AppShell>;
  if (!query.data) return <AppShell><HouseholdGate /></AppShell>;
  const expenses = query.data.expenses;
  async function undoLatest() { setNotice(""); setError(""); setBusy(true); try { const result = await undo(); setNotice(result.sarcastic_alert || result.message || "Latest activity undone."); await queryClient.invalidateQueries({ queryKey: ["dashboard"] }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed"); } finally { setBusy(false); } }
  return <AppShell>
    <PageTitle index="03" title="Activity log" description="Latest-first household ledger history." action={<Button variant="outline" disabled={busy || expenses.length === 0} onClick={undoLatest}><Undo2 />Undo latest</Button>} />
    {(notice || error) && <div className={`mb-6 border p-4 font-mono text-xs ${error ? "border-destructive text-destructive shadow-brutal-red" : "border-accent text-accent shadow-brutal-green"}`}>{error ? "ERR" : "SYS"} // {error || notice}</div>}
    <section className="border border-border bg-surface shadow-brutal-cyan">
      <div className="grid grid-cols-[52px_1fr] border-b border-border p-4 font-mono text-[10px] uppercase text-muted-foreground md:grid-cols-[64px_1fr_auto_auto]"><span>Pos</span><span>Entry</span><span className="hidden md:block">Amount</span><span className="hidden md:block">Timestamp</span></div>
      {expenses.length ? expenses.map((expense, index) => <article key={expense.id} className="grid grid-cols-[52px_1fr] items-center border-b border-border p-4 last:border-b-0 md:grid-cols-[64px_1fr_auto_auto] md:gap-8"><span className="font-mono text-lg text-primary">{String(index).padStart(2, "0")}</span><div><p className="font-grotesk font-bold uppercase">{expense.description}</p><p className="font-mono text-[10px] uppercase text-muted-foreground">Paid by {expense.payer_name ?? expense.payer_id.slice(0, 8)}</p><p className="mt-2 font-mono text-xs text-secondary md:hidden">{money.format(expense.amount)}</p></div><span className="hidden font-mono text-sm text-secondary md:block">{money.format(expense.amount)}</span><time className="hidden font-mono text-[10px] text-muted-foreground md:block">{new Date(expense.created_at).toLocaleString()}</time></article>) : <p className="p-8 font-mono text-xs uppercase text-muted-foreground">Stack empty // No expense activity</p>}
    </section>
  </AppShell>;
}