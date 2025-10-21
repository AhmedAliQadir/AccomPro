import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoutes() {
  return (
    <RequireAuth>
      <AppLayout>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/tenants" component={() => <div className="p-8">Tenants Page</div>} />
          <Route path="/properties" component={() => <div className="p-8">Properties Page</div>} />
          <Route path="/rooms" component={() => <div className="p-8">Rooms Page</div>} />
          <Route path="/reports" component={() => <div className="p-8">Reports Page</div>} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </RequireAuth>
  );
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <PublicRoutes />
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
