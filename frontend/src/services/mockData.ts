import type {
  Transaction,
  Budget,
  Prediction,
  CurrencyRate,
  TransactionSource,
  HealthStatus,
} from "../types";

// Static mock exchange rates (USD base)
export const MOCK_RATES: CurrencyRate[] = [
  { code: "USD", rate: 1, symbol: "$" },
  { code: "EUR", rate: 0.92, symbol: "€" },
  { code: "GBP", rate: 0.79, symbol: "£" },
  { code: "JPY", rate: 149.5, symbol: "¥" },
  { code: "INR", rate: 83.2, symbol: "₹" },
  { code: "CAD", rate: 1.36, symbol: "C$" },
  { code: "AUD", rate: 1.52, symbol: "A$" },
];

export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  MOCK_RATES.map((r) => [r.code, r.symbol])
);

export function convertToUSD(amount: number, fromCurrency: string): number {
  if (fromCurrency === "USD") return amount;
  const rate = MOCK_RATES.find((r) => r.code === fromCurrency);
  if (!rate) return amount;
  return amount / rate.rate;
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || "$";
}

export const CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "health",
  "education",
  "travel",
  "other",
] as const;

// Parse natural language text into a transaction (mock parser)
export function parseTextTransaction(text: string): Omit<Transaction, "id" | "user_id"> {
  const lower = text.toLowerCase();

  const amountMatch = text.match(/(?:\$|€|£|¥|₹)?\s*(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  let currency = "USD";
  if (text.includes("€") || lower.includes(" eur")) currency = "EUR";
  else if (text.includes("£") || lower.includes(" gbp")) currency = "GBP";
  else if (text.includes("¥") || lower.includes(" jpy")) currency = "JPY";
  else if (text.includes("₹") || lower.includes(" inr")) currency = "INR";

  let category: string = "other";
  const categoryKeywords: Record<string, string[]> = {
    food: ["coffee", "lunch", "dinner", "breakfast", "groceries", "restaurant", "food", "chipotle", "starbucks", "pizza", "meal", "snack", "grocery"],
    transport: ["uber", "gas", "fuel", "taxi", "bus", "train", "parking", "transport", "lyft", "shell"],
    shopping: ["shoes", "clothes", "amazon", "shopping", "nike", "mall", "store", "purchase"],
    bills: ["electric", "water", "internet", "phone", "rent", "mortgage", "bill", "utility", "utilities"],
    entertainment: ["movie", "netflix", "spotify", "game", "concert", "entertainment", "amc", "cinema"],
    health: ["pharmacy", "doctor", "gym", "health", "medicine", "vitamin", "cvs", "dental"],
    education: ["book", "course", "tuition", "class", "education", "udemy", "coursera"],
    travel: ["flight", "hotel", "travel", "airbnb", "booking", "vacation"],
  };
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  const merchantMatch = text.match(/(?:at|from)\s+([A-Z][a-zA-Z]+)/);
  const merchant = merchantMatch ? merchantMatch[1] : null;

  const description = text.replace(/(?:spent|paid|i spent|bought|purchased)\s*/i, "").trim();

  return {
    description: description || text,
    amount,
    currency,
    converted_amount: convertToUSD(amount, currency),
    category,
    date: new Date().toISOString().split("T")[0],
    merchant,
    source: "text" as TransactionSource,
  };
}

export function computeHealth(planned: number, actual: number): HealthStatus {
  if (actual >= planned) return "red";
  if (actual >= planned * 0.8) return "yellow";
  return "green";
}

export function computePrediction(
  transactions: Transaction[],
  budgets: Budget[]
): Prediction {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();
  const dayOfMonth = now.getDate();

  const monthTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const totalSpent = monthTransactions.reduce((sum, t) => sum + (t.converted_amount || t.amount), 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.planned_amount, 0);
  const remaining = totalBudget - totalSpent;

  const safeDailySpend = daysRemaining > 0 ? remaining / daysRemaining : 0;

  const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projectedMonthEnd = totalSpent + dailyAvg * daysRemaining;
  const velocityWarning = projectedMonthEnd > totalBudget;

  let daysUntilExhausted: number | null = null;
  if (dailyAvg > 0 && remaining > 0) {
    daysUntilExhausted = Math.floor(remaining / dailyAvg);
  } else if (remaining <= 0) {
    daysUntilExhausted = 0;
  }

  let recommendation: string;
  if (velocityWarning) {
    recommendation = `You're on pace to spend $${projectedMonthEnd.toFixed(0)} this month — $${(projectedMonthEnd - totalBudget).toFixed(0)} over budget. Consider cutting back on discretionary spending.`;
  } else if (remaining > 0 && daysRemaining > 0) {
    recommendation = `Great pace! You can safely spend $${safeDailySpend.toFixed(2)} per day for the remaining ${daysRemaining} days and stay within budget.`;
  } else {
    recommendation = "Keep tracking your expenses to get personalized insights.";
  }

  return {
    safe_daily_spend: Math.max(0, safeDailySpend),
    velocity_warning: velocityWarning,
    projected_month_end_total: projectedMonthEnd,
    days_until_budget_exhausted: daysUntilExhausted,
    recommendation,
  };
}

export function enrichBudgets(budgets: Budget[], transactions: Transaction[]): Budget[] {
  const now = new Date();
  return budgets.map((b) => {
    const actual = transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          t.category === b.category &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + (t.converted_amount || t.amount), 0);

    const remaining = b.planned_amount - actual;
    const health = computeHealth(b.planned_amount, actual);

    return { ...b, actual_amount: actual, remaining, health };
  });
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", user_id: "demo-user", description: "Groceries at Whole Foods", amount: 85.5, currency: "USD", converted_amount: 85.5, category: "food", date: getDateOffset(0), merchant: "Whole Foods", source: "voice" },
  { id: "tx-2", user_id: "demo-user", description: "Uber ride downtown", amount: 18.75, currency: "USD", converted_amount: 18.75, category: "transport", date: getDateOffset(0), merchant: "Uber", source: "text" },
  { id: "tx-3", user_id: "demo-user", description: "Lunch at Chipotle", amount: 14.5, currency: "USD", converted_amount: 14.5, category: "food", date: getDateOffset(0), merchant: "Chipotle", source: "voice" },
  { id: "tx-4", user_id: "demo-user", description: "Coffee at Starbucks", amount: 6.25, currency: "USD", converted_amount: 6.25, category: "food", date: getDateOffset(1), merchant: "Starbucks", source: "voice" },
  { id: "tx-5", user_id: "demo-user", description: "Netflix subscription", amount: 15.99, currency: "USD", converted_amount: 15.99, category: "entertainment", date: getDateOffset(1), merchant: "Netflix", source: "manual" },
  { id: "tx-6", user_id: "demo-user", description: "Electric bill", amount: 120.0, currency: "USD", converted_amount: 120.0, category: "bills", date: getDateOffset(2), merchant: "Electric Co", source: "ocr" },
  { id: "tx-7", user_id: "demo-user", description: "Running shoes at Nike", amount: 95.0, currency: "USD", converted_amount: 95.0, category: "shopping", date: getDateOffset(2), merchant: "Nike", source: "manual" },
  { id: "tx-8", user_id: "demo-user", description: "Pharmacy vitamins", amount: 32.4, currency: "USD", converted_amount: 32.4, category: "health", date: getDateOffset(3), merchant: "CVS", source: "text" },
  { id: "tx-9", user_id: "demo-user", description: "Dinner in Paris", amount: 42.0, currency: "EUR", converted_amount: 45.65, category: "food", date: getDateOffset(3), merchant: "Bistro Paris", source: "text" },
  { id: "tx-10", user_id: "demo-user", description: "Train ticket London", amount: 15.5, currency: "GBP", converted_amount: 19.62, category: "transport", date: getDateOffset(4), merchant: "Tube", source: "text" },
  { id: "tx-11", user_id: "demo-user", description: "Gas fill-up", amount: 52.3, currency: "USD", converted_amount: 52.3, category: "transport", date: getDateOffset(4), merchant: "Shell", source: "manual" },
  { id: "tx-12", user_id: "demo-user", description: "Movie tickets AMC", amount: 28.0, currency: "USD", converted_amount: 28.0, category: "entertainment", date: getDateOffset(5), merchant: "AMC", source: "text" },
  { id: "tx-13", user_id: "demo-user", description: "Sushi in Tokyo", amount: 3200, currency: "JPY", converted_amount: 21.4, category: "food", date: getDateOffset(5), merchant: "Sushi Bar", source: "voice" },
  { id: "tx-14", user_id: "demo-user", description: "Online course Udemy", amount: 19.99, currency: "USD", converted_amount: 19.99, category: "education", date: getDateOffset(6), merchant: "Udemy", source: "text" },
  { id: "tx-15", user_id: "demo-user", description: "Internet bill", amount: 79.99, currency: "USD", converted_amount: 79.99, category: "bills", date: getDateOffset(7), merchant: "Comcast", source: "manual" },
];

export const MOCK_BUDGETS: Budget[] = [
  { id: "bud-1", user_id: "demo-user", category: "food", planned_amount: 600, period: "monthly" },
  { id: "bud-2", user_id: "demo-user", category: "transport", planned_amount: 200, period: "monthly" },
  { id: "bud-3", user_id: "demo-user", category: "shopping", planned_amount: 300, period: "monthly" },
  { id: "bud-4", user_id: "demo-user", category: "bills", planned_amount: 800, period: "monthly" },
  { id: "bud-5", user_id: "demo-user", category: "entertainment", planned_amount: 150, period: "monthly" },
  { id: "bud-6", user_id: "demo-user", category: "health", planned_amount: 150, period: "monthly" },
];

export const MOCK_COACH_RESPONSES: string[] = [
  "You've spent $173 on food this month — that's 29% of your food budget. At this pace, you'll stay well within your $600 limit. Nice work!",
  "Your transport spending is at $90, which is 45% of budget with 14 days left. Consider carpooling or public transit a few days to keep on track.",
  "I notice your entertainment budget is at 92% capacity. Maybe skip one more movie night this month to stay in the green zone?",
  "You're doing great! Your total spending velocity is below your daily safe spend. Keep it up and you'll end the month with budget to spare.",
  "Your biggest spend category this month is food. Meal prepping on weekends could save you an estimated $80-120 monthly.",
  "Watch out — your bills category will likely hit the $800 cap with the upcoming utility payment. Plan ahead for next month's cycle.",
];

function getDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export function generateId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// CSV parser for drag-and-drop import
export function parseCsv(csvText: string): Omit<Transaction, "id" | "user_id">[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const transactions: Omit<Transaction, "id" | "user_id">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const amount = parseFloat(row.amount || row.price || "0") || 0;
    const currency = (row.currency || "USD").toUpperCase();
    const category = CATEGORIES.includes(row.category?.toLowerCase() as typeof CATEGORIES[number])
      ? row.category.toLowerCase()
      : "other";

    transactions.push({
      description: row.description || row.desc || row.name || "Imported transaction",
      amount,
      currency,
      converted_amount: convertToUSD(amount, currency),
      category,
      date: row.date || new Date().toISOString().split("T")[0],
      merchant: row.merchant || null,
      source: "csv",
    });
  }

  return transactions;
}
