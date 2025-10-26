import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileText, Calendar, User, Edit, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
}

interface SupportWorker {
  id: string;
  firstName: string;
  lastName: string;
}

interface SupportNote {
  id: string;
  tenantId: string;
  supportWorkerId: string;
  sessionDate: string;
  contactType: 'IN_PERSON' | 'PHONE_CALL';
  attendanceStatus: 'PRESENT' | 'AUTHORISED_NON_ATTENDANCE' | 'DID_NOT_ATTEND';
  economicWellbeingNotes?: string;
  enjoyAchieveNotes?: string;
  healthNotes?: string;
  staySafeNotes?: string;
  positiveContributionNotes?: string;
  specificSupportNeeds?: string;
  sessionComments?: string;
  clientSignature?: string;
  supportWorkerSignature?: string;
  nextSessionDate?: string;
  tenant: Tenant;
  supportWorker: SupportWorker;
  createdAt: string;
  updatedAt: string;
}

interface SupportNoteFormData {
  tenantId: string;
  sessionDate: string;
  contactType: 'IN_PERSON' | 'PHONE_CALL';
  attendanceStatus: 'PRESENT' | 'AUTHORISED_NON_ATTENDANCE' | 'DID_NOT_ATTEND';
  economicWellbeingNotes?: string;
  enjoyAchieveNotes?: string;
  healthNotes?: string;
  staySafeNotes?: string;
  positiveContributionNotes?: string;
  specificSupportNeeds?: string;
  sessionComments?: string;
  clientSignature?: string;
  supportWorkerSignature?: string;
  nextSessionDate?: string;
}

