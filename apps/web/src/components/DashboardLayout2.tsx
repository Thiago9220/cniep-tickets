import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BarChart3, BookText, Calendar, LayoutDashboard, Menu, TicketIcon, Bell, FolderOpen, User, LogOut, Settings, Moon, Sun, Shield, Kanban, GitBranch } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLembretesCount } from "@/hooks/useLembretes";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const lembretesCount = useLembretesCount();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Painel de Chamados", href: "/dashboard", icon: TicketIcon },
    { name: "Semanal", href: "/weekly", icon: Calendar },
    { name: "Mensal", href: "/monthly", icon: BarChart3 },
    { name: "Kanban", href: "/kanban", icon: Kanban },
    { name: "Guia de Atendimento", href: "/guide", icon: BookText },
    { name: "Meus Arquivos", href: "/docs", icon: FolderOpen },
    {
      name: "Lembretes",
      href: "/reminders",
      icon: Bell,
      badge:
        lembretesCount.atrasados > 0
          ? lembretesCount.atrasados
          : lembretesCount.urgentes > 0
          ? lembretesCount.urgentes
          : lembretesCount.pendentes,
      badgeColor:
        lembretesCount.atrasados > 0
          ? "bg-red-500"
          : lembretesCount.urgentes > 0
          ? "bg-red-500"
          : "bg-orange-500",
    },
    { name: "Fluxos", href: "/workflows", icon: GitBranch },
  ] as const;

  const adminNavItems = [
    { name: "Gerenciar Usuários", href: "/admin/users", icon: Shield },
  ];

  const envRaw = (import.meta as any).env?.VITE_APP_ENV || (import.meta as any).env?.MODE || "dev";
  const env = String(envRaw).toLowerCase();
  const envLabel = env.includes("prod")
    ? "Producao"
    : env.includes("staging") || env.includes("homolog")
    ? "Homologacao"
    : "Desenvolvimento";
  const envColor = env.includes("prod")
    ? "bg-emerald-500"
    : env.includes("staging") || env.includes("homolog")
    ? "bg-amber-500"
    : "bg-slate-500";

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                user?.avatar
                  ? user.avatar.startsWith("http")
                    ? user.avatar
                    : (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
                        .replace(/\/$/, "")
                        .replace(/\/api$/, "") + user.avatar
                  : undefined
              }
              alt={user?.name || "Avatar"}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user?.name || user?.email?.split("@")[0] || "Usuario"}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user?.name || "Usuario"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo-cniep.png" alt="CNIEP" className="h-10 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Alternar tema"
            onClick={() => toggleTheme?.()}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Gestao de Chamados GLPI - CNIEP</p>
        <div className="mt-2">
          <span className={cn("inline-flex items-center gap-2 text-xs text-white px-2 py-0.5 rounded-md", envColor)}>
            Ambiente: {envLabel}
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 relative",
                  location === item.href && "bg-secondary text-secondary-foreground font-medium"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {"badge" in item && (item as any).badge > 0 && (
                  <span
                    className={cn(
                      "absolute right-2 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                      (item as any).badgeColor
                    )}
                  >
                    {(item as any).badge}
                  </span>
                )}
              </Button>
            </Link>
          ))}

          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </div>
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 relative",
                      location === item.href && "bg-secondary text-secondary-foreground font-medium"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>
      <div className="px-4 mt-auto pt-4 border-t space-y-3">
        <div className="px-2">
          <Badge variant="secondary">Perfil: {user?.isAdmin ? "Administrador" : "Usuario"}</Badge>
        </div>
        <UserMenu />
        <div className="flex gap-2 px-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-start gap-2"
            onClick={() => setLocation("/profile")}
          >
            <User className="h-4 w-4" />
            Meu Perfil
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 justify-start gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card fixed inset-y-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 flex items-center px-4 justify-between gap-2">
        <img src="/logo-cniep.png" alt="CNIEP" className="h-8 w-auto" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          onClick={() => toggleTheme?.()}
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="container py-6 md:py-10 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}

