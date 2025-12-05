import { monthlyData as defaultMonthly, quarterlyData as defaultQuarterly, weeklyData as defaultWeekly } from "@/lib/data";
import React, { createContext, useContext, useEffect, useState } from "react";

// Tipos de dados (reaproveitando a estrutura do lib/data.ts mas tornando-a editável)
export type WeeklyData = typeof defaultWeekly;
export type MonthlyData = typeof defaultMonthly;
export type QuarterlyData = typeof defaultQuarterly;

interface DataContextType {
  weeklyData: WeeklyData;
  monthlyData: MonthlyData;
  quarterlyData: QuarterlyData;
  updateWeeklyData: (data: WeeklyData) => void;
  updateMonthlyData: (data: MonthlyData) => void;
  updateQuarterlyData: (data: QuarterlyData) => void;
  resetToDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Inicializa o estado com dados do localStorage ou defaults
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(() => {
    const saved = localStorage.getItem("weeklyData");
    return saved ? JSON.parse(saved) : defaultWeekly;
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData>(() => {
    const saved = localStorage.getItem("monthlyData");
    return saved ? JSON.parse(saved) : defaultMonthly;
  });

  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData>(() => {
    const saved = localStorage.getItem("quarterlyData");
    return saved ? JSON.parse(saved) : defaultQuarterly;
  });

  // Persiste mudanças no localStorage
  useEffect(() => {
    localStorage.setItem("weeklyData", JSON.stringify(weeklyData));
  }, [weeklyData]);

  useEffect(() => {
    localStorage.setItem("monthlyData", JSON.stringify(monthlyData));
  }, [monthlyData]);

  useEffect(() => {
    localStorage.setItem("quarterlyData", JSON.stringify(quarterlyData));
  }, [quarterlyData]);

  const updateWeeklyData = (data: WeeklyData) => setWeeklyData(data);
  const updateMonthlyData = (data: MonthlyData) => setMonthlyData(data);
  const updateQuarterlyData = (data: QuarterlyData) => setQuarterlyData(data);

  const resetToDefaults = () => {
    setWeeklyData(defaultWeekly);
    setMonthlyData(defaultMonthly);
    setQuarterlyData(defaultQuarterly);
  };

  return (
    <DataContext.Provider
      value={{
        weeklyData,
        monthlyData,
        quarterlyData,
        updateWeeklyData,
        updateMonthlyData,
        updateQuarterlyData,
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
