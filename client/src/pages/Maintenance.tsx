import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MaintenanceList } from "@/components/MaintenanceList";

export default function Maintenance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Maintenance</h1>
          <p className="text-muted-foreground mt-1">
            Manage maintenance jobs and schedules
          </p>
        </div>
        <Button data-testid="button-add-maintenance">
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>
      <MaintenanceList />
    </div>
  );
}
