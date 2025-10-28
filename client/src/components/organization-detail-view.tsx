import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Building2,
  Users,
  Home,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Save,
  X,
  UserCog,
} from 'lucide-react';

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z.string()
    .min(2, 'Subdomain must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  subscriptionTier: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  billingContact: z.string().optional(),
  billingEmail: z.string().email('Invalid billing email').optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type UpdateOrganizationFormData = z.infer<typeof updateOrganizationSchema>;

interface OrganizationDetailViewProps {
  organizationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationDetailView({
  organizationId,
  open,
  onOpenChange,
}: OrganizationDetailViewProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/organizations', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const response = await fetch(`/api/organizations/${organizationId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch organization');
      return response.json();
    },
    enabled: !!organizationId,
  });

  const organization = data?.organization;

  const form = useForm<UpdateOrganizationFormData>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: '',
      subdomain: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      postcode: '',
      subscriptionTier: 'BASIC',
      billingContact: '',
      billingEmail: '',
      billingAddress: '',
      paymentMethod: '',
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        subdomain: organization.subdomain || '',
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        address: organization.address || '',
        postcode: organization.postcode || '',
        subscriptionTier: organization.subscriptionTier || 'BASIC',
        billingContact: organization.billingContact || '',
        billingEmail: organization.billingEmail || '',
        billingAddress: organization.billingAddress || '',
        paymentMethod: organization.paymentMethod || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async (formData: UpdateOrganizationFormData) => {
      if (!organizationId) throw new Error('No organization ID');
      const response = await apiRequest('PUT', `/api/organizations/${organizationId}`, formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId] });
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpdateOrganizationFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        subdomain: organization.subdomain || '',
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        address: organization.address || '',
        postcode: organization.postcode || '',
        subscriptionTier: organization.subscriptionTier || 'BASIC',
        billingContact: organization.billingContact || '',
        billingEmail: organization.billingEmail || '',
        billingAddress: organization.billingAddress || '',
        paymentMethod: organization.paymentMethod || '',
      });
    }
    setIsEditing(false);
  };

  if (!organizationId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" data-testid="sheet-org-details">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading organization details...</p>
            </div>
          </div>
        ) : organization ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6" />
                  <div>
                    <SheetTitle data-testid="text-org-detail-name">{organization.name}</SheetTitle>
                    <SheetDescription>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {organization.subdomain}
                      </code>
                    </SheetDescription>
                  </div>
                </div>
                {organization.isActive ? (
                  <Badge variant="default">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-users">
                      {organization._count?.users || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Properties</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-properties">
                      {organization._count?.properties || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Residents</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-residents">
                      {organization._count?.residents || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-documents">
                      {organization._count?.documents || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Staff</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-staff">
                      {organization._count?.staff || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-incidents">
                      {organization._count?.incidents || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-org-compliance">
                      {organization._count?.compliance || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Organization Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Organization Details</h3>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-org"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={updateMutation.isPending}
                        data-testid="button-save-org"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <Form {...form}>
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subdomain"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Subdomain</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-subdomain" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-edit-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="postcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postcode</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-postcode" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subscriptionTier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subscription Tier</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-tier">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="FREE">Free</SelectItem>
                                  <SelectItem value="BASIC">Basic</SelectItem>
                                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="billingContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Contact</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-billing-contact" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="billingEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-edit-billing-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="billingAddress"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Billing Address</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-billing-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Payment Method</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-payment-method" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">Contact Email:</div>
                      <div data-testid="text-detail-email">{organization.contactEmail}</div>

                      <div className="text-muted-foreground">Contact Phone:</div>
                      <div data-testid="text-detail-phone">{organization.contactPhone || 'N/A'}</div>

                      <div className="text-muted-foreground">Address:</div>
                      <div data-testid="text-detail-address">{organization.address || 'N/A'}</div>

                      <div className="text-muted-foreground">Postcode:</div>
                      <div data-testid="text-detail-postcode">{organization.postcode || 'N/A'}</div>

                      <div className="text-muted-foreground">Subscription Tier:</div>
                      <div>
                        <Badge>{organization.subscriptionTier}</Badge>
                      </div>

                      <div className="text-muted-foreground">Billing Contact:</div>
                      <div>{organization.billingContact || 'N/A'}</div>

                      <div className="text-muted-foreground">Billing Email:</div>
                      <div>{organization.billingEmail || 'N/A'}</div>

                      <div className="text-muted-foreground">Payment Method:</div>
                      <div>{organization.paymentMethod || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Organization not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
