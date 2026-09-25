import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HouseholdGate } from "@/components/household-gate";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-kit";
import { addHouseholdMember, getHousehold, getSession } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/household")({ beforeLoad: async () => { try { if (!(await getSession())) throw redirect({ to: "/" }); } catch (error) { if (isRedirect(error)) throw error; throw redirect({ to: "/" }); } }, head: () => ({ meta: [{ title: "Household — Roommate Roulette" }, { name: "description", content: "Manage household members and chore rotation order." }, { property: "og:title", content: "Household — Roommate Roulette" }, { property: "og:description", content: "Manage household members and chore rotation order." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: HouseholdPage });

function HouseholdPage() {
  const fetchHousehold = useServerFn(getHousehold); const add = useServerFn(addHouseholdMember); const qc = useQueryClient(); const [error,setError]=useState("");
  const query = useQuery({ queryKey: ["household"], queryFn: () => fetchHousehold() });
  if (query.isLoading) return <AppShell><LoadingState/></AppShell>;
  if (query.error) return <AppShell><ErrorState message={query.error.message}/></AppShell>;
  if (!query.data) return <AppShell><HouseholdGate/></AppShell>;
  const household=query.data;
  return <AppShell><PageTitle index="02" title="Household" description="Roster and circular task queue order." action={<Button variant="outline" onClick={() => navigator.clipboard.writeText(household.id)}><Copy/>Copy household ID</Button>}/>
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><section className="border border-border bg-surface"><div className="grid grid-cols-[64px_1fr_auto] border-b border-border p-4 font-mono text-[10px] uppercase text-muted-foreground"><span>Turn</span><span>Flatmate</span><span>Status</span></div>{household.members.map((member,index)=><div key={member.id} className="grid grid-cols-[64px_1fr_auto] items-center border-b border-border p-4 last:border-b-0"><span className="font-mono text-xl text-primary">{String(member.turn_order_index ?? index).padStart(2,"0")}</span><div><p className="font-grotesk font-bold uppercase">{member.user_full_name ?? "Unnamed flatmate"}</p><p className="font-mono text-[10px] text-muted-foreground">{member.user_email ?? member.user_id}</p></div><Button variant="ghost" size="icon" title="Removal unavailable in API" disabled><Trash2/></Button></div>)}</section>
      <aside className="border border-border bg-surface-dark p-6 shadow-brutal-cyan"><p className="font-mono text-[10px] uppercase text-secondary">Roster mutation</p><h2 className="mt-2 font-grotesk text-2xl font-bold uppercase">Add flatmate</h2><p className="mt-2 text-sm text-muted-foreground">Enter their user UUID. They will be appended to the rotation unless you set an index.</p><form className="mt-6 space-y-3" onSubmit={async(e)=>{e.preventDefault(); const form=e.currentTarget; const d=new FormData(form); setError(""); try{await add({data:{user_id:String(d.get("user_id")),turn_order_index:d.get("order")?Number(d.get("order")):null}}); form.reset(); await qc.invalidateQueries({queryKey:["household"]});}catch(caught){setError(caught instanceof Error?caught.message:"Request failed");}}}><Input name="user_id" placeholder="User UUID" required/><Input name="order" type="number" min="0" placeholder="Turn index (optional)"/><Button className="w-full" type="submit"><Plus/>Add to roster</Button>{error&&<p className="font-mono text-xs text-destructive">ERR // {error}</p>}</form></aside>
    </div></AppShell>;
}