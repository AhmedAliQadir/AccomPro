import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, CheckCircle, Clock, AlertCircle, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

type AuditType = 
  | 'CQC_INSPECTION'
  | 'INTERNAL_AUDIT'
  | 'FIRE_SAFETY'
  | 'HEALTH_SAFETY'
  | 'SAFEGUARDING'
  | 'MEDICATION'
  | 'GDPR_COMPLIANCE'
  | 'OTHER';

type ComplianceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

interface ComplianceAudit {
  id: string;
  title: string;
  auditType: AuditType;
  status: ComplianceStatus;
  auditDate: string;
  score?: number;
  auditorName?: string;
  findings?: string;
  actionPlan?: string;
  evidence?: Array<{
    description: string;
    uploadedAt: string;
  }>;
}

const createAuditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  auditType: z.enum(['CQC_INSPECTION', 'INTERNAL_AUDIT', 'FIRE_SAFETY', 'HEALTH_SAFETY', 'SAFEGUARDING', 'MEDICATION', 'GDPR_COMPLIANCE', 'OTHER']),
  auditDate: z.string().min(1, 'Audit date is required'),
  auditorName: z.string().optional(),
  findings: z.string().optional(),
});

const updateAuditSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
  score: z.string().optional(),
  actionPlan: z.string().optional(),
});

const evidenceSchema = z.object({
  description: z.string().min(1, 'Description is required'),
});

type CreateAuditValues = z.infer<typeof createAuditSchema>;
type UpdateAuditValues = z.infer<typeof updateAuditSchema>;
type EvidenceValues = z.infer<typeof evidenceSchema>;

const formatAuditType = (type: AuditType) => {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

const getStatusVariant = (status: ComplianceStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'COMPLETED': return 'default';
    case 'IN_PROGRESS': return 'secondary';
    case 'PENDING': return 'outline';
    case 'OVERDUE': return 'destructive';
  }
};

function CreateAuditDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateAuditValues>({
    resolver: zodResolver(createAuditSchema),
    defaultValues: {
      title: '',
      auditType: 'INTERNAL_AUDIT',
      auditDate: new Date().toISOString().split('T')[0],
      auditorName: '',
      findings: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAuditValues) => {
      return await apiRequest('POST', '/api/compliance', data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/compliance'] });
      toast({
        title: 'Audit Created',
        description: 'The compliance audit has been successfully created.',
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create audit',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateAuditValues) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-audit">
          <Plus className="w-4 h-4 mr-2" />
          New Audit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Compliance Audit</DialogTitle>
          <DialogDescription>
            Schedule and document a new compliance audit
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Title *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., CQC Annual Inspection 2025" data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="auditType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-audit-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CQC_INSPECTION">CQC Inspection</SelectItem>
                        <SelectItem value="INTERNAL_AUDIT">Internal Audit</SelectItem>
                        <SelectItem value="FIRE_SAFETY">Fire Safety</SelectItem>
                        <SelectItem value="HEALTH_SAFETY">Health & Safety</SelectItem>
                        <SelectItem value="SAFEGUARDING">Safeguarding</SelectItem>
                        <SelectItem value="MEDICATION">Medication</SelectItem>
                        <SelectItem value="GDPR_COMPLIANCE">GDPR Compliance</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auditDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-audit-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="auditorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auditor Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Name of person conducting audit" data-testid="input-auditor-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Findings</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Document initial observations or expected areas of focus..." data-testid="input-findings" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? 'Creating...' : 'Create Audit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateAuditDialog({ audit }: { audit: ComplianceAudit }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateAuditValues>({
    resolver: zodResolver(updateAuditSchema),
    defaultValues: {
      status: audit.status,
      score: audit.score?.toString() || '',
      actionPlan: audit.actionPlan || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAuditValues) => {
      const payload = {
        ...data,
        score: data.score ? parseInt(data.score) : undefined,
      };
      return await apiRequest('PATCH', `/api/compliance/${audit.id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/compliance'] });
      toast({
        title: 'Audit Updated',
        description: 'The compliance audit has been successfully updated.',
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update audit',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpdateAuditValues) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-update-${audit.id}`}>
          Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Audit</DialogTitle>
          <DialogDescription>
            Update the status and details of {audit.title}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} data-testid="input-score" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="actionPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Plan</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Document required actions and remediation steps..." data-testid="input-action-plan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-update">
                {updateMutation.isPending ? 'Updating...' : 'Update Audit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddEvidenceDialog({ auditId, auditTitle }: { auditId: string; auditTitle: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<EvidenceValues>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      description: '',
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: async (data: EvidenceValues) => {
      return await apiRequest('POST', `/api/compliance/${auditId}/evidence`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/compliance'] });
      toast({
        title: 'Evidence Added',
        description: 'Evidence has been added to the audit.',
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add evidence',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EvidenceValues) => {
    addEvidenceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-add-evidence-${auditId}`}>
          <Upload className="w-4 h-4 mr-2" />
          Add Evidence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Evidence</DialogTitle>
          <DialogDescription>
            Add supporting evidence for {auditTitle}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={4} 
                      placeholder="Describe the evidence being provided (e.g., training certificates, inspection reports, policy documents...)" 
                      data-testid="input-evidence-description" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addEvidenceMutation.isPending} data-testid="button-submit-evidence">
                {addEvidenceMutation.isPending ? 'Adding...' : 'Add Evidence'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CompliancePage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ compliance: ComplianceAudit[] }>({
    queryKey: ['/api/compliance'],
  });

  const audits = data?.compliance || [];

  const stats = {
    total: audits.length,
    completed: audits.filter(a => a.status === 'COMPLETED').length,
    inProgress: audits.filter(a => a.status === 'IN_PROGRESS').length,
    overdue: audits.filter(a => a.status === 'OVERDUE').length,
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'OPS' || user?.role === 'ORG_ADMIN' || user?.role === 'COMPLIANCE_OFFICER';

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="page-compliance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Compliance & Audits</h1>
          <p className="text-muted-foreground mt-1">
            Track CQC inspections, internal audits, and regulatory compliance
          </p>
        </div>
        {canManage && <CreateAuditDialog />}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-audits">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-completed-audits">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-in-progress-audits">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-overdue-audits">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Audits</CardTitle>
          <CardDescription>
            {audits.length} audit{audits.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No audits yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first compliance audit to start tracking
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Audit Date</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id} data-testid={`row-audit-${audit.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{audit.title}</p>
                        {audit.evidence && audit.evidence.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {audit.evidence.length} evidence item{audit.evidence.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatAuditType(audit.auditType)}</TableCell>
                    <TableCell>{new Date(audit.auditDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {audit.auditorName || <span className="text-muted-foreground">Not assigned</span>}
                    </TableCell>
                    <TableCell>
                      {audit.score !== null && audit.score !== undefined ? (
                        <span className={`font-medium ${audit.score >= 80 ? 'text-green-600' : audit.score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                          {audit.score}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(audit.status)}>
                        {audit.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canManage && (
                          <>
                            <UpdateAuditDialog audit={audit} />
                            <AddEvidenceDialog 
                              auditId={audit.id} 
                              auditTitle={audit.title} 
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
