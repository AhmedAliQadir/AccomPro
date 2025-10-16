import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, User } from "lucide-react";

//todo: remove mock functionality
const visits = [
  {
    id: "1",
    tenant: "Sarah Johnson",
    date: "2024-10-16",
    time: "14:00",
    worker: "Dr. Smith",
    type: "Support Visit",
  },
  {
    id: "2",
    tenant: "Michael Chen",
    date: "2024-10-17",
    time: "10:00",
    worker: "J. Wilson",
    type: "Welfare Check",
  },
];

export default function Visits() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Support Visits</h1>
          <p className="text-muted-foreground mt-1">
            Log and schedule tenant support visits
          </p>
        </div>
        <Button data-testid="button-log-visit">
          <Plus className="mr-2 h-4 w-4" />
          Log Visit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visits.map((visit) => (
          <Card key={visit.id} data-testid={`card-visit-${visit.id}`}>
            <CardHeader>
              <CardTitle className="text-base">{visit.type}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{visit.tenant}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(visit.date).toLocaleDateString()} at {visit.time}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Worker: {visit.worker}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
