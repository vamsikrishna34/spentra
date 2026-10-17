import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

export interface TextLogRequest {
  text: string;
  user_id: string;
}

export interface ManualLogRequest {
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string | null;
  merchant: string | null;
  user_id: string;
}

export const apiClient = {
  // Transactions
  logText: (data: TextLogRequest) => api.post("/api/transactions/text", data),
  logVoice: (data: TextLogRequest) => api.post("/api/transactions/voice", data),
  logManual: (data: ManualLogRequest) => api.post("/api/transactions/manual", data),
  logOcr: (data: TextLogRequest) => api.post("/api/transactions/ocr", data),
  logCsv: (data: TextLogRequest) => api.post("/api/transactions/csv", data),
  getTransactions: (userId: string, limit = 100) =>
    api.get(`/api/transactions/${userId}?limit=${limit}`),
  deleteTransaction: (id: string) => api.delete(`/api/transactions/${id}`),

  // Budgets
  createBudget: (data: { user_id: string; category: string; planned_amount: number; period: string }) =>
    api.post("/api/budgets/", data),
  getBudgets: (userId: string) => api.get(`/api/budgets/${userId}`),
  updateBudget: (id: string, planned_amount: number) =>
    api.put(`/api/budgets/${id}`, { planned_amount }),
  deleteBudget: (id: string) => api.delete(`/api/budgets/${id}`),

  // Analytics
  getPrediction: (userId: string) => api.get(`/api/analytics/predict/${userId}`),
  getCoaching: (userId: string) => api.get(`/api/analytics/coach/${userId}`),
  getSummary: (userId: string) => api.get(`/api/analytics/summary/${userId}`),

  // Exports
  exportExcel: (userId: string) =>
    api.get(`/api/exports/${userId}/excel`, { responseType: "blob" }),
  exportPdf: (userId: string) =>
    api.get(`/api/exports/${userId}/pdf`, { responseType: "blob" }),
  exportWord: (userId: string) =>
    api.get(`/api/exports/${userId}/word`, { responseType: "blob" }),
};

export default apiClient;
