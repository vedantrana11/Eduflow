import axios, { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor — attach JWT ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — handle 401 / errors ──────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // Try to refresh token
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem("access_token", res.data.access_token);
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
            return api(error.config);
          }
        } catch {
          // Refresh failed — log out
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    const message = (error.response?.data as { detail?: string })?.detail || error.message;
    if (status !== 401) toast.error(message);

    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  signup: (data: Record<string, unknown>) =>
    api.post("/auth/signup", data),
  refresh: (token: string) =>
    api.post("/auth/refresh", { refresh_token: token }),
  me: () => api.get("/auth/me"),
  updateMe: (data: Record<string, unknown>) =>
    api.put("/auth/me", data),
};

// ─── Leads ────────────────────────────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/leads", { params }),
  get: (id: string) => api.get(`/leads/${id}`),
  create: (data: Record<string, unknown>) => api.post("/leads", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  addNote: (id: string, content: string) =>
    api.post(`/leads/${id}/notes`, { content }),
  assign: (id: string, counselorId: string) =>
    api.post(`/leads/${id}/assign?counselor_id=${counselorId}`),
  pipelineSummary: () => api.get("/leads/pipeline/summary"),
};

// ─── WhatsApp ─────────────────────────────────────────────────────────────────────
export const whatsappApi = {
  conversations: () => api.get("/whatsapp/conversations"),
  conversation: (leadId: string) => api.get(`/whatsapp/conversations/${leadId}`),
  send: (data: Record<string, unknown>) => api.post("/whatsapp/send", data),
  bulkSend: (data: Record<string, unknown>) => api.post("/whatsapp/bulk-send", data),
  templates: () => api.get("/whatsapp/templates"),
};

// ─── AI ───────────────────────────────────────────────────────────────────────────
export const aiApi = {
  scoreLead: (leadId: string) => api.post(`/ai/score-lead/${leadId}`),
  generateReply: (leadId: string, context: Record<string, unknown>) =>
    api.post(`/ai/generate-reply/${leadId}`, context),
  summarize: (leadId: string) => api.post(`/ai/summarize-conversation/${leadId}`),
  detectIntent: (leadId: string) => api.post(`/ai/detect-intent/${leadId}`),
  chat: (message: string, context?: string) =>
    api.post("/ai/chat", { message, context }),
  bulkScore: () => api.post("/ai/bulk-score"),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: Record<string, unknown>) => api.get("/tasks", { params }),
  upcoming: (days?: number) => api.get("/tasks/upcoming", { params: { days } }),
  create: (data: Record<string, unknown>) => api.post("/tasks", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data),
  complete: (id: string) => api.post(`/tasks/${id}/complete`),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get("/analytics/dashboard"),
  funnel: (days?: number) => api.get("/analytics/funnel", { params: { period_days: days } }),
  sources: () => api.get("/analytics/lead-sources"),
  activityLog: (limit?: number) => api.get("/analytics/activity-log", { params: { limit } }),
};

// ─── Google Sheets ────────────────────────────────────────────────────────────────
export const sheetsApi = {
  export: (spreadsheetId?: string) =>
    api.post("/sheets/export", null, { params: { spreadsheet_id: spreadsheetId } }),
  status: () => api.get("/sheets/status"),
};

// ─── Settings ─────────────────────────────────────────────────────────────────────
export const settingsApi = {
  profile: () => api.get("/settings/profile"),
  updateProfile: (data: Record<string, unknown>) => api.put("/settings/profile", data),
  team: () => api.get("/settings/team"),
  inviteTeamMember: (data: Record<string, unknown>) =>
    api.post("/settings/team/invite", data),
  removeTeamMember: (id: string) => api.delete(`/settings/team/${id}`),
  integrations: () => api.get("/settings/integrations"),
};
