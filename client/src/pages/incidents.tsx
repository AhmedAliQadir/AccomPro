import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertTriangle, CheckCircle, Clock, XCircle, Eye, Calendar, User, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

type IncidentType = 
  | 'SAFEGUARDING'
  | 'MEDICATION'
  | 'ACCIDENT'
  | 'NEAR_MISS'
  | 'BEHAVIORAL'
  | 'PROPERTY_DAMAGE'
  | 'MISSING_PERSON'
  | 'OTHER';

type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IncidentStatus = 'REPORTED' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED';

interface Incident {
  id: string;
  title: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  location?: string;
  witnessDetails?: string;
  actionsTaken?: string;
  followUpRequired?: boolean;
  followUpNotes?: string;
  reportedAt: string;
  occurredAt?: string;
  resident?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  };
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
}

const incidentFormSchema = z.object({
  residentId: z.string().optional(),
  incidentType: z.enum([
    'SAFEGUARDING',
    'MEDICATION',
    'ACCIDENT',
    'NEAR_MISS',
    'BEHAVIORAL',
    'PROPERTY_DAMAGE',
    'MISSING_PERSON',
    'OTHER',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().optional(),
  witnessDetails: z.string().optional(),
  actionsTaken: z.string().optional(),
  occurredAt: z.string().optional(),
});

const updateIncidentSchema = z.object({
  status: z.enum(['REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED']),
  actionsTaken: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;
type UpdateIncidentValues = z.infer<typeof updateIncidentSchema>;

const getSeverityVariant = (severity: IncidentSeverity) => {
  switch (severity) {
    case 'CRITICAL': return 'destructive';
    case 'HIGH': return 'destructive';
    case 'MEDIUM': return 'default';
    case 'LOW': return 'secondary';
  }
};

const getStatusIcon = (status: IncidentStatus) => {
  switch (status) {
    case 'REPORTED': return <AlertTriangle className="w-4 h-4" />;
    case 'UNDER_INVESTIGATION': return <Clock className="w-4 h-4" />;
    case 'RESOLVED': return <CheckCircle className="w-4 h-4" />;
    case 'CLOSED': return <XCircle className="w-4 h-4" />;
  }
};

const formatIncidentType = (type: IncidentType) => {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

const formatStatus = (status: IncidentStatus) => {
  return status.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

// Incident Detail Dialog Component
function IncidentDetailDialog({ 
  incident, 
  open, 
  onOpenChange 
}: { 
  incident: Incident; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Check if user can update incidents
  const canUpdate = ['ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'].includes(user?.role || '');

  const updateForm = useForm<UpdateIncidentValues>({
    resolver: zodResolver(updateIncidentSchema),
    defaultValues: {
      status: incident.status,
      actionsTaken: incident.actionsTaken || '',
      followUpRequired: incident.followUpRequired || false,
      followUpNotes: incident.followUpNotes || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateIncidentValues) => {
      return await apiRequest('PATCH', `/api/incidents/${incident.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: 'Incident Updated',
        description: 'The incident status has been successfully updated.',
      });
      setIsEditing(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update incident. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmitUpdate = (data: UpdateIncidentValues) => {
    updateMutation.mutate(data);
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <DialogTitle className="text-xl">{incident.title}</DialogTitle>
            <DialogDescription className="mt-1">
              Reported on {new Date(incident.reportedAt).toLocaleDateString()} at{' '}
              {new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getSeverityVariant(incident.severity)}>
              {incident.severity}
            </Badge>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        {/* Status and Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(incident.status)}
              <span className="font-medium">{formatStatus(incident.status)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Incident Type</label>
            <p className="mt-1 font-medium">{formatIncidentType(incident.incidentType)}</p>
          </div>
        </div>

        <Separator />

        {/* Incident Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              Description
            </div>
            <p className="text-sm">{incident.description}</p>
          </div>

          {incident.location && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              <p className="text-sm">{incident.location}</p>
            </div>
          )}

          {incident.occurredAt && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                Occurred At
              </div>
              <p className="text-sm">
                {new Date(incident.occurredAt).toLocaleDateString()} at{' '}
                {new Date(incident.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* People Involved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incident.resident && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <User className="w-4 h-4" />
                Resident
              </div>
              <div className="text-sm">
                <p className="font-medium">
                  {incident.resident.firstName} {incident.resident.lastName}
                </p>
                {incident.resident.email && (
                  <p className="text-muted-foreground">{incident.resident.email}</p>
                )}
                {incident.resident.phone && (
                  <p className="text-muted-foreground">{incident.resident.phone}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <User className="w-4 h-4" />
              Reported By
            </div>
            <div className="text-sm">
              <p className="font-medium">
                {incident.reporter.firstName} {incident.reporter.lastName}
              </p>
              <p className="text-muted-foreground">
                {incident.reporter.role}
                {incident.reporter.email && ` • ${incident.reporter.email}`}
              </p>
            </div>
          </div>
        </div>

        {(incident.witnessDetails || incident.actionsTaken) && (
          <>
            <Separator />
            <div className="space-y-4">
              {incident.witnessDetails && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Witness Details</label>
                  <p className="text-sm mt-1">{incident.witnessDetails}</p>
                </div>
              )}
              {incident.actionsTaken && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actions Taken</label>
                  <p className="text-sm mt-1">{incident.actionsTaken}</p>
                </div>
              )}
            </div>
          </>
        )}

        {incident.followUpRequired && incident.followUpNotes && (
          <>
            <Separator />
            <div className="bg-muted/50 p-4 rounded-md">
              <label className="text-sm font-medium">Follow-up Notes</label>
              <p className="text-sm mt-1">{incident.followUpNotes}</p>
            </div>
          </>
        )}

        {/* Update Form for Authorized Users */}
        {canUpdate && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Update Incident</h3>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-incident"
                  >
                    Edit Status
                  </Button>
                )}
              </div>

              {isEditing && (
                <Form {...updateForm}>
                  <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
                    <FormField
                      control={updateForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-update-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="REPORTED">Reported</SelectItem>
                              <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                              <SelectItem value="RESOLVED">Resolved</SelectItem>
                              <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="actionsTaken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Actions Taken</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Document any additional actions..." 
                              {...field} 
                              data-testid="input-update-actions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="followUpRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-follow-up"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Follow-up Required</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {updateForm.watch('followUpRequired') && (
                      <FormField
                        control={updateForm.control}
                        name="followUpNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the required follow-up..." 
                                {...field} 
                                data-testid="input-follow-up-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          updateForm.reset();
                        }}
                        data-testid="button-cancel-update"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                        data-testid="button-submit-update"
                      >
                        {updateMutation.isPending ? 'Updating...' : 'Update Incident'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </>
        )}
      </div>
    </DialogContent>
  );
}

export default function Incidents() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ incidents: Incident[] }>({
    queryKey: ['/api/incidents', statusFilter !== 'all' ? statusFilter : ''],
  });

  const { data: tenantsData } = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['/api/tenants'],
  });

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      incidentType: 'SAFEGUARDING',
      severity: 'MEDIUM',
      title: '',
      description: '',
      location: '',
      witnessDetails: '',
      actionsTaken: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: IncidentFormValues) => {
      return await apiRequest('POST', '/api/incidents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: 'Incident Reported',
        description: 'The incident has been successfully reported.',
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to report incident. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: IncidentFormValues) => {
    createMutation.mutate(data);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailDialogOpen(true);
  };

  const incidents = data?.incidents || [];
  const tenants = tenantsData?.tenants || [];

  const filteredIncidents = statusFilter === 'all' 
    ? incidents
    : incidents.filter(i => i.status === statusFilter);

  const stats = {
    total: incidents.length,
    reported: incidents.filter(i => i.status === 'REPORTED').length,
    investigating: incidents.filter(i => i.status === 'UNDER_INVESTIGATION').length,
    critical: incidents.filter(i => i.severity === 'CRITICAL').length,
  };

  return (
    <div className="p-4 md:p-8" data-testid="page-incidents">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">Incident Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage incidents, safeguarding concerns, and accidents
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-report-incident">
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>
                Document safeguarding concerns, accidents, or other incidents
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief summary of the incident" 
                          {...field} 
                          data-testid="input-incident-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-incident-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SAFEGUARDING">Safeguarding</SelectItem>
                            <SelectItem value="MEDICATION">Medication</SelectItem>
                            <SelectItem value="ACCIDENT">Accident</SelectItem>
                            <SelectItem value="NEAR_MISS">Near Miss</SelectItem>
                            <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                            <SelectItem value="PROPERTY_DAMAGE">Property Damage</SelectItem>
                            <SelectItem value="MISSING_PERSON">Missing Person</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-severity">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="residentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Resident (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-resident">
                            <SelectValue placeholder="Select resident (if applicable)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.firstName} {tenant.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of what happened..." 
                          className="min-h-24"
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Where did this occur?" 
                          {...field} 
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="witnessDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Names and contact information of witnesses..." 
                          {...field} 
                          data-testid="input-witnesses"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actionsTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actions Taken</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What immediate actions were taken?" 
                          {...field} 
                          data-testid="input-actions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-incident"
                  >
                    {createMutation.isPending ? 'Reporting...' : 'Report Incident'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Action</CardTitle>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reported}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Investigation</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.investigating}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
              Critical
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {stats.critical}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${filteredIncidents.length} incident${filteredIncidents.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-incidents">All</TabsTrigger>
              <TabsTrigger value="REPORTED" data-testid="tab-reported">Reported</TabsTrigger>
              <TabsTrigger value="UNDER_INVESTIGATION" data-testid="tab-investigating">Investigating</TabsTrigger>
              <TabsTrigger value="RESOLVED" data-testid="tab-resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading incidents...</div>
              ) : filteredIncidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No incidents found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Incident</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.map((incident) => (
                        <TableRow key={incident.id} data-testid={`row-incident-${incident.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{incident.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {incident.description.length > 60 
                                  ? incident.description.substring(0, 60) + '...'
                                  : incident.description
                                }
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatIncidentType(incident.incidentType)}</span>
                          </TableCell>
                          <TableCell>
                            {incident.resident ? (
                              <span className="text-sm">
                                {incident.resident.firstName} {incident.resident.lastName}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityVariant(incident.severity)}>
                              {incident.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(incident.status)}
                              <span className="text-sm">
                                {formatStatus(incident.status)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(incident.reportedAt).toLocaleDateString()}</p>
                              <p className="text-muted-foreground">
                                {new Date(incident.reportedAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewIncident(incident)}
                              data-testid={`button-view-incident-${incident.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Incident Detail Dialog */}
      {selectedIncident && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <IncidentDetailDialog 
            incident={selectedIncident} 
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
          />
        </Dialog>
      )}
    </div>
  );
}
