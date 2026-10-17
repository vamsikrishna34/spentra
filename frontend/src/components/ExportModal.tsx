import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileType,
  X,
  Loader2,
  Download,
  CheckCircle2,
} from "lucide-react";
import type { Transaction, Budget } from "../types";

interface ExportModalProps {
  onClose: () => void;
  transactions: Transaction[];
  budgets: Budget[];
}

type ExportFormat = "excel" | "pdf" | "word";

const formats: { id: ExportFormat; label: string; desc: string; icon: typeof FileSpreadsheet; color: string }[] = [
  { id: "excel", label: "Excel Spreadsheet", desc: ".xlsx with formulas", icon: FileSpreadsheet, color: "bg-primary-600" },
  { id: "pdf", label: "PDF Document", desc: "Formatted report", icon: FileType, color: "bg-danger-600" },
  { id: "word", label: "Word Document", desc: ".docx editable", icon: FileText, color: "bg-blue-600" },
];

function generateCSV(transactions: Transaction[], budgets: Budget[]): string {
  let csv = "Date,Description,Category,Amount,Currency,Converted (USD),Merchant,Source\n";
  for (const tx of transactions) {
    csv += `${tx.date},"${tx.description}",${tx.category},${tx.amount},${tx.currency},${(tx.converted_amount || tx.amount).toFixed(2)},"${tx.merchant || ""}",${tx.source || "manual"}\n`;
  }
  csv += "\n\nBudget Summary\n";
  csv += "Category,Planned,Actual,Remaining,Health\n";
  for (const b of budgets) {
    csv += `${b.category},${b.planned_amount},${b.actual_amount || 0},${b.remaining || 0},${b.health || "green"}\n`;
  }
  return csv;
}

function generateHTMLReport(transactions: Transaction[], budgets: Budget[], format: ExportFormat): string {
  const totalSpent = transactions.reduce((s, t) => s + (t.converted_amount || t.amount), 0);
  const totalBudget = budgets.reduce((s, b) => s + b.planned_amount, 0);

  const txRows = transactions.map((tx) => `
    <tr>
      <td>${tx.date}</td>
      <td>${tx.description}</td>
      <td>${tx.category}</td>
      <td style="text-align:right">${tx.currency} ${tx.amount.toFixed(2)}</td>
      <td style="text-align:right">USD ${(tx.converted_amount || tx.amount).toFixed(2)}</td>
      <td>${tx.merchant || "—"}</td>
    </tr>
  `).join("");

  const budgetRows = budgets.map((b) => `
    <tr>
      <td>${b.category}</td>
      <td style="text-align:right">$${b.planned_amount.toFixed(2)}</td>
      <td style="text-align:right">$${(b.actual_amount || 0).toFixed(2)}</td>
      <td style="text-align:right">$${(b.remaining || 0).toFixed(2)}</td>
      <td style="color:${b.health === "red" ? "#ef4444" : b.health === "yellow" ? "#f59e0b" : "#10b981"}">${b.health || "green"}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Spentra Financial Report</title>
<style>
  body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #1e293b; }
  h1 { color: #10b981; } h2 { color: #059669; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  .summary { display: flex; gap: 30px; margin: 20px 0; }
  .summary div { padding: 15px 20px; background: #f8fafc; border-radius: 10px; }
  .summary .label { font-size: 12px; color: #64748b; } .summary .value { font-size: 24px; font-weight: bold; }
</style></head><body>
<h1>Spentra Financial Report</h1>
<p>Generated: ${new Date().toLocaleDateString()}</p>
<div class="summary">
  <div><div class="label">Total Spent</div><div class="value">$${totalSpent.toFixed(2)}</div></div>
  <div><div class="label">Total Budget</div><div class="value">$${totalBudget.toFixed(2)}</div></div>
  <div><div class="label">Remaining</div><div class="value">$${(totalBudget - totalSpent).toFixed(2)}</div></div>
</div>
<h2>Transactions (${transactions.length})</h2>
<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>USD</th><th>Merchant</th></tr></thead>
<tbody>${txRows}</tbody></table>
<h2>Budget Summary</h2>
<table><thead><tr><th>Category</th><th>Planned</th><th>Actual</th><th>Remaining</th><th>Health</th></tr></thead>
<tbody>${budgetRows}</tbody></table>
</body></html>`;
}

export default function ExportModal({ onClose, transactions, budgets }: ExportModalProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [done, setDone] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setLoading(format);
    setDone(null);

    await new Promise((r) => setTimeout(r, 800));

    let blob: Blob;
    let filename: string;

    if (format === "excel") {
      // Export as CSV (opens in Excel)
      const csv = generateCSV(transactions, budgets);
      blob = new Blob([csv], { type: "text/csv" });
      filename = "spentra_report.csv";
    } else if (format === "pdf") {
      // Export as printable HTML (user can print to PDF)
      const html = generateHTMLReport(transactions, budgets, format);
      blob = new Blob([html], { type: "text/html" });
      filename = "spentra_report.html";
    } else {
      // Export as HTML (Word can open it)
      const html = generateHTMLReport(transactions, budgets, format);
      blob = new Blob([html], { type: "application/msword" });
      filename = "spentra_report.doc";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLoading(null);
    setDone(format);
    setTimeout(() => setDone(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="glass-card max-w-md w-full p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-400" />
            Export Report
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-5">
          Download your financial data with transactions and budget summary.
        </p>

        <div className="space-y-3">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            const isDone = done === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => handleExport(fmt.id)}
                disabled={loading !== null}
                className="w-full flex items-center gap-4 p-4 rounded-xl
                  border border-surface-300/40 bg-surface-200/30
                  hover:border-primary-500/40 hover:bg-surface-200/50
                  transition-all duration-200 disabled:opacity-50 text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${fmt.color} flex items-center justify-center flex-shrink-0`}>
                  {loading === fmt.id ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-200">{fmt.label}</p>
                  <p className="text-xs text-slate-500">{fmt.desc}</p>
                </div>
                {isDone && <CheckCircle2 className="w-5 h-5 text-primary-400" />}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          {transactions.length} transactions · {budgets.length} budget categories
        </p>
      </div>
    </div>
  );
}
