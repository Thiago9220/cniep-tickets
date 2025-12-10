import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Bell, CheckCircle2, Clock, Calendar, AlertTriangle, Repeat, Flag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Prioridade = "baixa" | "media" | "alta" | "urgente";

interface Lembrete {
  id: string;
  titulo: string;
  descricao: string;
  concluido: boolean;
  criadoEm: string;
  dataEntrega?: string;
  recorrente?: boolean;
  ultimaConclusao?: string;
  prioridade: Prioridade;
}

const prioridadeConfig: Record<Prioridade, { label: string; color: string; bgColor: string }> = {
  baixa: { label: "Baixa", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  media: { label: "Média", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  alta: { label: "Alta", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  urgente: { label: "Urgente", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30" },
};

export default function Reminders() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaDataEntrega, setNovaDataEntrega] = useState("");
  const [novoRecorrente, setNovoRecorrente] = useState(false);
  const [novaPrioridade, setNovaPrioridade] = useState<Prioridade>("media");

  // Carregar lembretes do localStorage e resetar recorrentes
  useEffect(() => {
    const lembretesStorage = localStorage.getItem("lembretes");
    if (lembretesStorage) {
      const lembretesCarregados: Lembrete[] = JSON.parse(lembretesStorage);
      const hoje = new Date().toLocaleDateString("pt-BR");

      // Resetar lembretes recorrentes se a última conclusão foi em outro dia
      const lembretesAtualizados = lembretesCarregados.map((l) => {
        if (l.recorrente && l.concluido && l.ultimaConclusao !== hoje) {
          return { ...l, concluido: false };
        }
        return l;
      });

      setLembretes(lembretesAtualizados);
    }
  }, []);

  // Salvar lembretes no localStorage
  useEffect(() => {
    localStorage.setItem("lembretes", JSON.stringify(lembretes));
  }, [lembretes]);

  const adicionarLembrete = () => {
    if (!novoTitulo.trim()) {
      toast.error("Digite um título para o lembrete");
      return;
    }

    const novoLembrete: Lembrete = {
      id: Date.now().toString(),
      titulo: novoTitulo,
      descricao: novaDescricao,
      concluido: false,
      criadoEm: new Date().toLocaleDateString("pt-BR"),
      dataEntrega: novoRecorrente ? undefined : (novaDataEntrega || undefined),
      recorrente: novoRecorrente,
      prioridade: novaPrioridade,
    };

    setLembretes([novoLembrete, ...lembretes]);
    setNovoTitulo("");
    setNovaDescricao("");
    setNovaDataEntrega("");
    setNovoRecorrente(false);
    setNovaPrioridade("media");
    toast.success(novoRecorrente ? "Lembrete diário adicionado!" : "Lembrete adicionado!");
  };

  const toggleConcluido = (id: string) => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    setLembretes(
      lembretes.map((l) =>
        l.id === id
          ? {
              ...l,
              concluido: !l.concluido,
              ultimaConclusao: !l.concluido ? hoje : l.ultimaConclusao,
            }
          : l
      )
    );
  };

  const removerLembrete = (id: string) => {
    setLembretes(lembretes.filter((l) => l.id !== id));
    toast.success("Lembrete removido!");
  };

  const prioridadeOrdem: Record<Prioridade, number> = {
    urgente: 0,
    alta: 1,
    media: 2,
    baixa: 3,
  };

  const lembretesPendentes = lembretes
    .filter((l) => !l.concluido)
    .sort((a, b) => prioridadeOrdem[a.prioridade || "media"] - prioridadeOrdem[b.prioridade || "media"]);
  const lembretesConluidos = lembretes.filter((l) => l.concluido);

  // Função para verificar status da data de entrega
  const getStatusEntrega = (dataEntrega?: string) => {
    if (!dataEntrega) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const entrega = new Date(dataEntrega + "T00:00:00");

    const diffTime = entrega.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "atrasado", label: "Atrasado", color: "text-red-500 bg-red-50" };
    if (diffDays === 0) return { status: "hoje", label: "Hoje", color: "text-orange-500 bg-orange-50" };
    if (diffDays === 1) return { status: "amanha", label: "Amanhã", color: "text-yellow-500 bg-yellow-50" };
    return { status: "futuro", label: formatarData(dataEntrega), color: "text-blue-500 bg-blue-50" };
  };

  const formatarData = (data: string) => {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Lembretes</h2>
        <p className="text-muted-foreground">
          Avisos e tarefas para lembrar de fazer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card para adicionar novo lembrete */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Lembrete
            </CardTitle>
            <CardDescription>
              Adicione tarefas e avisos importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título do lembrete..."
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarLembrete()}
            />
            <Textarea
              placeholder="Descrição (opcional)..."
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              rows={3}
            />
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Prioridade
              </label>
              <Select value={novaPrioridade} onValueChange={(v) => setNovaPrioridade(v as Prioridade)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-gray-500" />
                      Baixa
                    </span>
                  </SelectItem>
                  <SelectItem value="media">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-blue-500" />
                      Média
                    </span>
                  </SelectItem>
                  <SelectItem value="alta">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-orange-500" />
                      Alta
                    </span>
                  </SelectItem>
                  <SelectItem value="urgente">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-red-500" />
                      Urgente
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <label className="text-sm flex items-center gap-2 cursor-pointer">
                <Repeat className="h-4 w-4 text-blue-500" />
                Tarefa diária (recorrente)
              </label>
              <Switch
                checked={novoRecorrente}
                onCheckedChange={setNovoRecorrente}
              />
            </div>
            {!novoRecorrente && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de entrega (opcional)
                </label>
                <Input
                  type="date"
                  value={novaDataEntrega}
                  onChange={(e) => setNovaDataEntrega(e.target.value)}
                />
              </div>
            )}
            <Button onClick={adicionarLembrete} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardContent>
        </Card>

        {/* Card de lembretes pendentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Pendentes
              {lembretesPendentes.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {lembretesPendentes.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Tarefas que você ainda precisa fazer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lembretesPendentes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum lembrete pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lembretesPendentes.map((lembrete) => {
                  const statusEntrega = getStatusEntrega(lembrete.dataEntrega);
                  return (
                    <div
                      key={lembrete.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg group hover:bg-muted transition-colors",
                        statusEntrega?.status === "atrasado" ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={lembrete.concluido}
                        onCheckedChange={() => toggleConcluido(lembrete.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{lembrete.titulo}</p>
                          {lembrete.prioridade && lembrete.prioridade !== "media" && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                              prioridadeConfig[lembrete.prioridade].color,
                              prioridadeConfig[lembrete.prioridade].bgColor
                            )}>
                              <Flag className="h-3 w-3" />
                              {prioridadeConfig[lembrete.prioridade].label}
                            </span>
                          )}
                          {lembrete.recorrente && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-blue-950/30">
                              <Repeat className="h-3 w-3" />
                              Diário
                            </span>
                          )}
                          {statusEntrega && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                              statusEntrega.color
                            )}>
                              {statusEntrega.status === "atrasado" && <AlertTriangle className="h-3 w-3" />}
                              <Calendar className="h-3 w-3" />
                              {statusEntrega.label}
                            </span>
                          )}
                        </div>
                        {lembrete.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {lembrete.descricao}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Criado em {lembrete.criadoEm}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => removerLembrete(lembrete.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card de lembretes concluídos */}
      {lembretesConluidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Concluídos
              <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {lembretesConluidos.length}
              </span>
            </CardTitle>
            <CardDescription>
              Tarefas que você já completou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lembretesConluidos.map((lembrete) => (
                <div
                  key={lembrete.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg group opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Checkbox
                    checked={lembrete.concluido}
                    onCheckedChange={() => toggleConcluido(lembrete.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium line-through">{lembrete.titulo}</p>
                      {lembrete.prioridade && lembrete.prioridade !== "media" && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-muted-foreground bg-muted">
                          <Flag className="h-3 w-3" />
                          {prioridadeConfig[lembrete.prioridade].label}
                        </span>
                      )}
                      {lembrete.recorrente && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-muted-foreground bg-muted">
                          <Repeat className="h-3 w-3" />
                          Diário
                        </span>
                      )}
                      {lembrete.dataEntrega && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-muted-foreground bg-muted">
                          <Calendar className="h-3 w-3" />
                          {formatarData(lembrete.dataEntrega)}
                        </span>
                      )}
                    </div>
                    {lembrete.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-through">
                        {lembrete.descricao}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Criado em {lembrete.criadoEm}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => removerLembrete(lembrete.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
