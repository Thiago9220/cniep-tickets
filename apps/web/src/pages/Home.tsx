import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Calendar, Download, PieChart, TicketIcon, Upload, AlertTriangle, Bell, Clock, X } from "lucide-react";
import { Link } from "wouter";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { ticketsApi, type TicketStats } from "@/lib/api";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import { useLembretesCount } from "@/hooks/useLembretes";
import { cn } from "@/lib/utils";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [alertaFechado, setAlertaFechado] = useState(false);
  const lembretesCount = useLembretesCount();

  const temAlerta = lembretesCount.atrasados > 0 || lembretesCount.urgentes > 0;

  useEffect(() => {
    ticketsApi.getStats()
      .then(setStats)
      .catch((err) => console.error("Falha ao checar status da API", err));
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const tickets = await ticketsApi.getAll();

      if (tickets.length === 0) {
        toast.error("Nenhum ticket para exportar");
        return;
      }

      // Função para escapar campos CSV corretamente
      const escapeCSV = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        // Se contém aspas, ponto-e-vírgula, ou quebra de linha, precisa de escape
        if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Cabeçalhos do CSV
      const headers = [
        "ID",
        "Número",
        "Título",
        "Descrição",
        "Status",
        "Prioridade",
        "Tipo",
        "URL",
        "Data Abertura",
        "Criado Em",
        "Atualizado Em"
      ];

      // Converter tickets para linhas CSV
      const rows = tickets.map(ticket => [
        escapeCSV(ticket.id),
        escapeCSV(ticket.ticketNumber),
        escapeCSV(ticket.title),
        escapeCSV(ticket.description),
        escapeCSV(ticket.status),
        escapeCSV(ticket.priority),
        escapeCSV(ticket.type),
        escapeCSV(ticket.url),
        escapeCSV(ticket.registrationDate ? new Date(ticket.registrationDate).toLocaleDateString("pt-BR") : ""),
        escapeCSV(new Date(ticket.createdAt).toLocaleDateString("pt-BR")),
        escapeCSV(new Date(ticket.updatedAt).toLocaleDateString("pt-BR"))
      ]);

      // Montar CSV
      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      // Criar blob e fazer download
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tickets_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${tickets.length} tickets exportados com sucesso!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar tickets");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading("Importando arquivo...", {
      description: "Processando dados do Excel...",
    });

    try {
      const stats = await ticketsApi.importExcel(file);
      toast.success("Importação concluída!", {
        id: toastId,
        description: `${stats.imported} criados, ${stats.updated} atualizados, ${stats.skipped} ignorados.`,
        duration: 5000,
      });
      // Limpar o input para permitir selecionar o mesmo arquivo novamente se necessário
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na importação", {
        id: toastId,
        description: "Verifique o formato do arquivo e tente novamente.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx,.xls"
      />

      {/* Alerta de Lembretes */}
      {temAlerta && !alertaFechado && (
        <div className={cn(
          "relative rounded-lg border p-4 shadow-sm animate-in slide-in-from-top-2 duration-300",
          lembretesCount.atrasados > 0
            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
            : "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setAlertaFechado(true)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-4">
            <div className={cn(
              "rounded-full p-2",
              lembretesCount.atrasados > 0
                ? "bg-red-100 dark:bg-red-900/50"
                : "bg-orange-100 dark:bg-orange-900/50"
            )}>
              {lembretesCount.atrasados > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold",
                lembretesCount.atrasados > 0
                  ? "text-red-800 dark:text-red-200"
                  : "text-orange-800 dark:text-orange-200"
              )}>
                {lembretesCount.atrasados > 0
                  ? "Atenção: Você tem tarefas atrasadas!"
                  : "Você tem tarefas urgentes pendentes"}
              </h3>
              <div className="mt-1 flex flex-wrap gap-3 text-sm">
                {lembretesCount.atrasados > 0 && (
                  <span className="flex items-center gap-1 text-red-700 dark:text-red-300">
                    <Clock className="h-4 w-4" />
                    {lembretesCount.atrasados} {lembretesCount.atrasados === 1 ? "tarefa atrasada" : "tarefas atrasadas"}
                  </span>
                )}
                {lembretesCount.urgentes > 0 && (
                  <span className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-4 w-4" />
                    {lembretesCount.urgentes} {lembretesCount.urgentes === 1 ? "tarefa urgente" : "tarefas urgentes"}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant={lembretesCount.atrasados > 0 ? "destructive" : "default"}
                  className={cn(
                    lembretesCount.atrasados === 0 && "bg-orange-600 hover:bg-orange-700"
                  )}
                  asChild
                >
                  <Link href="/lembretes">
                    <Bell className="h-4 w-4 mr-2" />
                    Ver Lembretes
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Painel de Gestão Integrada</h1>
        <p className="text-lg text-muted-foreground">
          Visão unificada do suporte (GLPI) e desenvolvimento (JIRA) do Conselho Nacional de Justiça.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden border-l-4 border-l-orange-500">
          <Link href="/dashboard">
            <div className="absolute inset-0 z-10" />
          </Link>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-orange-500" />
                Dashboard GLPI
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <CardDescription>Chamados Importados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize métricas e gráficos dos chamados importados do Excel.
            </p>
            <div className="flex gap-2 flex-wrap relative z-20">
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImportClick();
                }}
                disabled={isImporting}
              >
                {isImporting ? "Importando..." : "Importar Excel"}
                {!isImporting && <Upload className="ml-2 h-3 w-3" />}
              </Button>
              <NewTicketDialog onTicketCreated={() => {
                ticketsApi.getStats().then(setStats);
              }} />
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 px-3 py-2">
                Dashboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden border-l-4 border-l-blue-500">
          <Link href="/weekly">
            <div className="absolute inset-0 z-10" />
          </Link>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Relatório Semanal
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <CardDescription>Foco Operacional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acompanhe o volume diário, backlog imediato e alertas de SLA da semana corrente.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden border-l-4 border-l-green-500">
          <Link href="/monthly">
            <div className="absolute inset-0 z-10" />
          </Link>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Relatório Mensal
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <CardDescription>Foco Tático</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analise tendências de volume, conformidade com SLA e distribuição por canais.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden border-l-4 border-l-purple-500">
          <Link href="/quarterly">
            <div className="absolute inset-0 z-10" />
          </Link>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Relatório Trimestral
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <CardDescription>Foco Estratégico</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Integração GLPI + JIRA, análise de causa raiz e impacto do desenvolvimento.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status da Plataforma</CardTitle>
            <CardDescription>Saúde do sistema interno</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* API Status */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stats ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  <span className="font-medium">API Backend</span>
                </div>
                <span className={`text-sm font-medium ${stats ? "text-green-600" : "text-red-600"}`}>
                  {stats ? "Operacional" : "Indisponível"}
                </span>
              </div>

              {/* Database Status */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stats ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="font-medium">Banco de Dados</span>
                </div>
                <span className={`text-sm font-medium ${stats ? "text-green-600" : "text-red-600"}`}>
                  {stats ? "Conectado" : "Erro de Conexão"}
                </span>
              </div>

              {/* Data Volume */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">Base de Conhecimento</span>
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {stats ? `${stats.total} chamados` : "..."}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Links úteis para a gestão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="https://teams.microsoft.com/l/meeting/new" target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-5 w-5" />
                  Agendar Reunião
                </a>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <Download className="h-5 w-5" />
                {isExporting ? "Exportando..." : "Extrair CSV Bruto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
