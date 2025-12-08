import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BarChart3, Calendar, LayoutDashboard, Menu, PieChart } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: "Visão Geral", href: "/", icon: LayoutDashboard },
    { name: "Relatório Semanal", href: "/weekly", icon: Calendar },
    { name: "Relatório Mensal", href: "/monthly", icon: BarChart3 },
    { name: "Relatório Trimestral", href: "/quarterly", icon: PieChart },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <img src="/logo-cniep.png" alt="CNIEP" className="h-10 w-auto" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Métricas de Atendimento GLPI</p>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  location === item.href && "bg-secondary text-secondary-foreground font-medium"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="px-6 mt-auto pt-4 border-t">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          GLPI: Online
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          JIRA: Online
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 flex items-center px-4 justify-between">
        <img src="/logo-cniep.png" alt="CNIEP" className="h-8 w-auto" />
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
