export type TicketStatus = "aberto" | "fechado" | "pendente" | "em_andamento";
export type TicketPriority = "baixa" | "media" | "alta";
export type TicketType =
  | "orientacao"
  | "correcao_tecnica"
  | "erro_temporario"
  | "duvida_negocial"
  | "melhorias"
  | "outros";
export type TicketStage = "backlog" | "desenvolvimento" | "homologacao" | "producao";

export interface Ticket {
  id: number;
  ticketNumber?: number | null;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  type: string;
  stage: string;
  position?: number | null;
  url?: string | null;
  registrationDate?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  assignee?: {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
}

export interface CreateTicketDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  url?: string;
  ticketNumber?: number;
  registrationDate?: string;
  assigneeId?: number;
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {}

// Mapeamento de labels para exibição
export const TICKET_STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  fechado: "Fechado",
  pendente: "Pendente",
  em_andamento: "Em Andamento",
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const TICKET_TYPE_LABELS: Record<string, string> = {
  orientacao: "Orientação",
  correcao_tecnica: "Correção Técnica",
  erro_temporario: "Erro Temporário",
  duvida_negocial: "Dúvida Negocial",
  melhorias: "Melhorias",
  outros: "Outros",
};

// Cores para os gráficos
export const TICKET_STATUS_COLORS: Record<string, string> = {
  aberto: "#3b82f6",
  fechado: "#22c55e",
  pendente: "#f59e0b",
  em_andamento: "#8b5cf6",
};

export const TICKET_PRIORITY_COLORS: Record<string, string> = {
  baixa: "#22c55e",
  media: "#f59e0b",
  alta: "#ef4444",
};

export const TICKET_TYPE_COLORS: Record<string, string> = {
  orientacao: "#3b82f6",
  correcao_tecnica: "#ef4444",
  erro_temporario: "#f59e0b",
  duvida_negocial: "#8b5cf6",
  melhorias: "#22c55e",
  outros: "#6b7280",
};

// Stages para o Kanban
export const TICKET_STAGE_LABELS: Record<string, string> = {
  backlog: "Backlog",
  desenvolvimento: "Em Desenvolvimento",
  homologacao: "Homologação",
  producao: "Produção",
};

export const TICKET_STAGE_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  desenvolvimento: "#3b82f6",
  homologacao: "#f59e0b",
  producao: "#22c55e",
};
