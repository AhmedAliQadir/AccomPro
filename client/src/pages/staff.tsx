import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, AlertCircle, FileText, Edit, UserMinus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle: string;
  dbsNumber?: string;
  dbsExpiryDate?: string;
  dbsCheckDate?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  trainingRecords?: Array<{
    courseName: string;
    completedDate: string;
    expiryDate?: string;
  }>;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
}

const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  jobTitle: z.string().min(1, 'Job title is required'),
  dbsNumber: z.string().optional(),
  dbsExpiryDate: z.string().optional(),
  dbsCheckDate: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
});

const trainingSchema = z.object({
  courseName: z.string().min(1, 'Course name is required'),
  completedDate: z.string().min(1, 'Completion date is required'),
  expiryDate: z.string().optional(),
});

type CreateStaffValues = z.infer<typeof createStaffSchema>;
type TrainingValues = z.infer<typeof trainingSchema>;

function CreateStaffDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      dbsNumber: '',
      dbsExpiryDate: '',
      dbsCheckDate: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateStaffValues) => {
      const payload = {
        ...data,
        email: data.email || undefined,
      };
      return await apiRequest('POST', '/api/staff', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: 'Staff Member Added',
        description: 'The staff member has been successfully added.',
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add staff member',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateStaffValues) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-staff">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to your organization
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-job-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dbsNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DBS Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-dbs-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dbsCheckDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DBS Check Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-dbs-check-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dbsExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DBS Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-dbs-expiry-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-start-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} data-testid="input-notes" />
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
                {createMutation.isPending ? 'Adding...' : 'Add Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddTrainingDialog({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrainingValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      courseName: '',
      completedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
    },
  });

  const addTrainingMutation = useMutation({
    mutationFn: async (data: TrainingValues) => {
      return await apiRequest('POST', `/api/staff/${staffId}/training`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: 'Training Added',
        description: `Training record added for ${staffName}`,
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add training record',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TrainingValues) => {
    addTrainingMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-add-training-${staffId}`}>
          <GraduationCap className="w-4 h-4 mr-2" />
          Add Training
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Training Record</DialogTitle>
          <DialogDescription>
            Add a training course completion for {staffName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Safeguarding Level 2" data-testid="input-course-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="completedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-completed-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-expiry-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addTrainingMutation.isPending} data-testid="button-submit-training">
                {addTrainingMutation.isPending ? 'Adding...' : 'Add Training'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StaffDetailDialog({ member, open, onClose }: { member: StaffMember | null; open: boolean; onClose: () => void }) {
  if (!member) return null;

  const isDbsExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);
    return expiry <= sixtyDaysFromNow && expiry >= today;
  };

  const dbsExpiring = isDbsExpiringSoon(member.dbsExpiryDate);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {member.firstName} {member.lastName}
          </DialogTitle>
          <DialogDescription>{member.jobTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant={member.isActive ? 'default' : 'secondary'}>
              {member.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {dbsExpiring && (
              <Badge variant="outline" className="border-orange-400 text-orange-600">
                DBS Expiring Soon
              </Badge>
            )}
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Contact Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {member.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{member.email}</p>
                </div>
              )}
              {member.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{member.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">{new Date(member.startDate).toLocaleDateString()}</p>
              </div>
              {member.endDate && (
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-sm font-medium">{new Date(member.endDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* DBS Details */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">DBS Check</h3>
            {member.dbsNumber ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">DBS Number</p>
                  <p className="text-sm font-mono font-medium">{member.dbsNumber}</p>
                </div>
                {member.dbsCheckDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Check Date</p>
                    <p className="text-sm font-medium">{new Date(member.dbsCheckDate).toLocaleDateString()}</p>
                  </div>
                )}
                {member.dbsExpiryDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expiry Date</p>
                    <p className={`text-sm font-medium ${dbsExpiring ? 'text-orange-600' : ''}`}>
                      {new Date(member.dbsExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No DBS record on file</p>
            )}
          </div>

          {/* Training Records */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Training Records ({member.trainingRecords?.length || 0} courses)
            </h3>
            {member.trainingRecords && member.trainingRecords.length > 0 ? (
              <div className="space-y-2">
                {member.trainingRecords.map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="text-sm font-medium">{record.courseName}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(record.completedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {record.expiryDate && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(record.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No training records on file</p>
            )}
          </div>

          {/* Emergency Contact */}
          {member.emergencyContact && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{member.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Relationship</p>
                  <p className="text-sm font-medium">{member.emergencyContact.relationship}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{member.emergencyContact.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateStaffDialog({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/staff/${staffId}/deactivate`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: 'Staff Deactivated',
        description: `${staffName} has been deactivated`,
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate staff member',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-deactivate-${staffId}`}>
          <UserMinus className="w-4 h-4 mr-2" />
          Deactivate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Staff Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate {staffName}? They will be marked as inactive but their record will be preserved.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => deactivateMutation.mutate()}
            disabled={deactivateMutation.isPending}
            data-testid="button-confirm-deactivate"
          >
            {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { user } = useAuth();

  const handleRowClick = (member: StaffMember) => {
    setSelectedStaff(member);
    setDetailOpen(true);
  };

  const { data, isLoading } = useQuery<{ staff: StaffMember[] }>({
    queryKey: ['/api/staff'],
  });

  const staff = data?.staff || [];

  const filteredStaff = staff.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || 
           member.jobTitle.toLowerCase().includes(searchLower);
  });

  const displayStaff = activeTab === 'active' 
    ? filteredStaff.filter(s => s.isActive)
    : activeTab === 'inactive'
    ? filteredStaff.filter(s => !s.isActive)
    : filteredStaff;

  const isDbsExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);
    return expiry <= sixtyDaysFromNow && expiry >= today;
  };

  const dbsExpiring = staff.filter(s => isDbsExpiringSoon(s.dbsExpiryDate));
  const canManage = user?.role === 'ADMIN' || user?.role === 'OPS' || user?.role === 'ORG_ADMIN';

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
    <div className="p-8" data-testid="page-staff">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your care staff, DBS checks, and training records
          </p>
        </div>
        {canManage && <CreateStaffDialog />}
      </div>

      {dbsExpiring.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-orange-900 dark:text-orange-100">
                DBS Checks Expiring Soon
              </CardTitle>
            </div>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {dbsExpiring.length} staff member{dbsExpiring.length !== 1 ? 's have' : ' has'} DBS checks expiring within 60 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dbsExpiring.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                  <div>
                    <p className="font-medium">{member.firstName} {member.lastName}</p>
                    <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Expires: {member.dbsExpiryDate && new Date(member.dbsExpiryDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">DBS: {member.dbsNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search staff by name or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-staff"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            {displayStaff.length} staff member{displayStaff.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-staff">All</TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active-staff">Active</TabsTrigger>
              <TabsTrigger value="inactive" data-testid="tab-inactive-staff">Inactive</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {displayStaff.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No staff members found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>DBS Status</TableHead>
                      <TableHead>Training</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStaff.map((member) => (
                      <TableRow 
                        key={member.id} 
                        data-testid={`row-staff-${member.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(member)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                              Started: {new Date(member.startDate).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{member.jobTitle}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {member.email && <p>{member.email}</p>}
                            {member.phone && <p className="text-muted-foreground">{member.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.dbsNumber ? (
                            <div>
                              <p className="text-sm font-mono">{member.dbsNumber}</p>
                              {member.dbsExpiryDate && (
                                <p className={`text-xs ${isDbsExpiringSoon(member.dbsExpiryDate) ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground'}`}>
                                  Exp: {new Date(member.dbsExpiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {member.trainingRecords?.length || 0} courses
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.isActive ? 'default' : 'secondary'}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {canManage && member.isActive && (
                              <>
                                <AddTrainingDialog 
                                  staffId={member.id} 
                                  staffName={`${member.firstName} ${member.lastName}`} 
                                />
                                <DeactivateStaffDialog 
                                  staffId={member.id} 
                                  staffName={`${member.firstName} ${member.lastName}`} 
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StaffDetailDialog 
        member={selectedStaff} 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
      />
    </div>
  );
}
