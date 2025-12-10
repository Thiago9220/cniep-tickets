import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Bell, CheckCircle2, Clock, Calendar, AlertTriangle, Repeat, Flag, Filter, Search, Tag, X, Pencil, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
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
  categoria?: string;
  ordem?: number;
}

const categoriasPreDefinidas = [
  { nome: "Chefe", cor: "bg-purple-500" },
  { nome: "GLPI", cor: "bg-blue-500" },
  { nome: "Reunião", cor: "bg-green-500" },
  { nome: "Relatório", cor: "bg-yellow-500" },
  { nome: "Urgente", cor: "bg-red-500" },
  { nome: "Pessoal", cor: "bg-pink-500" },
];

const prioridadeConfig: Record<Prioridade, { label: string; color: string; bgColor: string }> = {
  baixa: { label: "Baixa", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  media: { label: "Média", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  alta: { label: "Alta", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  urgente: { label: "Urgente", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30" },
};

const getCategoriaConfig = (categoria?: string) => {
  if (!categoria) return null;
  const cat = categoriasPreDefinidas.find((c) => c.nome === categoria);
  return cat || { nome: categoria, cor: "bg-gray-500" };
};

export default function Reminders() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaDataEntrega, setNovaDataEntrega] = useState("");
  const [novoRecorrente, setNovoRecorrente] = useState(false);
  const [novaPrioridade, setNovaPrioridade] = useState<Prioridade>("media");
  const [novaCategoria, setNovaCategoria] = useState<string>("");
  const [filtro, setFiltro] = useState<"todos" | "urgente" | "alta" | "atrasados" | "diarios">("todos");
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");

  // Estados para edição
  const [lembreteEditando, setLembreteEditando] = useState<Lembrete | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editDataEntrega, setEditDataEntrega] = useState("");
  const [editRecorrente, setEditRecorrente] = useState(false);
  const [editPrioridade, setEditPrioridade] = useState<Prioridade>("media");
  const [editCategoria, setEditCategoria] = useState<string>("");

  // Estados para drag and drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [ordenacaoManual, setOrdenacaoManual] = useState(false);

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

      // Verificar se há ordenação manual
      const temOrdemManual = lembretesAtualizados.some((l) => l.ordem !== undefined);
      setOrdenacaoManual(temOrdemManual);
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
      categoria: novaCategoria && novaCategoria !== "sem-categoria" ? novaCategoria : undefined,
    };

    setLembretes([novoLembrete, ...lembretes]);
    setNovoTitulo("");
    setNovaDescricao("");
    setNovaDataEntrega("");
    setNovoRecorrente(false);
    setNovaPrioridade("media");
    setNovaCategoria("");
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

  // Funções de edição
  const abrirEdicao = (lembrete: Lembrete) => {
    setLembreteEditando(lembrete);
    setEditTitulo(lembrete.titulo);
    setEditDescricao(lembrete.descricao);
    setEditDataEntrega(lembrete.dataEntrega || "");
    setEditRecorrente(lembrete.recorrente || false);
    setEditPrioridade(lembrete.prioridade);
    setEditCategoria(lembrete.categoria || "sem-categoria");
  };

  const salvarEdicao = () => {
    if (!lembreteEditando) return;
    if (!editTitulo.trim()) {
      toast.error("Digite um título para o lembrete");
      return;
    }

    setLembretes(
      lembretes.map((l) =>
        l.id === lembreteEditando.id
          ? {
              ...l,
              titulo: editTitulo,
              descricao: editDescricao,
              dataEntrega: editRecorrente ? undefined : (editDataEntrega || undefined),
              recorrente: editRecorrente,
              prioridade: editPrioridade,
              categoria: editCategoria && editCategoria !== "sem-categoria" ? editCategoria : undefined,
            }
          : l
      )
    );
    setLembreteEditando(null);
    toast.success("Lembrete atualizado!");
  };

  const fecharEdicao = () => {
    setLembreteEditando(null);
  };

  // Funções de drag and drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const lembretesPendentesIds = lembretes.filter((l) => !l.concluido).map((l) => l.id);
    const draggedIndex = lembretesPendentesIds.indexOf(draggedId);
    const targetIndex = lembretesPendentesIds.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Reordenar apenas os pendentes
    const novaOrdem = [...lembretesPendentesIds];
    novaOrdem.splice(draggedIndex, 1);
    novaOrdem.splice(targetIndex, 0, draggedId);

    // Atualizar ordem nos lembretes
    const lembretesAtualizados = lembretes.map((l) => {
      if (!l.concluido) {
        const novaOrdemIndex = novaOrdem.indexOf(l.id);
        return { ...l, ordem: novaOrdemIndex };
      }
      return l;
    });

    setLembretes(lembretesAtualizados);
    setOrdenacaoManual(true);
    setDraggedId(null);
    setDragOverId(null);
    toast.success("Ordem atualizada!");
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const resetarOrdenacao = () => {
    const lembretesAtualizados = lembretes.map((l) => ({ ...l, ordem: undefined }));
    setLembretes(lembretesAtualizados);
    setOrdenacaoManual(false);
    toast.success("Ordenação por prioridade restaurada!");
  };

  const prioridadeOrdem: Record<Prioridade, number> = {
    urgente: 0,
    alta: 1,
    media: 2,
    baixa: 3,
  };

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

  // Verificar se um lembrete está atrasado
  const isAtrasado = (lembrete: Lembrete) => {
    if (!lembrete.dataEntrega) return false;
    const status = getStatusEntrega(lembrete.dataEntrega);
    return status?.status === "atrasado";
  };

  // Filtrar e ordenar lembretes pendentes
  const lembretesPendentes = lembretes
    .filter((l) => !l.concluido)
    .filter((l) => {
      // Filtro por prioridade/status
      if (filtro === "urgente" && l.prioridade !== "urgente") return false;
      if (filtro === "alta" && l.prioridade !== "alta" && l.prioridade !== "urgente") return false;
      if (filtro === "atrasados" && !isAtrasado(l)) return false;
      if (filtro === "diarios" && !l.recorrente) return false;
      return true;
    })
    .filter((l) => {
      // Filtro por categoria
      if (filtroCategoria && l.categoria !== filtroCategoria) return false;
      return true;
    })
    .filter((l) => {
      // Filtro por busca (título ou descrição)
      if (!busca.trim()) return true;
      const termoBusca = busca.toLowerCase().trim();
      const tituloMatch = l.titulo.toLowerCase().includes(termoBusca);
      const descricaoMatch = l.descricao?.toLowerCase().includes(termoBusca);
      return tituloMatch || descricaoMatch;
    })
    .sort((a, b) => {
      // Se houver ordenação manual, usar ela
      if (ordenacaoManual && a.ordem !== undefined && b.ordem !== undefined) {
        return a.ordem - b.ordem;
      }
      // Caso contrário, ordenar por prioridade
      return prioridadeOrdem[a.prioridade || "media"] - prioridadeOrdem[b.prioridade || "media"];
    });

  const lembretesConluidos = lembretes.filter((l) => l.concluido);

  // Contadores para filtros
  const countAtrasados = lembretes.filter((l) => !l.concluido && isAtrasado(l)).length;
  const countUrgentes = lembretes.filter((l) => !l.concluido && l.prioridade === "urgente").length;
  const countAlta = lembretes.filter((l) => !l.concluido && (l.prioridade === "alta" || l.prioridade === "urgente")).length;
  const countDiarios = lembretes.filter((l) => !l.concluido && l.recorrente).length;
  const countPendentes = lembretes.filter((l) => !l.concluido).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lembretes</h2>
          <p className="text-muted-foreground">
            Avisos e tarefas para lembrar de fazer.
          </p>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filtro === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro("todos")}
          >
            <Filter className="h-3 w-3 mr-1" />
            Todos
            {countPendentes > 0 && (
              <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                {countPendentes}
              </span>
            )}
          </Button>
          {countAtrasados > 0 && (
            <Button
              variant={filtro === "atrasados" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("atrasados")}
              className={filtro !== "atrasados" ? "border-red-300 text-red-600 hover:bg-red-50" : "bg-red-500 hover:bg-red-600"}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Atrasados
              <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                {countAtrasados}
              </span>
            </Button>
          )}
          {countUrgentes > 0 && (
            <Button
              variant={filtro === "urgente" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("urgente")}
              className={filtro !== "urgente" ? "border-red-300 text-red-600 hover:bg-red-50" : "bg-red-500 hover:bg-red-600"}
            >
              <Flag className="h-3 w-3 mr-1" />
              Urgentes
              <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                {countUrgentes}
              </span>
            </Button>
          )}
          {countAlta > 0 && (
            <Button
              variant={filtro === "alta" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("alta")}
              className={filtro !== "alta" ? "border-orange-300 text-orange-600 hover:bg-orange-50" : "bg-orange-500 hover:bg-orange-600"}
            >
              <Flag className="h-3 w-3 mr-1" />
              Alta+
              <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                {countAlta}
              </span>
            </Button>
          )}
          {countDiarios > 0 && (
            <Button
              variant={filtro === "diarios" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("diarios")}
              className={filtro !== "diarios" ? "border-blue-300 text-blue-600 hover:bg-blue-50" : "bg-blue-500 hover:bg-blue-600"}
            >
              <Repeat className="h-3 w-3 mr-1" />
              Diários
              <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                {countDiarios}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de busca e filtro por categoria */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lembretes por título ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 pr-10"
          />
          {busca && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setBusca("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filtroCategoria === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroCategoria("")}
          >
            <Tag className="h-3 w-3 mr-1" />
            Todas
          </Button>
          {categoriasPreDefinidas.map((cat) => {
            const count = lembretes.filter((l) => !l.concluido && l.categoria === cat.nome).length;
            return (
              <Button
                key={cat.nome}
                variant={filtroCategoria === cat.nome ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroCategoria(filtroCategoria === cat.nome ? "" : cat.nome)}
                className={cn(
                  filtroCategoria !== cat.nome && "hover:bg-muted",
                  filtroCategoria === cat.nome && cat.cor
                )}
              >
                <span className={cn("h-2 w-2 rounded-full mr-1.5", cat.cor)} />
                {cat.nome}
                {count > 0 && (
                  <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
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
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categoria
              </label>
              <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-categoria">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      Sem categoria
                    </span>
                  </SelectItem>
                  {categoriasPreDefinidas.map((cat) => (
                    <SelectItem key={cat.nome} value={cat.nome}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", cat.cor)} />
                        {cat.nome}
                      </span>
                    </SelectItem>
                  ))}
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
            <div className="flex items-center justify-between">
              <div>
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
              </div>
              {ordenacaoManual && (
                <Button variant="outline" size="sm" onClick={resetarOrdenacao}>
                  <Flag className="h-3 w-3 mr-1" />
                  Ordenar por prioridade
                </Button>
              )}
            </div>
            {lembretesPendentes.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                <GripVertical className="h-3 w-3 inline mr-1" />
                Arraste os itens para reordenar
              </p>
            )}
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
                      draggable
                      onDragStart={(e) => handleDragStart(e, lembrete.id)}
                      onDragOver={(e) => handleDragOver(e, lembrete.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, lembrete.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg group hover:bg-muted transition-all cursor-grab active:cursor-grabbing",
                        statusEntrega?.status === "atrasado" ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/50",
                        draggedId === lembrete.id && "opacity-50 scale-95",
                        dragOverId === lembrete.id && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Checkbox
                          checked={lembrete.concluido}
                          onCheckedChange={() => toggleConcluido(lembrete.id)}
                          className="mt-0"
                        />
                      </div>
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
                          {lembrete.categoria && getCategoriaConfig(lembrete.categoria) && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-white",
                              getCategoriaConfig(lembrete.categoria)?.cor
                            )}>
                              <Tag className="h-3 w-3" />
                              {lembrete.categoria}
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => abrirEdicao(lembrete)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => removerLembrete(lembrete.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                      {lembrete.categoria && getCategoriaConfig(lembrete.categoria) && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-muted-foreground bg-muted">
                          <Tag className="h-3 w-3" />
                          {lembrete.categoria}
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

      {/* Modal de edição */}
      <Dialog open={!!lembreteEditando} onOpenChange={(open) => !open && fecharEdicao()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Lembrete
            </DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no lembrete
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Título do lembrete..."
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição (opcional)..."
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Prioridade
              </label>
              <Select value={editPrioridade} onValueChange={(v) => setEditPrioridade(v as Prioridade)}>
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
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categoria
              </label>
              <Select value={editCategoria} onValueChange={setEditCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-categoria">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      Sem categoria
                    </span>
                  </SelectItem>
                  {categoriasPreDefinidas.map((cat) => (
                    <SelectItem key={cat.nome} value={cat.nome}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", cat.cor)} />
                        {cat.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <label className="text-sm flex items-center gap-2 cursor-pointer">
                <Repeat className="h-4 w-4 text-blue-500" />
                Tarefa diária (recorrente)
              </label>
              <Switch
                checked={editRecorrente}
                onCheckedChange={setEditRecorrente}
              />
            </div>
            {!editRecorrente && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de entrega
                </label>
                <Input
                  type="date"
                  value={editDataEntrega}
                  onChange={(e) => setEditDataEntrega(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={fecharEdicao}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
