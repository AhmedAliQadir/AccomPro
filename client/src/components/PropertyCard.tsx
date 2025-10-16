import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, AlertCircle, Eye } from "lucide-react";

interface PropertyCardProps {
  property: {
    id: string;
    name: string;
    address: string;
    totalUnits: number;
    occupiedUnits: number;
    activeIssues: number;
    complianceStatus: "current" | "expiring" | "expired";
  };
}

const getComplianceColor = (status: string) => {
  switch (status) {
    case "current":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "expiring":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "expired":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

export function PropertyCard({ property }: PropertyCardProps) {
  const occupancyRate = Math.round(
    (property.occupiedUnits / property.totalUnits) * 100
  );

  return (
    <Card data-testid={`card-property-${property.id}`} className="hover-elevate">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-base">{property.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {property.address}
          </p>
        </div>
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {property.occupiedUnits}/{property.totalUnits} occupied
            </span>
          </div>
          <Badge variant="outline">{occupancyRate}%</Badge>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={getComplianceColor(property.complianceStatus)}
          >
            {property.complianceStatus === "current"
              ? "Compliant"
              : property.complianceStatus === "expiring"
              ? "Expiring Soon"
              : "Expired"}
          </Badge>
          {property.activeIssues > 0 && (
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>{property.activeIssues} issues</span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          data-testid={`button-view-property-${property.id}`}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
