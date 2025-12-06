import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart,
  FileText,
  Settings
} from "lucide-react";

export default function Documentation() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Documentação do Sistema</h1>
        <p className="text-muted-foreground">
          Guia completo para utilização do Dashboard de Tickets CNIEP
        </p>
      </div>

      <Tabs defaultValue="intro" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="intro">Introdução</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="guia">Guia Rápido</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* ABA: INTRODUÇÃO */}
        <TabsContent value="intro" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Bem-vindo ao Dashboard de Tickets CNIEP</CardTitle>
              </div>
              <CardDescription>
                Sistema de gerenciamento e acompanhamento de tickets desenvolvido para o CNIEP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">O que é este sistema?</h3>
                <p className="text-muted-foreground">
                  O Dashboard de Tickets CNIEP é uma plataforma completa para registrar, acompanhar
                  e analisar tickets de suporte, demandas e ocorrências. O sistema oferece
                  visualização em tempo real de métricas, relatórios detalhados e ferramentas
                  para gestão eficiente das demandas.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Principais Funcionalidades</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Gestão de Tickets</h4>
                      <p className="text-sm text-muted-foreground">
                        Crie, edite e acompanhe tickets com status e prioridades
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 border rounded-lg">
                    <BarChart className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Dashboard Interativo</h4>
                      <p className="text-sm text-muted-foreground">
                        Visualize KPIs e gráficos em tempo real
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Relatórios Detalhados</h4>
                      <p className="text-sm text-muted-foreground">
                        Relatórios semanais, mensais e trimestrais
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 border rounded-lg">
                    <Settings className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Importação de Dados</h4>
                      <p className="text-sm text-muted-foreground">
                        Importe tickets em lote via Excel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: TICKETS */}
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Tickets</CardTitle>
              <CardDescription>
                Aprenda a criar, editar e gerenciar tickets no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Status de Tickets</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Aberto
                    </Badge>
                    <span className="text-sm text-muted-foreground">Ticket criado, aguardando ação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      Em Andamento
                    </Badge>
                    <span className="text-sm text-muted-foreground">Ticket sendo trabalhado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                      Pendente
                    </Badge>
                    <span className="text-sm text-muted-foreground">Aguardando informação externa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Resolvido
                    </Badge>
                    <span className="text-sm text-muted-foreground">Ticket finalizado</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Níveis de Prioridade</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-700">Alta Prioridade</h4>
                      <p className="text-sm text-muted-foreground">
                        Problemas críticos que impedem operações principais. Requerem atenção imediata.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-700">Média Prioridade</h4>
                      <p className="text-sm text-muted-foreground">
                        Problemas que afetam funcionalidades mas têm alternativas temporárias.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-700">Baixa Prioridade</h4>
                      <p className="text-sm text-muted-foreground">
                        Melhorias, sugestões ou problemas menores que não impactam operações.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Campos do Ticket</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[140px]">Número do Ticket:</span>
                    <span className="text-muted-foreground">Identificador único (opcional)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[140px]">Título:</span>
                    <span className="text-muted-foreground">Resumo breve do problema ou demanda</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[140px]">Descrição:</span>
                    <span className="text-muted-foreground">Detalhes completos do ticket</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[140px]">URL:</span>
                    <span className="text-muted-foreground">Link relacionado ao ticket (opcional)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[140px]">Data de Registro:</span>
                    <span className="text-muted-foreground">Quando o ticket foi registrado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: RELATÓRIOS */}
        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Análises</CardTitle>
              <CardDescription>
                Entenda os diferentes tipos de relatórios disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold mb-1">Relatório Semanal</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Análise detalhada dos tickets da semana atual, incluindo:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Total de tickets criados na semana</li>
                    <li>• Distribuição por status e prioridade</li>
                    <li>• Taxa de resolução</li>
                    <li>• Tickets pendentes</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h3 className="font-semibold mb-1">Relatório Mensal</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Visão consolidada do mês, com métricas como:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Comparativo com meses anteriores</li>
                    <li>• Tempo médio de resolução</li>
                    <li>• Categorização de problemas recorrentes</li>
                    <li>• Análise de tendências</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-semibold mb-1">Relatório Trimestral</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Análise estratégica do trimestre, incluindo:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Evolução de métricas ao longo dos meses</li>
                    <li>• Identificação de padrões sazonais</li>
                    <li>• Recomendações estratégicas</li>
                    <li>• Planejamento para próximo período</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">KPIs Principais</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Total de Tickets</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantidade total de tickets no período
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Taxa de Resolução</h4>
                    <p className="text-sm text-muted-foreground">
                      Percentual de tickets resolvidos
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Tempo Médio</h4>
                    <p className="text-sm text-muted-foreground">
                      Tempo médio para resolução
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Tickets Pendentes</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantidade aguardando resolução
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: GUIA RÁPIDO */}
        <TabsContent value="guia" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <CardTitle>Guia Rápido</CardTitle>
              </div>
              <CardDescription>
                Tutoriais passo a passo para tarefas comuns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Como criar um novo ticket
                </h3>
                <ol className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <li>1. Acesse a página inicial do dashboard</li>
                  <li>2. Clique no botão "Novo Ticket" no canto superior direito</li>
                  <li>3. Preencha os campos obrigatórios (Título, Status, Prioridade)</li>
                  <li>4. Adicione informações opcionais (Descrição, URL, Data)</li>
                  <li>5. Clique em "Salvar" para criar o ticket</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Como editar um ticket existente
                </h3>
                <ol className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <li>1. Localize o ticket na lista da página inicial</li>
                  <li>2. Clique no botão "Editar" (ícone de lápis) ao lado do ticket</li>
                  <li>3. Modifique os campos desejados</li>
                  <li>4. Clique em "Salvar" para confirmar as alterações</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Como importar tickets via Excel
                </h3>
                <ol className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <li>1. Prepare uma planilha Excel com as colunas corretas</li>
                  <li>2. Clique no botão "Importar Excel" na página inicial</li>
                  <li>3. Selecione o arquivo Excel do seu computador</li>
                  <li>4. Revise os dados importados</li>
                  <li>5. Confirme a importação</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  Como acessar relatórios
                </h3>
                <ol className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <li>1. Use o menu lateral para navegar</li>
                  <li>2. Escolha entre Relatório Semanal, Mensal ou Trimestral</li>
                  <li>3. Visualize os gráficos e métricas apresentados</li>
                  <li>4. Use os filtros para personalizar a visualização</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
              </div>
              <CardDescription>
                Respostas para dúvidas comuns sobre o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Os dados são salvos automaticamente?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Todos os dados são salvos automaticamente no banco de dados PostgreSQL
                  assim que você cria ou edita um ticket. Não é necessário salvar manualmente.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Posso deletar um ticket?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim. Cada ticket tem um botão de exclusão (ícone de lixeira). Tenha cuidado,
                  pois a exclusão é permanente e não pode ser desfeita.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Como filtro tickets por período?</h3>
                <p className="text-sm text-muted-foreground">
                  Na página inicial, use os filtros disponíveis no topo da lista de tickets.
                  Você pode filtrar por status, prioridade e período de data.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Qual formato de Excel devo usar para importação?</h3>
                <p className="text-sm text-muted-foreground">
                  O arquivo Excel deve conter as colunas: Título, Descrição, Status, Prioridade.
                  Campos opcionais incluem: Número do Ticket, URL e Data de Registro.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Posso exportar os dados?</h3>
                <p className="text-sm text-muted-foreground">
                  Atualmente o sistema permite visualização e análise dos dados através dos relatórios.
                  Funcionalidades de exportação podem ser adicionadas em versões futuras.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Como funciona o tema claro/escuro?</h3>
                <p className="text-sm text-muted-foreground">
                  Use o botão de tema no canto superior direito para alternar entre modo claro e escuro.
                  Sua preferência é salva automaticamente no navegador.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">O sistema funciona offline?</h3>
                <p className="text-sm text-muted-foreground">
                  Não. O sistema requer conexão com a internet para acessar o banco de dados
                  e salvar as informações.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold mb-1">Há limite de tickets que posso criar?</h3>
                <p className="text-sm text-muted-foreground">
                  Não há limite técnico para a quantidade de tickets. O sistema foi projetado
                  para suportar grande volume de dados.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                Precisa de mais ajuda?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Se você não encontrou a resposta para sua dúvida nesta documentação,
                entre em contato com a equipe de suporte técnico do CNIEP.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
