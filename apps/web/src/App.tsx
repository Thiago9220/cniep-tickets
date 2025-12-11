import { DashboardLayout } from "@/components/DashboardLayout2";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import MonthlyReport from "./pages/MonthlyReport";
import KanbanBoard from "./pages/KanbanBoard";
import WeeklyReport from "./pages/WeeklyReport";
import Guide from "./pages/Guide";
import Reminders from "./pages/Reminders";
import Documentation from "./pages/Documentation";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import GoogleCallback from "./pages/auth/GoogleCallback";
import GithubCallback from "./pages/auth/GithubCallback";
import Users from "./pages/admin/Users";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";

function ProtectedRouter() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/weekly" component={WeeklyReport} />
          <Route path="/monthly" component={MonthlyReport} />
          <Route path="/kanban" component={KanbanBoard} />
          <Route path="/guide" component={Guide} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/docs" component={Documentation} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin/users" component={Users} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/auth/google/callback" component={GoogleCallback} />
      <Route path="/auth/github/callback" component={GithubCallback} />
      <Route>
        <ProtectedRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AuthProvider>
          <DataProvider>
            <TooltipProvider>
              <Toaster />
              <AppRouter />
            </TooltipProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
