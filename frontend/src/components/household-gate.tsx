import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createHousehold, selectHousehold } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HouseholdGate() {
  const [mode, setMode] = useState<"join" | "create">("create");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createHousehold);
  const select = useServerFn(selectHousehold);
  const queryClient = useQueryClient();
  return <div className="mx-auto max-w-2xl border border-border bg-surface p-6 shadow-brutal-purple md:p-10">
    <p className="font-mono text-xs uppercase text-primary">Setup required</p>
    <h2 className="mt-2 font-grotesk text-3xl font-bold uppercase">Choose your household</h2>
    <p className="mt-3 text-sm text-muted-foreground">Create a new home, or enter an existing household ID shared by a flatmate.</p>
    <div className="mt-6 grid grid-cols-2 border border-border">
      <Button variant={mode === "create" ? "default" : "ghost"} onClick={() => setMode("create")}>Create new</Button>
      <Button variant={mode === "join" ? "default" : "ghost"} onClick={() => setMode("join")}>Use ID</Button>
    </div>
    <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(""); try { if (mode === "create") await create({ data: { name: value } }); else await select({ data: { household_id: value } }); await queryClient.invalidateQueries(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed"); } finally { setBusy(false); } }}>
      <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={mode === "create" ? "Household name" : "Household UUID"} required />
      <Button type="submit" disabled={busy}>{busy ? "Working…" : mode === "create" ? "Create household" : "Open household"}</Button>
    </form>
    {error && <p className="mt-4 font-mono text-xs text-destructive">ERR // {error}</p>}
  </div>;
}