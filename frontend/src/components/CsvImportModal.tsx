import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { parseCsv, convertToUSD } from "../services/mockData";
import type { Transaction } from "../types";

interface CsvImportModalProps {
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, "id" | "user_id">[]) => void;
}

type Stage = "upload" | "preview" | "importing" | "done";

export default function CsvImportModal({ onClose, onImport }: CsvImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [parsedData, setParsedData] = useState<Omit<Transaction, "id" | "user_id">[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setError("No valid transactions found. Make sure your CSV has headers: description, amount, currency, category, date");
          return;
        }
        setParsedData(parsed);
        setStage("preview");
      } catch {
        setError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setStage("importing");
    await new Promise((r) => setTimeout(r, 1000));
    onImport(parsedData);
    setStage("done");
    setTimeout(onClose, 1200);
  };

  const downloadTemplate = () => {
    const csv = "description,amount,currency,category,date,merchant\nGroceries at Whole Foods,85.50,USD,food,2026-10-17,Whole Foods\nUber ride,18.75,USD,transport,2026-10-17,Uber\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spentra_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary-400" />
            CSV Import
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {stage === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-surface-400/50 hover:border-primary-500/40 hover:bg-surface-200/30"
              }`}
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Drop your CSV file here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-danger-500/10 border border-danger-500/20 rounded-lg p-3 text-sm text-danger-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Need a template?
              </p>
              <button onClick={downloadTemplate} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Download CSV template
              </button>
            </div>
          </div>
        )}

        {stage === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <FileText className="w-4 h-4 text-primary-400" />
              <span>{fileName}</span>
              <span className="badge bg-primary-500/20 text-primary-300 ml-auto">{parsedData.length} rows</span>
            </div>

            <div className="rounded-xl border border-surface-300/50 overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-200/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase">Description</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-400 uppercase">Amount</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase">Cat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200/40">
                  {parsedData.slice(0, 20).map((tx, i) => (
                    <tr key={i} className="hover:bg-surface-200/30">
                      <td className="px-3 py-2 text-slate-300 truncate max-w-[180px]">{tx.description}</td>
                      <td className="px-3 py-2 text-right text-slate-200 font-medium">
                        {tx.currency} {tx.amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-slate-400 capitalize">{tx.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 20 && (
                <p className="text-center text-xs text-slate-500 py-2">+ {parsedData.length - 20} more rows</p>
              )}
            </div>

            <div className="flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 text-sm text-primary-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Total: {parsedData.length} transactions, USD {parsedData.reduce((s, t) => s + (t.converted_amount || convertToUSD(t.amount, t.currency)), 0).toFixed(2)}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStage("upload"); setFileName(null); setParsedData([]); }}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button onClick={handleImport} className="btn-primary flex-1">
                Import {parsedData.length} Transactions
              </button>
            </div>
          </div>
        )}

        {stage === "importing" && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Importing {parsedData.length} transactions...</p>
          </div>
        )}

        {stage === "done" && (
          <div className="py-12 text-center space-y-3 animate-slide-up">
            <CheckCircle2 className="w-12 h-12 text-primary-400 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">{parsedData.length} transactions imported successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}
