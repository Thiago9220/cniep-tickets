import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth, getAuthToken } from "@/contexts/AuthContext";
import {
  Ticket,
  TICKET_STAGE_LABELS,
  TICKET_STAGE_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  TICKET_TYPE_LABELS,
} from "@/types/ticket";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  GripVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  Clock,
  Rocket,
  Layers,
  Trash2,
  CheckCircle,
  Archive,
  RotateCcw,
} from "lucide-react";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import { ticketsApi } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const STAGES = ["backlog", "desenvolvimento", "homologacao", "producao"] as const;

const STAGE_ICONS: Record<string, React.ReactNode> = {
  backlog: <Layers className="h-4 w-4" />,
  desenvolvimento: <Clock className="h-4 w-4" />,
  homologacao: <AlertCircle className="h-4 w-4" />,
  producao: <Rocket className="h-4 w-4" />,
};

// Helper to get initials
const getInitials = (name: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function KanbanBoard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [comments, setComments] = useState<Array<{ id: number; content: string; createdAt: string; user: { id: number; name: string | null; email: string } }>>([]);
  const [newComment, setNewComment] = useState("");
  const [activities, setActivities] = useState<Array<{ id: number; type: string; fromStage?: string; toStage?: string; message?: string; createdAt: string; user?: { id: number; name: string | null; email: string } }>>([]);
  const [following, setFollowing] = useState<boolean>(false);

  // Estados para os diálogos de confirmação
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Filtros e ordenação
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("todas");
  const [filterType, setFilterType] = useState<string>("todos");
  const [sortKey, setSortKey] = useState<
    "manual" | "priority" | "ticketNumber" | "createdAt" | "registrationDate" | "title"
  >("manual");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Ordem manual por coluna (persistida no navegador)
  const [stageOrder, setStageOrder] = useState<Record<string, number[]>>(() => {
    try {
      const raw = localStorage.getItem("kanban-order-v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const saveStageOrder = (next: Record<string, number[]>) => {
    setStageOrder(next);
    try {
      localStorage.setItem("kanban-order-v1", JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => fetchTickets(true), 5000); // Poll every 5 seconds (background)
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const response = await api.get("/tickets");
      setTickets(response.data);
      // Reconciliar ordem manual com os tickets carregados
      try {
        const byStage: Record<string, number[]> = { ...stageOrder };
        STAGES.forEach((s) => {
          const ids = response.data.filter((t: Ticket) => (t.stage || "backlog") === s).map((t: Ticket) => t.id);
          const existing = byStage[s] || [];
          // manter apenas ids existentes e adicionar novos ao final
          const filtered = existing.filter((id) => ids.includes(id));
          const missing = ids.filter((id: number) => !filtered.includes(id));
          byStage[s] = [...filtered, ...missing];
        });
        saveStageOrder(byStage);
      } catch {}
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      if (!isBackground) toast.error("Erro ao carregar tickets");
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  const updateTicketStage = async (ticketId: number, newStage: string) => {
    try {
      const token = getAuthToken();
      await api.patch(
        `/tickets/${ticketId}/stage`,
        { stage: newStage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, stage: newStage } : t))
      );

      toast.success("Ticket movido com sucesso");
    } catch (error: any) {
      console.error("Erro ao mover ticket:", error);
      const message = error.response?.data?.error || "Erro ao mover ticket";
      toast.error(message);
    }
  };

  const confirmDeleteTicket = async () => {
    if (!selectedTicket) return;
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Você precisa estar logado para realizar esta ação");
        return;
      }
      await ticketsApi.delete(selectedTicket.id, token);
      toast.success("Ticket enviado para o limbo digital!");
      setSelectedTicket(null);
      setIsDeleteDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error("Erro ao excluir ticket:", error);
      toast.error("Erro ao excluir ticket");
    }
  };

  const confirmCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Você precisa estar logado para realizar esta ação");
        return;
      }
      await ticketsApi.update(selectedTicket.id, { status: "fechado" }, token);
      toast.success("Missão cumprida! Ticket arquivado com sucesso.");
      setSelectedTicket(null);
      setIsCloseDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error("Erro ao concluir ticket:", error);
      toast.error("Erro ao concluir ticket");
    }
  };

  const restoreTicket = async (ticket: Ticket) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      await ticketsApi.update(ticket.id, { status: "aberto" }, token);
      toast.success("Ticket restaurado com sucesso!");
      fetchTickets();
    } catch (error) {
      console.error("Erro ao restaurar ticket:", error);
      toast.error("Erro ao restaurar ticket");
    }
  };

  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (draggedTicket && draggedTicket.stage !== stage) {
      // Mover para outra coluna: coloca no topo da ordem do destino
      const dest = stageOrder[stage] || [];
      const src = stageOrder[draggedTicket.stage] || [];
      const newSrc = src.filter((id) => id !== draggedTicket.id);
      const newDest = [draggedTicket.id, ...dest.filter((id) => id !== draggedTicket.id)];
      const nextOrder = { ...stageOrder, [draggedTicket.stage]: newSrc, [stage]: newDest };
      saveStageOrder(nextOrder);
      updateTicketStage(draggedTicket.id, stage);
      // Persistir ordem nas duas colunas
      persistOrder(stage, nextOrder[stage]);
      persistOrder(draggedTicket.stage, nextOrder[draggedTicket.stage]);
    } else if (draggedTicket && draggedTicket.stage === stage) {
      // Apenas reordenou dentro da mesma coluna
      persistOrder(stage);
    }
    setDraggedTicket(null);
  };

  const moveTicket = (ticket: Ticket, direction: "left" | "right") => {
    const currentIndex = STAGES.indexOf(ticket.stage as typeof STAGES[number]);
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < STAGES.length) {
      updateTicketStage(ticket.id, STAGES[newIndex]);
    }
  };

  // Ordenação auxiliar
  const sorters: Record<string, (a: Ticket, b: Ticket) => number> = {
    priority: (a, b) => {
      const weight: Record<string, number> = { alta: 3, media: 2, baixa: 1 };
      return (weight[a.priority] || 0) - (weight[b.priority] || 0);
    },
    ticketNumber: (a, b) => (a.ticketNumber || 0) - (b.ticketNumber || 0),
    createdAt: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    registrationDate: (a, b) =>
      new Date(a.registrationDate || a.createdAt).getTime() - new Date(b.registrationDate || b.createdAt).getTime(),
    title: (a, b) => a.title.localeCompare(b.title, "pt-BR"),
  };

  const getTicketsByStage = (stage: string) => {
    let list = tickets.filter((t) => (t.stage || "backlog") === stage).filter((t) => t.status !== "fechado");

    // Filtros
    if (filterPriority !== "todas") list = list.filter((t) => t.priority === filterPriority);
    if (filterType !== "todos") list = list.filter((t) => t.type === filterType);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(term) ||
        (t.description || "").toLowerCase().includes(term) ||
        String(t.ticketNumber || "").includes(term)
      );
    }

    // Ordenação
    if (sortKey === "manual") {
      const order = stageOrder[stage] || [];
      list = [...list].sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        return (ia === -1 ? 999999 : ia) - (ib === -1 ? 999999 : ib);
      });
    } else {
      const sorter = sorters[sortKey];
      list = [...list].sort(sorter);
      if (sortDir === "desc") list.reverse();
    }

    return list;
  };

  // WIP Limits (ajustável no futuro)
  const WIP_LIMIT: Record<string, number> = {
    backlog: 1000,
    desenvolvimento: 8,
    homologacao: 6,
    producao: 4,
  };

  const isOverWip = (stage: string, count: number) => count > (WIP_LIMIT[stage] ?? 9999);

  // Reordenar visualmente dentro da mesma coluna enquanto arrasta (preview + persistência local)
  const reorderWithinStage = (stage: string, overTicketId: number) => {
    if (!draggedTicket || draggedTicket.stage !== stage) return;
    const order = stageOrder[stage] || [];
    const from = order.indexOf(draggedTicket.id);
    const to = order.indexOf(overTicketId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, draggedTicket.id);
    saveStageOrder({ ...stageOrder, [stage]: next });
  };

  const persistOrder = async (stage: string, order?: number[]) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const arr = order ?? (stageOrder[stage] || []);
      // Apenas persiste tickets que realmente estão nesse stage
      const idsInStage = tickets.filter((t) => (t.stage || "backlog") === stage).map((t) => t.id);
      const filtered = arr.filter((id) => idsInStage.includes(id));
      if (filtered.length === 0) return;
      await ticketsApi.reorder(token, stage, filtered);
    } catch (e) {
      console.error("Falha ao persistir ordem do Kanban", e);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const color = TICKET_PRIORITY_COLORS[priority] || "#6b7280";
    return (
      <Badge
        variant="outline"
        style={{ borderColor: color, color: color }}
        className="text-[10px] px-1.5 py-0"
      >
        {TICKET_PRIORITY_LABELS[priority] || priority}
      </Badge>
    );
  };

  // Load comments/activities when opening ticket dialog
  useEffect(() => {
    const loadCollab = async () => {
      if (!selectedTicket) return;
      try {
        const [c, a] = await Promise.all([
          ticketsApi.getComments(selectedTicket.id),
          ticketsApi.getActivities(selectedTicket.id),
        ]);
        setComments(c);
        setActivities(a);
      } catch (e) {
        console.error("Erro ao carregar colaboração do ticket", e);
      }
    };
    loadCollab();
  }, [selectedTicket?.id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const postComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await ticketsApi.addComment(selectedTicket.id, newComment.trim(), token);
      setNewComment("");
      const fresh = await ticketsApi.getComments(selectedTicket.id);
      setComments(fresh);
      const acts = await ticketsApi.getActivities(selectedTicket.id);
      setActivities(acts);
    } catch (e) {
      console.error("Erro ao comentar", e);
      toast.error("Erro ao adicionar comentário");
    }
  };

  const toggleFollow = async () => {
    if (!selectedTicket) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await ticketsApi.toggleFollow(selectedTicket.id, token);
      setFollowing(res.following);
    } catch (e) {
      console.error("Erro ao seguir ticket", e);
    }
  };

  const archivedTickets = tickets.filter(t => t.status === "fechado");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col px-3 md:px-4 py-6 bg-slate-50 dark:bg-transparent">
      <div className="mb-4 flex items-start md:items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-3xl font-bold mb-2">Quadro de Desenvolvimento</h1>
          <p className="text-muted-foreground">
            Arraste os tickets entre as colunas para atualizar o status de desenvolvimento
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end md:flex-none">
          <div className="relative">
            <Input placeholder="Buscar por título, descrição ou #" value={search} onChange={(e) => setSearch(e.target.value)} className="w-[220px]" />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="ticketNumber">Número</SelectItem>
              <SelectItem value="createdAt">Criado em</SelectItem>
              <SelectItem value="registrationDate">Registro</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>{sortDir === "asc" ? "Asc" : "Desc"}</Button>
          <Button variant="outline" size="sm" onClick={() => setShowArchived(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Arquivados
          </Button>
          {user?.isAdmin && <NewTicketDialog onTicketCreated={() => fetchTickets(true)} />}
        </div>
      </div>

      <div className="flex-1 flex gap-3 overflow-x-auto pb-4 pr-2">
        {STAGES.map((stage) => {
          const stageTickets = getTicketsByStage(stage);
          const stageColor = TICKET_STAGE_COLORS[stage];
          const isDropTarget = dragOverStage === stage;
          const overLimit = isOverWip(stage, stageTickets.length);

          return (
            <div
              key={stage}
              className={`flex-1 min-w-[260px] max-w-[320px] flex flex-col rounded-lg border bg-white shadow-sm dark:bg-muted/30 transition-all ${
                isDropTarget ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div
                className={`p-3 border-b flex items-center gap-2 ${overLimit ? "bg-red-500/5" : "bg-slate-50/60 dark:bg-transparent"}`}
                style={{ borderBottomColor: stageColor }}
              >
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
                >
                  {STAGE_ICONS[stage]}
                </div>
                <span className="font-semibold">{TICKET_STAGE_LABELS[stage]}</span>
                <Badge variant="secondary" className="ml-auto">
                  {stageTickets.length}
                </Badge>
                {overLimit && (
                  <Badge variant="destructive" className="ml-2">WIP {WIP_LIMIT[stage]}</Badge>
                )}
              </div>

              {/* Tickets List */}
              <ScrollArea
                className="flex-1 p-2 rounded-b-lg"
                style={{ backgroundColor: `${stageColor}0D` }}
              >
                <div className="space-y-2">
                  {stageTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum ticket
                    </div>
                  ) : (
                    stageTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        draggable={user?.isAdmin}
                        onDragStart={(e) => handleDragStart(e, ticket)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          reorderWithinStage(stage, ticket.id);
                        }}
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          draggedTicket?.id === ticket.id ? "opacity-50" : ""
                        } ${user?.isAdmin ? "cursor-grab active:cursor-grabbing" : ""}`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            {user?.isAdmin && (
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {ticket.ticketNumber && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    #{ticket.ticketNumber}
                                  </span>
                                )}
                                {getPriorityBadge(ticket.priority)}
                              </div>
                              <p className="text-sm font-medium line-clamp-2">
                                {ticket.title}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {TICKET_TYPE_LABELS[ticket.type] || ticket.type}
                                </Badge>

                                <div className="flex items-center gap-1">
                                  {/* Creator Avatar */}
                                  {ticket.creator && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Avatar className="h-5 w-5 border border-muted-foreground/20">
                                            <AvatarImage src={ticket.creator.avatar || undefined} />
                                            <AvatarFallback className="text-[9px]">
                                              {getInitials(ticket.creator.name || ticket.creator.email)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Criado por: {ticket.creator.name || ticket.creator.email}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  
                                  {/* Assignee Avatar */}
                                  {ticket.assignee && (
                                     <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Avatar className="h-5 w-5 border border-primary/20 ring-1 ring-primary/10">
                                            <AvatarImage src={ticket.assignee.avatar || undefined} />
                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                              {getInitials(ticket.assignee.name || ticket.assignee.email)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Responsável: {ticket.assignee.name || ticket.assignee.email}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </div>
                            {user?.isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {STAGES.indexOf(ticket.stage as typeof STAGES[number]) > 0 && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveTicket(ticket, "left");
                                      }}
                                    >
                                      <ChevronLeft className="h-4 w-4 mr-2" />
                                      Mover para{" "}
                                      {
                                        TICKET_STAGE_LABELS[
                                          STAGES[
                                            STAGES.indexOf(
                                              ticket.stage as typeof STAGES[number]
                                            ) - 1
                                          ]
                                        ]
                                      }
                                    </DropdownMenuItem>
                                  )}
                                  {STAGES.indexOf(ticket.stage as typeof STAGES[number]) <
                                    STAGES.length - 1 && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveTicket(ticket, "right");
                                      }}
                                    >
                                      <ChevronRight className="h-4 w-4 mr-2" />
                                      Mover para{" "}
                                      {
                                        TICKET_STAGE_LABELS[
                                          STAGES[
                                            STAGES.indexOf(
                                              ticket.stage as typeof STAGES[number]
                                            ) + 1
                                          ]
                                        ]
                                      }
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Isso é um adeus definitivo!</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer mandar este ticket para o limbo digital?
              <br />
              Essa ação é irreversível e apagará todo o histórico e comentários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Melhor não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTicket} className="bg-red-600 hover:bg-red-700">
              Sim, apagar para sempre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missão cumprida?</AlertDialogTitle>
            <AlertDialogDescription>
              Pronto para arquivar esta vitória?
              <br />
              O ticket será marcado como concluído e sairá do quadro de desenvolvimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ainda não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseTicket} className="bg-green-600 hover:bg-green-700">
              Sim, concluir tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showArchived} onOpenChange={setShowArchived}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tickets Arquivados</SheetTitle>
            <SheetDescription>
              Histórico de tickets concluídos. Você pode restaurá-los para o quadro a qualquer momento.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {archivedTickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum ticket arquivado.</p>
            ) : (
              archivedTickets.map(ticket => (
                <div key={ticket.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                   <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span>
                           <span className="font-medium text-sm">{ticket.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <Badge variant="outline" className="text-[10px]">{TICKET_TYPE_LABELS[ticket.type]}</Badge>
                           <span>{new Date(ticket.updatedAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => restoreTicket(ticket)} title="Restaurar ticket">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                   </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {selectedTicket.ticketNumber && (
                    <Badge variant="outline" className="font-mono">
                      #{selectedTicket.ticketNumber}
                    </Badge>
                  )}
                  {getPriorityBadge(selectedTicket.priority)}
                  <Button variant="outline" size="sm" className="ml-auto" onClick={toggleFollow}>{following ? "Deixar de seguir" : "Seguir"}</Button>
                  {user?.isAdmin && (
                    <div className="flex gap-2 ml-2 border-l pl-2">
                        <Button variant="outline" size="icon" onClick={() => setIsCloseDialogOpen(true)} title="Concluir ticket">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setIsDeleteDialogOpen(true)} title="Excluir ticket">
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                  )}
                </div>
                <DialogTitle className="text-left">{selectedTicket.title}</DialogTitle>
                <DialogDescription className="text-left">
                  {selectedTicket.description || "Sem descrição"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Tipo
                    </p>
                    <Badge variant="secondary">
                      {TICKET_TYPE_LABELS[selectedTicket.type] || selectedTicket.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </p>
                    <Badge variant="secondary">{selectedTicket.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Estágio
                    </p>
                    <Badge
                      style={{
                        backgroundColor: `${TICKET_STAGE_COLORS[selectedTicket.stage]}20`,
                        color: TICKET_STAGE_COLORS[selectedTicket.stage],
                      }}
                    >
                      {TICKET_STAGE_LABELS[selectedTicket.stage] || selectedTicket.stage}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Criado em
                    </p>
                    <p className="text-sm">
                      {new Date(selectedTicket.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Criado por</p>
                    <div className="flex items-center gap-2">
                       {selectedTicket.creator ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedTicket.creator.avatar || undefined} />
                              <AvatarFallback>{getInitials(selectedTicket.creator.name || selectedTicket.creator.email)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{selectedTicket.creator.name || selectedTicket.creator.email}</span>
                          </>
                       ) : (
                         <span className="text-sm text-muted-foreground">Desconhecido</span>
                       )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Responsável</p>
                     <div className="flex items-center gap-2">
                       {selectedTicket.assignee ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedTicket.assignee.avatar || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(selectedTicket.assignee.name || selectedTicket.assignee.email)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{selectedTicket.assignee.name || selectedTicket.assignee.email}</span>
                          </>
                       ) : (
                         <span className="text-sm text-muted-foreground">Não atribuído</span>
                       )}
                    </div>
                  </div>
                </div>

                {selectedTicket.url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Link GLPI
                    </p>
                    <a
                      href={selectedTicket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Abrir ticket no GLPI
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {user?.isAdmin && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Mover para
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {STAGES.filter((s) => s !== selectedTicket.stage).map((stage) => (
                      <Button
                        key={stage}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateTicketStage(selectedTicket.id, stage);
                          setSelectedTicket({ ...selectedTicket, stage });
                        }}
                        style={{
                          borderColor: TICKET_STAGE_COLORS[stage],
                          color: TICKET_STAGE_COLORS[stage],
                        }}
                      >
                        {STAGE_ICONS[stage]}
                        <span className="ml-1">{TICKET_STAGE_LABELS[stage]}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comentários */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Comentários</p>
                <div className="max-h-40 overflow-y-auto space-y-3 pr-2">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem comentários</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-medium">{c.user.name || c.user.email}</span>{" "}
                        <span className="text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                        <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva um comentário... Use @email para mencionar" rows={2} />
                  <Button onClick={postComment}>Enviar</Button>
                </div>
              </div>

              {/* Histórico */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Histórico</p>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 text-sm">
                  {activities.length === 0 ? (
                    <p className="text-muted-foreground">Sem atividades</p>
                  ) : (
                    activities.map((a) => (
                      <div key={a.id}>
                        <span className="font-medium">{a.user?.name || a.user?.email || "Sistema"}</span>{" "}
                        <span className="text-muted-foreground">{a.type === "move" ? (
                          <>moveu de <b>{TICKET_STAGE_LABELS[a.fromStage || ""] || a.fromStage}</b> para <b>{TICKET_STAGE_LABELS[a.toStage || ""] || a.toStage}</b></>
                        ) : (
                          <>comentou: {a.message}</>
                        )}</span>
                        <span className="text-muted-foreground text-xs"> — {new Date(a.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
