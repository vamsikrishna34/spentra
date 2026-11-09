import type { Transaction, Budget } from "../types";
import {
  MOCK_TRANSACTIONS,
  MOCK_BUDGETS,
  MOCK_COACH_RESPONSES,
  computePrediction,
  enrichBudgets,
  parseTextTransaction,
  generateId,
  convertToUSD,
  formatCurrency,
} from "./mockData";
import { supabase } from "./supabaseClient";

const STORAGE_KEY = "spentra_data_v1";

interface StoredData {
  transactions: Transaction[];
  budgets: Budget[];
}

function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredData;
  } catch {
    return null;
  }
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function getInitialData(): StoredData {
  const stored = loadFromStorage();
  if (stored) return stored;
  return {
    transactions: [...MOCK_TRANSACTIONS],
    budgets: [...MOCK_BUDGETS],
  };
}

// Simulated async delay for realistic UX
function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dataStore = {
  async getTransactions(): Promise<Transaction[]> {
    await delay(200);
    return getInitialData().transactions;
  },

  async getBudgets(): Promise<Budget[]> {
    await delay(200);
    const data = getInitialData();
    return enrichBudgets(data.budgets, data.transactions);
  },

  async getSalary(): Promise<number> {
    if (!supabase) throw new Error("Database connection is not configured");
    const { data, error } = await supabase
      .from("salary_settings")
      .select("monthly_amount_usd")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw error;
    return data ? Number(data.monthly_amount_usd) : 0;
  },

  async saveSalary(monthlyAmountUSD: number): Promise<void> {
    if (!supabase) throw new Error("Database connection is not configured");
    const { error } = await supabase
      .from("salary_settings")
      .upsert(
        { id: "default", monthly_amount_usd: Number(monthlyAmountUSD.toFixed(4)), updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    if (error) throw error;
  },

  async addTransaction(
    tx: Omit<Transaction, "id" | "user_id">
  ): Promise<Transaction> {
    await delay(400);
    const data = getInitialData();
    const newTx: Transaction = {
      ...tx,
      id: generateId(),
      user_id: "demo-user",
      converted_amount: tx.converted_amount || convertToUSD(tx.amount, tx.currency),
    };
    data.transactions.unshift(newTx);
    saveToStorage(data);
    return newTx;
  },

  async addTransactions(
    txs: Omit<Transaction, "id" | "user_id">[]
  ): Promise<Transaction[]> {
    await delay(500);
    const data = getInitialData();
    const newTxs = txs.map((tx) => ({
      ...tx,
      id: generateId(),
      user_id: "demo-user",
      converted_amount: tx.converted_amount || convertToUSD(tx.amount, tx.currency),
    }));
    data.transactions.unshift(...newTxs);
    saveToStorage(data);
    return newTxs;
  },

  async deleteTransaction(id: string): Promise<void> {
    await delay(150);
    const data = getInitialData();
    data.transactions = data.transactions.filter((t) => t.id !== id);
    saveToStorage(data);
  },

  async updateBudget(budgetId: string, plannedAmount: number): Promise<Budget> {
    await delay(200);
    const data = getInitialData();
    const budget = data.budgets.find((b) => b.id === budgetId);
    if (!budget) throw new Error("Budget not found");
    budget.planned_amount = plannedAmount;
    saveToStorage(data);
    return enrichBudgets(data.budgets, data.transactions).find((b) => b.id === budgetId)!;
  },

  async addBudget(category: string, plannedAmount: number): Promise<Budget> {
    await delay(200);
    const data = getInitialData();
    const newBudget: Budget = {
      id: `bud-${Date.now()}`,
      user_id: "demo-user",
      category,
      planned_amount: plannedAmount,
      period: "monthly",
    };
    data.budgets.push(newBudget);
    saveToStorage(data);
    return enrichBudgets(data.budgets, data.transactions).find((b) => b.id === newBudget.id)!;
  },

  async deleteBudget(budgetId: string): Promise<void> {
    await delay(150);
    const data = getInitialData();
    data.budgets = data.budgets.filter((b) => b.id !== budgetId);
    saveToStorage(data);
  },

  async getCoachResponse(question: string, transactions: Transaction[], budgets: Budget[], currency: string): Promise<string> {
    await delay(800);
    const lower = question.toLowerCase();
    const spentIn = (category: string) => transactions
      .filter((t) => t.category === category)
      .reduce((s, t) => s + (t.converted_amount || t.amount), 0);

    if (lower.includes("food") || lower.includes("eat") || lower.includes("dining")) {
      const foodBudget = budgets.find((b) => b.category === "food");
      const foodSpent = spentIn("food");
      if (!foodBudget) return `You've spent ${formatCurrency(foodSpent, currency)} on food this month. You don't have a food budget set yet.`;
      const pct = ((foodSpent / foodBudget.planned_amount) * 100).toFixed(0);
      return `You've spent ${formatCurrency(foodSpent, currency)} on food this month — that's ${pct}% of your ${formatCurrency(foodBudget.planned_amount, currency)} budget. ${foodSpent < foodBudget.planned_amount * 0.8 ? "You're on track!" : "Consider meal prepping to save."}`;
    }

    if (lower.includes("transport") || lower.includes("gas") || lower.includes("uber")) {
      return `Transport spending: ${formatCurrency(spentIn("transport"), currency)} this month. Consider public transit or carpooling to reduce costs by up to 30%.`;
    }

    if (lower.includes("save") || lower.includes("saving") || lower.includes("cut")) {
      const discretionary = spentIn("entertainment") + spentIn("food");
      return `Your dining and entertainment spending is ${formatCurrency(discretionary, currency)} this month. Trimming that by 20% would free up ${formatCurrency(discretionary * 0.2, currency)}.`;
    }

    if (lower.includes("budget") || lower.includes("over") || lower.includes("limit")) {
      const prediction = computePrediction(transactions, budgets, currency);
      const totalBudget = budgets.reduce((s, b) => s + b.planned_amount, 0);
      return prediction.velocity_warning
        ? `Warning: You're projected to exceed your budget by ${formatCurrency(prediction.projected_month_end_total - totalBudget, currency)} this month. Safe daily spend: ${formatCurrency(prediction.safe_daily_spend, currency)}.`
        : `You're within budget! Safe daily spend for the rest of the month: ${formatCurrency(prediction.safe_daily_spend, currency)}.`;
    }

    const idx = Math.floor(Math.random() * MOCK_COACH_RESPONSES.length);
    return MOCK_COACH_RESPONSES[idx];
  },

  parseNaturalLanguage(text: string): Omit<Transaction, "id" | "user_id"> {
    return parseTextTransaction(text);
  },

  resetData(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
