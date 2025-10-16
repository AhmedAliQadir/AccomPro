import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, MapPin, Calendar } from "lucide-react";

//todo: remove mock functionality
const maintenanceJobs = [
  {
    id: "1",
    title: "Boiler repair",
    property: "Oakwood House",
    priority: "urgent",
    status: "in-progress",
    scheduledDate: "2024-10-17",
  },
  {
    id: "2",
    title: "Door lock replacement",
    property: "Maple Gardens",
    priority: "high",
    status: "scheduled",
    scheduledDate: "2024-10-18",
  },
  {
    id: "3",
    title: "Window cleaning",
    property: "Pine View",
    priority: "low",
    status: "pending",
    scheduledDate: "2024-10-20",
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "high":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "medium":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "low":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

export function MaintenanceList() {
  return (
    <div className="space-y-3">
      {maintenanceJobs.map((job) => (
        <Card key={job.id} data-testid={`card-maintenance-${job.id}`}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{job.title}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{job.property}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getPriorityColor(job.priority)}
              >
                {job.priority}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                data-testid={`button-view-maintenance-${job.id}`}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
