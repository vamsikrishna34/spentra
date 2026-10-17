import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet,
  Plus,
  TrendingDown,
  Loader2,
  Trash2,
  Download,
  Menu,
  ScanLine,
  FileUp,
  PencilLine,
  Mic,
  Type,
  Sparkles,
  ArrowRight,
  Target,
  Coins,
  RotateCcw,
  PieChart,
  BarChart3,
  Sun,
  Moon,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import VoiceLogger from "./components/VoiceLogger";
import QuickInputBar from "./components/QuickInputBar";
import HealthBarCard from "./components/HealthBarCard";
import PredictiveBanner from "./components/PredictiveBanner";
import AiSidebarChat from "./components/AiSidebarChat";
import ExportModal from "./components/ExportModal";
import OcrModal from "./components/OcrModal";
import ManualEntryModal from "./components/ManualEntryModal";
import CsvImportModal from "./components/CsvImportModal";

import { dataStore } from "./services/dataStore";
import {
  enrichBudgets,
  computePrediction,
  getCurrencySymbol,
  formatCurrency,
  CATEGORIES,
} from "./services/mockData";
import type { AppView, Transaction, Budget, Goal } from "./types";

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetEditValue, setBudgetEditValue] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(() => localStorage.getItem("spentra_currency") || "USD");
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("spentra_goals") || "[]") as Goal[];
    } catch {
      return [];
    }
  });
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return localStorage.getItem("spentra_theme") === "light" ? "light" : "dark";
  });

  // Derived: enriched budgets with real-time actual amounts
  const enrichedBudgets = useMemo(
    () => enrichBudgets(budgets, transactions),
    [budgets, transactions]
  );

  // Derived: prediction
  const livePrediction = useMemo(
    () => computePrediction(transactions, budgets),
    [transactions, budgets]
  );

  const totalSpent = useMemo(
    () => transactions.reduce((s, t) => s + (t.converted_amount || t.amount), 0),
    [transactions]
  );
  const totalBudget = useMemo(
    () => budgets.reduce((s, b) => s + b.planned_amount, 0),
    [budgets]
  );
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, buds] = await Promise.all([
        dataStore.getTransactions(),
        dataStore.getBudgets(),
      ]);
      setTransactions(txs);
      setBudgets(buds);
    } catch {
      // Fallback already handled in dataStore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("spentra_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("spentra_currency", selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    localStorage.setItem("spentra_goals", JSON.stringify(goals));
  }, [goals]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogText = async (text: string) => {
    setLogLoading(true);
    try {
      const parsed = dataStore.parseNaturalLanguage(text);
      const newTx = await dataStore.addTransaction(parsed);
      setTransactions((prev) => [newTx, ...prev]);
      showToast(`Logged: ${newTx.currency} ${newTx.amount.toFixed(2)} → ${newTx.category}`);
    } catch {
      showToast("Failed to log transaction");
    } finally {
      setLogLoading(false);
    }
  };

  const handleLogVoice = async (transcript: string) => {
    setLogLoading(true);
    try {
      const parsed = dataStore.parseNaturalLanguage(transcript);
      parsed.source = "voice";
      const newTx = await dataStore.addTransaction(parsed);
      setTransactions((prev) => [newTx, ...prev]);
      showToast(`Voice logged: ${newTx.description}`);
    } catch {
      showToast("Failed to log voice transaction");
    } finally {
      setLogLoading(false);
    }
  };

  const handleManualSave = async (tx: Omit<Transaction, "id" | "user_id">) => {
    try {
      const newTx = await dataStore.addTransaction(tx);
      setTransactions((prev) => [newTx, ...prev]);
      showToast("Transaction added manually");
    } catch {
      showToast("Failed to add transaction");
    }
  };

  const handleOcrParsed = async (tx: Omit<Transaction, "id" | "user_id">) => {
    try {
      const newTx = await dataStore.addTransaction(tx);
      setTransactions((prev) => [newTx, ...prev]);
      showToast(`Receipt scanned: ${newTx.description}`);
    } catch {
      showToast("Failed to save receipt");
    }
  };

  const handleCsvImport = async (txs: Omit<Transaction, "id" | "user_id">[]) => {
    try {
      const newTxs = await dataStore.addTransactions(txs);
      setTransactions((prev) => [...newTxs, ...prev]);
      showToast(`Imported ${newTxs.length} transactions`);
    } catch {
      showToast("CSV import failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dataStore.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast("Transaction deleted");
    } catch {
      showToast("Failed to delete");
    }
  };

  const handleBudgetUpdate = async (budgetId: string) => {
    const val = parseFloat(budgetEditValue);
    if (isNaN(val) || val <= 0) return;
    try {
      await dataStore.updateBudget(budgetId, val);
      setBudgets((prev) => prev.map((b) => (b.id === budgetId ? { ...b, planned_amount: val } : b)));
      setEditingBudget(null);
      showToast("Budget updated");
    } catch {
      showToast("Failed to update budget");
    }
  };

  const handleResetData = () => {
    dataStore.resetData();
    loadData();
    showToast("Data reset to defaults");
  };

  const handleAddGoal = () => {
    const targetAmount = Number(goalTarget);
    if (!goalTitle.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) return;
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      user_id: "demo-user",
      title: goalTitle.trim(),
      target_amount: targetAmount,
      current_amount: 0,
      target_date: "",
    };
    setGoals((current) => [...current, goal]);
    setGoalTitle("");
    setGoalTarget("");
    showToast("Goal added");
  };

  const handleGoalProgress = (goalId: string, value: string) => {
    const currentAmount = Math.max(0, Number(value) || 0);
    setGoals((current) => current.map((goal) => goal.id === goalId ? { ...goal, current_amount: currentAmount } : goal));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    showToast("Goal removed");
  };

  // Category breakdown for analytics
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      const cat = tx.category;
      map[cat] = (map[cat] || 0) + (tx.converted_amount || tx.amount);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const maxCategorySpend = categoryBreakdown.length > 0 ? categoryBreakdown[0][1] : 1;

  const monthlySpending = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString(undefined, { month: "short" }),
        amount: 0,
      };
    });
    const monthMap = new Map(months.map((month) => [month.key, month]));

    for (const tx of transactions) {
      const date = new Date(`${tx.date}T00:00:00`);
      const month = monthMap.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (month) month.amount += tx.converted_amount || tx.amount;
    }

    return months;
  }, [transactions]);

  const maxMonthlySpend = Math.max(...monthlySpending.map((month) => month.amount), 1);

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        budgetPct={budgetPct}
        currency={selectedCurrency}
      />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="btn-secondary p-2.5"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold gradient-text">Spentra</h1>
          <div className="w-10" />
        </div>

        <div className="flex justify-end items-center gap-2 mb-4 flex-wrap">
          <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
            <span className="text-slate-500">Currency</span>
            <select
              value={selectedCurrency}
              onChange={(event) => setSelectedCurrency(event.target.value)}
              className="bg-transparent text-inherit outline-none cursor-pointer"
              aria-label="Choose display currency"
            >
              {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'].map((currency) => (
                <option key={currency} value={currency} className="bg-surface-100 text-slate-900">{currency}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            className="btn-secondary flex items-center gap-2 text-sm"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] glass-card px-5 py-3 text-sm text-primary-300 animate-slide-up neon-border">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeView === "dashboard" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                  <p className="text-slate-500 text-sm mt-1">Your financial overview at a glance</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Wallet className="w-5 h-5" />}
                    label="Total Spent"
                    value={formatCurrency(totalSpent, selectedCurrency)}
                    color="primary"
                    trend={`${transactions.length} transactions`}
                  />
                  <StatCard
                    icon={<Target className="w-5 h-5" />}
                    label="Total Budget"
                    value={formatCurrency(totalBudget, selectedCurrency)}
                    color="blue"
                    trend="monthly"
                  />
                  <StatCard
                    icon={<TrendingDown className="w-5 h-5" />}
                    label="Remaining"
                    value={formatCurrency(Math.max(0, totalBudget - totalSpent), selectedCurrency)}
                    color={totalBudget - totalSpent < 0 ? "danger" : "accent"}
                    trend={`${budgetPct.toFixed(0)}% used`}
                  />
                  <StatCard
                    icon={<Coins className="w-5 h-5" />}
                    label="Safe Daily Spend"
                    value={formatCurrency(livePrediction.safe_daily_spend, selectedCurrency)}
                    color={livePrediction.velocity_warning ? "warning" : "accent"}
                    trend={livePrediction.velocity_warning ? "Over pace" : "On track"}
                  />
                </div>

                {/* Predictive Banner */}
                <PredictiveBanner
                  safeDailySpend={livePrediction.safe_daily_spend}
                  velocityWarning={livePrediction.velocity_warning}
                  recommendation={livePrediction.recommendation}
                  daysUntilExhausted={livePrediction.days_until_budget_exhausted}
                  projectedTotal={livePrediction.projected_month_end_total}
                  currency={selectedCurrency}
                />

                {/* Budget Health Bars */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-white">Budget Health</h2>
                    <button
                      onClick={() => setActiveView("analytics")}
                      className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                    >
                      View all <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {enrichedBudgets.length === 0 ? (
                    <div className="glass-card p-8 text-center text-slate-400 text-sm">
                      No budgets set yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enrichedBudgets.map((b) => (
                        <div key={b.id} className="glass-card-hover p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-100 capitalize">{b.category}</span>
                            <button
                              onClick={() => { setEditingBudget(b.id); setBudgetEditValue(String(b.planned_amount)); }}
                              className="btn-ghost p-1 text-xs"
                              aria-label={`Edit ${b.category} expected cost`}
                            >
                              <PencilLine className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {editingBudget === b.id ? (
                            <div className="flex gap-2 mb-3">
                              <input
                                type="number"
                                min="0"
                                className="input-field py-1.5 text-sm"
                                value={budgetEditValue}
                                onChange={(event) => setBudgetEditValue(event.target.value)}
                                onKeyDown={(event) => event.key === "Enter" && handleBudgetUpdate(b.id)}
                                autoFocus
                              />
                              <button onClick={() => handleBudgetUpdate(b.id)} className="btn-primary px-3 py-1 text-xs">Save</button>
                            </div>
                          ) : null}
                          <HealthBarCard
                            category={b.category}
                            planned={b.planned_amount}
                            actual={b.actual_amount || 0}
                            health={b.health || "green"}
                            currency={selectedCurrency}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <GoalsPanel
                  goals={goals}
                  title={goalTitle}
                  target={goalTarget}
                  onTitleChange={setGoalTitle}
                  onTargetChange={setGoalTarget}
                  onAdd={handleAddGoal}
                  onProgressChange={handleGoalProgress}
                  onDelete={handleDeleteGoal}
                  currency={selectedCurrency}
                />

                {/* Recent Transactions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                    <button
                      onClick={() => setActiveView("transactions")}
                      className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                    >
                      View all <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <TransactionList
                    transactions={transactions.slice(0, 8)}
                    onDelete={handleDelete}
                    displayCurrency={selectedCurrency}
                  />
                </div>
              </div>
            )}

            {/* Quick Log */}
            {activeView === "log" && (
              <div className="space-y-6 max-w-2xl animate-fade-in">
                <div>
                  <h1 className="text-2xl font-bold text-white">Quick Log</h1>
                  <p className="text-slate-500 text-sm mt-1">Log expenses by voice, text, receipt, or manual entry</p>
                </div>

                {/* Voice Logging */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary-400" />
                    Voice Logging
                  </h2>
                  <VoiceLogger onTranscript={handleLogVoice} />
                </div>

                {/* Natural Language Text */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary-400" />
                    Natural Language Text
                  </h2>
                  <QuickInputBar
                    onSubmit={handleLogText}
                    loading={logLoading}
                    placeholder="e.g. Spent $45 on groceries at Whole Foods"
                  />
                </div>

                {/* More Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <LogOptionCard
                    icon={<ScanLine className="w-5 h-5" />}
                    label="Scan Receipt"
                    desc="Upload a receipt image for AI extraction"
                    onClick={() => setShowOcr(true)}
                  />
                  <LogOptionCard
                    icon={<PencilLine className="w-5 h-5" />}
                    label="Manual Entry"
                    desc="Enter transaction details by hand"
                    onClick={() => setShowManual(true)}
                  />
                  <LogOptionCard
                    icon={<FileUp className="w-5 h-5" />}
                    label="CSV Import"
                    desc="Bulk import from a spreadsheet file"
                    onClick={() => setShowCsv(true)}
                  />
                </div>
              </div>
            )}

            {/* Transactions */}
            {activeView === "transactions" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Transactions</h1>
                    <p className="text-slate-500 text-sm mt-1">{transactions.length} total transactions</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowOcr(true)} className="btn-secondary flex items-center gap-2 text-sm">
                      <ScanLine className="w-4 h-4" /> Scan
                    </button>
                    <button onClick={() => setShowCsv(true)} className="btn-secondary flex items-center gap-2 text-sm">
                      <FileUp className="w-4 h-4" /> Import
                    </button>
                    <button onClick={() => setShowManual(true)} className="btn-primary flex items-center gap-2 text-sm">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                <TransactionList
                  transactions={transactions}
                  onDelete={handleDelete}
                  showCurrency
                  displayCurrency={selectedCurrency}
                />
              </div>
            )}

            {/* Analytics */}
            {activeView === "analytics" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="text-2xl font-bold text-white">Analytics</h1>
                  <p className="text-slate-500 text-sm mt-1">Predictive insights and spending breakdown</p>
                </div>

                <PredictiveBanner
                  safeDailySpend={livePrediction.safe_daily_spend}
                  velocityWarning={livePrediction.velocity_warning}
                  recommendation={livePrediction.recommendation}
                  daysUntilExhausted={livePrediction.days_until_budget_exhausted}
                  projectedTotal={livePrediction.projected_month_end_total}
                  currency={selectedCurrency}
                />

                {/* Spending Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <CategoryPieChart data={categoryBreakdown} currency={selectedCurrency} />
                  <MonthlySpendingChart data={monthlySpending} maxAmount={maxMonthlySpend} currency={selectedCurrency} />
                </div>

                {/* Category Breakdown */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold text-white mb-4">Spending by Category</h2>
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-500">No spending data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryBreakdown.map(([cat, amount]) => (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-slate-300 capitalize">{cat}</span>
                            <span className="text-sm font-medium text-white">{formatCurrency(amount, selectedCurrency)}</span>
                          </div>
                          <div className="h-2 bg-surface-300/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all duration-700"
                              style={{ width: `${(amount / maxCategorySpend) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Budget Cards */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Budget Health</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrichedBudgets.map((b) => (
                      <div key={b.id} className="glass-card-hover p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-100 capitalize">{b.category}</h3>
                          {editingBudget === b.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                className="input-field w-20 text-sm py-1"
                                value={budgetEditValue}
                                onChange={(e) => setBudgetEditValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleBudgetUpdate(b.id)}
                              />
                              <button
                                onClick={() => handleBudgetUpdate(b.id)}
                                className="btn-primary px-2 py-1 text-xs"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingBudget(b.id); setBudgetEditValue(String(b.planned_amount)); }}
                              className="btn-ghost p-1 text-xs"
                            >
                              <PencilLine className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <HealthBarCard
                          category={b.category}
                          planned={b.planned_amount}
                          actual={b.actual_amount || 0}
                          health={b.health || "green"}
                          currency={selectedCurrency}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            {activeView === "export" && (
              <div className="space-y-6 max-w-2xl animate-fade-in">
                <div>
                  <h1 className="text-2xl font-bold text-white">Export Reports</h1>
                  <p className="text-slate-500 text-sm mt-1">Download your financial data with AI summaries</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ExportCard
                    icon={<Download className="w-6 h-6" />}
                    title="Excel"
                    desc="Spreadsheet with formulas"
                    onClick={() => setShowExport(true)}
                    color="primary"
                  />
                  <ExportCard
                    icon={<Download className="w-6 h-6" />}
                    title="PDF"
                    desc="Formatted printable report"
                    onClick={() => setShowExport(true)}
                    color="danger"
                  />
                  <ExportCard
                    icon={<Download className="w-6 h-6" />}
                    title="Word"
                    desc="Editable document format"
                    onClick={() => setShowExport(true)}
                    color="blue"
                  />
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Report includes</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-300">
                        <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary-400" /> AI-generated spending summary</li>
                        <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary-400" /> {transactions.length} transaction records</li>
                        <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary-400" /> {budgets.length} budget categories</li>
                        <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary-400" /> Multi-currency conversion</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowExport(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  <Download className="w-5 h-5" />
                  Choose Export Format
                </button>
              </div>
            )}

            {/* Settings */}
            {activeView === "settings" && (
              <div className="space-y-6 max-w-2xl animate-fade-in">
                <div>
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-slate-500 text-sm mt-1">Manage your preferences and data</p>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Default Currency</h3>
                    <p className="text-sm text-slate-500">Amounts across the app display in this currency</p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedCurrency(c)}
                          className={`badge cursor-pointer transition-colors ${c === selectedCurrency ? "bg-primary-500/20 text-primary-300" : "bg-surface-200/50 text-slate-400 hover:text-slate-200"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Budget Categories</h3>
                    <p className="text-sm text-slate-500">Active tracking categories</p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {CATEGORIES.map((c) => (
                        <span key={c} className="badge bg-surface-200/50 text-slate-300 capitalize">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Data Management</h3>
                    <p className="text-sm text-slate-500">Reset all transactions and budgets to defaults</p>
                    <button
                      onClick={handleResetData}
                      className="btn-danger mt-3 flex items-center gap-2 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Demo Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* AI Coach Sidebar */}
      <AiSidebarChat transactions={transactions} budgets={enrichedBudgets} />

      {/* Modals */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          transactions={transactions}
          budgets={enrichedBudgets}
        />
      )}
      {showOcr && (
        <OcrModal
          onClose={() => setShowOcr(false)}
          onParsed={handleOcrParsed}
        />
      )}
      {showManual && (
        <ManualEntryModal
          onClose={() => setShowManual(false)}
          onSave={handleManualSave}
        />
      )}
      {showCsv && (
        <CsvImportModal
          onClose={() => setShowCsv(false)}
          onImport={handleCsvImport}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function GoalsPanel({
  goals,
  title,
  target,
  onTitleChange,
  onTargetChange,
  onAdd,
  onProgressChange,
  onDelete,
  currency = "USD",
}: {
  goals: Goal[];
  title: string;
  target: string;
  onTitleChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onAdd: () => void;
  onProgressChange: (goalId: string, value: string) => void;
  onDelete: (goalId: string) => void;
  currency?: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Financial Goals</h2>
          <p className="text-sm text-slate-500 mt-1">Track savings targets alongside your spending.</p>
        </div>
        <Target className="w-5 h-5 text-primary-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2 mb-5">
        <input
          className="input-field"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Goal name, e.g. Emergency fund"
          aria-label="Goal name"
        />
        <input
          className="input-field"
          type="number"
          min="1"
          value={target}
          onChange={(event) => onTargetChange(event.target.value)}
          placeholder="Target amount"
          aria-label="Goal target amount"
        />
        <button onClick={onAdd} className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add goal
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No goals yet. Add your first savings target above.</p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            return (
              <div key={goal.id} className="rounded-xl bg-surface-200/40 border border-surface-300/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-medium text-slate-100 truncate">{goal.title}</p>
                  <button onClick={() => onDelete(goal.id)} className="btn-ghost p-1 text-slate-500 hover:text-danger-400" aria-label={`Remove ${goal.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>{progress.toFixed(0)}% complete</span>
                  <span>{formatCurrency(goal.current_amount, currency)} / {formatCurrency(goal.target_amount, currency)}</span>
                </div>
                <div className="h-2 bg-surface-300/60 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <label className="text-xs text-slate-500 flex items-center gap-2">
                  Current saved
                  <input
                    type="number"
                    min="0"
                    value={goal.current_amount}
                    onChange={(event) => onProgressChange(goal.id, event.target.value)}
                    className="input-field py-1.5 text-sm max-w-32"
                    aria-label={`Current saved for ${goal.title}`}
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "accent" | "warning" | "danger" | "blue";
  trend: string;
}

function StatCard({ icon, label, value, color, trend }: StatCardProps) {
  const colors: Record<string, string> = {
    primary: "bg-primary-500/15 text-primary-400",
    accent: "bg-accent-500/15 text-accent-400",
    warning: "bg-warning-500/15 text-warning-400",
    danger: "bg-danger-500/15 text-danger-400",
    blue: "bg-blue-500/15 text-blue-400",
  };

  return (
    <div className="glass-card-hover p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-white truncate">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{trend}</p>
        </div>
      </div>
    </div>
  );
}

const chartColors = ["#34d399", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#fb7185", "#22d3ee"];

function CategoryPieChart({ data, currency = "USD" }: { data: [string, number][]; currency?: string }) {
  const total = data.reduce((sum, [, amount]) => sum + amount, 0);
  let cursor = 0;
  const gradientStops = data.map(([, amount], index) => {
    const start = cursor;
    cursor += total > 0 ? (amount / total) * 100 : 0;
    return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <PieChart className="w-4 h-4 text-primary-400" />
        <h2 className="font-semibold text-white">Spending Mix</h2>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No spending data yet.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            className="w-40 h-40 rounded-full flex-shrink-0 relative"
            style={{ background: `conic-gradient(${gradientStops.join(", ")})` }}
            role="img"
            aria-label="Spending by category pie chart"
          >
            <div className="absolute inset-7 rounded-full bg-surface-100 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Total</span>
              <span className="text-lg font-bold text-white">{formatCurrency(total, currency)}</span>
            </div>
          </div>
          <div className="w-full space-y-2.5">
            {data.map(([category, amount], index) => (
              <div key={category} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-slate-300 capitalize min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  <span className="truncate">{category}</span>
                </span>
                <span className="text-slate-100 font-medium flex-shrink-0">{((amount / total) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlySpendingChart({
  data,
  maxAmount,
  currency = "USD",
}: {
  data: { label: string; amount: number }[];
  maxAmount: number;
  currency?: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-primary-400" />
        <h2 className="font-semibold text-white">Monthly Spending</h2>
      </div>
      <div className="h-48 flex items-end gap-2 sm:gap-4 border-b border-surface-300/50 px-1">
        {data.map((month) => {
          const height = month.amount > 0 ? Math.max((month.amount / maxAmount) * 100, 5) : 3;
          return (
            <div key={month.label} className="h-full flex-1 flex flex-col items-center justify-end gap-2 group">
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatCurrency(month.amount, currency)}
              </span>
              <div
                className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-primary-700 to-primary-400 transition-all duration-500 group-hover:from-primary-500 group-hover:to-primary-300"
                style={{ height: `${height}%` }}
                title={`${month.label}: ${formatCurrency(month.amount, currency)}`}
              />
              <span className="text-[11px] text-slate-500">{month.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-4">Converted to {currency} across the last six months</p>
    </div>
  );
}

function TransactionList({
  transactions,
  onDelete,
  showCurrency,
  displayCurrency = "USD",
}: {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  showCurrency?: boolean;
  displayCurrency?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-400 text-sm">No transactions yet. Log one to get started!</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="divide-y divide-surface-200/40">
        {transactions.map((tx) => {
          const symbol = getCurrencySymbol(tx.currency);
          const usdAmount = tx.converted_amount || tx.amount;
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 hover:bg-surface-200/30 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-surface-300/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase">{tx.category.slice(0, 2)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span>{tx.date}</span>
                    <span>·</span>
                    <span className="capitalize">{tx.category}</span>
                    {tx.merchant && (<><span>·</span><span>{tx.merchant}</span></>)}
                    {tx.source && tx.source !== "manual" && (
                      <span className="badge bg-primary-500/10 text-primary-400/80 py-0.5 capitalize">{tx.source}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-semibold text-white text-sm">
                    {symbol}{tx.amount.toFixed(2)}
                  </p>
                  {showCurrency && tx.currency !== displayCurrency && (
                    <p className="text-xs text-slate-500">{formatCurrency(usdAmount, displayCurrency)} {displayCurrency}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(tx.id)}
                  className="text-slate-600 hover:text-danger-400 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogOptionCard({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card-hover p-5 text-left transition-all duration-200 hover:scale-[1.02]"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-white text-sm">{label}</h3>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </button>
  );
}

function ExportCard({
  icon,
  title,
  desc,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  color: "primary" | "danger" | "blue";
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary-500/15 text-primary-400 border-primary-500/30",
    danger: "bg-danger-500/15 text-danger-400 border-danger-500/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <button
      onClick={onClick}
      className={`glass-card-hover p-6 text-center transition-all duration-200 hover:scale-[1.02] border-2 ${colors[color]}`}
    >
      <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mx-auto mb-3`}>
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </button>
  );
}
