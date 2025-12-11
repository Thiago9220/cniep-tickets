import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Lembrete {
  id: string;
  titulo: string;
  descricao: string;
  concluido: boolean;
  criadoEm: string;
  dataEntrega?: string;
  recorrente?: boolean;
  ultimaConclusao?: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
}

export function useLembretesCount() {
  const [counts, setCounts] = useState({
    pendentes: 0,
    atrasados: 0,
    urgentes: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    const calcularCounts = () => {
      const storageKey = user ? `lembretes:${user.id}` : "lembretes";
      const lembretesStorage = localStorage.getItem(storageKey);
      if (!lembretesStorage) {
        setCounts({ pendentes: 0, atrasados: 0, urgentes: 0 });
        return;
      }

      const lembretes: Lembrete[] = JSON.parse(lembretesStorage);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Resetar recorrentes do dia anterior
      const lembretesAtualizados = lembretes.map((l) => {
        const hojeStr = new Date().toLocaleDateString("pt-BR");
        if (l.recorrente && l.concluido && l.ultimaConclusao !== hojeStr) {
          return { ...l, concluido: false };
        }
        return l;
      });

      const pendentes = lembretesAtualizados.filter((l) => !l.concluido);

      const atrasados = pendentes.filter((l) => {
        if (!l.dataEntrega) return false;
        const entrega = new Date(l.dataEntrega + "T00:00:00");
        return entrega < hoje;
      });

      const urgentes = pendentes.filter((l) => l.prioridade === "urgente");

      setCounts({
        pendentes: pendentes.length,
        atrasados: atrasados.length,
        urgentes: urgentes.length,
      });
    };

    // Calcular na montagem
    calcularCounts();

    // Escutar mudanças no localStorage
    const handleStorage = (e: StorageEvent) => {
      const storageKey = user ? `lembretes:${user.id}` : "lembretes";
      if (e.key === storageKey) {
        calcularCounts();
      }
    };

    // Também escutar um evento customizado para mudanças na mesma aba
    const handleCustomEvent = () => calcularCounts();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("lembretes-updated", handleCustomEvent);

    // Verificar periodicamente (para pegar mudanças na mesma aba)
    const interval = setInterval(calcularCounts, 2000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("lembretes-updated", handleCustomEvent);
      clearInterval(interval);
    };
  }, [user?.id]);

  return counts;
}
