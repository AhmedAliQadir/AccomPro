import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, AlertCircle, Calendar, FileText } from 'lucide-react';
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

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle: string;
  dbsNumber?: string;
  dbsExpiryDate?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  trainingRecords?: Array<{
    courseName: string;
    completedDate: string;
    expiryDate?: string;
  }>;
}

export default function Staff() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Example: This would fetch from /api/staff
  const { data, isLoading } = useQuery<{ staff: StaffMember[] }>({
    queryKey: ['/api/staff', activeTab],
    enabled: false, // Disabled for demo since backend isn't connected
  });

  // Mock data for demonstration
  const mockStaff: StaffMember[] = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@saifcare.com',
      phone: '07700 900123',
      jobTitle: 'Senior Support Worker',
      dbsNumber: 'DBS001234567',
      dbsExpiryDate: '2025-06-15',
      startDate: '2022-03-01',
      isActive: true,
      trainingRecords: [
        { courseName: 'Safeguarding Level 2', completedDate: '2024-01-15', expiryDate: '2027-01-15' },
        { courseName: 'First Aid', completedDate: '2024-03-20', expiryDate: '2027-03-20' },
      ],
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@saifcare.com',
      phone: '07700 900124',
      jobTitle: 'Support Worker',
      dbsNumber: 'DBS001234568',
      dbsExpiryDate: '2025-02-10',
      startDate: '2023-01-15',
      isActive: true,
      trainingRecords: [
        { courseName: 'Mental Health Awareness', completedDate: '2024-02-10' },
      ],
    },
    {
      id: '3',
      firstName: 'Emily',
      lastName: 'Williams',
      email: 'emily.williams@saifcare.com',
      phone: '07700 900125',
      jobTitle: 'Operations Manager',
      dbsNumber: 'DBS001234569',
      dbsExpiryDate: '2024-12-20',
      startDate: '2021-06-01',
      isActive: true,
    },
  ];

  const staff = mockStaff;

  // Filter staff based on search
  const filteredStaff = staff.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || 
           member.jobTitle.toLowerCase().includes(searchLower);
  });

  // Filter by active status
  const displayStaff = activeTab === 'active' 
    ? filteredStaff.filter(s => s.isActive)
    : activeTab === 'inactive'
    ? filteredStaff.filter(s => !s.isActive)
    : filteredStaff;

  // Check if DBS is expiring soon (within 60 days)
  const isDbsExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);
    return expiry <= sixtyDaysFromNow && expiry >= today;
  };

  const dbsExpiring = staff.filter(s => isDbsExpiringSoon(s.dbsExpiryDate));

  return (
    <div className="p-8" data-testid="page-staff">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your care staff, DBS checks, and training records
          </p>
        </div>
        <Button data-testid="button-add-staff">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* DBS Expiry Alerts */}
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

      {/* Search and Filters */}
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

      {/* Staff List */}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>DBS Status</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayStaff.map((member) => (
                    <TableRow key={member.id} data-testid={`row-staff-${member.id}`}>
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
                        <Button variant="ghost" size="sm" data-testid={`button-view-staff-${member.id}`}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
