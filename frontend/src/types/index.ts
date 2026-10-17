export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  converted_amount?: number;
  category: string;
  date: string;
  merchant: string | null;
  source?: TransactionSource;
}

export type TransactionSource = "voice" | "text" | "manual" | "ocr" | "csv";

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  planned_amount: number;
  period: string;
  actual_amount?: number;
  remaining?: number;
  health?: HealthStatus;
}

export type HealthStatus = "green" | "yellow" | "red";

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface CurrencyRate {
  code: string;
  rate: number;
  symbol: string;
}

export interface SpendingSummary {
  total_spent: number;
  transaction_count: number;
  by_category: Record<string, number>;
}

export interface ExportOptions {
  format: "excel" | "pdf" | "word";
  dateRange?: "month" | "quarter" | "year" | "all";
}

export type AppView =
  | "dashboard"
  | "transactions"
  | "log"
  | "analytics"
  | "export"
  | "settings";
