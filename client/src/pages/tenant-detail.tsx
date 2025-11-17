import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, FileText, Download, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
    serviceChargeAmount?: number;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [endTenancyOpen, setEndTenancyOpen] = useState(false);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endReason, setEndReason] = useState('');
  const [endNotes, setEndNotes] = useState('');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  const canVerifyDocuments = user?.role === 'ADMIN' || user?.role === 'OPS' || user?.role === 'COMPLIANCE_OFFICER';

  const { data, isLoading } = useQuery<{ tenant: Tenant }>({
    queryKey: ['/api/tenants', tenantId],
    enabled: !!tenantId,
  });

  const endTenancyMutation = useMutation({
    mutationFn: async ({ tenancyId, data }: { tenancyId: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/tenancies/${tenancyId}/end`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId] });
      setEndTenancyOpen(false);
      setEndDate(new Date().toISOString().split('T')[0]);
      setEndReason('');
      setEndNotes('');
      toast({
        title: 'Tenancy ended',
        description: 'The tenancy has been ended successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to end tenancy',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEndTenancy = (tenancyId: string) => {
    endTenancyMutation.mutate({
      tenancyId,
      data: {
        endDate: endDate || new Date().toISOString().split('T')[0],
        endReason: endReason || undefined,
        endNotes: endNotes || undefined,
      },
    });
  };

  const verifyDocumentMutation = useMutation({
    mutationFn: async ({ documentId, notes }: { documentId: string; notes?: string }) => {
      const response = await apiRequest('POST', `/api/documents/${documentId}/verify`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId] });
      setVerifyDialogOpen(false);
      setSelectedDocId(null);
      setVerifyNotes('');
      toast({
        title: 'Document verified',
        description: 'The document has been successfully verified',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to verify document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/documents/${documentId}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId] });
      setRejectDialogOpen(false);
      setSelectedDocId(null);
      setRejectReason('');
      toast({
        title: 'Document rejected',
        description: 'The document has been rejected',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to reject document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleVerifyDocument = () => {
    if (!selectedDocId) return;
    verifyDocumentMutation.mutate({
      documentId: selectedDocId,
      notes: verifyNotes || undefined,
    });
  };

  const handleRejectDocument = () => {
    if (!selectedDocId || !rejectReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting this document',
        variant: 'destructive',
      });
      return;
    }
    rejectDocumentMutation.mutate({
      documentId: selectedDocId,
      reason: rejectReason,
    });
  };

  const tenant = data?.tenant;
  const canEndTenancy = user?.role === 'ADMIN' || user?.role === 'OPS';

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
                {activeTenancy.serviceChargeAmount != null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Service Charges: </span>
                    £{Number(activeTenancy.serviceChargeAmount).toFixed(2)} / month
                  </div>
                )}
                {canEndTenancy && (
                  <Dialog open={endTenancyOpen} onOpenChange={setEndTenancyOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full" data-testid="button-end-tenancy">
                        End Tenancy
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>End Tenancy</DialogTitle>
                        <DialogDescription>
                          Record the end of this tenancy. The tenant's status will be updated to "Moved Out" if they have no other active tenancies.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="Leave empty for today"
                            data-testid="input-end-date"
                          />
                          <p className="text-xs text-muted-foreground">Leave empty to use today's date</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endReason">Reason</Label>
                          <Input
                            id="endReason"
                            value={endReason}
                            onChange={(e) => setEndReason(e.target.value)}
                            placeholder="e.g. Moved to independent living"
                            data-testid="input-end-reason"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endNotes">Notes</Label>
                          <Textarea
                            id="endNotes"
                            value={endNotes}
                            onChange={(e) => setEndNotes(e.target.value)}
                            placeholder="Additional details about ending this tenancy"
                            data-testid="input-end-notes"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setEndTenancyOpen(false)}
                          disabled={endTenancyMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleEndTenancy(activeTenancy.id)}
                          disabled={endTenancyMutation.isPending}
                          data-testid="button-confirm-end-tenancy"
                        >
                          {endTenancyMutation.isPending ? 'Ending...' : 'End Tenancy'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          {doc.uploadedBy && ` by ${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`}
                        </p>
                        {doc.verifiedAt && (
                          <p className="text-xs text-muted-foreground">
                            Verified {new Date(doc.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" data-testid={`button-view-document-${doc.id}`}>
                        View
                      </Button>
                      {canVerifyDocuments && doc.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              setVerifyDialogOpen(true);
                            }}
                            data-testid={`button-verify-document-${doc.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              setRejectDialogOpen(true);
                            }}
                            data-testid={`button-reject-document-${doc.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Verify Document Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent data-testid="dialog-verify-document">
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Confirm that you have reviewed this document and it meets all requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-notes">Verification Notes (Optional)</Label>
              <Textarea
                id="verify-notes"
                placeholder="Add any notes about this verification..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                rows={3}
                data-testid="textarea-verify-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyDialogOpen(false);
                setSelectedDocId(null);
                setVerifyNotes('');
              }}
              data-testid="button-cancel-verify"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyDocument}
              disabled={verifyDocumentMutation.isPending}
              data-testid="button-confirm-verify"
            >
              {verifyDocumentMutation.isPending ? 'Verifying...' : 'Verify Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-document">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. The reason will be shared with the uploader.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., Document is not clear, wrong document type, expired..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                data-testid="textarea-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedDocId(null);
                setRejectReason('');
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectDocument}
              disabled={rejectDocumentMutation.isPending || !rejectReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectDocumentMutation.isPending ? 'Rejecting...' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
