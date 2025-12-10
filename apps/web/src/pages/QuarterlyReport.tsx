import { UrgencyPieChart } from "@/components/Charts";
import { EditQuarterlyDialog } from "@/components/EditQuarterlyDialog";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { ticketsApi, type QuarterlyStatsResponse } from "@/lib/api";
import { ArrowRight, Bug, CheckSquare, Download, GitMerge, Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// Função para obter o trimestre atual
function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

export default function QuarterlyReport() {
  const { quarterlyData } = useData();
  const [selectedQuarter, setSelectedQuarter] = useState<string>(getCurrentQuarter());
  const [availableQuarters, setAvailableQuarters] = useState<string[]>([]);
  const [quarterlyStats, setQuarterlyStats] = useState<QuarterlyStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar trimestres disponíveis
  useEffect(() => {
    const fetchQuarters = async () => {
      try {
        const { quarters } = await ticketsApi.getAvailableQuarters();
        setAvailableQuarters(quarters);
        // Se o trimestre atual não tem dados, selecionar o mais recente disponível
        if (quarters.length > 0 && !quarters.includes(selectedQuarter)) {
          setSelectedQuarter(quarters[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar trimestres:", error);
      }
    };
    fetchQuarters();
  }, []);

  // Buscar estatísticas do trimestre selecionado
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedQuarter) return;
      setIsLoading(true);
      try {
        const stats = await ticketsApi.getQuarterlyStats(selectedQuarter);
        setQuarterlyStats(stats);
      } catch (error) {
        console.error("Erro ao buscar estatísticas trimestrais:", error);
        setQuarterlyStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [selectedQuarter]);

  // Dados de causa raiz (da API ou fallback para dados locais)
  const rootCauseData = quarterlyStats?.rootCause || quarterlyData.rootCause;
  const analysisText = quarterlyStats?.analysis || "A maior parte dos incidentes ainda é causada por bugs de software, justificando o foco da equipe de desenvolvimento em correções de estabilidade no próximo ciclo.";
  const periodLabel = quarterlyStats?.period || quarterlyData.period;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório Trimestral</h2>
          <p className="text-muted-foreground">
            Período: {periodLabel} | Foco: Estratégia e Desenvolvimento
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              {availableQuarters.map((q) => (
                <SelectItem key={q} value={q}>
                  {q.replace("-", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EditQuarterlyDialog />
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Integração GLPI + JIRA */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Bugs Corrigidos (JIRA)"
          value={quarterlyData.jiraIntegration.bugsFixed}
          description="Correções implantadas em produção"
          icon={<Bug className="h-4 w-4" />}
          status="success"
        />
        <KpiCard
          title="Melhorias Entregues"
          value={quarterlyData.jiraIntegration.improvements}
          description="Novas funcionalidades"
          icon={<Lightbulb className="h-4 w-4" />}
          status="neutral"
        />
        <KpiCard
          title="Redução Estimada de Tickets"
          value={quarterlyData.jiraIntegration.ticketsReduced}
          description="Impacto direto das correções"
          trend="down"
          trendValue="Impacto Positivo"
          status="success"
          icon={<ArrowRight className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Análise de Causa Raiz</CardTitle>
            <CardDescription>
              Origem primária dos incidentes no trimestre
              {quarterlyStats && (
                <span className="ml-2 text-xs text-green-600">
                  (Dados reais: {quarterlyStats.summary.total} tickets)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {rootCauseData.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
                  <strong>Análise:</strong> {analysisText}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status do Desenvolvimento (JIRA)</CardTitle>
            <CardDescription>
              Progresso das demandas vinculadas ao suporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrgencyPieChart data={quarterlyData.jiraStatus} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plano de Ação para o Próximo Trimestre</CardTitle>
          <CardDescription>Recomendações baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg flex flex-col gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 w-fit rounded-lg text-blue-600 dark:text-blue-400">
                <GitMerge className="h-5 w-5" />
              </div>
              <h4 className="font-semibold">Automação de Deploy</h4>
              <p className="text-sm text-muted-foreground">Implementar CI/CD para reduzir erros de versão.</p>
            </div>
            <div className="p-4 border rounded-lg flex flex-col gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 w-fit rounded-lg text-green-600 dark:text-green-400">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h4 className="font-semibold">Treinamento de Usuários</h4>
              <p className="text-sm text-muted-foreground">Criar webinars focados nas dúvidas recorrentes.</p>
            </div>
            <div className="p-4 border rounded-lg flex flex-col gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 w-fit rounded-lg text-orange-600 dark:text-orange-400">
                <Bug className="h-5 w-5" />
              </div>
              <h4 className="font-semibold">Força Tarefa de Bugs</h4>
              <p className="text-sm text-muted-foreground">Dedicar 30% do tempo da sprint para zerar o backlog de bugs.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
