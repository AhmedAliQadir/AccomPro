import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
  dateOfBirth: string;
  tenancies: Array<{
    id: string;
    isActive: boolean;
    room: {
      roomNumber: string;
      property: {
        id: string;
        name: string;
      };
    };
  }>;
  _count: {
    documents: number;
  };
}

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  READY_FOR_TENANCY: 'secondary',
  ACTIVE: 'default',
  INACTIVE: 'destructive',
};

export default function TenantsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['/api/tenants'],
  });

  const canCreate = user?.role === 'ADMIN' || user?.role === 'OPS' || user?.role === 'SUPPORT';

  const filteredTenants = (data?.tenants || []).filter((tenant) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      tenant.firstName.toLowerCase().includes(searchLower) ||
      tenant.lastName.toLowerCase().includes(searchLower) ||
      tenant.email?.toLowerCase().includes(searchLower) ||
      tenant.phone?.includes(search)
    );
  });

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
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant information and onboarding
          </p>
        </div>
        {canCreate && (
          <Link href="/tenants/new">
            <a>
              <Button data-testid="button-create-tenant">
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </a>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tenants"
          />
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {search ? 'No tenants found' : 'No tenants yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Get started by adding your first tenant'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTenants.map((tenant) => {
            const activeTenancy = tenant.tenancies.find((t) => t.isActive);
            return (
              <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
                <a>
                  <Card className="hover-elevate active-elevate-2" data-testid={`card-tenant-${tenant.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {tenant.firstName} {tenant.lastName}
                          </CardTitle>
                          <CardDescription className="flex flex-col gap-1 mt-2">
                            {tenant.email && <span>{tenant.email}</span>}
                            {tenant.phone && <span>{tenant.phone}</span>}
                            {activeTenancy && (
                              <span className="flex items-center gap-1">
                                <span className="text-muted-foreground">Room:</span>
                                <span className="font-medium">
                                  {activeTenancy.room.property.name} - Room {activeTenancy.room.roomNumber}
                                </span>
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={statusColors[tenant.status] || 'outline'}>
                            {tenant.status.replace(/_/g, ' ')}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {tenant._count.documents} documents
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
