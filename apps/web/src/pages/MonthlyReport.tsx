import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ticketsApi, type MonthStatsResponse, type AvailablePeriods } from "@/lib/api";
import { TICKET_TYPE_LABELS, TICKET_TYPE_COLORS } from "@/types/ticket";
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
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Loader2,
  Edit3,
  Save,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function MonthlyReport() {
  const [stats, setStats] = useState<MonthStatsResponse | null>(null);
  const [periods, setPeriods] = useState<AvailablePeriods | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campos editáveis
  const [insights, setInsights] = useState<string>("");
  const [actions, setActions] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  // Carregar períodos disponíveis primeiro
  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const periodsData = await ticketsApi.getAvailablePeriods();
        setPeriods(periodsData);
        if (periodsData.months.length > 0) {
          setSelectedMonth(periodsData.months[0]);
        }
      } catch (err) {
        setError("Erro ao carregar períodos disponíveis");
        setLoading(false);
      }
    };
    loadPeriods();
  }, []);

  // Carregar dados do mês selecionado
  useEffect(() => {
    if (!selectedMonth) return;

    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsData = await ticketsApi.getMonthStats(selectedMonth);
        setStats(statsData);

        // Carregar insights salvos
        const savedInsights = localStorage.getItem(`monthly-insights-${selectedMonth}`);
        const savedActions = localStorage.getItem(`monthly-actions-${selectedMonth}`);
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
    loadStats();
  }, [selectedMonth]);

  const saveInsights = () => {
    localStorage.setItem(`monthly-insights-${selectedMonth}`, insights);
    localStorage.setItem(`monthly-actions-${selectedMonth}`, actions);
    setIsEditing(false);
  };

  // Navegação entre meses
  const currentMonthIndex = periods?.months.indexOf(selectedMonth) ?? -1;
  const canGoPrevious = currentMonthIndex < (periods?.months.length ?? 0) - 1;
  const canGoNext = currentMonthIndex > 0;

  const goToPreviousMonth = () => {
    if (canGoPrevious && periods) {
      setSelectedMonth(periods.months[currentMonthIndex + 1]);
    }
  };

  const goToNextMonth = () => {
    if (canGoNext && periods) {
      setSelectedMonth(periods.months[currentMonthIndex - 1]);
    }
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
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
        <Button onClick={() => setSelectedMonth(selectedMonth)} variant="outline">
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

  const weeklyTrendData = stats.byWeek.map((w) => ({
    ...w,
    name: w.week,
  }));

  const variacao = parseFloat(stats.summary.variacao);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório Mensal</h2>
          <p className="text-muted-foreground">Período: {stats.period}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            disabled={!canGoPrevious}
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods?.months.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonthLabel(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            disabled={!canGoNext}
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Mensais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total de Chamados"
          value={stats.summary.total}
          description={
            variacao !== 0 ? (
              <span className={`flex items-center gap-1 ${variacao > 0 ? "text-red-500" : "text-green-500"}`}>
                {variacao > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(variacao)}% vs mês anterior
              </span>
            ) : "Volume do mês"
          }
          trend={variacao > 0 ? "up" : variacao < 0 ? "down" : "neutral"}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          title="Resolvidos"
          value={stats.summary.fechados}
          description="Chamados fechados"
          trend="up"
          status="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          title="Pendentes"
          value={stats.summary.pendentes}
          description="Aguardando resolução"
          trend={stats.summary.pendentes > 10 ? "up" : "down"}
          status={stats.summary.pendentes > 10 ? "warning" : "success"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          title="Taxa de Resolução"
          value={`${stats.summary.taxaResolucao}%`}
          description="Fechados / Total"
          trend={parseFloat(stats.summary.taxaResolucao) > 80 ? "up" : "down"}
          status={parseFloat(stats.summary.taxaResolucao) > 80 ? "success" : "warning"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          title="Críticos Pendentes"
          value={stats.summary.criticalCount}
          description="Alta prioridade"
          trend={stats.summary.criticalCount > 0 ? "up" : "neutral"}
          status={stats.summary.criticalCount > 0 ? "danger" : "success"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Tendência Semanal */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tendência Semanal</CardTitle>
            <CardDescription>Evolução dos chamados ao longo do mês</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    name="Total"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="fechados"
                    stroke="#22c55e"
                    name="Fechados"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="pendentes"
                    stroke="#f59e0b"
                    name="Pendentes"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Por Tipo de Chamado</CardTitle>
            <CardDescription>Classificação das solicitações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    // Oculta rótulos para fatias com 0%
                    label={({ percent }) => (Math.round(percent * 100) > 0 ? `${(percent * 100).toFixed(0)}%` : null)}
                    labelLine={false}
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Prioridade</CardTitle>
            <CardDescription>Nível de criticidade dos chamados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Tipos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tipos de Chamados</CardTitle>
            <CardDescription>Categorias mais frequentes do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topTypes.map((item, index) => {
                const maxCount = Math.max(...stats.topTypes.map((t) => t.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground">{index + 1}.</span>
                        {TICKET_TYPE_LABELS[item.type] || item.type}
                      </span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: TICKET_TYPE_COLORS[item.type] || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.topTypes.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum chamado registrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chamados Críticos e Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chamados Críticos */}
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

        {/* Insights do Mês */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Insights do Mês</CardTitle>
                <CardDescription>Observações e ações (editável)</CardDescription>
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
              <label className="text-sm font-medium mb-2 block">Observações</label>
              <Textarea
                placeholder="Ex: Aumento significativo de chamados de correção técnica. Possível relação com atualização do sistema..."
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ações para o Próximo Mês</label>
              <Textarea
                placeholder="Ex: 1. Revisar processo de deploy. 2. Aumentar cobertura de testes..."
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
