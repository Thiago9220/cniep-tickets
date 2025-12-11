import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ticketsApi, type TicketStats, type MonthlyStats } from "@/lib/api";
import {
  Ticket,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_COLORS,
  TICKET_PRIORITY_COLORS,
  TICKET_STATUS_COLORS,
} from "@/types/ticket";
import { useEffect, useState, useMemo } from "react";
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
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [criticalTickets, setCriticalTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterPriority, setFilterPriority] = useState<string>("todos");
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, monthlyData, criticalData, ticketsData] = await Promise.all([
        ticketsApi.getStats(),
        ticketsApi.getMonthlyStats(),
        ticketsApi.getCriticalTickets(),
        ticketsApi.getAll(),
      ]);
      setStats(statsData);
      setMonthlyStats(monthlyData);
      setCriticalTickets(criticalData);
      setAllTickets(ticketsData);
    } catch (err) {
      setError("Erro ao carregar dados. Verifique se a API está rodando.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      // Busca por texto
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchTitle = ticket.title.toLowerCase().includes(search);
        const matchDesc = ticket.description?.toLowerCase().includes(search);
        const matchNumber = ticket.ticketNumber?.toString().includes(search);
        if (!matchTitle && !matchDesc && !matchNumber) return false;
      }

      // Filtro por status
      if (filterStatus !== "todos" && ticket.status !== filterStatus) return false;

      // Filtro por prioridade
      if (filterPriority !== "todos" && ticket.priority !== filterPriority) return false;

      // Filtro por tipo
      if (filterType !== "todos" && ticket.type !== filterType) return false;

      // Filtro por data
      if (filterDateStart && ticket.registrationDate) {
        const ticketDate = new Date(ticket.registrationDate);
        const startDate = new Date(filterDateStart);
        if (ticketDate < startDate) return false;
      }
      if (filterDateEnd && ticket.registrationDate) {
        const ticketDate = new Date(ticket.registrationDate);
        const endDate = new Date(filterDateEnd);
        endDate.setHours(23, 59, 59);
        if (ticketDate > endDate) return false;
      }

      return true;
    });
  }, [allTickets, searchTerm, filterStatus, filterPriority, filterType, filterDateStart, filterDateEnd]);

  const hasActiveFilters = searchTerm || filterStatus !== "todos" || filterPriority !== "todos" || filterType !== "todos" || filterDateStart || filterDateEnd;

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("todos");
    setFilterPriority("todos");
    setFilterType("todos");
    setFilterDateStart("");
    setFilterDateEnd("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  // Preparar dados para gráficos
  const typeChartData = Object.entries(stats.byType).map(([key, value]) => ({
    name: TICKET_TYPE_LABELS[key] || key,
    value,
    fill: TICKET_TYPE_COLORS[key] || "#6b7280",
  }));

  const priorityChartData = Object.entries(stats.byPriority).map(([key, value]) => ({
    name: TICKET_PRIORITY_LABELS[key] || key,
    value,
    fill: TICKET_PRIORITY_COLORS[key] || "#6b7280",
  }));

  const statusChartData = Object.entries(stats.byStatus).map(([key, value]) => ({
    name: TICKET_STATUS_LABELS[key] || key,
    value,
    fill: TICKET_STATUS_COLORS[key] || "#6b7280",
  }));

  // Formatar dados mensais para o gráfico
  const monthlyChartData = monthlyStats.map((item) => ({
    ...item,
    month: formatMonth(item.month),
  }));

  function formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard de Chamados</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowTicketList(!showTicketList)}
              variant={showTicketList ? "default" : "outline"}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showTicketList ? "Ocultar Lista" : "Ver Tickets"}
            </Button>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Visão geral dos chamados importados do GLPI - Sistema CNIEP
        </p>
      </div>

      {/* Seção de Filtros e Lista de Tickets */}
      {showTicketList && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar e Filtrar Tickets
                </CardTitle>
                <CardDescription>
                  {filteredTickets.length} de {allTickets.length} tickets
                  {hasActiveFilters && " (filtrado)"}
                </CardDescription>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca por texto */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou número do ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros colapsáveis */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros avançados
                  </span>
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prioridade */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data início */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data início</label>
                    <Input
                      type="date"
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                    />
                  </div>

                  {/* Data fim */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data fim</label>
                    <Input
                      type="date"
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Tabela de tickets */}
            <div className="border rounded-lg overflow-hidden relative">
              <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarGutter: "stable both-edges" }}>
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur shadow-sm">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">#</th>
                      <th className="text-left p-3 text-sm font-medium">Título</th>
                      <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Tipo</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium hidden sm:table-cell">Prioridade</th>
                      <th className="text-left p-3 text-sm font-medium hidden lg:table-cell">Data</th>
                      <th className="text-left p-3 text-sm font-medium">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {hasActiveFilters ? "Nenhum ticket encontrado com os filtros aplicados" : "Nenhum ticket cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.slice(0, 100).map((ticket) => (
                        <tr key={ticket.id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm font-mono">
                            {ticket.ticketNumber || ticket.id}
                          </td>
                          <td className="p-3 text-sm">
                            <div className="max-w-[300px] truncate" title={ticket.title}>
                              {ticket.title}
                            </div>
                          </td>
                          <td className="p-3 text-sm hidden md:table-cell">
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: TICKET_TYPE_COLORS[ticket.type] || "#6b7280",
                                color: TICKET_TYPE_COLORS[ticket.type] || "#6b7280"
                              }}
                            >
                              {TICKET_TYPE_LABELS[ticket.type] || ticket.type}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge
                              style={{
                                backgroundColor: TICKET_STATUS_COLORS[ticket.status] || "#6b7280",
                              }}
                            >
                              {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm hidden sm:table-cell">
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: TICKET_PRIORITY_COLORS[ticket.priority] || "#6b7280",
                                color: TICKET_PRIORITY_COLORS[ticket.priority] || "#6b7280"
                              }}
                            >
                              {TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm hidden lg:table-cell text-muted-foreground">
                            {ticket.registrationDate
                              ? new Date(ticket.registrationDate).toLocaleDateString("pt-BR")
                              : "-"}
                          </td>
                          <td className="p-3 text-sm">
                            {ticket.url ? (
                              <a
                                href={ticket.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredTickets.length > 100 && (
                <div className="bg-muted/30 p-2 text-center text-sm text-muted-foreground border-t">
                  Mostrando 100 de {filteredTickets.length} tickets. Use os filtros para refinar a busca.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Chamados registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.fechados}</div>
            <p className="text-xs text-muted-foreground">Taxa: {stats.taxaResolucao}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando resolução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalTickets.length}</div>
            <p className="text-xs text-muted-foreground">Alta prioridade</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Chamados por Tipo</CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle>Chamados por Prioridade</CardTitle>
            <CardDescription>Nível de criticidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      {monthlyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Chamados ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
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
      )}

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Situação atual dos chamados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
            {criticalTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-muted-foreground">Nenhum chamado crítico pendente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {criticalTickets.slice(0, 5).map((ticket) => (
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
                {criticalTickets.length > 5 && (
                  <p className="text-sm text-center text-muted-foreground">
                    + {criticalTickets.length - 5} outros chamados críticos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
