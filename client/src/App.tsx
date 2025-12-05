import { DashboardLayout } from "@/components/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MonthlyReport from "./pages/MonthlyReport";
import QuarterlyReport from "./pages/QuarterlyReport";
import WeeklyReport from "./pages/WeeklyReport";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/weekly" component={WeeklyReport} />
        <Route path="/monthly" component={MonthlyReport} />
        <Route path="/quarterly" component={QuarterlyReport} />
        <Route path="/docs" component={() => <div className="p-4">Documentação em construção...</div>} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
