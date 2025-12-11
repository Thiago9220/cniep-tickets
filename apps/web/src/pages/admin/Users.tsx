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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, ShieldAlert, User as UserIcon, Lock } from "lucide-react";
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

  if (isAuthLoading || (isAuthenticated && user?.isAdmin && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">
          Controle de acesso e permissões dos usuários do sistema
        </p>
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
