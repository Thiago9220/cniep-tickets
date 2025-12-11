import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { remindersApi } from "@/lib/api";

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
    let mounted = true;

    const fetchCounts = async () => {
      try {
        if (!user) {
          mounted && setCounts({ pendentes: 0, atrasados: 0, urgentes: 0 });
          return;
        }
        const token = localStorage.getItem("cniep_auth_token");
        if (!token) return;
        const data = await remindersApi.counts(token);
        mounted && setCounts(data);
      } catch (e) {
        // ignore
      }
    };

    fetchCounts();

    const handleCustomEvent = () => fetchCounts();
    window.addEventListener("lembretes-updated", handleCustomEvent);
    const interval = setInterval(fetchCounts, 5000);

    return () => {
      mounted = false;
      window.removeEventListener("lembretes-updated", handleCustomEvent);
      clearInterval(interval);
    };
  }, [user?.id]);

  return counts;
}
