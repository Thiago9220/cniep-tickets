import { TrendLineChart, UrgencyPieChart } from "@/components/Charts";
import { EditMonthlyDialog } from "@/components/EditMonthlyDialog";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { BarChart3, CheckCircle, Download, ThumbsUp, Users } from "lucide-react";

export default function MonthlyReport() {
  const { monthlyData } = useData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório Mensal</h2>
          <p className="text-muted-foreground">
            Período: {monthlyData.period}
          </p>
        </div>
        <div className="flex gap-2">
          <EditMonthlyDialog />
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Mensais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de Tickets"
          value={monthlyData.summary.totalTickets}
          description="Volume total no mês"
          trend="up"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          title="Conformidade SLA"
          value={`${monthlyData.summary.slaCompliance}%`}
          description="Meta: >90%"
          trend="down"
          status="warning"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KpiCard
          title="Resolução 1º Nível"
          value={`${monthlyData.summary.fcr}%`}
          description="Meta: >70%"
          trend="up"
          status="success"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          title="Satisfação (CSAT)"
          value={monthlyData.summary.satisfaction}
          description="Escala 1-5"
          trend="neutral"
          status="success"
          icon={<ThumbsUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tendência de Volume</CardTitle>
            <CardDescription>
              Evolução semanal de abertura e fechamento de tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <TrendLineChart data={monthlyData.volumeTrend} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>
              Classificação dos chamados no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrgencyPieChart data={monthlyData.byType} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volume por Canal</CardTitle>
            <CardDescription>Origem das solicitações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.byChannel.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-24 text-sm font-medium">{item.name}</div>
                  <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(item.value / 100) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Insights do Mês</CardTitle>
            <CardDescription>Observações qualitativas</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Aumento de chamados via Chat, reduzindo a carga no telefone.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">•</span>
                <span>SLA de tickets de "Dúvida" impactado pela falta de documentação.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Pico de incidentes relacionado à atualização de sistemas.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
