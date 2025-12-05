import { SimpleBarChart, VolumeBarChart } from "@/components/Charts";
import { EditWeeklyDialog } from "@/components/EditWeeklyDialog";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { AlertTriangle, CheckCircle2, Clock, Download, Inbox } from "lucide-react";

export default function WeeklyReport() {
  const { weeklyData } = useData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório Semanal</h2>
          <p className="text-muted-foreground">
            Período: {weeklyData.period}
          </p>
        </div>
        <div className="flex gap-2">
          <EditWeeklyDialog />
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tickets Abertos"
          value={weeklyData.summary.opened}
          description="Volume da semana"
          trend="neutral"
          icon={<Inbox className="h-4 w-4" />}
        />
        <KpiCard
          title="Tickets Fechados"
          value={weeklyData.summary.closed}
          description="Resoluções"
          trend="down"
          status="warning"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          title="Backlog Total"
          value={weeklyData.summary.backlog}
          description="Pendentes"
          trend="up"
          status="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          title="TMA Semanal"
          value={`${weeklyData.summary.tma}h`}
          description={`Meta: ${weeklyData.summary.tmaGoal}h`}
          trend="up"
          status="success"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="backlog">Detalhamento do Backlog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Volume Diário</CardTitle>
                <CardDescription>
                  Comparativo de tickets abertos vs fechados por dia da semana
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <VolumeBarChart data={weeklyData.dailyVolume} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Backlog por Urgência</CardTitle>
                <CardDescription>
                  Distribuição atual dos tickets pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={weeklyData.backlogByUrgency} 
                  dataKey="value" 
                  name="Tickets" 
                  color="var(--color-primary)" 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="backlog">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Risco</CardTitle>
              <CardDescription>
                Tickets críticos e com risco de violação de SLA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-4" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-200">{weeklyData.summary.slaRisk} Tickets em Risco de SLA</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">Ação recomendada: Priorizar tickets críticos imediatamente.</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Top Ofensores (Categorias)</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Acesso ao Sistema</li>
                      <li>Erro na Geração de Relatórios</li>
                      <li>Lentidão no Portal</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Distribuição por Analista</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Analista A: Alta carga</li>
                      <li>Analista B: Carga média</li>
                      <li>Analista C: Disponível</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
