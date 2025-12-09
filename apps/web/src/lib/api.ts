import axios from "axios";
import type { Ticket, CreateTicketDto, UpdateTicketDto } from "@/types/ticket";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
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
