import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function GithubCallback() {
  const [, setLocation] = useLocation();
  const { loginWithGithub } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError("Acesso negado pelo GitHub");
      setTimeout(() => setLocation("/login"), 2000);
      return;
    }

    if (code) {
      handleGithubLogin(code);
    } else {
      setError("Código de autorização não encontrado");
      setTimeout(() => setLocation("/login"), 2000);
    }
  }, []);

  const handleGithubLogin = async (code: string) => {
    try {
      await loginWithGithub(code);
      toast.success("Login com GitHub realizado!");
      setLocation("/");
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao fazer login com GitHub";
      setError(message);
      toast.error(message);
      setTimeout(() => setLocation("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <>
            <p className="text-destructive">{error}</p>
            <p className="text-muted-foreground text-sm">Redirecionando...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processando login com GitHub...</p>
          </>
        )}
      </div>
    </div>
  );
}
