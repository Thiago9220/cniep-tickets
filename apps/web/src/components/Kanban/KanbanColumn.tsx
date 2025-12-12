import { Ticket, TICKET_STAGE_LABELS, TICKET_STAGE_COLORS } from "@/types/ticket";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TicketCard } from "./TicketCard";
import { Layers, Clock, AlertCircle, Rocket } from "lucide-react";
import { WIP_LIMIT } from "@/hooks/useKanbanBoard";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  backlog: <Layers className="h-4 w-4" />,
  desenvolvimento: <Clock className="h-4 w-4" />,
  homologacao: <AlertCircle className="h-4 w-4" />,
  producao: <Rocket className="h-4 w-4" />,
};

interface KanbanColumnProps {
  stage: string;
  tickets: Ticket[];
  isDropTarget: boolean;
  onDragOver: (e: React.DragEvent, stage: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stage: string) => void;
  
  // Ticket Props
  isAdmin: boolean;
  draggedTicketId?: number;
  onTicketDragStart: (e: React.DragEvent, ticket: Ticket) => void;
  onTicketDragOver: (stage: string, ticketId: number) => void;
  onTicketClick: (ticket: Ticket) => void;
  onTicketMoveLeft: (ticket: Ticket) => void;
  onTicketMoveRight: (ticket: Ticket) => void;
}

export function KanbanColumn({
  stage,
  tickets,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  isAdmin,
  draggedTicketId,
  onTicketDragStart,
  onTicketDragOver,
  onTicketClick,
  onTicketMoveLeft,
  onTicketMoveRight,
}: KanbanColumnProps) {
  const stageColor = TICKET_STAGE_COLORS[stage];
  const overLimit = tickets.length > (WIP_LIMIT[stage] ?? 9999);

  return (
    <div
      className={`flex-1 min-w-[260px] max-w-[320px] flex flex-col rounded-lg border bg-white shadow-sm dark:bg-muted/30 transition-all ${
        isDropTarget ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
      onDragOver={(e) => onDragOver(e, stage)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage)}
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
          {tickets.length}
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
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum ticket
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isAdmin={isAdmin}
                isDragged={draggedTicketId === ticket.id}
                onDragStart={onTicketDragStart}
                onDragOver={(e) => {
                  e.preventDefault();
                  onTicketDragOver(stage, ticket.id);
                }}
                onClick={onTicketClick}
                onMoveLeft={onTicketMoveLeft}
                onMoveRight={onTicketMoveRight}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
