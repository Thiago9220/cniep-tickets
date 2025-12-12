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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Pencil,
  GitBranch,
  User,
  Link as LinkIcon,
  MessageCircleQuestion,
  Play,
  Phone,
  Mail,
  ExternalLink,
  Search,
  X,
  ArrowRight,
  CheckCircle,
  RotateCcw,
  Zap,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  workflowsApi,
  type Workflow,
  type WorkflowNode,
  type WorkflowNodeType,
  type WorkflowNodeOption,
  type WorkflowNodeQuestion,
  type WorkflowNodeContact,
  type WorkflowNodeLink,
  type WorkflowNodeAction,
  type WorkflowNodeEnd,
} from "@/lib/api";
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

const nodeTypeConfig: Record<WorkflowNodeType, { label: string; icon: any; color: string }> = {
  question: { label: "Pergunta", icon: MessageCircleQuestion, color: "bg-blue-500" },
  contact: { label: "Contato", icon: User, color: "bg-green-500" },
  link: { label: "Link", icon: LinkIcon, color: "bg-purple-500" },
  action: { label: "Ação", icon: Zap, color: "bg-orange-500" },
  end: { label: "Fim", icon: Flag, color: "bg-gray-500" },
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

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

  // Estado para visualização do fluxograma
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);

  // Estados do formulário
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    nodes: [] as WorkflowNode[],
    startNodeId: "",
  });

  // Estado para adicionar/editar nó
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState({
    type: "question" as WorkflowNodeType,
    title: "",
    // Question
    options: [{ label: "", targetNodeId: "" }] as WorkflowNodeOption[],
    // Contact
    contactName: "",
    contactRole: "",
    contactPhone: "",
    contactEmail: "",
    // Link
    linkUrl: "",
    linkDescription: "",
    // Action
    actionDescription: "",
    // End
    endMessage: "",
  });

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
      nodes: [],
      startNodeId: "",
    });
    setEditingWorkflow(null);
  };

  const resetNodeForm = () => {
    setNodeForm({
      type: "question",
      title: "",
      options: [{ label: "", targetNodeId: "" }],
      contactName: "",
      contactRole: "",
      contactPhone: "",
      contactEmail: "",
      linkUrl: "",
      linkDescription: "",
      actionDescription: "",
      endMessage: "",
    });
    setEditingNode(null);
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
      nodes: workflow.nodes || [],
      startNodeId: workflow.startNodeId || "",
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
        nodes: formData.nodes.length > 0 ? formData.nodes : undefined,
        startNodeId: formData.startNodeId || undefined,
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

  // Funções para gerenciar nós
  const openAddNodeDialog = () => {
    resetNodeForm();
    setIsNodeDialogOpen(true);
  };

  const openEditNodeDialog = (node: WorkflowNode) => {
    setEditingNode(node);
    const content = node.content as any;
    setNodeForm({
      type: node.type,
      title: node.title,
      options: node.type === "question" ? (content.options || [{ label: "", targetNodeId: "" }]) : [{ label: "", targetNodeId: "" }],
      contactName: node.type === "contact" ? content.name || "" : "",
      contactRole: node.type === "contact" ? content.role || "" : "",
      contactPhone: node.type === "contact" ? content.phone || "" : "",
      contactEmail: node.type === "contact" ? content.email || "" : "",
      linkUrl: node.type === "link" ? content.url || "" : "",
      linkDescription: node.type === "link" ? content.description || "" : "",
      actionDescription: node.type === "action" ? content.description || "" : "",
      endMessage: node.type === "end" ? content.message || "" : "",
    });
    setIsNodeDialogOpen(true);
  };

  const saveNode = () => {
    if (!nodeForm.title.trim()) {
      toast.error("Digite um título para o nó");
      return;
    }

    let content: any;
    switch (nodeForm.type) {
      case "question":
        const validOptions = nodeForm.options.filter(o => o.label.trim());
        if (validOptions.length === 0) {
          toast.error("Adicione pelo menos uma opção");
          return;
        }
        content = { options: validOptions };
        break;
      case "contact":
        if (!nodeForm.contactName.trim()) {
          toast.error("Digite o nome do contato");
          return;
        }
        content = {
          name: nodeForm.contactName,
          role: nodeForm.contactRole || undefined,
          phone: nodeForm.contactPhone || undefined,
          email: nodeForm.contactEmail || undefined,
        };
        break;
      case "link":
        if (!nodeForm.linkUrl.trim()) {
          toast.error("Digite a URL do link");
          return;
        }
        content = {
          url: nodeForm.linkUrl,
          description: nodeForm.linkDescription || undefined,
        };
        break;
      case "action":
        content = { description: nodeForm.actionDescription || "" };
        break;
      case "end":
        content = { message: nodeForm.endMessage || undefined };
        break;
    }

    const node: WorkflowNode = {
      id: editingNode?.id || generateId(),
      type: nodeForm.type,
      title: nodeForm.title,
      content,
    };

    if (editingNode) {
      setFormData({
        ...formData,
        nodes: formData.nodes.map((n) => (n.id === node.id ? node : n)),
      });
    } else {
      const newNodes = [...formData.nodes, node];
      setFormData({
        ...formData,
        nodes: newNodes,
        startNodeId: formData.startNodeId || node.id,
      });
    }

    setIsNodeDialogOpen(false);
    resetNodeForm();
  };

  const deleteNode = (nodeId: string) => {
    const newNodes = formData.nodes.filter((n) => n.id !== nodeId);
    // Limpar referências a este nó nas opções de perguntas
    const cleanedNodes = newNodes.map((n) => {
      if (n.type === "question") {
        const content = n.content as WorkflowNodeQuestion;
        return {
          ...n,
          content: {
            options: content.options.filter((o) => o.targetNodeId !== nodeId),
          },
        };
      }
      return n;
    });
    setFormData({
      ...formData,
      nodes: cleanedNodes,
      startNodeId: formData.startNodeId === nodeId ? (cleanedNodes[0]?.id || "") : formData.startNodeId,
    });
  };

  const addOption = () => {
    setNodeForm({
      ...nodeForm,
      options: [...nodeForm.options, { label: "", targetNodeId: "" }],
    });
  };

  const removeOption = (index: number) => {
    setNodeForm({
      ...nodeForm,
      options: nodeForm.options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, field: "label" | "targetNodeId", value: string) => {
    const newOptions = [...nodeForm.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setNodeForm({ ...nodeForm, options: newOptions });
  };

  // Funções para visualização do fluxograma
  const startViewing = (workflow: Workflow) => {
    setViewingWorkflow(workflow);
    setCurrentNodeId(workflow.startNodeId || null);
    setVisitedNodes([]);
  };

  const selectOption = (targetNodeId: string) => {
    if (currentNodeId) {
      setVisitedNodes([...visitedNodes, currentNodeId]);
    }
    setCurrentNodeId(targetNodeId);
  };

  const goBack = () => {
    if (visitedNodes.length > 0) {
      const newVisited = [...visitedNodes];
      const previousNodeId = newVisited.pop();
      setVisitedNodes(newVisited);
      setCurrentNodeId(previousNodeId || null);
    }
  };

  const restartFlow = () => {
    setCurrentNodeId(viewingWorkflow?.startNodeId || null);
    setVisitedNodes([]);
  };

  const closeViewing = () => {
    setViewingWorkflow(null);
    setCurrentNodeId(null);
    setVisitedNodes([]);
  };

  const getCurrentNode = (): WorkflowNode | null => {
    if (!viewingWorkflow?.nodes || !currentNodeId) return null;
    return viewingWorkflow.nodes.find((n) => n.id === currentNodeId) || null;
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

  // Renderizar nó na visualização
  const renderNodeContent = (node: WorkflowNode) => {
    const config = nodeTypeConfig[node.type];
    const Icon = config.icon;
    const content = node.content as any;

    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("p-2 rounded-lg", config.color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <Badge variant="outline">{config.label}</Badge>
          </div>
          <CardTitle className="text-xl">{node.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {node.type === "question" && (
            <div className="space-y-2">
              {(content as WorkflowNodeQuestion).options.map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-3"
                  onClick={() => option.targetNodeId && selectOption(option.targetNodeId)}
                  disabled={!option.targetNodeId}
                >
                  {option.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>
          )}

          {node.type === "contact" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{(content as WorkflowNodeContact).name}</p>
                  {(content as WorkflowNodeContact).role && (
                    <p className="text-sm text-muted-foreground">{(content as WorkflowNodeContact).role}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(content as WorkflowNodeContact).phone && (
                  <a
                    href={`tel:${(content as WorkflowNodeContact).phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {(content as WorkflowNodeContact).phone}
                  </a>
                )}
                {(content as WorkflowNodeContact).email && (
                  <a
                    href={`mailto:${(content as WorkflowNodeContact).email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {(content as WorkflowNodeContact).email}
                  </a>
                )}
              </div>
            </div>
          )}

          {node.type === "link" && (
            <a
              href={(content as WorkflowNodeLink).url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Abrir Link</p>
                {(content as WorkflowNodeLink).description && (
                  <p className="text-sm text-muted-foreground">{(content as WorkflowNodeLink).description}</p>
                )}
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </a>
          )}

          {node.type === "action" && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-orange-800 dark:text-orange-200">
                {(content as WorkflowNodeAction).description || "Execute esta ação"}
              </p>
            </div>
          )}

          {node.type === "end" && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {(content as WorkflowNodeEnd).message || "Fim do fluxo"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Modal de visualização do fluxograma
  if (viewingWorkflow) {
    const currentNode = getCurrentNode();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{viewingWorkflow.title}</h2>
            {viewingWorkflow.description && (
              <p className="text-muted-foreground">{viewingWorkflow.description}</p>
            )}
          </div>
          <Button variant="outline" onClick={closeViewing}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>

        {/* Barra de progresso/navegação */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={visitedNodes.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground">
            Passo {visitedNodes.length + 1}
          </span>
          <Button variant="outline" size="sm" onClick={restartFlow}>
            <Play className="h-4 w-4 mr-1" />
            Reiniciar
          </Button>
        </div>

        {/* Nó atual */}
        {currentNode ? (
          renderNodeContent(currentNode)
        ) : (
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Este fluxo não tem nós configurados.</p>
              <Button
                variant="link"
                onClick={() => {
                  closeViewing();
                  openEditDialog(viewingWorkflow);
                }}
              >
                Clique aqui para editar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fluxos de Decisão</h2>
          <p className="text-muted-foreground">
            Crie fluxogramas interativos para guiar procedimentos.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fluxos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filtroCategoria === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroCategoria("")}
          >
            Todas
          </Button>
          {categoriasPreDefinidas.map((cat) => (
            <Button
              key={cat.nome}
              variant={filtroCategoria === cat.nome ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroCategoria(filtroCategoria === cat.nome ? "" : cat.nome)}
              className={cn(filtroCategoria === cat.nome && cat.cor)}
            >
              {cat.nome}
            </Button>
          ))}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((workflow) => {
            const catConfig = getCategoriaConfig(workflow.category);
            const nodeCount = workflow.nodes?.length || 0;

            return (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.title}</CardTitle>
                      {workflow.description && (
                        <CardDescription className="mt-1">{workflow.description}</CardDescription>
                      )}
                    </div>
                    {catConfig && (
                      <Badge className={cn("text-white", catConfig.cor)}>
                        {catConfig.nome}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <GitBranch className="h-4 w-4" />
                    {nodeCount} {nodeCount === 1 ? "nó" : "nós"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => startViewing(workflow)}
                      disabled={nodeCount === 0}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(workflow)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de criação/edição do workflow */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Editar Fluxo" : "Novo Fluxo de Decisão"}
            </DialogTitle>
            <DialogDescription>
              Crie um fluxograma interativo com perguntas, contatos e links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info básica */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Ex: Atendimento Negocial"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição do fluxo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Lista de nós */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Nós do Fluxograma</label>
                <Button variant="outline" size="sm" onClick={openAddNodeDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Nó
                </Button>
              </div>

              {formData.nodes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <GitBranch className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum nó adicionado</p>
                  <Button variant="link" size="sm" onClick={openAddNodeDialog}>
                    Adicionar primeiro nó
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.nodes.map((node) => {
                    const config = nodeTypeConfig[node.type];
                    const Icon = config.icon;
                    const isStart = formData.startNodeId === node.id;

                    return (
                      <div
                        key={node.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          isStart && "border-primary bg-primary/5"
                        )}
                      >
                        <div className={cn("p-2 rounded", config.color)}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{node.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {isStart && (
                              <Badge variant="default" className="text-xs">
                                Início
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isStart && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, startNodeId: node.id })}
                              title="Definir como início"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditNodeDialog(node)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteNode(node.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : editingWorkflow ? "Salvar" : "Criar Fluxo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de criação/edição de nó */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNode ? "Editar Nó" : "Adicionar Nó"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo do Nó</label>
              <Select
                value={nodeForm.type}
                onValueChange={(v) => setNodeForm({ ...nodeForm, type: v as WorkflowNodeType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(nodeTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                placeholder="Ex: É problema negocial?"
                value={nodeForm.title}
                onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
              />
            </div>

            {/* Campos específicos por tipo */}
            {nodeForm.type === "question" && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Opções de Resposta</label>
                {nodeForm.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Ex: Sim"
                      value={option.label}
                      onChange={(e) => updateOption(idx, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={option.targetNodeId}
                      onValueChange={(v) => updateOption(idx, "targetNodeId", v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Vai para..." />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.nodes
                          .filter((n) => n.id !== editingNode?.id)
                          .map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {nodeForm.options.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Opção
                </Button>
              </div>
            )}

            {nodeForm.type === "contact" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    placeholder="Nome do contato"
                    value={nodeForm.contactName}
                    onChange={(e) => setNodeForm({ ...nodeForm, contactName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cargo/Função</label>
                  <Input
                    placeholder="Ex: Analista Negocial"
                    value={nodeForm.contactRole}
                    onChange={(e) => setNodeForm({ ...nodeForm, contactRole: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      placeholder="(61) 99999-9999"
                      value={nodeForm.contactPhone}
                      onChange={(e) => setNodeForm({ ...nodeForm, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail</label>
                    <Input
                      placeholder="email@cnj.jus.br"
                      value={nodeForm.contactEmail}
                      onChange={(e) => setNodeForm({ ...nodeForm, contactEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {nodeForm.type === "link" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL *</label>
                  <Input
                    placeholder="https://..."
                    value={nodeForm.linkUrl}
                    onChange={(e) => setNodeForm({ ...nodeForm, linkUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    placeholder="Descrição do link"
                    value={nodeForm.linkDescription}
                    onChange={(e) => setNodeForm({ ...nodeForm, linkDescription: e.target.value })}
                  />
                </div>
              </div>
            )}

            {nodeForm.type === "action" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição da Ação</label>
                <Textarea
                  placeholder="Descreva a ação a ser tomada..."
                  value={nodeForm.actionDescription}
                  onChange={(e) => setNodeForm({ ...nodeForm, actionDescription: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            {nodeForm.type === "end" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem Final</label>
                <Input
                  placeholder="Ex: Fluxo concluído com sucesso!"
                  value={nodeForm.endMessage}
                  onChange={(e) => setNodeForm({ ...nodeForm, endMessage: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNodeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveNode}>
              {editingNode ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
