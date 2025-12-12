import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ticketsApi, usersApi } from "@/lib/api";
import { getAuthToken } from "@/contexts/AuthContext";
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
} from "@/types/ticket";

interface NewTicketDialogProps {
  onTicketCreated?: () => void;
}

export function NewTicketDialog({ onTicketCreated }: NewTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; name: string | null; email: string }>>([]);
  const [formData, setFormData] = useState({
    ticketNumber: "",
    title: "",
    description: "",
    status: "aberto",
    priority: "media",
    type: "outros",
    url: "",
    registrationDate: new Date().toISOString().split("T")[0],
    assigneeId: "",
  });

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        try {
          const token = getAuthToken();
          if (token) {
            const data = await usersApi.getAll(token);
            setUsers(data);
          }
        } catch (error) {
          console.error("Erro ao carregar usuários:", error);
        }
      };
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Preencha o título do ticket");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      await ticketsApi.create({
        ...formData,
        ticketNumber: formData.ticketNumber ? parseInt(formData.ticketNumber, 10) : undefined,
        registrationDate: formData.registrationDate || undefined,
        assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : undefined,
      }, token || undefined);

      toast.success("Ticket criado com sucesso!");
      setOpen(false);
      resetForm();
      onTicketCreated?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ticketNumber: "",
      title: "",
      description: "",
      status: "aberto",
      priority: "media",
      type: "outros",
      url: "",
      registrationDate: new Date().toISOString().split("T")[0],
      assigneeId: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo ticket manualmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticketNumber">Número do Ticket</Label>
                <Input
                  id="ticketNumber"
                  type="number"
                  placeholder="Ex: 12345"
                  value={formData.ticketNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, ticketNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationDate">Data de Abertura</Label>
                <Input
                  id="registrationDate"
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Título do chamado"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição detalhada do chamado..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigneeId: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ninguém</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL do Ticket (GLPI)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://glpi.cnj.jus.br/..."
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
