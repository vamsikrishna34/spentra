import { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, TrendingUp, TrendingDown, Loader2, Trash2, Download } from "lucide-react";

import Sidebar from "./components/Sidebar";
import VoiceLogger from "./components/VoiceLogger";
import QuickInputBar from "./components/QuickInputBar";
import HealthBarCard from "./components/HealthBarCard";
import PredictiveBanner from "./components/PredictiveBanner";
import AiSidebarChat from "./components/AiSidebarChat";
import ExportModal from "./components/ExportModal";

import apiClient from "./services/api";
import type { Transaction, Budget, Prediction } from "./types";

const DEMO_USER_ID = "demo-user";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, budgetRes] = await Promise.all([
        apiClient.getTransactions(DEMO_USER_ID),
        apiClient.getBudgets(DEMO_USER_ID),
      ]);
      setTransactions(txRes.data.transactions || []);
      setBudgets(budgetRes.data.budgets || []);

      try {
        const predRes = await apiClient.getPrediction(DEMO_USER_ID);
        setPrediction(predRes.data.prediction);
      } catch {
        setPrediction(null);
      }
    } catch {
      setError("Unable to load data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogText = async (text: string) => {
    setLogLoading(true);
    try {
      await apiClient.logText({ text, user_id: DEMO_USER_ID });
      await loadData();
    } catch {
      setError("Failed to log transaction.");
    } finally {
      setLogLoading(false);
    }
  };

  const handleLogVoice = async (transcript: string) => {
    setLogLoading(true);
    try {
      await apiClient.logVoice({ text: transcript, user_id: DEMO_USER_ID });
      await loadData();
    } catch {
      setError("Failed to log voice transaction.");
    } finally {
      setLogLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete transaction.");
    }
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.planned_amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <main className="flex-1 p-6 lg:p-8 max-w-6xl">
        {error && (
          <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Dashboard */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Your financial overview at a glance</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Spent</p>
                    <p className="text-xl font-bold text-slate-900">${totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Budget</p>
                    <p className="text-xl font-bold text-slate-900">${totalBudget.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Remaining</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${(totalBudget - totalSpent).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Predictive Banner */}
            {prediction && (
              <PredictiveBanner
                safeDailySpend={prediction.safe_daily_spend}
                velocityWarning={prediction.velocity_warning}
                recommendation={prediction.recommendation}
                daysUntilExhausted={prediction.days_until_budget_exhausted}
              />
            )}

            {/* Budget Health Bars */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Budget Health</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : budgets.length === 0 ? (
                <p className="text-sm text-slate-500">No budgets set yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgets.map((b) => (
                    <HealthBarCard
                      key={b.id}
                      category={b.category}
                      planned={b.planned_amount}
                      actual={b.actual_amount || 0}
                      health={b.health || "green"}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Transactions</h2>
              <div className="card p-0 overflow-hidden">
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-500 p-6">No transactions yet. Log one to get started!</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-600 uppercase">
                              {tx.category.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                            <p className="text-xs text-slate-500">
                              {tx.date} · {tx.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">
                            ${tx.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-slate-400 hover:text-danger-600 transition-colors"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Log */}
        {activeView === "log" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quick Log</h1>
              <p className="text-slate-500 text-sm mt-1">Log expenses by voice, text, or manual entry</p>
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-2">Voice Logging</h2>
              <VoiceLogger onTranscript={handleLogVoice} />
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-3">Natural Language Text</h2>
              <QuickInputBar
                onSubmit={handleLogText}
                loading={logLoading}
                placeholder="e.g. Spent $45 on groceries at Whole Foods"
              />
            </div>
          </div>
        )}

        {/* Transactions */}
        {activeView === "transactions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
                <p className="text-slate-500 text-sm mt-1">{transactions.length} total transactions</p>
              </div>
              <button onClick={() => setActiveView("log")} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600 uppercase">{tx.category.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {tx.date} · {tx.category} · {tx.currency}
                            {tx.merchant && ` · ${tx.merchant}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">${tx.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-slate-400 hover:text-danger-600 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeView === "analytics" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
              <p className="text-slate-500 text-sm mt-1">Predictive insights and spending breakdown</p>
            </div>

            {prediction && (
              <PredictiveBanner
                safeDailySpend={prediction.safe_daily_spend}
                velocityWarning={prediction.velocity_warning}
                recommendation={prediction.recommendation}
                daysUntilExhausted={prediction.days_until_budget_exhausted}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => (
                <HealthBarCard
                  key={b.id}
                  category={b.category}
                  planned={b.planned_amount}
                  actual={b.actual_amount || 0}
                  health={b.health || "green"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        {activeView === "export" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Export Reports</h1>
              <p className="text-slate-500 text-sm mt-1">Download your financial data with AI summaries</p>
            </div>
            <div className="card">
              <button
                onClick={() => setShowExport(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <Download className="w-5 h-5" />
                Choose Export Format
              </button>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeView === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your preferences</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-600">Settings panel will be available soon.</p>
            </div>
          </div>
        )}
      </main>

      {/* AI Coach Sidebar */}
      <AiSidebarChat transactions={transactions} budgets={budgets} userId={DEMO_USER_ID} />

      {/* Export Modal */}
      {showExport && <ExportModal userId={DEMO_USER_ID} onClose={() => setShowExport(false)} />}
    </div>
  );
}
