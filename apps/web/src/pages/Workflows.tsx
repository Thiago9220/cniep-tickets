import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  GitBranch,
  User,
  Link as LinkIcon,
  ListOrdered,
  Phone,
  Mail,
  ExternalLink,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { workflowsApi, type Workflow, type WorkflowContact, type WorkflowLink, type WorkflowStep } from "@/lib/api";
import { getAuthToken } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";

const categoriasPreDefinidas = [
  { nome: "Negocial", cor: "bg-purple-500" },
  { nome: "Penal", cor: "bg-red-500" },
  { nome: "Infraestrutura", cor: "bg-blue-500" },
  { nome: "Suporte", cor: "bg-green-500" },
  { nome: "Desenvolvimento", cor: "bg-orange-500" },
  { nome: "Administrativo", cor: "bg-gray-500" },
];

export default function Workflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // Estados para criação/edição
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    contacts: [] as WorkflowContact[],
    links: [] as WorkflowLink[],
    steps: [] as WorkflowStep[],
  });

  // Estados para inputs temporários
  const [newContact, setNewContact] = useState<WorkflowContact>({ name: "", role: "", phone: "", email: "" });
  const [newLink, setNewLink] = useState<WorkflowLink>({ title: "", url: "", description: "" });
  const [newStep, setNewStep] = useState<WorkflowStep>({ order: 1, title: "", description: "" });

  // Estados para expandir/colapsar seções no formulário
  const [expandedSections, setExpandedSections] = useState({
    contacts: true,
    links: true,
    steps: true,
  });

  // Estado para expandir fluxos na listagem
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWorkflows();
  }, [user?.id]);

  const loadWorkflows = async () => {
    try {
      const token = getAuthToken();
      if (!token || !user) return;
      setIsLoading(true);
      const list = await workflowsApi.list(token);
      setWorkflows(list);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar fluxos");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      contacts: [],
      links: [],
      steps: [],
    });
    setNewContact({ name: "", role: "", phone: "", email: "" });
    setNewLink({ title: "", url: "", description: "" });
    setNewStep({ order: 1, title: "", description: "" });
    setEditingWorkflow(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      title: workflow.title,
      description: workflow.description || "",
      category: workflow.category || "",
      contacts: workflow.contacts || [],
      links: workflow.links || [],
      steps: workflow.steps || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Digite um título para o fluxo");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        contacts: formData.contacts.length > 0 ? formData.contacts : undefined,
        links: formData.links.length > 0 ? formData.links : undefined,
        steps: formData.steps.length > 0 ? formData.steps : undefined,
      };

      if (editingWorkflow) {
        const updated = await workflowsApi.update(token, editingWorkflow.id, data);
        setWorkflows(workflows.map((w) => (w.id === updated.id ? updated : w)));
        toast.success("Fluxo atualizado!");
      } else {
        const created = await workflowsApi.create(token, data);
        setWorkflows([created, ...workflows]);
        toast.success("Fluxo criado!");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar fluxo:", error);
      const message = error.response?.data?.error || "Erro ao salvar fluxo";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      await workflowsApi.delete(token, id);
      setWorkflows(workflows.filter((w) => w.id !== id));
      toast.success("Fluxo removido!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover fluxo");
    }
  };

  // Funções para adicionar itens
  const addContact = () => {
    if (!newContact.name.trim()) {
      toast.error("Digite o nome do contato");
      return;
    }
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { ...newContact }],
    });
    setNewContact({ name: "", role: "", phone: "", email: "" });
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter((_, i) => i !== index),
    });
  };

  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Preencha título e URL do link");
      return;
    }
    setFormData({
      ...formData,
      links: [...formData.links, { ...newLink }],
    });
    setNewLink({ title: "", url: "", description: "" });
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    });
  };

  const addStep = () => {
    if (!newStep.title.trim()) {
      toast.error("Digite o título do passo");
      return;
    }
    const order = formData.steps.length + 1;
    setFormData({
      ...formData,
      steps: [...formData.steps, { ...newStep, order }],
    });
    setNewStep({ order: order + 1, title: "", description: "" });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, order: i + 1 }));
    setFormData({
      ...formData,
      steps: newSteps,
    });
  };

  const toggleWorkflowExpanded = (id: string) => {
    const newSet = new Set(expandedWorkflows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedWorkflows(newSet);
  };

  const getCategoriaConfig = (categoria?: string | null) => {
    if (!categoria) return null;
    const cat = categoriasPreDefinidas.find((c) => c.nome === categoria);
    return cat || { nome: categoria, cor: "bg-gray-500" };
  };

  // Filtrar fluxos
  const filteredWorkflows = workflows
    .filter((w) => {
      if (filtroCategoria && w.category !== filtroCategoria) return false;
      return true;
    })
    .filter((w) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        w.title.toLowerCase().includes(termo) ||
        w.description?.toLowerCase().includes(termo) ||
        w.category?.toLowerCase().includes(termo)
      );
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fluxos</h2>
          <p className="text-muted-foreground">
            Procedimentos, contatos e links importantes organizados por área.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fluxos..."
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
            const count = workflows.filter((w) => w.category === cat.nome).length;
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

      {/* Lista de fluxos */}
      {filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">Nenhum fluxo encontrado</p>
            <Button variant="link" onClick={openCreateDialog}>
              Criar primeiro fluxo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredWorkflows.map((workflow) => {
            const isExpanded = expandedWorkflows.has(workflow.id);
            const catConfig = getCategoriaConfig(workflow.category);
            const contacts = workflow.contacts || [];
            const links = workflow.links || [];
            const steps = workflow.steps || [];

            return (
              <Card key={workflow.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleWorkflowExpanded(workflow.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{workflow.title}</CardTitle>
                        {catConfig && (
                          <Badge className={cn("text-white", catConfig.cor)}>
                            {catConfig.nome}
                          </Badge>
                        )}
                      </div>
                      {workflow.description && (
                        <CardDescription>{workflow.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {contacts.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {contacts.length} contato{contacts.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {links.length > 0 && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            {links.length} link{links.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {steps.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ListOrdered className="h-3 w-3" />
                            {steps.length} passo{steps.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(workflow);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(workflow.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t pt-4 space-y-6">
                    {/* Descrição (se houver) */}
                    {workflow.description && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workflow.description}</p>
                      </div>
                    )}

                    {/* Mensagem se não houver conteúdo */}
                    {contacts.length === 0 && links.length === 0 && steps.length === 0 && !workflow.description && (
                      <div className="text-center py-6 text-muted-foreground">
                        <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Este fluxo ainda não tem conteúdo.</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(workflow);
                          }}
                        >
                          Clique aqui para adicionar contatos, links ou passos
                        </Button>
                      </div>
                    )}

                    {/* Contatos */}
                    {contacts.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-blue-500" />
                          Contatos
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {contacts.map((contact, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{contact.name}</p>
                                {contact.role && (
                                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {contact.phone && (
                                    <a
                                      href={`tel:${contact.phone}`}
                                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                      <Phone className="h-3 w-3" />
                                      {contact.phone}
                                    </a>
                                  )}
                                  {contact.email && (
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                      <Mail className="h-3 w-3" />
                                      {contact.email}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {links.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-3">
                          <LinkIcon className="h-4 w-4 text-green-500" />
                          Links Úteis
                        </h4>
                        <div className="grid gap-2">
                          {links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                            >
                              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <LinkIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate group-hover:text-primary">
                                  {link.title}
                                </p>
                                {link.description && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {link.description}
                                  </p>
                                )}
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Passos */}
                    {steps.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-3">
                          <ListOrdered className="h-4 w-4 text-orange-500" />
                          Procedimento
                        </h4>
                        <div className="space-y-2">
                          {steps
                            .sort((a, b) => a.order - b.order)
                            .map((step, idx) => (
                              <div
                                key={idx}
                                className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-orange-600 dark:text-orange-300">
                                    {step.order}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{step.title}</p>
                                  {step.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {step.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              {editingWorkflow ? "Editar Fluxo" : "Novo Fluxo"}
            </DialogTitle>
            <DialogDescription>
              {editingWorkflow
                ? "Atualize as informações do fluxo"
                : "Crie um novo fluxo com contatos, links e procedimentos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Ex: Conversa sobre Negocial"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Uma breve descrição do fluxo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <div className="flex gap-2 flex-wrap">
                  {categoriasPreDefinidas.map((cat) => (
                    <Button
                      key={cat.nome}
                      type="button"
                      variant={formData.category === cat.nome ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          category: formData.category === cat.nome ? "" : cat.nome,
                        })
                      }
                      className={cn(formData.category === cat.nome && cat.cor)}
                    >
                      <span className={cn("h-2 w-2 rounded-full mr-1.5", cat.cor)} />
                      {cat.nome}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seção de Contatos */}
            <div className="border rounded-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
                onClick={() =>
                  setExpandedSections({ ...expandedSections, contacts: !expandedSections.contacts })
                }
              >
                <span className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Contatos ({formData.contacts.length})
                </span>
                {expandedSections.contacts ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.contacts && (
                <div className="p-4 pt-0 space-y-3">
                  {formData.contacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{contact.name}</span>
                        {contact.role && (
                          <span className="text-muted-foreground"> - {contact.role}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeContact(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Nome *"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <Input
                      placeholder="Cargo/Função"
                      value={newContact.role}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    />
                    <Input
                      placeholder="Telefone"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                    <Input
                      placeholder="E-mail"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addContact}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Contato
                  </Button>
                </div>
              )}
            </div>

            {/* Seção de Links */}
            <div className="border rounded-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
                onClick={() =>
                  setExpandedSections({ ...expandedSections, links: !expandedSections.links })
                }
              >
                <span className="font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-green-500" />
                  Links ({formData.links.length})
                </span>
                {expandedSections.links ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.links && (
                <div className="p-4 pt-0 space-y-3">
                  {formData.links.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 truncate">
                        <span className="font-medium">{link.title}</span>
                        <span className="text-muted-foreground text-sm ml-2">{link.url}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeLink(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid gap-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Título do link *"
                        value={newLink.title}
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      />
                      <Input
                        placeholder="URL *"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      />
                    </div>
                    <Input
                      placeholder="Descrição (opcional)"
                      value={newLink.description}
                      onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addLink}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Link
                  </Button>
                </div>
              )}
            </div>

            {/* Seção de Passos */}
            <div className="border rounded-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
                onClick={() =>
                  setExpandedSections({ ...expandedSections, steps: !expandedSections.steps })
                }
              >
                <span className="font-medium flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-orange-500" />
                  Procedimento ({formData.steps.length} passos)
                </span>
                {expandedSections.steps ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.steps && (
                <div className="p-4 pt-0 space-y-3">
                  {formData.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                    >
                      <span className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-300">
                        {step.order}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{step.title}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeStep(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid gap-2">
                    <Input
                      placeholder="Título do passo *"
                      value={newStep.title}
                      onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Descrição detalhada (opcional)"
                      value={newStep.description}
                      onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Passo
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : editingWorkflow
                ? "Salvar Alterações"
                : "Criar Fluxo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
