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
};
