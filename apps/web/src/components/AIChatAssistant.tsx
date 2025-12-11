import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Bot, Copy, Send, Settings, User, X, Loader2, FileText, Trash2, Plus } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api"; // Import the API client
import { getAuthToken } from "@/contexts/AuthContext"; // Import auth token helper

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Manual {
  id: string;
  titulo: string;
  conteudo: string;
  createdAt: string;
}

interface AIChatAssistantProps {
  contextData: string;
}

const SYSTEM_PROMPT = `Você é um assistente especializado em atendimento do CNIEP (Cadastro Nacional de Inspeções em Estabelecimentos Penais) do CNJ (Conselho Nacional de Justiça).

Sua função é auxiliar a equipe de suporte a responder dúvidas e atender solicitações relacionadas ao sistema CNIEP2.

Diretrizes:
- Seja cordial e profissional
- Forneça respostas claras e objetivas
- Quando apropriado, sugira respostas padrão que podem ser copiadas
- Se não souber a resposta, indique que o usuário deve escalar para análise mais detalhada
- Sempre que possível, cite a base de conhecimento fornecida
- Mantenha o tom formal adequado ao serviço público

Base de conhecimento do CNIEP:
`;

export function AIChatAssistant({ contextData }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false); // Keep for manuals tab
  const [manuais, setManuais] = useState<Manual[]>(() => {
    const saved = localStorage.getItem("cniep_manuais");
    return saved ? JSON.parse(saved) : [];
  });
  const [novoManualTitulo, setNovoManualTitulo] = useState("");
  const [novoManualConteudo, setNovoManualConteudo] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const adicionarManual = () => {
    if (!novoManualTitulo.trim() || !novoManualConteudo.trim()) {
      toast.error("Preencha o título e o conteúdo do manual!");
      return;
    }

    const novoManual: Manual = {
      id: crypto.randomUUID(),
      titulo: novoManualTitulo.trim(),
      conteudo: novoManualConteudo.trim(),
      createdAt: new Date().toISOString(),
    };

    const novosManuais = [...manuais, novoManual];
    setManuais(novosManuais);
    localStorage.setItem("cniep_manuais", JSON.stringify(novosManuais));
    setNovoManualTitulo("");
    setNovoManualConteudo("");
    toast.success(`Manual "${novoManual.titulo}" adicionado com sucesso!`);
  };

  const removerManual = (id: string) => {
    const manual = manuais.find((m) => m.id === id);
    const novosManuais = manuais.filter((m) => m.id !== id);
    setManuais(novosManuais);
    localStorage.setItem("cniep_manuais", JSON.stringify(novosManuais));
    toast.success(`Manual "${manual?.titulo}" removido!`);
  };

  const limparTodosManuais = () => {
    setManuais([]);
    localStorage.removeItem("cniep_manuais");
    toast.success("Todos os manuais foram removidos!");
  };

  const getManuaisContext = () => {
    if (manuais.length === 0) return "";
    return manuais
      .map((m) => `### ${m.titulo}\n${m.conteudo}`)
      .join("\n\n---\n\n");
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const token = getAuthToken();
    if (!token) {
      toast.error("Você precisa estar logado para usar o assistente de IA.");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
        .join("\n\n");

      const manuaisContext = getManuaisContext();
      const fullContext = manuaisContext
        ? `${contextData}\n\n---\n\n## Manuais e Documentação Adicional:\n${manuaisContext}`
        : contextData;

      const fullPrompt = `${SYSTEM_PROMPT}${fullContext}

Histórico da conversa:
${conversationHistory}

Usuário: ${userMessage.content}

Assistente:`

      const response = await api.post(
        "/chat/completion",
        {
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const assistantContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).response?.data?.error || (error as Error).message || "Erro desconhecido";
      toast.error(`Erro ao consultar IA: ${errorMessage}`);

      const errorAssistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Desculpe, ocorreu um erro ao processar sua solicitação: ${errorMessage}. Por favor, tente novamente.`, 
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, contextData, manuais]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Resposta copiada!");
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa!");
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Assistente IA CNIEP</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearChat} title="Limpar conversa">
                <X className="h-4 w-4" />
              </Button>
            )}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Configurações (Manuais)"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurações do Assistente</DialogTitle>
                  <DialogDescription>
                    Adicione conteúdo de manuais para o assistente.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="manuais" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="manuais" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Manuais
                      {manuais.length > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                          {manuais.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manuais" className="space-y-4 py-4">
                    {/* Formulário para adicionar novo manual */}
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="manual-titulo">Título do Manual</Label>
                        <Input
                          id="manual-titulo"
                          placeholder="Ex: Manual do CNIEP2, Resolução 593/2024..."
                          value={novoManualTitulo}
                          onChange={(e) => setNovoManualTitulo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-conteudo">Conteúdo</Label>
                        <p className="text-xs text-muted-foreground">
                          Abra o PDF/Word, selecione todo o texto (Ctrl+A) e cole aqui (Ctrl+V).
                        </p>
                        <Textarea
                          id="manual-conteudo"
                          placeholder="Cole aqui o conteúdo do manual..."
                          value={novoManualConteudo}
                          onChange={(e) => setNovoManualConteudo(e.target.value)}
                          className="h-[120px] font-mono text-xs resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          {novoManualConteudo.length.toLocaleString()} caracteres
                        </p>
                      </div>
                      <Button
                        onClick={adicionarManual}
                        disabled={!novoManualTitulo.trim() || !novoManualConteudo.trim()}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Manual
                      </Button>
                    </div>

                    {/* Lista de manuais salvos */}
                    {manuais.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Manuais Salvos ({manuais.length})</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={limparTodosManuais}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Limpar todos
                          </Button>
                        </div>
                        <ScrollArea className="h-[150px]">
                          <div className="space-y-2 pr-4">
                            {manuais.map((manual) => (
                              <div
                                key={manual.id}
                                className="flex items-center justify-between p-3 border rounded-md bg-background"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{manual.titulo}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {manual.conteudo.length.toLocaleString()} caracteres
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removerManual(manual.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground text-center">
                          Total: {manuais.reduce((acc, m) => acc + m.conteudo.length, 0).toLocaleString()} caracteres
                        </p>
                      </div>
                    )}

                    {manuais.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum manual adicionado ainda.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Tire suas dúvidas sobre o CNIEP. O assistente tem acesso às respostas padrão e documentação.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        <ScrollArea className="flex-1 pr-4 overflow-hidden" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  Olá! Sou o chatbot do CNIEP.
                </p>
                <p className="text-xs mt-2">
                  Estou aqui para ajudar a equipe de suporte com dúvidas sobre o sistema CNIEP2 e procedimentos de atendimento.
                </p>
                <p className="text-xs mt-3 text-muted-foreground/70">
                  Digite sua pergunta abaixo para começar.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[85%] group relative overflow-hidden",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words overflow-hidden">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words overflow-hidden">{message.content}</p>
                    )}
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    <span className="text-[10px] opacity-50 mt-1 block">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}