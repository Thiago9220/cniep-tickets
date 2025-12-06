import { monthlyDataByMonth, quarterlyData as defaultQuarterly, weeklyData as defaultWeekly } from "@/lib/data";
import { weeklyReportService, type WeeklyReportData } from "@/services/weeklyReportService";
import React, { createContext, useContext, useEffect, useState } from "react";

// Tipos de dados (reaproveitando a estrutura do lib/data.ts mas tornando-a editável)
export type WeeklyData = typeof defaultWeekly;
export type MonthlyData = typeof monthlyDataByMonth['2025-11'];
export type QuarterlyData = typeof defaultQuarterly;

// Função para obter a chave da semana atual (formato: YYYY-WXX)
function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Função para obter o período da semana (formato: DD/MM/YYYY até DD/MM/YYYY)
function getWeekPeriod(weekKey: string): string {
  const [year, weekStr] = weekKey.split('-W');
  const weekNum = parseInt(weekStr);

  // Calcula o primeiro dia da semana (domingo)
  const jan1 = new Date(parseInt(year), 0, 1);
  const daysOffset = (weekNum - 1) * 7 - jan1.getDay();
  const startDate = new Date(parseInt(year), 0, 1 + daysOffset);

  // Calcula o último dia da semana (sábado)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return `${formatDate(startDate)} até ${formatDate(endDate)}`;
}

interface DataContextType {
  weeklyData: WeeklyData;
  monthlyData: MonthlyData;
  quarterlyData: QuarterlyData;
  selectedMonth: string;
  selectedWeek: string;
  availableWeeks: string[];
  isLoading: boolean;
  isSyncing: boolean;
  updateWeeklyData: (data: WeeklyData) => void;
  updateMonthlyData: (data: MonthlyData) => void;
  updateQuarterlyData: (data: QuarterlyData) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedWeek: (week: string) => void;
  resetToDefaults: () => void;
  syncWithDatabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Estados de loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Semana selecionada (padrão: semana atual)
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const saved = localStorage.getItem("selectedWeek");
    return saved || getCurrentWeekKey();
  });

  // Mês selecionado (padrão: novembro 2025)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem("selectedMonth");
    return saved || "2025-11";
  });

  // Store de dados semanais (múltiplas semanas)
  const [weeklyDataStore, setWeeklyDataStore] = useState<Record<string, WeeklyData>>(() => {
    const saved = localStorage.getItem("weeklyDataStore");
    if (saved) {
      return JSON.parse(saved);
    }
    // Inicializa com a semana atual usando dados default
    const currentWeek = getCurrentWeekKey();
    return {
      [currentWeek]: {
        ...defaultWeekly,
        period: getWeekPeriod(currentWeek)
      }
    };
  });

  const [monthlyDataStore, setMonthlyDataStore] = useState<Record<string, MonthlyData>>(() => {
    const saved = localStorage.getItem("monthlyDataStore");
    return saved ? JSON.parse(saved) : monthlyDataByMonth;
  });

  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData>(() => {
    const saved = localStorage.getItem("quarterlyData");
    return saved ? JSON.parse(saved) : defaultQuarterly;
  });

  // Garante que a semana atual sempre exista no store
  useEffect(() => {
    const currentWeek = getCurrentWeekKey();
    if (!weeklyDataStore[currentWeek]) {
      setWeeklyDataStore(prev => ({
        ...prev,
        [currentWeek]: {
          ...defaultWeekly,
          period: getWeekPeriod(currentWeek)
        }
      }));
    }
  }, [weeklyDataStore]);

  // Lista de semanas disponíveis (ordenadas da mais recente para a mais antiga)
  const availableWeeks = Object.keys(weeklyDataStore).sort().reverse();

  // Dados da semana selecionada
  const weeklyData = weeklyDataStore[selectedWeek] || {
    ...defaultWeekly,
    period: getWeekPeriod(selectedWeek)
  };

  // Dados do mês atual selecionado
  const monthlyData = monthlyDataStore[selectedMonth] || monthlyDataByMonth[selectedMonth];

  // Persiste mudanças no localStorage
  useEffect(() => {
    localStorage.setItem("weeklyDataStore", JSON.stringify(weeklyDataStore));
  }, [weeklyDataStore]);

  useEffect(() => {
    localStorage.setItem("selectedWeek", selectedWeek);
  }, [selectedWeek]);

  useEffect(() => {
    localStorage.setItem("monthlyDataStore", JSON.stringify(monthlyDataStore));
  }, [monthlyDataStore]);

  useEffect(() => {
    localStorage.setItem("quarterlyData", JSON.stringify(quarterlyData));
  }, [quarterlyData]);

  useEffect(() => {
    localStorage.setItem("selectedMonth", selectedMonth);
  }, [selectedMonth]);

  const updateWeeklyData = (data: WeeklyData) => {
    setWeeklyDataStore(prev => ({
      ...prev,
      [selectedWeek]: data
    }));

    // Salva no banco em background (híbrido)
    weeklyReportService.saveReportHybrid(
      selectedWeek,
      data.period,
      data as WeeklyReportData
    );
  };

  const updateMonthlyData = (data: MonthlyData) => {
    setMonthlyDataStore(prev => ({
      ...prev,
      [selectedMonth]: data
    }));
  };

  const updateQuarterlyData = (data: QuarterlyData) => setQuarterlyData(data);

  const resetToDefaults = () => {
    const currentWeek = getCurrentWeekKey();
    setWeeklyDataStore({
      [currentWeek]: {
        ...defaultWeekly,
        period: getWeekPeriod(currentWeek)
      }
    });
    setMonthlyDataStore(monthlyDataByMonth);
    setQuarterlyData(defaultQuarterly);
    setSelectedMonth("2025-11");
    setSelectedWeek(currentWeek);
  };

  // Sincroniza dados com o banco de dados
  const syncWithDatabase = async () => {
    setIsSyncing(true);
    try {
      const syncedData = await weeklyReportService.syncWithDatabase(weeklyDataStore);
      setWeeklyDataStore(syncedData);
    } catch (error) {
      console.error('Erro ao sincronizar com banco de dados:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincroniza com o banco ao carregar a aplicação
  useEffect(() => {
    const initialSync = async () => {
      setIsLoading(true);
      try {
        const syncedData = await weeklyReportService.syncWithDatabase(weeklyDataStore);
        setWeeklyDataStore(syncedData);
      } catch (error) {
        console.error('Erro na sincronização inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialSync();
  }, []); // Executa apenas uma vez na montagem

  return (
    <DataContext.Provider
      value={{
        weeklyData,
        monthlyData,
        quarterlyData,
        selectedMonth,
        selectedWeek,
        availableWeeks,
        isLoading,
        isSyncing,
        updateWeeklyData,
        updateMonthlyData,
        updateQuarterlyData,
        setSelectedMonth,
        setSelectedWeek,
        resetToDefaults,
        syncWithDatabase,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
