export interface Ticket {
  id: number;
  ticketNumber?: number | null;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  url?: string | null;
  registrationDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  url?: string;
  ticketNumber?: number;
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {}
