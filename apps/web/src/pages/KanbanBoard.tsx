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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CheckCircle2,
  Rocket,
  Layers,
} from "lucide-react";
import { NewTicketDialog } from "@/components/NewTicketDialog";

const STAGES = ["backlog", "desenvolvimento", "homologacao", "producao"] as const;

const STAGE_ICONS: Record<string, React.ReactNode> = {
  backlog: <Layers className="h-4 w-4" />,
  desenvolvimento: <Clock className="h-4 w-4" />,
  homologacao: <AlertCircle className="h-4 w-4" />,
  producao: <Rocket className="h-4 w-4" />,
};

export default function KanbanBoard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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
      updateTicketStage(draggedTicket.id, stage);
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

  const getTicketsByStage = (stage: string) => {
    return tickets
      .filter((t) => (t.stage || "backlog") === stage)
      .filter((t) => t.status !== "fechado"); // Hide closed tickets
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quadro de Desenvolvimento</h1>
          <p className="text-muted-foreground">
            Arraste os tickets entre as colunas para atualizar o status de desenvolvimento
          </p>
        </div>
        {user?.isAdmin && <NewTicketDialog onTicketCreated={() => fetchTickets(true)} />}
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageTickets = getTicketsByStage(stage);
          const stageColor = TICKET_STAGE_COLORS[stage];
          const isDropTarget = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={`flex-1 min-w-[300px] max-w-[350px] flex flex-col rounded-lg border bg-muted/30 transition-all ${
                isDropTarget ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div
                className="p-3 border-b flex items-center gap-2"
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
              </div>

              {/* Tickets List */}
              <ScrollArea className="flex-1 p-2">
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
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {TICKET_TYPE_LABELS[ticket.type] || ticket.type}
                                </Badge>
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

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
