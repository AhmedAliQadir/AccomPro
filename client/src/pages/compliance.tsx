import { Plus, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
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
  findings?: Array<{
    area: string;
    observation: string;
    severity: string;
  }>;
  actionPlan?: Array<{
    action: string;
    responsible: string;
    dueDate: string;
    status: string;
  }>;
}

const formatAuditType = (type: AuditType) => {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

const getStatusVariant = (status: ComplianceStatus) => {
  switch (status) {
    case 'COMPLETED': return 'default';
    case 'IN_PROGRESS': return 'secondary';
    case 'PENDING': return 'outline';
    case 'OVERDUE': return 'destructive';
  }
};

export default function Compliance() {
  // Mock data for demonstration
  const mockAudits: ComplianceAudit[] = [
    {
      id: '1',
      title: 'CQC Annual Inspection 2025',
      auditType: 'CQC_INSPECTION',
      status: 'IN_PROGRESS',
      auditDate: '2025-11-15T00:00:00Z',
      auditorName: 'CQC Inspector - Jane Smith',
      score: 85,
      findings: [
        { area: 'Medication Management', observation: 'Good practices observed', severity: 'LOW' },
        { area: 'Staff Training', observation: 'Some gaps in safeguarding training', severity: 'MEDIUM' },
      ],
      actionPlan: [
        { action: 'Complete safeguarding training for all staff', responsible: 'Sarah Johnson', dueDate: '2025-12-01', status: 'IN_PROGRESS' },
      ],
    },
    {
      id: '2',
      title: 'Fire Safety Audit Q4',
      auditType: 'FIRE_SAFETY',
      status: 'COMPLETED',
      auditDate: '2025-10-01T00:00:00Z',
      auditorName: 'Fire Safety Officer',
      score: 95,
      findings: [
        { area: 'Fire Exits', observation: 'All exits clear and accessible', severity: 'LOW' },
        { area: 'Equipment', observation: 'All extinguishers serviced', severity: 'LOW' },
      ],
    },
    {
      id: '3',
      title: 'Internal Quality Audit',
      auditType: 'INTERNAL_AUDIT',
      status: 'PENDING',
      auditDate: '2025-11-30T00:00:00Z',
    },
  ];

  const audits = mockAudits;

  const stats = {
    total: audits.length,
    completed: audits.filter(a => a.status === 'COMPLETED').length,
    inProgress: audits.filter(a => a.status === 'IN_PROGRESS').length,
    overdue: audits.filter(a => a.status === 'OVERDUE').length,
  };

  return (
    <div className="p-8" data-testid="page-compliance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Compliance & Audits</h1>
          <p className="text-muted-foreground mt-1">
            Track CQC inspections, internal audits, and regulatory compliance
          </p>
        </div>
        <Button data-testid="button-create-audit">
          <Plus className="w-4 h-4 mr-2" />
          New Audit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active audits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className={stats.overdue > 0 ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stats.overdue > 0 ? 'text-red-900 dark:text-red-100' : ''}`}>
              Overdue
            </CardTitle>
            <AlertCircle className={`w-4 h-4 ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-900 dark:text-red-100' : ''}`}>
              {stats.overdue}
            </div>
            <p className={`text-xs ${stats.overdue > 0 ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audits List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
          <CardDescription>
            Compliance audits and inspections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id} data-testid={`row-audit-${audit.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{audit.title}</p>
                      {audit.findings && audit.findings.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {audit.findings.length} finding{audit.findings.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatAuditType(audit.auditType)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(audit.auditDate).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{audit.auditorName || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {audit.score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          audit.score >= 80 ? 'text-green-600 dark:text-green-400' : 
                          audit.score >= 60 ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {audit.score}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(audit.status)}>
                      {audit.status.split('_').map(word => 
                        word.charAt(0) + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {audit.actionPlan && audit.actionPlan.length > 0 ? (
                      <span className="text-sm">
                        {audit.actionPlan.length} action{audit.actionPlan.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-view-audit-${audit.id}`}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
