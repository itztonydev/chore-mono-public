import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Home, LayoutDashboard, LogOut, UserRound, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { signOut } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/household" as const, label: "Household", icon: Home },
  { to: "/account" as const, label: "Account", icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const logout = useServerFn(signOut);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 md:px-8">
          <Link to="/dashboard" className="flex items-center gap-3 font-grotesk text-base font-bold uppercase md:text-lg">
            <span className="grid size-8 place-items-center border border-primary bg-primary text-primary-foreground shadow-brutal-sm-purple"><Zap className="size-4" /></span>
            <span className="hidden sm:inline">Roommate Roulette</span>
            <span className="sm:hidden">R.R.</span>
          </Link>
          <nav className="flex h-full items-stretch border-x border-border">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} aria-label={label} title={label} className={`flex min-w-12 items-center justify-center gap-2 border-r border-border px-3 font-mono text-xs uppercase transition-colors first:border-l-0 md:min-w-32 ${pathname === to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}>
                <Icon className="size-4" /><span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onClick={async () => { await logout(); await navigate({ to: "/", replace: true }); }}><LogOut /></Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-12">{children}</main>
      <footer className="border-t border-border px-4 py-4 font-mono text-[10px] uppercase text-muted-foreground md:px-8">
        <div className="mx-auto flex max-w-[1500px] justify-between"><span>RR_SYS / v1.0</span><span className="flex items-center gap-1"><CreditCard className="size-3" /> Zero-sum ledger</span></div>
      </footer>
    </div>
  );
}