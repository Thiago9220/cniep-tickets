import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, ticketsApi } from "@/lib/api";
import { useAuth, getAuthToken } from "@/contexts/AuthContext";
import { Ticket, TICKET_STAGE_LABELS } from "@/types/ticket";

const STAGES = ["backlog", "desenvolvimento", "homologacao", "producao"] as const;

export const WIP_LIMIT: Record<string, number> = {
  backlog: 1000,
  desenvolvimento: 8,
  homologacao: 6,
  producao: 4,
};

export function useKanbanBoard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Drag and Drop state
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Filters and Sorting
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("todas");
  const [filterType, setFilterType] = useState<string>("todos");
  const [sortKey, setSortKey] = useState<
    "manual" | "priority" | "ticketNumber" | "createdAt" | "registrationDate" | "title"
  >("manual");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showArchived, setShowArchived] = useState(false);

  // Manual Order State
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

  const fetchTickets = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const response = await api.get("/tickets");
      setTickets(response.data);
      
      // Reconcile manual order with loaded tickets
      try {
        const byStage: Record<string, number[]> = { ...stageOrder };
        STAGES.forEach((s) => {
          const ids = response.data.filter((t: Ticket) => (t.stage || "backlog") === s).map((t: Ticket) => t.id);
          const existing = byStage[s] || [];
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

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => fetchTickets(true), 5000);
    return () => clearInterval(interval);
  }, []);

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

  const persistOrder = async (stage: string, order?: number[]) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const arr = order ?? (stageOrder[stage] || []);
      const idsInStage = tickets.filter((t) => (t.stage || "backlog") === stage).map((t) => t.id);
      const filtered = arr.filter((id) => idsInStage.includes(id));
      if (filtered.length === 0) return;
      await ticketsApi.reorder(token, stage, filtered);
    } catch (e) {
      console.error("Falha ao persistir ordem do Kanban", e);
    }
  };

  // Drag and Drop Handlers
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
      const dest = stageOrder[stage] || [];
      const src = stageOrder[draggedTicket.stage] || [];
      const newSrc = src.filter((id) => id !== draggedTicket.id);
      const newDest = [draggedTicket.id, ...dest.filter((id) => id !== draggedTicket.id)];
      const nextOrder = { ...stageOrder, [draggedTicket.stage]: newSrc, [stage]: newDest };
      saveStageOrder(nextOrder);
      updateTicketStage(draggedTicket.id, stage);
      persistOrder(stage, nextOrder[stage]);
      persistOrder(draggedTicket.stage, nextOrder[draggedTicket.stage]);
    } else if (draggedTicket && draggedTicket.stage === stage) {
      persistOrder(stage);
    }
    setDraggedTicket(null);
  };

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

  const moveTicket = (ticket: Ticket, direction: "left" | "right") => {
    const currentIndex = STAGES.indexOf(ticket.stage as typeof STAGES[number]);
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < STAGES.length) {
      updateTicketStage(ticket.id, STAGES[newIndex]);
    }
  };

  // Sorters
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

  const isOverWip = (stage: string, count: number) => count > (WIP_LIMIT[stage] ?? 9999);

  return {
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
    isOverWip,
    updateTicketStage,
    moveTicket,
    user
  };
}
