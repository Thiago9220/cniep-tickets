import axios from "axios";
import type { Ticket, CreateTicketDto, UpdateTicketDto } from "@/types/ticket";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Tipos para estatísticas
export interface TicketStats {
  total: number;
  pendentes: number;
  abertos: number;
  fechados: number;
  taxaResolucao: string | number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface MonthlyStats {
  month: string;
  total: number;
  fechados: number;
  pendentes: number;
}

export const ticketsApi = {
  getAll: async (): Promise<Ticket[]> => {
    const response = await api.get<Ticket[]>("/tickets");
    return response.data;
  },

  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: CreateTicketDto): Promise<Ticket> => {
    const response = await api.post<Ticket>("/tickets", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTicketDto): Promise<Ticket> => {
    const response = await api.put<Ticket>(`/tickets/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },

  // Estatísticas
  getStats: async (): Promise<TicketStats> => {
    const response = await api.get<TicketStats>("/tickets/stats/overview");
    return response.data;
  },

  getMonthlyStats: async (): Promise<MonthlyStats[]> => {
    const response = await api.get<MonthlyStats[]>("/tickets/stats/monthly");
    return response.data;
  },

  getCriticalTickets: async (): Promise<Ticket[]> => {
    const response = await api.get<Ticket[]>("/tickets/stats/critical");
    return response.data;
  },

  // Estatísticas por período específico
  getWeeklyStats: async (weekKey: string): Promise<WeeklyStatsResponse> => {
    const response = await api.get<WeeklyStatsResponse>(`/tickets/stats/weekly/${weekKey}`);
    return response.data;
  },

  getMonthStats: async (monthKey: string): Promise<MonthStatsResponse> => {
    const response = await api.get<MonthStatsResponse>(`/tickets/stats/month/${monthKey}`);
    return response.data;
  },

  getAvailablePeriods: async (): Promise<AvailablePeriods> => {
    const response = await api.get<AvailablePeriods>("/tickets/stats/available-periods");
    return response.data;
  },

  // Estatísticas trimestrais
  getQuarterlyStats: async (quarterKey: string): Promise<QuarterlyStatsResponse> => {
    const response = await api.get<QuarterlyStatsResponse>(`/tickets/stats/quarterly/${quarterKey}`);
    return response.data;
  },

  getAvailableQuarters: async (): Promise<AvailableQuarters> => {
    const response = await api.get<AvailableQuarters>("/tickets/stats/available-quarters");
    return response.data;
  },

  importExcel: async (file: File, token: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/tickets/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// Tipos para lembretes
export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export interface ReminderDTO {
  id: string;
  titulo: string;
  descricao: string;
  concluido: boolean;
  createdAt: string;
  updatedAt: string;
  dataEntrega?: string | null;
  recorrente: boolean;
  ultimaConclusao?: string | null;
  prioridade: Prioridade;
  categoria?: string | null;
  ordem?: number | null;
}

export interface ReminderCreate {
  titulo: string;
  descricao?: string;
  dataEntrega?: string | null; // formato YYYY-MM-DD
  recorrente?: boolean;
  prioridade?: Prioridade;
  categoria?: string | null;
  ordem?: number | null;
}

export interface ReminderUpdate extends Partial<ReminderCreate> {
  concluido?: boolean;
}

export const remindersApi = {
  list: async (token: string): Promise<ReminderDTO[]> => {
    const res = await api.get<ReminderDTO[]>("/reminders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  counts: async (token: string): Promise<{ pendentes: number; atrasados: number; urgentes: number }> => {
    const res = await api.get("/reminders/counts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  create: async (token: string, data: ReminderCreate): Promise<ReminderDTO> => {
    const res = await api.post<ReminderDTO>("/reminders", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  update: async (token: string, id: string, data: ReminderUpdate): Promise<ReminderDTO> => {
    const res = await api.put<ReminderDTO>(`/reminders/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  delete: async (token: string, id: string): Promise<void> => {
    await api.delete(`/reminders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  reorder: async (token: string, updates: Array<{ id: string; ordem: number | null }>): Promise<{ updated: number }> => {
    const res = await api.post(`/reminders/reorder`, { updates }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

// Tipos para Manuais
export interface Manual {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  userId: number;
}

export const manualsApi = {
  list: async (token: string): Promise<Manual[]> => {
    const res = await api.get<Manual[]>("/manuals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  create: async (token: string, data: { titulo: string; conteudo: string }): Promise<Manual> => {
    const res = await api.post<Manual>("/manuals", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  delete: async (token: string, id: string): Promise<void> => {
    await api.delete(`/manuals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Tipos para estatísticas de período
export interface WeeklyStatsResponse {
  weekKey: string;
  period: string;
  summary: {
    total: number;
    fechados: number;
    pendentes: number;
    abertos: number;
    taxaResolucao: string;
    criticalCount: number;
  };
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  byDay: Array<{ day: string; abertos: number; fechados: number }>;
  topTypes: Array<{ type: string; count: number }>;
  criticalPending: Ticket[];
  tickets: Ticket[];
}

export interface MonthStatsResponse {
  monthKey: string;
  monthName: string;
  period: string;
  summary: {
    total: number;
    fechados: number;
    pendentes: number;
    taxaResolucao: string;
    criticalCount: number;
    variacao: string;
  };
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  byWeek: Array<{ week: string; total: number; fechados: number; pendentes: number }>;
  topTypes: Array<{ type: string; count: number }>;
  criticalPending: Ticket[];
}

export interface AvailablePeriods {
  weeks: string[];
  months: string[];
}

export interface RootCauseItem {
  name: string;
  value: number;
  count: number;
}

export interface QuarterlyStatsResponse {
  quarterKey: string;
  period: string;
  periodDates: string;
  summary: {
    total: number;
    fechados: number;
    pendentes: number;
    taxaResolucao: string;
    variacao: string;
  };
  byType: Record<string, number>;
  rootCause: RootCauseItem[];
  analysis: string;
}

export interface AvailableQuarters {
  quarters: string[];
}
