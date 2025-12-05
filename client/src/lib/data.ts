export interface TicketData {
  id: string;
  type: 'Incidente' | 'Solicitação' | 'Dúvida' | 'Problema';
  urgency: 'Crítica' | 'Alta' | 'Média' | 'Baixa';
  status: 'Aberto' | 'Fechado' | 'Em Andamento' | 'Pendente';
  channel: 'E-mail' | 'Telefone' | 'GLPI' | 'Portal';
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
    { day: 'Seg', opened: 12, closed: 10, pending: 2 },
    { day: 'Ter', opened: 15, closed: 12, pending: 3 },
    { day: 'Qua', opened: 8, closed: 9, pending: 1 },
    { day: 'Qui', opened: 10, closed: 8, pending: 2 },
    { day: 'Sex', opened: 5, closed: 6, pending: 0 },
    { day: 'Sáb', opened: 0, closed: 0, pending: 0 },
    { day: 'Dom', opened: 0, closed: 0, pending: 0 }
  ]
};

// Template padrão para um mês
const monthlyDataTemplate = {
  summary: {
    totalTickets: 0,
    pending: 0,
    slaCompliance: 90,
    fcr: 70,
    satisfaction: 4.5
  },
  volumeTrend: [
    { week: 'Semana 1', opened: 0, closed: 0, pending: 0 },
    { week: 'Semana 2', opened: 0, closed: 0, pending: 0 },
    { week: 'Semana 3', opened: 0, closed: 0, pending: 0 },
    { week: 'Semana 4', opened: 0, closed: 0, pending: 0 }
  ],
  byType: [
    { name: 'Solicitação', value: 0 },
    { name: 'Incidente', value: 0 },
    { name: 'Problema', value: 0 },
    { name: 'Dúvida', value: 0 }
  ],
  byChannel: [
    { name: 'E-mail', value: 0 },
    { name: 'GLPI', value: 0 },
    { name: 'Telefone', value: 0 },
    { name: 'Portal', value: 0 }
  ]
};

// Dados mensais por mês
export const monthlyDataByMonth: Record<string, typeof monthlyDataTemplate> = {
  '2025-09': {
    summary: {
      totalTickets: 78,
      pending: 18,
      slaCompliance: 88,
      fcr: 68,
      satisfaction: 4.6
    },
    volumeTrend: [
      { week: 'Semana 1', opened: 18, closed: 16, pending: 4 },
      { week: 'Semana 2', opened: 20, closed: 19, pending: 5 },
      { week: 'Semana 3', opened: 19, closed: 20, pending: 4 },
      { week: 'Semana 4', opened: 21, closed: 23, pending: 5 }
    ],
    byType: [
      { name: 'Solicitação', value: 28 },
      { name: 'Incidente', value: 22 },
      { name: 'Problema', value: 14 },
      { name: 'Dúvida', value: 14 }
    ],
    byChannel: [
      { name: 'E-mail', value: 5 },
      { name: 'GLPI', value: 70 },
      { name: 'Telefone', value: 3 },
      { name: 'Portal', value: 0 }
    ]
  },
  '2025-10': {
    summary: {
      totalTickets: 92,
      pending: 21,
      slaCompliance: 86,
      fcr: 71,
      satisfaction: 4.7
    },
    volumeTrend: [
      { week: 'Semana 1', opened: 22, closed: 20, pending: 6 },
      { week: 'Semana 2', opened: 24, closed: 22, pending: 7 },
      { week: 'Semana 3', opened: 23, closed: 24, pending: 5 },
      { week: 'Semana 4', opened: 23, closed: 26, pending: 3 }
    ],
    byType: [
      { name: 'Solicitação', value: 32 },
      { name: 'Incidente', value: 28 },
      { name: 'Problema', value: 16 },
      { name: 'Dúvida', value: 16 }
    ],
    byChannel: [
      { name: 'E-mail', value: 7 },
      { name: 'GLPI', value: 80 },
      { name: 'Telefone', value: 5 },
      { name: 'Portal', value: 0 }
    ]
  },
  '2025-11': {
    summary: {
      totalTickets: 85,
      pending: 23,
      slaCompliance: 85,
      fcr: 72,
      satisfaction: 4.8
    },
    volumeTrend: [
      { week: 'Semana 1', opened: 20, closed: 18, pending: 5 },
      { week: 'Semana 2', opened: 22, closed: 20, pending: 8 },
      { week: 'Semana 3', opened: 21, closed: 22, pending: 6 },
      { week: 'Semana 4', opened: 22, closed: 25, pending: 4 }
    ],
    byType: [
      { name: 'Solicitação', value: 30 },
      { name: 'Incidente', value: 25 },
      { name: 'Problema', value: 15 },
      { name: 'Dúvida', value: 15 }
    ],
    byChannel: [
      { name: 'E-mail', value: 0 },
      { name: 'GLPI', value: 85 },
      { name: 'Telefone', value: 0 },
      { name: 'Portal', value: 0 }
    ]
  },
  '2025-12': {
    ...monthlyDataTemplate
  }
};

// Exporta dados do mês atual (novembro) para compatibilidade
export const monthlyData = monthlyDataByMonth['2025-11'];

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
