import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Building2, User, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const organizationWizardSchema = z.object({
  // Organization details
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z.string()
    .min(2, 'Subdomain must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  subscriptionTier: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).default('BASIC'),
  billingContact: z.string().optional(),
  billingEmail: z.string().email('Invalid billing email').optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
  
  // Initial admin user details
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
  adminEmail: z.string().email('Invalid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminPasswordConfirm: z.string(),
}).refine((data) => data.adminPassword === data.adminPasswordConfirm, {
  message: "Passwords don't match",
  path: ["adminPasswordConfirm"],
});

type OrganizationWizardFormData = z.infer<typeof organizationWizardSchema>;

interface AddOrganizationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddOrganizationWizard({ open, onOpenChange }: AddOrganizationWizardProps) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('organization');

  const form = useForm<OrganizationWizardFormData>({
    resolver: zodResolver(organizationWizardSchema),
    defaultValues: {
      organizationName: '',
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
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      adminPasswordConfirm: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: OrganizationWizardFormData) => {
      const payload = {
        organization: {
          name: formData.organizationName,
          subdomain: formData.subdomain,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          address: formData.address,
          postcode: formData.postcode,
          subscriptionTier: formData.subscriptionTier,
          billingContact: formData.billingContact,
          billingEmail: formData.billingEmail,
          billingAddress: formData.billingAddress,
          paymentMethod: formData.paymentMethod,
        },
        initialAdmin: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.adminEmail,
          password: formData.adminPassword,
        },
      };

      const response = await apiRequest('POST', '/api/organizations', payload);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: 'Success',
        description: `Organization "${data.organization.name}" created successfully! Admin user: ${data.adminUser.email}`,
      });
      form.reset();
      setCurrentTab('organization');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OrganizationWizardFormData) => {
    createMutation.mutate(data);
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof OrganizationWizardFormData)[] = [];
    
    if (currentTab === 'organization') {
      fieldsToValidate = [
        'organizationName',
        'subdomain',
        'contactEmail',
        'subscriptionTier',
      ];
    } else if (currentTab === 'admin') {
      fieldsToValidate = [
        'adminFirstName',
        'adminLastName',
        'adminEmail',
        'adminPassword',
        'adminPasswordConfirm',
      ];
    }

    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      if (currentTab === 'organization') {
        setCurrentTab('admin');
      } else if (currentTab === 'admin') {
        setCurrentTab('review');
      }
    }
  };

  const formData = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-organization">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization and set up the initial administrator account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="organization" data-testid="tab-organization">
                  <Building2 className="h-4 w-4 mr-2" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="admin" data-testid="tab-admin">
                  <User className="h-4 w-4 mr-2" />
                  Initial Admin
                </TabsTrigger>
                <TabsTrigger value="review" data-testid="tab-review">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Review
                </TabsTrigger>
              </TabsList>

              {/* Step 1: Organization Details */}
              <TabsContent value="organization" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Hope Trust Housing" {...field} data-testid="input-org-name" />
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
                        <FormLabel>Subdomain *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., hope-trust" {...field} data-testid="input-subdomain" />
                        </FormControl>
                        <FormDescription>
                          Lowercase letters, numbers, and hyphens only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@example.com" {...field} data-testid="input-contact-email" />
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
                          <Input placeholder="01234 567890" {...field} data-testid="input-contact-phone" />
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
                          <Input placeholder="Street address" {...field} data-testid="input-address" />
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
                          <Input placeholder="SW1A 1AA" {...field} data-testid="input-postcode" />
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
                        <FormLabel>Subscription Tier *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subscription-tier">
                              <SelectValue placeholder="Select tier" />
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
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-4">Billing Information (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="billingContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} data-testid="input-billing-contact" />
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
                            <Input type="email" placeholder="billing@example.com" {...field} data-testid="input-billing-email" />
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
                            <Input placeholder="Billing address" {...field} data-testid="input-billing-address" />
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
                            <Input placeholder="e.g., Credit Card, Bank Transfer" {...field} data-testid="input-payment-method" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Step 2: Initial Admin User */}
              <TabsContent value="admin" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-admin-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} data-testid="input-admin-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" {...field} data-testid="input-admin-email" />
                        </FormControl>
                        <FormDescription>
                          This will be used to log in to the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} data-testid="input-admin-password" />
                        </FormControl>
                        <FormDescription>
                          Minimum 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminPasswordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} data-testid="input-admin-password-confirm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Step 3: Review */}
              <TabsContent value="review" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">Name:</div>
                        <div className="font-medium" data-testid="text-review-org-name">{formData.organizationName}</div>
                        
                        <div className="text-muted-foreground">Subdomain:</div>
                        <div className="font-medium" data-testid="text-review-subdomain">{formData.subdomain}</div>
                        
                        <div className="text-muted-foreground">Contact Email:</div>
                        <div className="font-medium">{formData.contactEmail}</div>
                        
                        {formData.contactPhone && (
                          <>
                            <div className="text-muted-foreground">Contact Phone:</div>
                            <div className="font-medium">{formData.contactPhone}</div>
                          </>
                        )}
                        
                        <div className="text-muted-foreground">Subscription Tier:</div>
                        <div className="font-medium">{formData.subscriptionTier}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Initial Administrator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">Name:</div>
                        <div className="font-medium" data-testid="text-review-admin-name">
                          {formData.adminFirstName} {formData.adminLastName}
                        </div>
                        
                        <div className="text-muted-foreground">Email:</div>
                        <div className="font-medium" data-testid="text-review-admin-email">{formData.adminEmail}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between gap-2">
              {currentTab !== 'organization' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentTab === 'admin') setCurrentTab('organization');
                    else if (currentTab === 'review') setCurrentTab('admin');
                  }}
                  data-testid="button-wizard-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              <div className="flex-1" />

              {currentTab === 'review' ? (
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-create-organization"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Organization'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  data-testid="button-wizard-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
