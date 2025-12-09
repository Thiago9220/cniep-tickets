import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ticketsApi, type WeeklyStatsResponse, type AvailablePeriods } from "@/lib/api";
import { TICKET_TYPE_LABELS, TICKET_TYPE_COLORS, TICKET_PRIORITY_LABELS } from "@/types/ticket";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  Inbox,
  RefreshCw,
  ExternalLink,
  Loader2,
  TrendingUp,
  Edit3,
  Save,
} from "lucide-react";

// Função para obter a chave da semana atual
function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export default function WeeklyReport() {
  const [stats, setStats] = useState<WeeklyStatsResponse | null>(null);
  const [periods, setPeriods] = useState<AvailablePeriods | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeekKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campos editáveis para insights
  const [insights, setInsights] = useState<string>("");
  const [actions, setActions] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const currentWeek = getCurrentWeekKey();
  const isCurrentWeek = selectedWeek === currentWeek;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, periodsData] = await Promise.all([
        ticketsApi.getWeeklyStats(selectedWeek),
        ticketsApi.getAvailablePeriods(),
      ]);
      setStats(statsData);
      setPeriods(periodsData);

      // Carregar insights salvos do localStorage
      const savedInsights = localStorage.getItem(`weekly-insights-${selectedWeek}`);
      const savedActions = localStorage.getItem(`weekly-actions-${selectedWeek}`);
      if (savedInsights) setInsights(savedInsights);
      else setInsights("");
      if (savedActions) setActions(savedActions);
      else setActions("");
    } catch (err) {
      setError("Erro ao carregar dados. Verifique se a API está rodando.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  const saveInsights = () => {
    localStorage.setItem(`weekly-insights-${selectedWeek}`, insights);
    localStorage.setItem(`weekly-actions-${selectedWeek}`, actions);
    setIsEditing(false);
  };

  const formatWeekLabel = (weekKey: string) => {
    const [year, weekStr] = weekKey.split("-W");
    return `Semana ${weekStr} de ${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do relatório...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-muted-foreground">{error || "Nenhum dado encontrado"}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Preparar dados para gráficos
  const typeChartData = Object.entries(stats.byType).map(([key, value]) => ({
    name: TICKET_TYPE_LABELS[key] || key,
    value,
    fill: TICKET_TYPE_COLORS[key] || "#6b7280",
  }));

  const priorityChartData = [
    { name: "Alta", value: stats.byPriority.alta || 0, fill: "#ef4444" },
    { name: "Média", value: stats.byPriority.media || 0, fill: "#f59e0b" },
    { name: "Baixa", value: stats.byPriority.baixa || 0, fill: "#22c55e" },
  ];

  const dailyChartData = stats.byDay.map((d) => ({
    ...d,
    name: d.day,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Relatório Semanal</h2>
            {isCurrentWeek && (
              <Badge variant="default" className="bg-green-600">
                Semana Atual
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Período: {stats.period}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[220px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods?.weeks.map((week) => (
                <SelectItem key={week} value={week}>
                  {formatWeekLabel(week)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total de Chamados"
          value={stats.summary.total}
          description="Registrados na semana"
          trend="neutral"
          icon={<Inbox className="h-4 w-4" />}
        />
        <KpiCard
          title="Resolvidos"
          value={stats.summary.fechados}
          description={`Taxa: ${stats.summary.taxaResolucao}%`}
          trend="up"
          status="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          title="Pendentes"
          value={stats.summary.pendentes}
          description="Aguardando resolução"
          trend={stats.summary.pendentes > 5 ? "up" : "down"}
          status={stats.summary.pendentes > 5 ? "warning" : "success"}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          title="Críticos"
          value={stats.summary.criticalCount}
          description="Alta prioridade pendente"
          trend={stats.summary.criticalCount > 0 ? "up" : "neutral"}
          status={stats.summary.criticalCount > 0 ? "danger" : "success"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          title="Taxa Resolução"
          value={`${stats.summary.taxaResolucao}%`}
          description="Fechados / Total"
          trend={parseFloat(stats.summary.taxaResolucao) > 80 ? "up" : "down"}
          status={parseFloat(stats.summary.taxaResolucao) > 80 ? "success" : "warning"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="details">Detalhamento</TabsTrigger>
          <TabsTrigger value="insights">Insights & Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Gráfico de Volume Diário */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Volume Diário</CardTitle>
                <CardDescription>Chamados por dia da semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="abertos" name="Abertos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fechados" name="Fechados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico por Prioridade */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Por Prioridade</CardTitle>
                <CardDescription>Distribuição por criticidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Chamado</CardTitle>
              <CardDescription>Categorização dos chamados da semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Tipos de Chamados */}
            <Card>
              <CardHeader>
                <CardTitle>Top Tipos de Chamados</CardTitle>
                <CardDescription>Categorias mais frequentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topTypes.map((item, index) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span>{TICKET_TYPE_LABELS[item.type] || item.type}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                  {stats.topTypes.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum chamado registrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chamados Críticos Pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Chamados Críticos Pendentes
                </CardTitle>
                <CardDescription>Alta prioridade aguardando resolução</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.criticalPending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                    <p className="text-muted-foreground">Nenhum chamado crítico pendente</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {stats.criticalPending.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              #{ticket.ticketNumber}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ticket.registrationDate
                                ? new Date(ticket.registrationDate).toLocaleDateString("pt-BR")
                                : "-"}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">{ticket.title}</p>
                        </div>
                        {ticket.url && (
                          <a
                            href={ticket.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Insights e Observações</CardTitle>
                  <CardDescription>
                    Análise qualitativa da semana (editável)
                  </CardDescription>
                </div>
                {isEditing ? (
                  <Button onClick={saveInsights} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Principais Observações da Semana
                </label>
                <Textarea
                  placeholder="Ex: Aumento de chamados relacionados a erros de formulário. Necessário verificar última atualização do sistema..."
                  value={insights}
                  onChange={(e) => setInsights(e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ações Recomendadas / Próximos Passos
                </label>
                <Textarea
                  placeholder="Ex: 1. Priorizar tickets críticos de carregamento. 2. Agendar reunião com equipe de desenvolvimento..."
                  value={actions}
                  onChange={(e) => setActions(e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
