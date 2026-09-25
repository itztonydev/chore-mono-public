import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function PageTitle({ index, title, description, action }: { index: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-6 md:flex-row md:items-end"><div><p className="mb-2 font-mono text-xs uppercase text-primary">{index} / system module</p><h1 className="font-grotesk text-4xl font-bold uppercase md:text-6xl">{title}</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p></div>{action}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="grid min-h-64 place-items-center border border-dashed border-border bg-surface-dark p-8 text-center font-mono text-sm text-muted-foreground">{children}</div>;
}

export function LoadingState() { return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-8 animate-spin text-primary" aria-label="Loading" /></div>; }

export function ErrorState({ message }: { message: string }) { return <div className="border border-destructive bg-surface p-5 font-mono text-sm text-destructive shadow-brutal-red">ERR // {message}</div>; }