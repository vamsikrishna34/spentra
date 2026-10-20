import { LayoutDashboard, Wallet, Mic, BarChart3, Download, Settings, TrendingDown, X } from "lucide-react";
import { convertFromUSD, getCurrencySymbol } from "../services/mockData";
import type { AppView } from "../types";

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  totalBudget: number;
  totalSpent: number;
  budgetPct: number;
  currency?: string;
}

const navItems: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Wallet },
  { id: "log", label: "Quick Log", icon: Mic },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "export", label: "Export", icon: Download },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activeView, onNavigate, mobileOpen, onCloseMobile, totalBudget, totalSpent, budgetPct, currency = "INR" }: SidebarProps) {
  const handleNav = (view: AppView) => {
    onNavigate(view);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onCloseMobile} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto w-72 h-screen bg-surface-50/90 backdrop-blur-xl border-r border-surface-200/40 flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-surface-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-white" /></div>
              <div><h1 className="text-lg font-bold gradient-text">Spentra</h1><p className="text-xs text-slate-500">AI Finance Tracker</p></div>
            </div>
            <button onClick={onCloseMobile} className="lg:hidden btn-ghost p-1.5" aria-label="Close menu"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? "bg-primary-600/15 text-primary-400" : "text-slate-400 hover:bg-surface-200/50 hover:text-slate-200"}`}><Icon className="w-5 h-5 flex-shrink-0" />{item.label}{active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}</button>;
          })}
        </nav>
        <div className="p-5">
          <div className="sidebar-budget-card">
            <div className="flex items-center justify-between mb-2"><p className="eyebrow">Monthly budget</p><span className="text-xs text-slate-400">{Math.round(budgetPct)}%</span></div>
            <p className="metric-value text-xl">{getCurrencySymbol(currency)}{convertFromUSD(totalSpent, currency).toFixed(0)} <span className="text-xs text-slate-500 font-normal">/ {getCurrencySymbol(currency)}{convertFromUSD(totalBudget, currency).toFixed(0)}</span></p>
            <div className="progress-track mt-3"><div className={`progress-fill ${budgetPct >= 100 ? "bg-danger-500" : budgetPct >= 80 ? "bg-warning-500" : "bg-primary-500"}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} /></div>
          </div>
        </div>
      </aside>
    </>
  );
}
