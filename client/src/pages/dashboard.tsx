import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Home, FileCheck, UserCheck, Clock } from 'lucide-react';
import { useAuth, isPlatformAdmin } from '@/lib/auth';
import AdminDashboard from './admin-dashboard';
import SupportDashboard from './support-dashboard';

interface DashboardStats {
  summary: {
    totalTenants: number;
    activeTenants: number;
    totalProperties: number;
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    activeCases: number;
    pendingDocuments: number;
  };
}

interface OrgData {
  organization: {
    name: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard stats for default dashboard (always call hooks unconditionally)
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/reports/dashboard'],
    enabled: !isPlatformAdmin(user) && user?.role !== 'SUPPORT',
  });

  const { data: orgData } = useQuery<OrgData>({
    queryKey: ['/api/organization'],
    enabled: !isPlatformAdmin(user),
  });

  // Route to role-specific dashboards
  // Platform Admin (Orbixio staff) - sees cross-organization command center
  if (isPlatformAdmin(user)) {
    return <AdminDashboard />;
  }
  
  // Support Workers - see mobile-first task cockpit
  if (user?.role === 'SUPPORT') {
    return <SupportDashboard />;
  }
  
  // Organization Admins, OPS, VIEWER - see organization-scoped dashboard

  const stats = data?.summary;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const orgName = orgData?.organization?.name;
  const firstName = user?.firstName;
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="p-8 space-y-8">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <p className="text-blue-200 text-sm font-medium mb-1">
          {orgName || 'Your Organisation'}
        </p>
        <h1 className="text-3xl font-bold">
          {greeting}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="text-blue-100 mt-1 text-sm">
          Here's an overview of your housing association today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-tenants">
              {stats?.totalTenants || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-tenants">
              {stats?.activeTenants || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-properties">
              {stats?.totalProperties || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-rooms">
              {stats?.totalRooms || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-occupancy">
              {stats?.occupancyRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.occupiedRooms || 0} / {stats?.totalRooms || 0} rooms occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-cases">
              {stats?.activeCases || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending onboarding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-docs">
              {stats?.pendingDocuments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
