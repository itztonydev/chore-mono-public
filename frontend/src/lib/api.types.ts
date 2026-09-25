export type SessionUser = {
  user_id: string;
  email: string;
  full_name: string;
  available_login_methods?: string[] | null;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  turn_order_index: number;
  user_full_name?: string | null;
  user_email?: string | null;
};

export type Household = {
  id: string;
  name: string;
  created_at: string;
  members: HouseholdMember[];
};

export type Chore = {
  id: string;
  household_id: string;
  title: string;
  description?: string | null;
  current_assignee_id?: string | null;
  current_assignee_name?: string | null;
  created_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  user_name?: string | null;
  split_amount: number;
};

export type Expense = {
  id: string;
  household_id: string;
  payer_id: string;
  payer_name?: string | null;
  amount: number;
  description: string;
  created_at: string;
  splits: ExpenseSplit[];
};

export type Balances = {
  household_id: string;
  net_balances: Record<string, number>;
  user_names?: Record<string, string>;
  is_balanced: boolean;
  total_household_spend: number;
};

export type DebtVector = {
  from_user_id: string;
  from_user_name?: string | null;
  to_user_id: string;
  to_user_name?: string | null;
  amount: number;
};

export type SimplifiedDebt = {
  household_id: string;
  net_balances: Record<string, number>;
  simplified_transactions: DebtVector[];
  original_transactions_count: number;
  simplified_transactions_count: number;
  transactions_eliminated: number;
  efficiency_gain_percent: number;
  algorithm_applied?: string;
};
