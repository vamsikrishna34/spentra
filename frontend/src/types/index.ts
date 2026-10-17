export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  merchant: string | null;
  source?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  planned_amount: number;
  period: string;
  actual_amount?: number;
  remaining?: number;
  health?: "green" | "yellow" | "red";
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  default_currency: string;
}

export interface Prediction {
  safe_daily_spend: number;
  velocity_warning: boolean;
  projected_month_end_total: number;
  days_until_budget_exhausted: number | null;
  recommendation: string;
}

export interface CoachingNudge {
  nudge: string;
}

export interface SpendingSummary {
  total_spent: number;
  transaction_count: number;
  by_category: Record<string, number>;
}