export default function SupportNotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SupportNote | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SupportNoteFormData>({
    tenantId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    contactType: 'IN_PERSON',
    attendanceStatus: 'PRESENT',
    economicWellbeingNotes: '',
    enjoyAchieveNotes: '',
    healthNotes: '',
    staySafeNotes: '',
    positiveContributionNotes: '',
    specificSupportNeeds: '',
    sessionComments: '',
    clientSignature: '',
    supportWorkerSignature: '',
    nextSessionDate: '',
  });

  // Fetch support notes
  const { data, isLoading } = useQuery<{ supportNotes: SupportNote[] }>({
    queryKey: ['/api/support-notes'],
  });

  // Fetch tenants for dropdown
  const { data: tenantsData } = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['/api/tenants'],
  });

  const supportNotes = data?.supportNotes || [];
  const tenants = tenantsData?.tenants || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SupportNoteFormData) => {
      return await apiRequest('POST', '/api/support-notes', {
        ...data,
        sessionDate: new Date(data.sessionDate).toISOString(),
        nextSessionDate: data.nextSessionDate ? new Date(data.nextSessionDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-notes'] });
      toast({
        title: 'Support Note Created',
        description: 'Weekly support session note has been successfully recorded.',
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create support note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: SupportNoteFormData & { id: string }) => {
      return await apiRequest('PATCH', `/api/support-notes/${id}`, {
        ...data,
        sessionDate: new Date(data.sessionDate).toISOString(),
        nextSessionDate: data.nextSessionDate ? new Date(data.nextSessionDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-notes'] });
      toast({
        title: 'Support Note Updated',
        description: 'Support note has been successfully updated.',
      });
      setDialogOpen(false);
      setSelectedNote(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update support note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tenantId: '',
      sessionDate: new Date().toISOString().split('T')[0],
      contactType: 'IN_PERSON',
      attendanceStatus: 'PRESENT',
      economicWellbeingNotes: '',
      enjoyAchieveNotes: '',
      healthNotes: '',
      staySafeNotes: '',
      positiveContributionNotes: '',
      specificSupportNeeds: '',
      sessionComments: '',
      clientSignature: '',
      supportWorkerSignature: '',
      nextSessionDate: '',
    });
  };

  const handleEdit = (note: SupportNote) => {
    setSelectedNote(note);
    setFormData({
      tenantId: note.tenantId,
      sessionDate: new Date(note.sessionDate).toISOString().split('T')[0],
      contactType: note.contactType,
      attendanceStatus: note.attendanceStatus,
      economicWellbeingNotes: note.economicWellbeingNotes || '',
      enjoyAchieveNotes: note.enjoyAchieveNotes || '',
      healthNotes: note.healthNotes || '',
      staySafeNotes: note.staySafeNotes || '',
      positiveContributionNotes: note.positiveContributionNotes || '',
      specificSupportNeeds: note.specificSupportNeeds || '',
      sessionComments: note.sessionComments || '',
      clientSignature: note.clientSignature || '',
      supportWorkerSignature: note.supportWorkerSignature || '',
      nextSessionDate: note.nextSessionDate ? new Date(note.nextSessionDate).toISOString().split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleView = (note: SupportNote) => {
    setSelectedNote(note);
    setViewDialogOpen(true);
  };

  const handleDownload = async (noteId: string) => {
    try {
      const response = await fetch(`/api/support-notes/${noteId}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download support note');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `support-note-${noteId}.pdf`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Complete',
        description: 'Support note has been downloaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download support note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.tenantId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a resident for this support note.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.sessionDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a session date.',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedNote) {
      updateMutation.mutate({ id: selectedNote.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    resetForm();
    setDialogOpen(true);
  };

  // Filter support notes based on search
  const filteredNotes = supportNotes.filter(note =>
    `${note.tenant.firstName} ${note.tenant.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    `${note.supportWorker.firstName} ${note.supportWorker.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = user?.role === 'ADMIN' || user?.role === 'OPS' || user?.role === 'SUPPORT';
  const canEdit = user?.role === 'ADMIN' || user?.role === 'OPS' || user?.role === 'SUPPORT';

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Support Notes</h1>
          <p className="text-muted-foreground mt-1">
            Document weekly support sessions with residents
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleNewNote} data-testid="button-create-support-note">
            <Plus className="h-4 w-4 mr-2" />
            New Support Note
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by resident or support worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-notes"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Support Session Notes ({filteredNotes.length})
          </CardTitle>
          <CardDescription>
            Record of all weekly support sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No support notes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Contact Type</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Support Worker</TableHead>
                    <TableHead>Next Session</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => (
                    <TableRow key={note.id} data-testid={`row-support-note-${note.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {note.tenant.firstName} {note.tenant.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(note.sessionDate), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={note.contactType === 'IN_PERSON' ? 'default' : 'secondary'}>
                          {note.contactType === 'IN_PERSON' ? 'In Person' : 'Phone Call'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          note.attendanceStatus === 'PRESENT' ? 'default' :
                          note.attendanceStatus === 'AUTHORISED_NON_ATTENDANCE' ? 'secondary' : 'destructive'
                        }>
                          {note.attendanceStatus.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {note.supportWorker.firstName} {note.supportWorker.lastName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {note.nextSessionDate ? (
                          <span className="text-sm">
                            {format(new Date(note.nextSessionDate), 'dd MMM yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(note)}
                            data-testid={`button-view-${note.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(note.id)}
                            data-testid={`button-download-${note.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(note)}
                              data-testid={`button-edit-${note.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedNote ? 'Edit Support Note' : 'New Weekly Support Session Note'}
            </DialogTitle>
            <DialogDescription>
              Document the weekly support session with all relevant information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Resident *</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                  required
                >
                  <SelectTrigger data-testid="select-tenant">
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionDate">Session Date *</Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  required
                  data-testid="input-session-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactType">Type of Contact *</Label>
                <Select
                  value={formData.contactType}
                  onValueChange={(value: any) => setFormData({ ...formData, contactType: value })}
                  required
                >
                  <SelectTrigger data-testid="select-contact-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PERSON">In Person</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendanceStatus">Attendance Status *</Label>
                <Select
                  value={formData.attendanceStatus}
                  onValueChange={(value: any) => setFormData({ ...formData, attendanceStatus: value })}
                  required
                >
                  <SelectTrigger data-testid="select-attendance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="AUTHORISED_NON_ATTENDANCE">Authorised Non-Attendance</SelectItem>
                    <SelectItem value="DID_NOT_ATTEND">Did Not Attend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Support Criteria Sections */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Support Criteria</h3>

              {/* Economic Wellbeing */}
              <div className="space-y-2">
                <Label htmlFor="economicWellbeingNotes">
                  1. Achieve Economic Wellbeing
                  <span className="text-muted-foreground text-sm ml-2">
                    (Banking, Budgeting, Debt management, Benefits)
                  </span>
                </Label>
                <Textarea
                  id="economicWellbeingNotes"
                  value={formData.economicWellbeingNotes}
                  onChange={(e) => setFormData({ ...formData, economicWellbeingNotes: e.target.value })}
                  rows={3}
                  data-testid="textarea-economic-wellbeing"
                />
              </div>

              {/* Enjoy & Achieve */}
              <div className="space-y-2">
                <Label htmlFor="enjoyAchieveNotes">
                  2. Enjoy & Achieve
                  <span className="text-muted-foreground text-sm ml-2">
                    (Employment, Education/training, Social networks, Volunteering, Moving on)
                  </span>
                </Label>
                <Textarea
                  id="enjoyAchieveNotes"
                  value={formData.enjoyAchieveNotes}
                  onChange={(e) => setFormData({ ...formData, enjoyAchieveNotes: e.target.value })}
                  rows={3}
                  data-testid="textarea-enjoy-achieve"
                />
              </div>

              {/* Be Healthy */}
              <div className="space-y-2">
                <Label htmlFor="healthNotes">
                  3. Be Healthy
                  <span className="text-muted-foreground text-sm ml-2">
                    (Healthcare, Physical health, Substance misuse, Personal hygiene, Healthy eating)
                  </span>
                </Label>
                <Textarea
                  id="healthNotes"
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  rows={3}
                  data-testid="textarea-health"
                />
              </div>

              {/* Stay Safe */}
              <div className="space-y-2">
                <Label htmlFor="staySafeNotes">
                  4. Stay Safe
                  <span className="text-muted-foreground text-sm ml-2">
                    (Living conditions, Independent life skills, Reducing risk of harm)
                  </span>
                </Label>
                <Textarea
                  id="staySafeNotes"
                  value={formData.staySafeNotes}
                  onChange={(e) => setFormData({ ...formData, staySafeNotes: e.target.value })}
                  rows={3}
                  data-testid="textarea-stay-safe"
                />
              </div>

              {/* Positive Contribution */}
              <div className="space-y-2">
                <Label htmlFor="positiveContributionNotes">
                  5. Making a Positive Contribution
                  <span className="text-muted-foreground text-sm ml-2">
                    (Anti-social behaviour, Probation/offending, Managing relationships)
                  </span>
                </Label>
                <Textarea
                  id="positiveContributionNotes"
                  value={formData.positiveContributionNotes}
                  onChange={(e) => setFormData({ ...formData, positiveContributionNotes: e.target.value })}
                  rows={3}
                  data-testid="textarea-positive-contribution"
                />
              </div>
            </div>

            {/* Additional Sections */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="specificSupportNeeds">Requested Specific Support Needs</Label>
                <Textarea
                  id="specificSupportNeeds"
                  value={formData.specificSupportNeeds}
                  onChange={(e) => setFormData({ ...formData, specificSupportNeeds: e.target.value })}
                  rows={3}
                  data-testid="textarea-specific-needs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionComments">Session Comments</Label>
                <Textarea
                  id="sessionComments"
                  value={formData.sessionComments}
                  onChange={(e) => setFormData({ ...formData, sessionComments: e.target.value })}
                  rows={3}
                  data-testid="textarea-comments"
                />
              </div>
            </div>

            {/* Signatures and Next Session */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="clientSignature">Client Signature</Label>
                <Input
                  id="clientSignature"
                  value={formData.clientSignature}
                  onChange={(e) => setFormData({ ...formData, clientSignature: e.target.value })}
                  placeholder="Client name or signature"
                  data-testid="input-client-signature"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportWorkerSignature">Support Worker Signature</Label>
                <Input
                  id="supportWorkerSignature"
                  value={formData.supportWorkerSignature}
                  onChange={(e) => setFormData({ ...formData, supportWorkerSignature: e.target.value })}
                  placeholder="Your name or signature"
                  data-testid="input-worker-signature"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="nextSessionDate">Date of Next Support Session</Label>
                <Input
                  id="nextSessionDate"
                  type="date"
                  value={formData.nextSessionDate}
                  onChange={(e) => setFormData({ ...formData, nextSessionDate: e.target.value })}
                  data-testid="input-next-session"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedNote(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-note"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : selectedNote
                  ? 'Update Note'
                  : 'Create Note'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Support Session Note</DialogTitle>
            <DialogDescription>
              Weekly support session details
            </DialogDescription>
          </DialogHeader>

          {selectedNote && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Resident</p>
                  <p className="font-medium">
                    {selectedNote.tenant.firstName} {selectedNote.tenant.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Session Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedNote.sessionDate), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Type</p>
                  <p className="font-medium">
                    {selectedNote.contactType === 'IN_PERSON' ? 'In Person' : 'Phone Call'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="font-medium">
                    {selectedNote.attendanceStatus.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Support Criteria */}
              <div className="space-y-4">
                <h3 className="font-semibold">Support Criteria</h3>

                {selectedNote.economicWellbeingNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      1. Achieve Economic Wellbeing
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.economicWellbeingNotes}</p>
                  </div>
                )}

                {selectedNote.enjoyAchieveNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      2. Enjoy & Achieve
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.enjoyAchieveNotes}</p>
                  </div>
                )}

                {selectedNote.healthNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      3. Be Healthy
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.healthNotes}</p>
                  </div>
                )}

                {selectedNote.staySafeNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      4. Stay Safe
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.staySafeNotes}</p>
                  </div>
                )}

                {selectedNote.positiveContributionNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      5. Making a Positive Contribution
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.positiveContributionNotes}</p>
                  </div>
                )}
              </div>

              {/* Additional Sections */}
              {(selectedNote.specificSupportNeeds || selectedNote.sessionComments) && (
                <div className="space-y-4 border-t pt-4">
                  {selectedNote.specificSupportNeeds && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Specific Support Needs
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{selectedNote.specificSupportNeeds}</p>
                    </div>
                  )}

                  {selectedNote.sessionComments && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Session Comments
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{selectedNote.sessionComments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client Signature</p>
                  <p className="font-medium">{selectedNote.clientSignature || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Support Worker</p>
                  <p className="font-medium">
                    {selectedNote.supportWorker.firstName} {selectedNote.supportWorker.lastName}
                  </p>
                </div>
                {selectedNote.nextSessionDate && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Next Session Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedNote.nextSessionDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedNote.id)}
                  data-testid="button-download-view"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {canEdit && (
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleEdit(selectedNote);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Note
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
