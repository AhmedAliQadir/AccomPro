import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Document {
  id: string;
  type: string;
  status: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  verifiedAt?: string;
  isMandatory: boolean;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
  dateOfBirth: string;
  nationalId?: string;
  supportLevel?: string;
  medicalNotes?: string;
  emergencyContact?: string;
  tenancies: Array<{
    id: string;
    startDate: string;
    endDate?: string;
    rentAmount?: number;
    isActive: boolean;
    room: {
      id: string;
      roomNumber: string;
      property: {
        id: string;
        name: string;
        address: string;
      };
    };
  }>;
  documents: Document[];
}

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  READY_FOR_TENANCY: 'secondary',
  ACTIVE: 'default',
  INACTIVE: 'destructive',
};

const docStatusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  VERIFIED: 'default',
  REJECTED: 'destructive',
};

export default function TenantDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/tenants/:id');
  const tenantId = params?.id;

  const { data, isLoading } = useQuery<{ tenant: Tenant }>({
    queryKey: ['/api/tenants', tenantId],
    enabled: !!tenantId,
  });

  const tenant = data?.tenant;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-24 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Tenant not found</h2>
          <Button onClick={() => setLocation('/tenants')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  const activeTenancy = tenant.tenancies.find((t) => t.isActive);
  const mandatoryDocs = tenant.documents.filter((d) => d.isMandatory);
  const verifiedMandatoryDocs = mandatoryDocs.filter((d) => d.status === 'VERIFIED');
  const complianceRate = mandatoryDocs.length > 0
    ? Math.round((verifiedMandatoryDocs.length / mandatoryDocs.length) * 100)
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => setLocation('/tenants')} className="mb-4" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenants
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{tenant.firstName} {tenant.lastName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusColors[tenant.status] || 'outline'}>
                {tenant.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenant.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.email}</span>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                DOB: {new Date(tenant.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Tenancy</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTenancy ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{activeTenancy.room.property.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Room {activeTenancy.room.roomNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeTenancy.room.property.address}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Start Date: </span>
                  {new Date(activeTenancy.startDate).toLocaleDateString()}
                </div>
                {activeTenancy.rentAmount && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Rent: </span>
                    £{activeTenancy.rentAmount.toFixed(2)} / month
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active tenancy</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">
            Documents ({tenant.documents.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Documents</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Compliance: {complianceRate}% ({verifiedMandatoryDocs.length} / {mandatoryDocs.length} mandatory verified)
              </p>
            </div>
          </div>

          {tenant.documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No documents uploaded</p>
                <p className="text-sm text-muted-foreground">
                  Upload documents to complete tenant onboarding
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {tenant.documents.map((doc) => (
                <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={docStatusColors[doc.status] || 'outline'} className="text-xs">
                            {doc.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {doc.type.replace(/_/g, ' ')}
                          </Badge>
                          {doc.isMandatory && (
                            <Badge variant="outline" className="text-xs">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                        </p>
                        {doc.verifiedAt && (
                          <p className="text-xs text-muted-foreground">
                            Verified {new Date(doc.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h2 className="text-xl font-semibold">Tenancy History</h2>
          {tenant.tenancies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tenancy history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tenant.tenancies.map((tenancy) => (
                <Card key={tenancy.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {tenancy.room.property.name} - Room {tenancy.room.roomNumber}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(tenancy.startDate).toLocaleDateString()} - 
                          {tenancy.endDate ? new Date(tenancy.endDate).toLocaleDateString() : 'Present'}
                        </p>
                      </div>
                      <Badge variant={tenancy.isActive ? 'default' : 'outline'}>
                        {tenancy.isActive ? 'Active' : 'Ended'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
