import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

//todo: remove mock functionality
const reports = [
  {
    id: "1",
    title: "Occupancy Report",
    description: "Property occupancy rates and trends",
    lastGenerated: "2024-10-15",
  },
  {
    id: "2",
    title: "Compliance Status",
    description: "Certificate and compliance overview",
    lastGenerated: "2024-10-14",
  },
  {
    id: "3",
    title: "Support KPIs",
    description: "Support visit statistics and outcomes",
    lastGenerated: "2024-10-16",
  },
  {
    id: "4",
    title: "Financial Summary",
    description: "Rent collection and arrears analysis",
    lastGenerated: "2024-10-16",
  },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate and download reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} data-testid={`card-report-${report.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.description}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                data-testid={`button-generate-report-${report.id}`}
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
