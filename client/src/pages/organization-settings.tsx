import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Building2, CreditCard, Save } from 'lucide-react';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  billingContact: z.string().optional(),
  billingEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery<{ organization: any }>({
    queryKey: ['/api/organization/settings'],
  });

  const organization = data?.organization;

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      postcode: '',
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
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        address: organization.address || '',
        postcode: organization.postcode || '',
        billingContact: organization.billingContact || '',
        billingEmail: organization.billingEmail || '',
        billingAddress: organization.billingAddress || '',
        paymentMethod: organization.paymentMethod || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async (formData: OrganizationFormData) => {
      return apiRequest('/api/organization/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization/settings'] });
      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update organization settings',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        contactEmail: organization.contactEmail || '',
        contactPhone: organization.contactPhone || '',
        address: organization.address || '',
        postcode: organization.postcode || '',
        billingContact: organization.billingContact || '',
        billingEmail: organization.billingEmail || '',
        billingAddress: organization.billingAddress || '',
        paymentMethod: organization.paymentMethod || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Organization not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Organization Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization's details and billing information
            </p>
          </div>
          {!isEditing && canEdit && (
            <Button onClick={() => setIsEditing(true)} data-testid="button-edit-settings">
              Edit Settings
            </Button>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Details
                </CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-organization-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Subscription Tier</FormLabel>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {organization.subscriptionTier}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            disabled={!isEditing}
                            data-testid="input-contact-email"
                          />
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
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-contact-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          rows={2}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem className="md:w-1/2">
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          data-testid="input-postcode"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Manage billing contacts and payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="billingContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="e.g., Finance Manager"
                            data-testid="input-billing-contact"
                          />
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
                          <Input
                            {...field}
                            type="email"
                            disabled={!isEditing}
                            placeholder="billing@example.com"
                            data-testid="input-billing-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          rows={2}
                          placeholder="If different from organization address"
                          data-testid="input-billing-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="e.g., Credit Card ending in 1234"
                          data-testid="input-payment-method"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </Form>

        <Card>
          <CardHeader>
            <CardTitle>Organization ID</CardTitle>
            <CardDescription>
              This is your unique organization identifier for API integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block p-3 bg-muted rounded text-sm font-mono" data-testid="text-organization-id">
              {organization.id}
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
