import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Home,
  AlertTriangle,
  FileText,
  Plus,
  ClipboardList,
  UserPlus,
  Bell,
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

interface SupportDashboardData {
  summary: {
    assignedProperties: number;
    totalResidents: number;
    activeIncidents: number;
    criticalIncidents: number;
    pendingDocuments: number;
    overdueCompliance: number;
  };
  assignedProperties: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  recentIncidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    reportedAt: string;
    resident: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  residentAlerts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    property: string;
    alertType: "PENDING_DOCUMENTS" | "CRITICAL_INCIDENT";
    alertCount: number;
  }>;
}

export default function SupportDashboard() {
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<SupportDashboardData>({
    queryKey: ["/api/support/dashboard"],
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, assignedProperties, recentIncidents, residentAlerts } = data;

  // Transform recent incidents to ActivityItem format
  const activities: ActivityItem[] = recentIncidents.map((incident) => ({
    id: incident.id,
    user: {
      name: incident.resident
        ? `${incident.resident.firstName} ${incident.resident.lastName}`
        : "Unknown",
      initials: incident.resident
        ? `${incident.resident.firstName[0]}${incident.resident.lastName[0]}`
        : "?",
    },
    action: "reported incident",
    details: incident.title,
    timestamp: incident.reportedAt,
    type: "incident",
  }));

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Caseload</h1>
        <p className="text-muted-foreground mt-1">
          Support worker task cockpit
        </p>
      </div>

      {/* Critical Alerts */}
      {(summary.criticalIncidents > 0 || residentAlerts.length > 0) && (
        <div className="space-y-3">
          {summary.criticalIncidents > 0 && (
            <AlertBanner
              variant="error"
              title={`${summary.criticalIncidents} Critical Incident${summary.criticalIncidents > 1 ? "s" : ""}`}
              description="Immediate attention required for critical safeguarding incidents"
              action={{
                label: "View Now",
                onClick: () => navigate("/incidents?severity=CRITICAL"),
              }}
              testId="alert-critical-incidents"
            />
          )}
          {residentAlerts.filter(a => a.alertType === "PENDING_DOCUMENTS").length > 0 && (
            <AlertBanner
              variant="warning"
              title={`${summary.pendingDocuments} Pending Document${summary.pendingDocuments > 1 ? "s" : ""}`}
              description="Resident documents awaiting verification"
              action={{
                label: "Review",
                onClick: () => navigate("/documents"),
              }}
              testId="alert-pending-documents"
            />
          )}
        </div>
      )}

      {/* Caseload Summary - Mobile Optimized */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3">Your Caseload</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Properties"
            value={summary.assignedProperties}
            icon={Home}
            variant="default"
            onClick={() => navigate("/properties")}
            testId="stat-properties"
          />
          <StatCard
            label="Residents"
            value={summary.totalResidents}
            icon={Users}
            variant="default"
            onClick={() => navigate("/tenants")}
            testId="stat-residents"
          />
          <StatCard
            label="Active Incidents"
            value={summary.activeIncidents}
            subtitle={`${summary.criticalIncidents} critical`}
            icon={AlertTriangle}
            variant={summary.criticalIncidents > 0 ? "error" : "default"}
            onClick={() => navigate("/incidents")}
            testId="stat-incidents"
          />
          <StatCard
            label="Pending Docs"
            value={summary.pendingDocuments}
            icon={FileText}
            variant={summary.pendingDocuments > 0 ? "warning" : "default"}
            onClick={() => navigate("/documents")}
            testId="stat-documents"
          />
        </div>
      </div>

      {/* Quick Actions - Touch Optimized */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <QuickActionCard
            label="New Incident"
            description="Report safeguarding"
            icon={Plus}
            onClick={() => navigate("/incidents/new")}
            variant="primary"
            testId="action-new-incident"
          />
          <QuickActionCard
            label="My Residents"
            description="View caseload"
            icon={Users}
            onClick={() => navigate("/tenants")}
            testId="action-residents"
          />
          <QuickActionCard
            label="Properties"
            description="Assigned locations"
            icon={Home}
            onClick={() => navigate("/properties")}
            testId="action-properties"
          />
          <QuickActionCard
            label="Documents"
            description="Verify & upload"
            icon={FileText}
            onClick={() => navigate("/documents")}
            badge={summary.pendingDocuments > 0 ? summary.pendingDocuments : undefined}
            variant={summary.pendingDocuments > 0 ? "warning" : "default"}
            testId="action-documents"
          />
        </div>
      </div>

      {/* Resident Alerts - Mobile Friendly */}
      {residentAlerts.length > 0 && (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-3">
            Resident Alerts ({residentAlerts.length})
          </h2>
          <Card data-testid="card-resident-alerts">
            <CardContent className="p-3 md:p-6">
              <div className="space-y-2 md:space-y-3">
                {residentAlerts.map((alert) => (
                  <div
                    key={`${alert.id}-${alert.alertType}`}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => navigate(`/tenants/${alert.id}`)}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={alert.alertType === "CRITICAL_INCIDENT" ? "text-red-500" : "text-amber-500"}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {alert.firstName} {alert.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {alert.property}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge
                        variant={alert.alertType === "CRITICAL_INCIDENT" ? "destructive" : "secondary"}
                        className="no-default-hover-elevate no-default-active-elevate whitespace-nowrap"
                      >
                        {alert.alertType === "CRITICAL_INCIDENT"
                          ? "Critical"
                          : `${alert.alertCount} docs`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two Column Layout - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Assigned Properties */}
        <Card data-testid="card-properties">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Home className="w-5 h-5" />
              Your Properties ({assignedProperties.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedProperties.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <Home className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                <p>No properties assigned</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {assignedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="p-3 md:p-4 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => navigate(`/properties/${property.id}`)}
                    data-testid={`property-${property.id}`}
                  >
                    <h4 className="font-medium">{property.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {property.address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <ActivityFeed
          activities={activities}
          title="Recent Incidents"
          maxHeight="h-80 md:h-96"
          onItemClick={(activity) => navigate(`/incidents/${activity.id}`)}
          testId="feed-incidents"
        />
      </div>
    </div>
  );
}
