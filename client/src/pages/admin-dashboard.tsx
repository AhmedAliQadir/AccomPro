import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Home,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCog,
  TrendingUp,
} from "lucide-react";
import {
  StatCard,
  QuickActionCard,
  ActivityFeed,
  AlertBanner,
  type ActivityItem,
} from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface AdminDashboardData {
  summary: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalProperties: number;
    totalTenants: number;
    totalIncidents: number;
    totalCompliance: number;
    totalStaff: number;
    criticalIncidents: number;
    overdueCompliance: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    subscriptionTier: string;
    isActive: boolean;
    _count: {
      users: number;
      properties: number;
      residents: number;
      incidents: number;
      compliance: number;
      staff: number;
    };
  }>;
  recentCriticalIncidents: Array<{
    id: string;
    title: string;
    severity: string;
    reportedAt: string;
    resident: {
      firstName: string;
      lastName: string;
    } | null;
    organization: {
      name: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
    organization: {
      name: string;
    };
  }>;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<AdminDashboardData>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, organizations, recentCriticalIncidents, recentActivity } = data;

  // Transform recent activity to ActivityItem format
  const activities: ActivityItem[] = recentActivity.map((activity) => ({
    id: activity.id,
    user: {
      name: `${activity.user.firstName} ${activity.user.lastName}`,
      initials: `${activity.user.firstName[0]}${activity.user.lastName[0]}`,
    },
    action: activity.action,
    details: `${activity.organization.name} • ${activity.entityType}`,
    timestamp: activity.createdAt,
    type: activity.entityType.toLowerCase().includes("incident")
      ? "incident"
      : activity.entityType.toLowerCase().includes("compliance")
        ? "compliance"
        : activity.entityType.toLowerCase().includes("document")
          ? "document"
          : "default",
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Platform Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Cross-organization command center
        </p>
      </div>

      {/* Critical Alerts */}
      {(summary.criticalIncidents > 0 || summary.overdueCompliance > 0) && (
        <div className="space-y-3">
          {summary.criticalIncidents > 0 && (
            <AlertBanner
              variant="error"
              title={`${summary.criticalIncidents} Critical Incident${summary.criticalIncidents > 1 ? "s" : ""} Require Attention`}
              description="Immediate action required for critical safeguarding incidents"
              action={{
                label: "View Incidents",
                onClick: () => navigate("/incidents?severity=CRITICAL"),
              }}
              testId="alert-critical-incidents"
            />
          )}
          {summary.overdueCompliance > 0 && (
            <AlertBanner
              variant="warning"
              title={`${summary.overdueCompliance} Overdue Compliance Audit${summary.overdueCompliance > 1 ? "s" : ""}`}
              description="Compliance audits past their due date require immediate review"
              action={{
                label: "View Audits",
                onClick: () => navigate("/compliance?status=OVERDUE"),
              }}
              testId="alert-overdue-compliance"
            />
          )}
        </div>
      )}

      {/* System-Wide KPIs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System-Wide Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Organizations"
            value={summary.totalOrganizations}
            subtitle={`${summary.activeOrganizations} active`}
            icon={Building2}
            variant="default"
            onClick={() => navigate("/organizations")}
            testId="stat-organizations"
          />
          <StatCard
            label="Total Users"
            value={summary.totalUsers}
            icon={Users}
            variant="default"
            testId="stat-users"
          />
          <StatCard
            label="Properties"
            value={summary.totalProperties}
            icon={Home}
            variant="default"
            testId="stat-properties"
          />
          <StatCard
            label="Residents"
            value={summary.totalTenants}
            icon={Users}
            variant="default"
            testId="stat-residents"
          />
          <StatCard
            label="Incidents"
            value={summary.totalIncidents}
            subtitle={`${summary.criticalIncidents} critical`}
            icon={AlertTriangle}
            variant={summary.criticalIncidents > 0 ? "error" : "default"}
            onClick={() => navigate("/incidents")}
            testId="stat-incidents"
          />
          <StatCard
            label="Compliance Audits"
            value={summary.totalCompliance}
            subtitle={`${summary.overdueCompliance} overdue`}
            icon={CheckCircle}
            variant={summary.overdueCompliance > 0 ? "warning" : "success"}
            onClick={() => navigate("/compliance")}
            testId="stat-compliance"
          />
          <StatCard
            label="Staff Members"
            value={summary.totalStaff}
            icon={UserCog}
            variant="default"
            testId="stat-staff"
          />
          <StatCard
            label="Documents"
            value="-"
            subtitle="Cross-organization"
            icon={FileText}
            variant="default"
            testId="stat-documents"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            label="Organizations"
            description="Manage tenants"
            icon={Building2}
            onClick={() => navigate("/organizations")}
            testId="action-organizations"
          />
          <QuickActionCard
            label="Critical Incidents"
            description="Safeguarding alerts"
            icon={AlertTriangle}
            onClick={() => navigate("/incidents?severity=CRITICAL")}
            badge={summary.criticalIncidents > 0 ? summary.criticalIncidents : undefined}
            variant={summary.criticalIncidents > 0 ? "warning" : "default"}
            testId="action-critical-incidents"
          />
          <QuickActionCard
            label="Compliance"
            description="Audit overview"
            icon={CheckCircle}
            onClick={() => navigate("/compliance")}
            badge={summary.overdueCompliance > 0 ? summary.overdueCompliance : undefined}
            variant={summary.overdueCompliance > 0 ? "warning" : "default"}
            testId="action-compliance"
          />
          <QuickActionCard
            label="System Reports"
            description="Analytics & insights"
            icon={TrendingUp}
            onClick={() => navigate("/reports")}
            testId="action-reports"
          />
        </div>
      </div>

      {/* Organization Portfolio */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Organization Portfolio</h2>
        <Card data-testid="card-organizations">
          <CardHeader>
            <CardTitle>All Organizations ({organizations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.slice(0, 10).map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                  data-testid={`org-card-${org.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{org.name}</h3>
                      <Badge
                        variant={org.isActive ? "default" : "secondary"}
                        className="no-default-hover-elevate no-default-active-elevate"
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="no-default-hover-elevate no-default-active-elevate"
                      >
                        {org.subscriptionTier}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Users:</span>{" "}
                        <span className="font-medium">{org._count.users}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Properties:</span>{" "}
                        <span className="font-medium">{org._count.properties}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Residents:</span>{" "}
                        <span className="font-medium">{org._count.residents}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Staff:</span>{" "}
                        <span className="font-medium">{org._count.staff}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Incidents:</span>{" "}
                        <span className="font-medium">{org._count.incidents}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Audits:</span>{" "}
                        <span className="font-medium">{org._count.compliance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {organizations.length > 10 && (
                <button
                  type="button"
                  className="w-full p-3 text-center text-primary hover:bg-muted rounded-lg transition-colors"
                  onClick={() => navigate("/organizations")}
                  data-testid="button-view-all-orgs"
                >
                  View All Organizations ({organizations.length})
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Critical Incidents */}
        <Card data-testid="card-critical-incidents">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Recent Critical Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCriticalIncidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No critical incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCriticalIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-3 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    data-testid={`incident-${incident.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{incident.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {incident.organization.name}
                          {incident.resident && (
                            <> • {incident.resident.firstName} {incident.resident.lastName}</>
                          )}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2 no-default-hover-elevate no-default-active-elevate">
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <ActivityFeed
          activities={activities}
          title="Recent System Activity"
          maxHeight="h-96"
          testId="feed-activity"
        />
      </div>
    </div>
  );
}
