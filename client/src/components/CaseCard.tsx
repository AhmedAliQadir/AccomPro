import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, User } from "lucide-react";

interface CaseCardProps {
  caseItem: {
    id: string;
    type: "complaint" | "safeguarding" | "asb";
    title: string;
    tenant: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "in-progress" | "resolved" | "closed";
    createdDate: string;
    dueDate?: string;
  };
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "safeguarding":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "asb":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "complaint":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
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

export function CaseCard({ caseItem }: CaseCardProps) {
  return (
    <Card data-testid={`card-case-${caseItem.id}`} className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{caseItem.title}</CardTitle>
          <Badge variant="outline" className={getTypeColor(caseItem.type)}>
            {caseItem.type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{caseItem.tenant}</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={getSeverityColor(caseItem.severity)}
          >
            {caseItem.severity}
          </Badge>
          <Badge variant="outline">
            {caseItem.status.replace("-", " ")}
          </Badge>
        </div>

        {caseItem.dueDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Due: {new Date(caseItem.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          data-testid={`button-view-case-${caseItem.id}`}
        >
          <FileText className="mr-2 h-4 w-4" />
          View Case
        </Button>
      </CardContent>
    </Card>
  );
}
