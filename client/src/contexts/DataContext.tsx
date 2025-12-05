import { monthlyDataByMonth, quarterlyData as defaultQuarterly, weeklyData as defaultWeekly } from "@/lib/data";
import React, { createContext, useContext, useEffect, useState } from "react";

// Tipos de dados (reaproveitando a estrutura do lib/data.ts mas tornando-a editável)
export type WeeklyData = typeof defaultWeekly;
export type MonthlyData = typeof monthlyDataByMonth['2025-11'];
export type QuarterlyData = typeof defaultQuarterly;

interface DataContextType {
  weeklyData: WeeklyData;
  monthlyData: MonthlyData;
  quarterlyData: QuarterlyData;
  selectedMonth: string;
  updateWeeklyData: (data: WeeklyData) => void;
  updateMonthlyData: (data: MonthlyData) => void;
  updateQuarterlyData: (data: QuarterlyData) => void;
  setSelectedMonth: (month: string) => void;
  resetToDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Mês selecionado (padrão: novembro 2025)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem("selectedMonth");
    return saved || "2025-11";
  });

  // Inicializa o estado com dados do localStorage ou defaults
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(() => {
    const saved = localStorage.getItem("weeklyData");
    return saved ? JSON.parse(saved) : defaultWeekly;
  });

  const [monthlyDataStore, setMonthlyDataStore] = useState<Record<string, MonthlyData>>(() => {
    const saved = localStorage.getItem("monthlyDataStore");
    return saved ? JSON.parse(saved) : monthlyDataByMonth;
  });

  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData>(() => {
    const saved = localStorage.getItem("quarterlyData");
    return saved ? JSON.parse(saved) : defaultQuarterly;
  });

  // Dados do mês atual selecionado
  const monthlyData = monthlyDataStore[selectedMonth] || monthlyDataByMonth[selectedMonth];

  // Persiste mudanças no localStorage
  useEffect(() => {
    localStorage.setItem("weeklyData", JSON.stringify(weeklyData));
  }, [weeklyData]);

  useEffect(() => {
    localStorage.setItem("monthlyDataStore", JSON.stringify(monthlyDataStore));
  }, [monthlyDataStore]);

  useEffect(() => {
    localStorage.setItem("quarterlyData", JSON.stringify(quarterlyData));
  }, [quarterlyData]);

  useEffect(() => {
    localStorage.setItem("selectedMonth", selectedMonth);
  }, [selectedMonth]);

  const updateWeeklyData = (data: WeeklyData) => setWeeklyData(data);

  const updateMonthlyData = (data: MonthlyData) => {
    setMonthlyDataStore(prev => ({
      ...prev,
      [selectedMonth]: data
    }));
  };

  const updateQuarterlyData = (data: QuarterlyData) => setQuarterlyData(data);

  const resetToDefaults = () => {
    setWeeklyData(defaultWeekly);
    setMonthlyDataStore(monthlyDataByMonth);
    setQuarterlyData(defaultQuarterly);
    setSelectedMonth("2025-11");
  };

  return (
    <DataContext.Provider
      value={{
        weeklyData,
        monthlyData,
        quarterlyData,
        selectedMonth,
        updateWeeklyData,
        updateMonthlyData,
        updateQuarterlyData,
        setSelectedMonth,
        resetToDefaults,
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
