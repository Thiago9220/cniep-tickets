import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ExternalLink,
  Trash2,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useKanbanBoard } from "@/hooks/useKanbanBoard";
import { KanbanColumn } from "@/components/Kanban/KanbanColumn";
import { KanbanFilters } from "@/components/Kanban/KanbanFilters";

const STAGES = ["backlog", "desenvolvimento", "homologacao", "producao"] as const;
const STAGE_ICONS: Record<string, React.ReactNode> = {
    backlog: <div className="h-4 w-4" />, // Placeholder, icon logic is inside KanbanColumn too, duplicated for Dialog
    desenvolvimento: <div className="h-4 w-4" />,
    homologacao: <div className="h-4 w-4" />,
    producao: <div className="h-4 w-4" />,
};

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
  const {
    tickets,
    isLoading,
    draggedTicket,
    dragOverStage,
    search,
    setSearch,
    filterPriority,
    setFilterPriority,
    filterType,
    setFilterType,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    showArchived,
    setShowArchived,
    fetchTickets,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    reorderWithinStage,
    getTicketsByStage,
    updateTicketStage,
    moveTicket,
    user
  } = useKanbanBoard();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Array<{ id: number; content: string; createdAt: string; user: { id: number; name: string | null; email: string } }>>([]);
  const [newComment, setNewComment] = useState("");
  const [activities, setActivities] = useState<Array<{ id: number; type: string; fromStage?: string; toStage?: string; message?: string; createdAt: string; user?: { id: number; name: string | null; email: string } }>>([]);
  const [following, setFollowing] = useState<boolean>(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const archivedTickets = tickets.filter(t => t.status === "fechado");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col px-3 md:px-4 py-6 bg-slate-50 dark:bg-transparent">
      
      <KanbanFilters
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        sortDir={sortDir}
        onSortDirToggle={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
        onShowArchived={() => setShowArchived(true)}
        isAdmin={!!user?.isAdmin}
        onTicketCreated={() => fetchTickets(true)}
      />

      <div className="flex-1 flex gap-3 overflow-x-auto pb-4 pr-2">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            tickets={getTicketsByStage(stage)}
            isDropTarget={dragOverStage === stage}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isAdmin={!!user?.isAdmin}
            draggedTicketId={draggedTicket?.id}
            onTicketDragStart={handleDragStart}
            onTicketDragOver={reorderWithinStage}
            onTicketClick={setSelectedTicket}
            onTicketMoveLeft={(t) => moveTicket(t, "left")}
            onTicketMoveRight={(t) => moveTicket(t, "right")}
          />
        ))}
      </div>

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
                         <span className="ml-1">{TICKET_STAGE_LABELS[stage]}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

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