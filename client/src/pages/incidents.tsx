import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  reportedAt: string;
  occurredAt?: string;
  resident?: {
    firstName: string;
    lastName: string;
  };
  reporter: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Helper to get badge variant based on severity
const getSeverityVariant = (severity: IncidentSeverity) => {
  switch (severity) {
    case 'CRITICAL': return 'destructive';
    case 'HIGH': return 'destructive';
    case 'MEDIUM': return 'default';
    case 'LOW': return 'secondary';
  }
};

// Helper to get status icon
const getStatusIcon = (status: IncidentStatus) => {
  switch (status) {
    case 'REPORTED': return <AlertTriangle className="w-4 h-4" />;
    case 'UNDER_INVESTIGATION': return <Clock className="w-4 h-4" />;
    case 'RESOLVED': return <CheckCircle className="w-4 h-4" />;
    case 'CLOSED': return <XCircle className="w-4 h-4" />;
  }
};

// Format incident type for display
const formatIncidentType = (type: IncidentType) => {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

export default function Incidents() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Example: This would fetch from /api/incidents
  const { data, isLoading } = useQuery<{ incidents: Incident[] }>({
    queryKey: ['/api/incidents', statusFilter],
    enabled: false, // Disabled for demo since backend isn't connected
  });

  // Mock data for demonstration
  const mockIncidents: Incident[] = [
    {
      id: '1',
      title: 'Medication Administration Error',
      incidentType: 'MEDICATION',
      severity: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      description: 'Wrong dosage of medication administered to resident.',
      location: 'Room 12A',
      reportedAt: '2025-10-20T14:30:00Z',
      occurredAt: '2025-10-20T13:00:00Z',
      resident: {
        firstName: 'John',
        lastName: 'Smith',
      },
      reporter: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'SUPPORT',
      },
    },
    {
      id: '2',
      title: 'Safeguarding Concern Raised',
      incidentType: 'SAFEGUARDING',
      severity: 'CRITICAL',
      status: 'REPORTED',
      description: 'Resident reported concerns about safety.',
      location: 'Test Property',
      reportedAt: '2025-10-21T09:15:00Z',
      occurredAt: '2025-10-21T08:00:00Z',
      resident: {
        firstName: 'Jane',
        lastName: 'Doe',
      },
      reporter: {
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'SUPPORT',
      },
    },
    {
      id: '3',
      title: 'Minor Slip in Bathroom',
      incidentType: 'ACCIDENT',
      severity: 'LOW',
      status: 'RESOLVED',
      description: 'Resident slipped on wet floor but no injuries sustained.',
      location: 'Shared Bathroom',
      reportedAt: '2025-10-19T16:45:00Z',
      occurredAt: '2025-10-19T16:30:00Z',
      resident: {
        firstName: 'Ahmed',
        lastName: 'Qadir',
      },
      reporter: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'SUPPORT',
      },
    },
  ];

  const incidents = mockIncidents;

  // Filter by status
  const filteredIncidents = statusFilter === 'all' 
    ? incidents
    : incidents.filter(i => i.status === statusFilter);

  // Stats
  const stats = {
    total: incidents.length,
    reported: incidents.filter(i => i.status === 'REPORTED').length,
    investigating: incidents.filter(i => i.status === 'UNDER_INVESTIGATION').length,
    critical: incidents.filter(i => i.severity === 'CRITICAL').length,
  };

  return (
    <div className="p-8" data-testid="page-incidents">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Incident Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage incidents, safeguarding concerns, and accidents
          </p>
        </div>
        <Button data-testid="button-report-incident">
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
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
                            {incident.status.split('_').map(word => 
                              word.charAt(0) + word.slice(1).toLowerCase()
                            ).join(' ')}
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
                        <Button variant="ghost" size="sm" data-testid={`button-view-incident-${incident.id}`}>
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
