import { prisma } from '../prisma';

// All tool handlers are scoped by organizationId from JWT — never from tool input

export async function getStaffOverview(organizationId: string) {
  const staff = await prisma.staff.findMany({
    where: { organizationId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      isActive: true,
      startDate: true,
      endDate: true,
    },
  });
  const active = staff.filter(s => s.isActive);
  const inactive = staff.filter(s => !s.isActive);
  const jobTitles = Array.from(new Set(active.map(s => s.jobTitle)));
  return {
    totalStaff: staff.length,
    activeStaff: active.length,
    inactiveStaff: inactive.length,
    jobTitles,
    staff: active.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      jobTitle: s.jobTitle,
      startDate: s.startDate,
    })),
  };
}

export async function getStaffDbsStatus(organizationId: string) {
  const staff = await prisma.staff.findMany({
    where: { organizationId, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dbsNumber: true,
      dbsExpiryDate: true,
      dbsCheckDate: true,
    },
  });
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expired = staff.filter(s => s.dbsExpiryDate && new Date(s.dbsExpiryDate) < now);
  const expiringWithin30 = staff.filter(s => s.dbsExpiryDate && new Date(s.dbsExpiryDate) >= now && new Date(s.dbsExpiryDate) <= thirtyDays);
  const expiringWithin90 = staff.filter(s => s.dbsExpiryDate && new Date(s.dbsExpiryDate) > thirtyDays && new Date(s.dbsExpiryDate) <= ninetyDays);
  const valid = staff.filter(s => s.dbsExpiryDate && new Date(s.dbsExpiryDate) > ninetyDays);
  const noDbs = staff.filter(s => !s.dbsNumber);

  const formatList = (list: typeof staff) => list.map(s => ({
    name: `${s.firstName} ${s.lastName}`,
    dbsExpiry: s.dbsExpiryDate,
  }));

  return {
    totalActive: staff.length,
    expired: { count: expired.length, staff: formatList(expired) },
    expiringWithin30Days: { count: expiringWithin30.length, staff: formatList(expiringWithin30) },
    expiringWithin90Days: { count: expiringWithin90.length, staff: formatList(expiringWithin90) },
    valid: { count: valid.length },
    noDbs: { count: noDbs.length, staff: formatList(noDbs) },
  };
}

export async function getStaffTrainingStatus(organizationId: string) {
  const staff = await prisma.staff.findMany({
    where: { organizationId, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      trainingRecords: true,
    },
  });

  const now = new Date();
  const results = staff.map(s => {
    const records = (s.trainingRecords as any[] | null) || [];
    const expired = records.filter(r => r.expiryDate && new Date(r.expiryDate) < now);
    const current = records.filter(r => !r.expiryDate || new Date(r.expiryDate) >= now);
    return {
      name: `${s.firstName} ${s.lastName}`,
      totalCourses: records.length,
      currentCourses: current.length,
      expiredCourses: expired.length,
      expiredDetails: expired.map(r => ({ course: r.courseName, expiredOn: r.expiryDate })),
    };
  });

  return {
    totalStaff: staff.length,
    staffWithExpiredTraining: results.filter(r => r.expiredCourses > 0).length,
    staffTraining: results,
  };
}

export async function getComplianceAudits(organizationId: string, input: { status?: string; auditType?: string }) {
  const where: any = { organizationId };
  if (input.status) where.status = input.status;
  if (input.auditType) where.auditType = input.auditType;

  const audits = await prisma.compliance.findMany({
    where,
    orderBy: { auditDate: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      auditType: true,
      status: true,
      auditDate: true,
      auditorName: true,
      score: true,
      findings: true,
      actionPlan: true,
      dueDate: true,
      completedAt: true,
    },
  });
  return { count: audits.length, audits };
}

export async function getComplianceDashboard(organizationId: string) {
  const audits = await prisma.compliance.findMany({
    where: { organizationId },
    select: { status: true, auditType: true, dueDate: true, auditDate: true, title: true },
  });

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  audits.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byType[a.auditType] = (byType[a.auditType] || 0) + 1;
  });

  const now = new Date();
  const upcoming = audits
    .filter(a => a.dueDate && new Date(a.dueDate) > now && a.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)
    .map(a => ({ title: a.title, dueDate: a.dueDate, type: a.auditType }));

  return { total: audits.length, byStatus, byType, upcomingAudits: upcoming };
}

export async function getIncidentStats(organizationId: string) {
  const incidents = await prisma.incident.findMany({
    where: { organizationId },
    select: { status: true, severity: true, incidentType: true },
  });

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  incidents.forEach(i => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    byType[i.incidentType] = (byType[i.incidentType] || 0) + 1;
  });

  return { total: incidents.length, byStatus, bySeverity, byType };
}

