import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

//todo: remove mock functionality
const financialSummary = {
  totalRent: "£45,280",
  collected: "£42,150",
  arrears: "£3,130",
  collectionRate: "93%",
};

const arrearsAccounts = [
  { id: "1", tenant: "John Doe", amount: "£850", weeks: 3 },
  { id: "2", tenant: "Jane Smith", amount: "£1,200", weeks: 5 },
  { id: "3", tenant: "Bob Johnson", amount: "£1,080", weeks: 4 },
];

export default function Finances() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Finances</h1>
        <p className="text-muted-foreground mt-1">
          Rent, charges, and arrears management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.totalRent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.collected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrears</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {financialSummary.arrears}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.collectionRate}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arrears Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {arrearsAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 border rounded-md"
                data-testid={`card-arrears-${account.id}`}
              >
                <div>
                  <p className="font-medium">{account.tenant}</p>
                  <p className="text-sm text-muted-foreground">
                    {account.weeks} weeks in arrears
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                    {account.amount}
                  </Badge>
                  <Button variant="outline" size="sm" data-testid={`button-manage-arrears-${account.id}`}>
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
