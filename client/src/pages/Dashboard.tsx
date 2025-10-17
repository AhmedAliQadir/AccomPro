import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceList } from "@/components/MaintenanceList";
import { CaseCard } from "@/components/CaseCard";
import { AddTenantDialog } from "@/components/AddTenantDialog";

//todo: remove mock functionality
const recentCases = [
  {
    id: "1",
    type: "safeguarding" as const,
    title: "Welfare check required",
    tenant: "Sarah Johnson",
    severity: "high" as const,
    status: "in-progress" as const,
    createdDate: "2024-10-15",
    dueDate: "2024-10-18",
  },
  {
    id: "2",
    type: "complaint" as const,
    title: "Noise complaint",
    tenant: "Michael Chen",
    severity: "medium" as const,
    status: "open" as const,
    createdDate: "2024-10-16",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your accommodation management
          </p>
        </div>
        <AddTenantDialog />
      </div>

      <DashboardStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
