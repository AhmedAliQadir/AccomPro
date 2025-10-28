import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Users, Home, Search, CheckCircle2, XCircle, Plus, ShieldAlert } from 'lucide-react';
import { AddOrganizationWizard } from '@/components/add-organization-wizard';
import { OrganizationDetailView } from '@/components/organization-detail-view';
import { useAuth } from '@/lib/auth';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    properties: number;
  };
}

interface OrganizationsResponse {
  organizations: Organization[];
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  const isPlatformAdmin = user?.isPlatformAdmin === true;

  const { data, isLoading } = useQuery<OrganizationsResponse>({
    queryKey: ['/api/organizations'],
    enabled: isPlatformAdmin,
  });

  const organizations = data?.organizations || [];

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'default';
      case 'PROFESSIONAL':
        return 'secondary';
      case 'STARTER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Access denied for non-Platform Admins
  if (!isPlatformAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This page is restricted to Platform Administrators only.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Only Orbixio LTD staff can manage organizations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-organizations">
            Organizations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all customer organizations on the AccommodateME platform
          </p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} data-testid="button-add-organization">
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Add Organization Wizard */}
      <AddOrganizationWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />

      {/* Organization Detail View */}
      <OrganizationDetailView
        organizationId={selectedOrgId}
        open={isDetailViewOpen}
        onOpenChange={(open) => {
          setIsDetailViewOpen(open);
          if (!open) setSelectedOrgId(null);
        }}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-orgs">
              {organizations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-orgs">
              {organizations.filter((org) => org.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">
              {organizations.reduce((sum, org) => sum + org._count.users, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, subdomain, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-orgs"
            />
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Properties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No organizations found matching your search' : 'No organizations yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => {
                        setSelectedOrgId(org.id);
                        setIsDetailViewOpen(true);
                      }}
                      data-testid={`row-org-${org.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div data-testid={`text-org-name-${org.id}`}>{org.name}</div>
                            {org.address && (
                              <div className="text-xs text-muted-foreground">
                                {org.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {org.subdomain}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{org.contactEmail}</div>
                          {org.contactPhone && (
                            <div className="text-xs text-muted-foreground">
                              {org.contactPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTierBadgeVariant(org.subscriptionTier)}>
                          {org.subscriptionTier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {org.isActive ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Inactive</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span data-testid={`text-org-users-${org.id}`}>
                            {org._count.users}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Home className="h-3 w-3 text-muted-foreground" />
                          <span data-testid={`text-org-properties-${org.id}`}>
                            {org._count.properties}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
