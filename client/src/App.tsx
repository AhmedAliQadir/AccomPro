import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PropertiesPage from "@/pages/properties";
import PropertyDetailPage from "@/pages/property-detail";
import TenantsPage from "@/pages/tenants";
import TenantDetailPage from "@/pages/tenant-detail";
import TenantOnboardingPage from "@/pages/tenant-onboarding";
import RoomsPage from "@/pages/rooms";
import ReportsPage from "@/pages/reports";
import IncidentsPage from "@/pages/incidents";
import StaffPage from "@/pages/staff";
import CompliancePage from "@/pages/compliance";
import SupportNotesPage from "@/pages/support-notes";
import OrganizationSettingsPage from "@/pages/organization-settings";
import OrganizationsPage from "@/pages/organizations";
import NotFound from "@/pages/not-found";

function ProtectedRoutes() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <RequireAuth>
      <SidebarProvider style={style as React.CSSProperties}>
        <AppLayout>
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/organizations" component={OrganizationsPage} />
            <Route path="/tenants/new" component={TenantOnboardingPage} />
            <Route path="/tenants/:id" component={TenantDetailPage} />
            <Route path="/tenants" component={TenantsPage} />
            <Route path="/properties/:id" component={PropertyDetailPage} />
            <Route path="/properties" component={PropertiesPage} />
            <Route path="/rooms" component={RoomsPage} />
            <Route path="/staff" component={StaffPage} />
            <Route path="/incidents" component={IncidentsPage} />
            <Route path="/compliance" component={CompliancePage} />
            <Route path="/support-notes" component={SupportNotesPage} />
            <Route path="/organization-settings" component={OrganizationSettingsPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </SidebarProvider>
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
