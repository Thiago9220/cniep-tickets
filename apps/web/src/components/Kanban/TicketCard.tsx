import {
  Ticket,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  TICKET_TYPE_LABELS,
  TICKET_STAGE_LABELS
} from "@/types/ticket";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

interface TicketCardProps {
  ticket: Ticket;
  canEditKanban: boolean;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, ticket: Ticket) => void;
  onDragOver: (e: React.DragEvent) => void;
  onClick: (ticket: Ticket) => void;
  onMoveLeft: (ticket: Ticket) => void;
  onMoveRight: (ticket: Ticket) => void;
}

const STAGES = ["backlog", "desenvolvimento", "homologacao", "producao"] as const;

export function TicketCard({
  ticket,
  canEditKanban,
  isDragged,
  onDragStart,
  onDragOver,
  onClick,
  onMoveLeft,
  onMoveRight,
}: TicketCardProps) {

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

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const currentStageIndex = STAGES.indexOf(ticket.stage as typeof STAGES[number]);

  return (
    <Card
      draggable={canEditKanban}
      onDragStart={(e) => onDragStart(e, ticket)}
      onDragOver={onDragOver}
      className={`cursor-pointer hover:shadow-md transition-all ${
        isDragged ? "opacity-50" : ""
      } ${canEditKanban ? "cursor-grab active:cursor-grabbing" : ""}`}
      onClick={() => onClick(ticket)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {canEditKanban && (
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
          {canEditKanban && (
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
                {currentStageIndex > 0 && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLeft(ticket);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Mover para {TICKET_STAGE_LABELS[STAGES[currentStageIndex - 1]]}
                  </DropdownMenuItem>
                )}
                {currentStageIndex < STAGES.length - 1 && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveRight(ticket);
                    }}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Mover para {TICKET_STAGE_LABELS[STAGES[currentStageIndex + 1]]}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
