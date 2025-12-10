import { DashboardLayout } from "@/components/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import MonthlyReport from "./pages/MonthlyReport";
import QuarterlyReport from "./pages/QuarterlyReport";
import WeeklyReport from "./pages/WeeklyReport";
import Guide from "./pages/Guide";
import Reminders from "./pages/Reminders";
import Documentation from "./pages/Documentation";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/weekly" component={WeeklyReport} />
        <Route path="/monthly" component={MonthlyReport} />
        <Route path="/quarterly" component={QuarterlyReport} />
        <Route path="/guide" component={Guide} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/docs" component={Documentation} />
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
