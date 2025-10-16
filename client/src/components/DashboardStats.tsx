import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, AlertTriangle, Wrench } from "lucide-react";

//todo: remove mock functionality
const stats = [
  {
    title: "Total Tenants",
    value: "147",
    icon: Users,
    change: "+12 this month",
    trend: "up" as const,
  },
  {
    title: "Properties",
    value: "23",
    icon: Building2,
    change: "95% occupied",
    trend: "neutral" as const,
  },
  {
    title: "Active Cases",
    value: "8",
    icon: AlertTriangle,
    change: "2 urgent",
    trend: "down" as const,
  },
  {
    title: "Maintenance Jobs",
    value: "15",
    icon: Wrench,
    change: "5 overdue",
    trend: "down" as const,
  },
];

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
