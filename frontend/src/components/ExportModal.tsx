import { useState } from "react";
import { FileSpreadsheet, FileText, FileType, X, Loader2, Download } from "lucide-react";

interface ExportModalProps {
  userId: string;
  onClose: () => void;
}

type ExportFormat = "excel" | "pdf" | "word";

const formats: { id: ExportFormat; label: string; icon: typeof FileSpreadsheet; color: string }[] = [
  { id: "excel", label: "Excel Spreadsheet", icon: FileSpreadsheet, color: "bg-accent-600" },
  { id: "pdf", label: "PDF Document", icon: FileType, color: "bg-danger-600" },
  { id: "word", label: "Word Document", icon: FileText, color: "bg-primary-600" },
];

export default function ExportModal({ userId, onClose }: ExportModalProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setLoading(format);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${baseUrl}/api/exports/${userId}/${format}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const extensions: Record<ExportFormat, string> = { excel: "xlsx", pdf: "pdf", word: "docx" };
      a.download = `spentra_report.${extensions[format]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-600" />
            Export Report
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Choose a format to download your financial report with AI-generated summary.
        </p>

        <div className="space-y-3">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <button
                key={fmt.id}
                onClick={() => handleExport(fmt.id)}
                disabled={loading !== null}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                <div className={`w-10 h-10 rounded-lg ${fmt.color} flex items-center justify-center`}>
                  {loading === fmt.id ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="font-medium text-slate-700">{fmt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
