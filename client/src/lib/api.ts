import axios from "axios";
import type { Ticket, CreateTicketDto, UpdateTicketDto } from "@/types/ticket";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

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
};