export async function getIncidents(organizationId: string, input: { status?: string; severity?: string; limit?: number }) {
  const where: any = { organizationId };
  if (input.status) where.status = input.status;
  if (input.severity) where.severity = input.severity;

  const incidents = await prisma.incident.findMany({
    where,
    orderBy: { reportedAt: 'desc' },
    take: input.limit || 20,
    select: {
      id: true,
      title: true,
      incidentType: true,
      severity: true,
      status: true,
      description: true,
      reportedAt: true,
      resolvedAt: true,
      followUpRequired: true,
      reporter: { select: { firstName: true, lastName: true } },
      resident: { select: { firstName: true, lastName: true } },
    },
  });
  return { count: incidents.length, incidents };
}

export async function getTenantOverview(organizationId: string) {
  const tenants = await prisma.tenant.findMany({
    where: { organizationId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      documents: { select: { type: true, status: true } },
    },
  });

  const byStatus: Record<string, number> = {};
  tenants.forEach(t => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });

  const tenantsWithDocIssues = tenants.filter(t => {
    const pending = t.documents.filter(d => d.status === 'PENDING').length;
    const rejected = t.documents.filter(d => d.status === 'REJECTED').length;
    return pending > 0 || rejected > 0;
  }).length;

  return {
    total: tenants.length,
    byStatus,
    tenantsWithDocumentIssues: tenantsWithDocIssues,
  };
}

export async function getPropertyOccupancy(organizationId: string) {
  const properties = await prisma.property.findMany({
    where: { organizationId },
    include: {
      rooms: {
        include: {
          tenancies: { where: { isActive: true } },
        },
      },
    },
  });

  return properties.map(p => {
    const totalRooms = p.rooms.length;
    const occupiedRooms = p.rooms.filter(r => r.tenancies.length > 0).length;
    return {
      name: p.name,
      address: p.address,
      totalRooms,
      occupiedRooms,
      vacantRooms: totalRooms - occupiedRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    };
  });
}

export async function getDocumentCompliance(organizationId: string) {
  const docs = await prisma.document.findMany({
    where: { organizationId },
    select: {
      type: true,
      status: true,
      isMandatory: true,
      tenant: { select: { firstName: true, lastName: true } },
    },
  });

  const byStatus: Record<string, number> = {};
  docs.forEach(d => {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  });

  const mandatoryPending = docs.filter(d => d.isMandatory && d.status === 'PENDING');

  return {
    total: docs.length,
    byStatus,
    mandatoryPendingCount: mandatoryPending.length,
    mandatoryPending: mandatoryPending.map(d => ({
      type: d.type,
      tenant: `${d.tenant.firstName} ${d.tenant.lastName}`,
    })),
  };
}

export async function getSupportNotesSummary(organizationId: string, input: { days?: number }) {
  const days = input.days || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const notes = await prisma.supportNote.findMany({
    where: { organizationId, sessionDate: { gte: since } },
    select: {
      sessionDate: true,
      attendanceStatus: true,
      contactType: true,
    },
  });

  const total = notes.length;
  const present = notes.filter(n => n.attendanceStatus === 'PRESENT').length;
  const dna = notes.filter(n => n.attendanceStatus === 'DID_NOT_ATTEND').length;
  const auth = notes.filter(n => n.attendanceStatus === 'AUTHORISED_NON_ATTENDANCE').length;
  const inPerson = notes.filter(n => n.contactType === 'IN_PERSON').length;
  const phone = notes.filter(n => n.contactType === 'PHONE_CALL').length;

  return {
    period: `Last ${days} days`,
    totalSessions: total,
    attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    present,
    didNotAttend: dna,
    authorisedAbsence: auth,
    inPerson,
    phoneCalls: phone,
  };
}

export async function getOverdueItems(organizationId: string) {
  const now = new Date();

  const overdueAudits = await prisma.compliance.findMany({
    where: { organizationId, status: 'OVERDUE' },
    select: { id: true, title: true, auditType: true, dueDate: true },
    take: 20,
  });

  const expiredDbs = await prisma.staff.findMany({
    where: { organizationId, isActive: true, dbsExpiryDate: { lt: now } },
    select: { id: true, firstName: true, lastName: true, dbsExpiryDate: true },
  });

  const criticalIncidents = await prisma.incident.findMany({
    where: {
      organizationId,
      severity: { in: ['HIGH', 'CRITICAL'] },
      status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] },
    },
    select: { id: true, title: true, severity: true, status: true, reportedAt: true },
    take: 20,
  });

  return {
    overdueAudits: { count: overdueAudits.length, items: overdueAudits },
    expiredDbs: {
      count: expiredDbs.length,
      staff: expiredDbs.map(s => ({ name: `${s.firstName} ${s.lastName}`, expiry: s.dbsExpiryDate })),
    },
    openCriticalIncidents: { count: criticalIncidents.length, items: criticalIncidents },
  };
}
