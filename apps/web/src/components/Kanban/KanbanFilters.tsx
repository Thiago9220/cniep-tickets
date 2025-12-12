import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import { TICKET_TYPE_LABELS } from "@/types/ticket";

interface KanbanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  sortKey: string;
  onSortKeyChange: (value: any) => void;
  sortDir: "asc" | "desc";
  onSortDirToggle: () => void;
  onShowArchived: () => void;
  canEditKanban: boolean;
  onTicketCreated: () => void;
}

export function KanbanFilters({
  search,
  onSearchChange,
  filterPriority,
  onFilterPriorityChange,
  filterType,
  onFilterTypeChange,
  sortKey,
  onSortKeyChange,
  sortDir,
  onSortDirToggle,
  onShowArchived,
  canEditKanban,
  onTicketCreated
}: KanbanFiltersProps) {
  return (
    <div className="mb-4 flex items-start md:items-center justify-between gap-3 flex-wrap">
      <div className="flex-1 min-w-[260px]">
        <h1 className="text-3xl font-bold mb-2">Quadro de Desenvolvimento</h1>
        <p className="text-muted-foreground">
          Arraste os tickets entre as colunas para atualizar o status de desenvolvimento
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end md:flex-none">
        <div className="relative">
          <Input 
            placeholder="Buscar por título, descrição ou #" 
            value={search} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-[220px]" 
          />
        </div>
        <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas prioridades</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={onSortKeyChange}>
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
        <Button variant="outline" size="sm" onClick={onSortDirToggle}>{sortDir === "asc" ? "Asc" : "Desc"}</Button>
        <Button variant="outline" size="sm" onClick={onShowArchived}>
          <Archive className="h-4 w-4 mr-2" />
          Arquivados
        </Button>
        {canEditKanban && <NewTicketDialog onTicketCreated={onTicketCreated} />}
      </div>
    </div>
  );
}
