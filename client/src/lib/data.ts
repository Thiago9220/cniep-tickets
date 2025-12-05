export interface TicketData {
  id: string;
  type: 'Incidente' | 'Solicitação' | 'Dúvida' | 'Problema';
  urgency: 'Crítica' | 'Alta' | 'Média' | 'Baixa';
  status: 'Aberto' | 'Fechado' | 'Em Andamento' | 'Pendente';
  channel: 'E-mail' | 'Telefone' | 'Chat' | 'Portal';
  createdAt: string;
  closedAt?: string;
  slaStatus: 'Dentro' | 'Fora' | 'Risco';
  tma: number; // em horas
}

export interface JiraData {
  id: string;
  type: 'Bug' | 'Melhoria' | 'Tarefa' | 'Épico';
  status: 'Backlog' | 'Em Desenvolvimento' | 'Em Teste' | 'Concluído';
  priority: 'Alta' | 'Média' | 'Baixa';
  linkedTickets: number;
}

export const weeklyData = {
  period: '01/12/2025 - 07/12/2025',
  summary: {
    opened: 50,
    closed: 45,
    backlog: 120,
    tma: 4.5,
    tmaGoal: 5.0,
    slaRisk: 3
  },
  backlogByUrgency: [
    { name: 'Crítica', value: 5, fill: 'var(--color-destructive)' },
    { name: 'Alta', value: 15, fill: 'var(--color-orange-500)' },
    { name: 'Média', value: 50, fill: 'var(--color-blue-500)' },
    { name: 'Baixa', value: 50, fill: 'var(--color-green-500)' }
  ],
  dailyVolume: [
    { day: 'Seg', opened: 12, closed: 10 },
    { day: 'Ter', opened: 15, closed: 12 },
    { day: 'Qua', opened: 8, closed: 9 },
    { day: 'Qui', opened: 10, closed: 8 },
    { day: 'Sex', opened: 5, closed: 6 },
    { day: 'Sáb', opened: 0, closed: 0 },
    { day: 'Dom', opened: 0, closed: 0 }
  ]
};

export const monthlyData = {
  period: 'Novembro 2025',
  summary: {
    totalTickets: 200,
    slaCompliance: 85,
    fcr: 72, // First Contact Resolution
    satisfaction: 4.8
  },
  volumeTrend: [
    { week: 'Semana 1', opened: 45, closed: 40 },
    { week: 'Semana 2', opened: 52, closed: 55 },
    { week: 'Semana 3', opened: 48, closed: 42 },
    { week: 'Semana 4', opened: 55, closed: 60 }
  ],
  byType: [
    { name: 'Solicitação', value: 63 },
    { name: 'Incidente', value: 62 },
    { name: 'Problema', value: 39 },
    { name: 'Dúvida', value: 36 }
  ],
  byChannel: [
    { name: 'E-mail', value: 83 },
    { name: 'Chat', value: 49 },
    { name: 'Telefone', value: 39 },
    { name: 'Portal', value: 29 }
  ]
};

export const quarterlyData = {
  period: 'Q4 2025 (Out-Dez)',
  jiraIntegration: {
    bugsFixed: 15,
    improvements: 8,
    ticketsReduced: 45 // Estimativa de redução de tickets após correções
  },
  rootCause: [
    { name: 'Infraestrutura', value: 30 },
    { name: 'Software (Bug)', value: 45 },
    { name: 'Usuário (Treinamento)', value: 15 },
    { name: 'Acesso/Permissão', value: 10 }
  ],
  jiraStatus: [
    { name: 'Concluído', value: 25 },
    { name: 'Em Desenvolvimento', value: 12 },
    { name: 'Backlog', value: 18 }
  ]
};
