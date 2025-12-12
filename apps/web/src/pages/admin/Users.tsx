import { useState, useEffect } from "react";
import { useAuth, getAuthToken } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Shield, ShieldAlert, User as UserIcon, Lock, UserPlus, Eye, EyeOff, Trash2, Kanban } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Lista de super admins (deve bater com o backend)
const SUPER_ADMIN_EMAILS = [
  "thiago.ramos.pro@gmail.com",
];

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  canEditKanban: boolean;
  provider: string | null;
  createdAt: string;
  _count?: {
    documents: number;
  };
}

export default function Users() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Estados para criar novo usuário
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "user" as "user" | "admin",
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (!isAuthLoading && user && !user.isAdmin) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      setLocation("/dashboard");
      return;
    }

    if (isAuthenticated && user?.isAdmin) {
      fetchUsers();
    }
  }, [user, isAuthenticated, isAuthLoading, setLocation]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const response = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao carregar lista de usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const token = getAuthToken();
      await api.patch(`/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success("Permissão atualizada com sucesso");
    } catch (error: any) {
      console.error("Erro ao atualizar permissão:", error);
      const message = error.response?.data?.error || "Erro ao atualizar permissão";
      toast.error(message);
    }
  };

  const isSuperAdmin = (email: string) => SUPER_ADMIN_EMAILS.includes(email);

  const handleKanbanPermissionChange = async (userId: number, canEditKanban: boolean) => {
    try {
      const token = getAuthToken();
      await api.patch(`/users/${userId}/kanban-permission`,
        { canEditKanban },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(users.map(u =>
        u.id === userId ? { ...u, canEditKanban } : u
      ));

      toast.success(canEditKanban ? "Permissão de edição do Kanban concedida" : "Permissão de edição do Kanban removida");
    } catch (error: any) {
      console.error("Erro ao atualizar permissão do kanban:", error);
      const message = error.response?.data?.error || "Erro ao atualizar permissão";
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = getAuthToken();
      await api.delete(`/auth/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.filter(u => u.id !== userId));
      toast.success("Usuário deletado com sucesso");
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error);
      const message = error.response?.data?.error || "Erro ao deletar usuário";
      toast.error(message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.password) {
      toast.error("Email e senha são obrigatórios");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setIsCreating(true);
      const token = getAuthToken();
      const response = await api.post("/auth/admin/create-user", newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Adiciona o novo usuário na lista
      setUsers([response.data.user, ...users]);

      toast.success("Usuário criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewUser({ email: "", password: "", name: "", role: "user" });
      setShowPassword(false);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      const message = error.response?.data?.error || "Erro ao criar usuário";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isAuthLoading || (isAuthenticated && user?.isAdmin && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Controle de acesso e permissões dos usuários do sistema
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar uma nova conta de acesso ao sistema.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome do usuário"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "user" | "admin") => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span>Usuário</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-primary" />
                          <span>Administrador</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Lista de Usuários</CardTitle>
          </div>
          <CardDescription>
            Visualize e gerencie os papéis de cada usuário ({users.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-center">Editar Kanban</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSuper = isSuperAdmin(u.email);
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={u.avatar || undefined} />
                            <AvatarFallback>{u.name?.charAt(0) || u.email.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{u.name || "Sem nome"}</span>
                              {isSuper && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500 text-amber-600 bg-amber-50 gap-1">
                                        <Shield className="h-2 w-2" />
                                        SUPER
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Super Administrador (Protegido)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                            {u.provider && (
                              <span className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                                Via {u.provider}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {u._count?.documents || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-[140px]">
                          {isSuper ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md bg-muted/50 cursor-not-allowed">
                              <Lock className="h-3 w-3" />
                              <span>Admin</span>
                            </div>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(value) => handleRoleChange(u.id, value)}
                              disabled={user?.id === u.id} // Impede alterar o próprio papel
                            >
                              <SelectTrigger className={u.role === "admin" ? "border-primary/50 bg-primary/5" : ""}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Usuário</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-primary" />
                                    <span>Admin</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isSuper || u.role === "admin" ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center justify-center">
                                  <Kanban className="h-4 w-4 text-green-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Administradores já têm acesso total</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Switch
                            checked={u.canEditKanban}
                            onCheckedChange={(checked) => handleKanbanPermissionChange(u.id, checked)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {!isSuper && user?.id !== u.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar usuário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar o usuário <strong>{u.name || u.email}</strong>?
                                  Esta ação não pode ser desfeita e todos os dados do usuário serão removidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
