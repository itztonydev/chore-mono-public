import {
  createFileRoute,
  isRedirect,
  redirect,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Undo2,
  WalletCards,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { HouseholdGate } from "@/components/household-gate";
import {
  ErrorState,
  LoadingState,
  PageTitle,
} from "@/components/page-kit";

import {
  createExpense,
  getDashboard,
  getSession,
  undoLastActivity,
} from "@/lib/api.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoreRouletteView } from "@/components/ChoreRouletteView";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    try {
      if (!(await getSession())) {
        throw redirect({ to: "/" });
      }
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }

      throw redirect({ to: "/" });
    }
  },

  head: () => ({
    meta: [
      {
        title: "Dashboard — Roommate Roulette",
      },
      {
        name: "description",
        content:
          "Current chores, balances, debt simplification, and household activity.",
      },
      {
        property: "og:title",
        content: "Dashboard — Roommate Roulette",
      },
      {
        property: "og:description",
        content:
          "Current chores, balances, debt simplification, and household activity.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),

  component: Dashboard,
});

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Dashboard() {
  const dashboard = useServerFn(getDashboard);
  const undo = useServerFn(undoLastActivity);
  const addExpense = useServerFn(createExpense);

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboard(),
  });

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = () => {
    return queryClient.invalidateQueries({
      queryKey: ["dashboard"],
    });
  };

  if (query.isLoading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (query.error) {
    return (
      <AppShell>
        <ErrorState message={query.error.message} />
      </AppShell>
    );
  }

  if (!query.data) {
    return (
      <AppShell>
        <HouseholdGate />
      </AppShell>
    );
  }

  const data = query.data;

  async function perform(
    action: () => Promise<unknown>,
  ) {
    setError("");
    setNotice("");

    try {
      const result = (await action()) as {
        sarcastic_alert?: string | null;
        message?: string;
      };

      setNotice(
        result.sarcastic_alert ??
          result.message ??
          "Ledger updated.",
      );

      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Request failed",
      );
    }
  }

  return (
    <AppShell>
      <PageTitle
        index="01"
        title={data.household.name}
        description="Live rotation queue and zero-sum expense ledger."
        action={
          <div className="font-mono text-xs uppercase text-muted-foreground">
            Household // {data.household.id.slice(0, 12)}
          </div>
        }
      />

      {(notice || error) && (
        <div
          className={`mb-6 border p-4 font-mono text-xs ${
            error
              ? "border-destructive text-destructive shadow-brutal-red"
              : "border-accent text-accent shadow-brutal-green"
          }`}
        >
          {error ? "ERR" : "SYS"} // {error || notice}
        </div>
      )}

      <ChoreRouletteView householdId={data.household.id} />
      {/* Activity log */}
      <section className="mt-8 border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="font-mono text-[10px] uppercase text-primary">
              LIFO stack
            </p>

            <h2 className="font-grotesk text-2xl font-bold uppercase">
              Activity log
            </h2>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              perform(() => undo())
            }
          >
            <Undo2 />
            Undo latest
          </Button>
        </div>

        <div className="divide-y divide-border">
          {data.expenses
            .slice(0, 6)
            .map((expense) => (
              <div
                key={expense.id}
                className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div>
                  <p className="font-medium">
                    {expense.description}
                  </p>

                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Paid by{" "}
                    {expense.payer_name ??
                      expense.payer_id.slice(0, 8)}
                  </p>
                </div>

                <span className="font-mono text-sm text-secondary">
                  {money.format(expense.amount)}
                </span>

                <time className="font-mono text-[10px] text-muted-foreground">
                  {new Date(
                    expense.created_at,
                  ).toLocaleString()}
                </time>
              </div>
            ))}
        </div>
      </section>
    </AppShell>
  );
}

type HouseholdMember = {
  user_id: string;
  user_full_name?: string | null;
};

type ExpenseFormProps = {
  members: HouseholdMember[];

  onSubmit: (payload: {
    payer_id: string;
    amount: number;
    description: string;
    splits: Array<{
      user_id: string;
      split_amount: number;
    }>;
  }) => Promise<void>;
};

function ExpenseForm({
  members,
  onSubmit,
}: ExpenseFormProps) {
  return (
    <form
      className="grid gap-2 border-t border-border pt-5 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const amount = Number(
          formData.get("amount"),
        );

        const payerId = String(
          formData.get("payer"),
        );

        const description = String(
          formData.get("description"),
        );

        const included = members.map(
          (member) => member.user_id,
        );

        const split = Math.round(
          (amount / Math.max(included.length, 1)) *
            100,
        ) / 100;

        const splits = included.map(
          (userId, index) => ({
            user_id: userId,
            split_amount:
              index === included.length - 1
                ? Math.round(
                    (amount - split * index) * 100,
                  ) / 100
                : split,
          }),
        );

        await onSubmit({
          payer_id: payerId,
          amount,
          description,
          splits,
        });

        form.reset();
      }}
    >
      <Input
        name="description"
        placeholder="Expense description"
        required
      />

      <Input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Amount"
        required
      />

      <select
        name="payer"
        required
        className="h-11 border border-input bg-background px-3 font-mono text-xs"
      >
        <option value="">
          Who paid?
        </option>

        {members.map((member) => (
          <option
            key={member.user_id}
            value={member.user_id}
          >
            {member.user_full_name ??
              member.user_id.slice(0, 8)}
          </option>
        ))}
      </select>

      <Button type="submit">
        <WalletCards />
        Split equally
      </Button>
    </form>
  );
}