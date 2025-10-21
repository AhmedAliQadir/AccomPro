import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Home, Users, CheckCircle, Clock, XCircle, TrendingUp, Building2 } from 'lucide-react';

interface DashboardSummary {
  totalTenants: number;
  activeTenancies: number;
  pendingDocuments: number;
  verifiedDocuments: number;
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
}

interface OccupancyByProperty {
  propertyId: string;
  propertyName: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

interface ComplianceData {
  tenantId: string;
  tenantName: string;
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  complianceRate: number;
}

export default function ReportsPage() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<{ summary: DashboardSummary }>({
    queryKey: ['/api/reports/dashboard'],
  });

  const { data: occupancyData, isLoading: occupancyLoading } = useQuery<{ occupancy: OccupancyByProperty[] }>({
    queryKey: ['/api/reports/occupancy'],
  });

  const { data: complianceData, isLoading: complianceLoading } = useQuery<{ compliance: ComplianceData[] }>({
    queryKey: ['/api/reports/compliance'],
  });

  const isLoading = dashboardLoading || occupancyLoading || complianceLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const occupancy = occupancyData?.occupancy || [];
  const compliance = complianceData?.compliance || [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Overview of properties, tenants, and compliance
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalRooms || 0} total rooms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenancies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeTenancies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalTenants || 0} total tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalRooms ? Math.round((summary.occupiedRooms / summary.totalRooms) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.occupiedRooms || 0} of {summary?.totalRooms || 0} rooms occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Compliance</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.verifiedDocuments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.pendingDocuments || 0} pending verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy by Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Occupancy by Property
          </CardTitle>
          <CardDescription>
            Room occupancy rates across all properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {occupancy.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties to display
            </div>
          ) : (
            <div className="space-y-3">
              {occupancy.map((item) => (
                <div key={item.propertyId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{item.propertyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.occupiedRooms} / {item.totalRooms} rooms occupied
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{item.occupancyRate}%</div>
                    </div>
                    <Badge variant={item.occupancyRate >= 80 ? 'default' : item.occupancyRate >= 50 ? 'secondary' : 'outline'}>
                      {item.occupancyRate >= 80 ? 'High' : item.occupancyRate >= 50 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Document Compliance by Tenant
          </CardTitle>
          <CardDescription>
            Status of mandatory document verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {compliance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tenants to display
            </div>
          ) : (
            <div className="space-y-3">
              {compliance.map((item) => (
                <div key={item.tenantId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{item.tenantName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {item.verifiedDocuments} verified
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        {item.pendingDocuments} pending
                      </div>
                      {item.rejectedDocuments > 0 && (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-600" />
                          {item.rejectedDocuments} rejected
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={item.complianceRate === 100 ? 'default' : item.complianceRate >= 50 ? 'secondary' : 'destructive'}>
                    {item.complianceRate}% Complete
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
