import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Calendar, PieChart, TicketIcon } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="space-y-8">
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
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
              Ver dashboard <ArrowRight className="h-3 w-3" />
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
            <CardTitle>Status dos Sistemas</CardTitle>
            <CardDescription>Monitoramento em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">GLPI (Service Desk)</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operacional</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">JIRA (Projetos)</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operacional</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="font-medium">Portal do Usuário</span>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Lentidão Intermitente</span>
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
              <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                <a href="#" target="_blank">
                  <BarChart3 className="h-5 w-5" />
                  Extrair CSV Bruto
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
