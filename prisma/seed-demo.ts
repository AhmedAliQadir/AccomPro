/**
 * AccomPro - Rich Demo Seed Script
 * Creates realistic UK supported housing data for demos
 * Run with: npx tsx prisma/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AccomPro demo database...\n');

  // ── ORGANISATION ────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { subdomain: 'bridgeview' },
    update: {},
    create: {
      name: 'Bridgeview Housing Association',
      subdomain: 'bridgeview',
      contactEmail: 'admin@bridgeviewhousing.org.uk',
      contactPhone: '0121 456 7890',
      address: '14 Victoria Street, Birmingham, B1 1BD',
      postcode: 'B1 1BD',
      subscriptionTier: 'PROFESSIONAL',
      isActive: true,
      settings: {
        branding: { primaryColor: '#1D4ED8', logo: null },
        features: { staffManagement: true, incidentTracking: true, complianceAudits: true }
      }
    },
  });
  console.log(`✓ Organisation: ${org.name}`);

  // ── USERS ────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bridgeviewhousing.org.uk' },
    update: {},
    create: {
      email: 'admin@bridgeviewhousing.org.uk',
      password: await bcrypt.hash('Demo1234!', 10),
      firstName: 'Rachel',
      lastName: 'Thompson',
      role: 'ORG_ADMIN',
      organizationId: org.id,
    },
  });

  const opsUser = await prisma.user.upsert({
    where: { email: 'ops@bridgeviewhousing.org.uk' },
    update: {},
    create: {
      email: 'ops@bridgeviewhousing.org.uk',
      password: await bcrypt.hash('Demo1234!', 10),
      firstName: 'James',
      lastName: 'Patel',
      role: 'OPS',
      organizationId: org.id,
    },
  });

  const supportUser1 = await prisma.user.upsert({
    where: { email: 'sarah.w@bridgeviewhousing.org.uk' },
    update: {},
    create: {
      email: 'sarah.w@bridgeviewhousing.org.uk',
      password: await bcrypt.hash('Demo1234!', 10),
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'SUPPORT',
      organizationId: org.id,
    },
  });

  const supportUser2 = await prisma.user.upsert({
    where: { email: 'david.k@bridgeviewhousing.org.uk' },
    update: {},
    create: {
      email: 'david.k@bridgeviewhousing.org.uk',
      password: await bcrypt.hash('Demo1234!', 10),
      firstName: 'David',
      lastName: 'Khan',
      role: 'SUPPORT',
      organizationId: org.id,
    },
  });

  const complianceUser = await prisma.user.upsert({
    where: { email: 'compliance@bridgeviewhousing.org.uk' },
    update: {},
    create: {
      email: 'compliance@bridgeviewhousing.org.uk',
      password: await bcrypt.hash('Demo1234!', 10),
      firstName: 'Linda',
      lastName: 'Okafor',
      role: 'COMPLIANCE_OFFICER',
      organizationId: org.id,
    },
  });

  console.log('✓ Users created (5 users across all roles)');

  // ── PROPERTIES ───────────────────────────────────────────────
  const prop1 = await prisma.property.upsert({
    where: { id: 'prop-demo-001' },
    update: {},
    create: {
      id: 'prop-demo-001',
      organizationId: org.id,
      name: 'Maple House',
      address: '23 Maple Road, Birmingham',
      postcode: 'B12 8QR',
      totalUnits: 8,
      description: '8-bed supported living facility for adults with mental health needs',
      serviceChargeAmount: 195.00,
      serviceChargeNotes: 'Covers utilities, cleaning and on-site support',
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: 'prop-demo-002' },
    update: {},
    create: {
      id: 'prop-demo-002',
      organizationId: org.id,
      name: 'Cedar Court',
      address: '7 Cedar Lane, Birmingham',
      postcode: 'B16 0AX',
      totalUnits: 12,
      description: '12-bed facility for young people aged 18-25 leaving care',
      serviceChargeAmount: 175.00,
      serviceChargeNotes: 'Includes all bills and weekly support sessions',
    },
  });

  const prop3 = await prisma.property.upsert({
    where: { id: 'prop-demo-003' },
    update: {},
    create: {
      id: 'prop-demo-003',
      organizationId: org.id,
      name: 'Birchwood Mews',
      address: '55 Birchwood Avenue, Solihull',
      postcode: 'B91 2TG',
      totalUnits: 6,
      description: '6-bed supported accommodation for adults recovering from substance misuse',
      serviceChargeAmount: 210.00,
    },
  });

  console.log('✓ Properties: Maple House, Cedar Court, Birchwood Mews');

  // ── ROOMS ────────────────────────────────────────────────────
  const roomsData = [
    // Maple House (8 rooms)
    ...['101','102','103','104','105','106','107','108'].map((n, i) => ({
      id: `room-maple-${n}`,
      propertyId: prop1.id,
      roomNumber: n,
      floor: Math.floor(i / 4) + 1,
      facilities: ['Single Bed', 'Wardrobe', 'Desk', i < 4 ? 'En-suite' : 'Shared Bathroom'],
    })),
    // Cedar Court (12 rooms)
    ...['201','202','203','204','205','206','207','208','209','210','211','212'].map((n, i) => ({
      id: `room-cedar-${n}`,
      propertyId: prop2.id,
      roomNumber: n,
      floor: Math.floor(i / 6) + 1,
      facilities: ['Single Bed', 'Wardrobe', 'Shared Kitchen'],
    })),
    // Birchwood (6 rooms)
    ...['301','302','303','304','305','306'].map((n, i) => ({
      id: `room-birch-${n}`,
      propertyId: prop3.id,
      roomNumber: n,
      floor: 1,
      facilities: ['Single Bed', 'Wardrobe', 'Shared Bathroom', 'Garden Access'],
    })),
  ];

  for (const room of roomsData) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    });
  }
  console.log('✓ Rooms: 26 rooms across 3 properties');

  // ── STAFF ────────────────────────────────────────────────────
  const staffData = [
    {
      id: 'staff-demo-001',
      firstName: 'Marcus', lastName: 'Adeyemi',
      email: 'marcus.a@bridgeviewhousing.org.uk', phone: '07700 900123',
      jobTitle: 'Senior Support Worker',
      dbsNumber: 'DBS001234567', dbsExpiryDate: new Date('2026-06-30'),
      startDate: new Date('2021-03-01'),
    },
    {
      id: 'staff-demo-002',
      firstName: 'Priya', lastName: 'Sharma',
      email: 'priya.s@bridgeviewhousing.org.uk', phone: '07700 900456',
      jobTitle: 'Support Worker',
      dbsNumber: 'DBS002345678', dbsExpiryDate: new Date('2025-12-31'),
      startDate: new Date('2022-07-15'),
    },
    {
      id: 'staff-demo-003',
      firstName: 'Tom', lastName: 'Griffiths',
      email: 'tom.g@bridgeviewhousing.org.uk', phone: '07700 900789',
      jobTitle: 'Wellbeing Coordinator',
      dbsNumber: 'DBS003456789', dbsExpiryDate: new Date('2026-03-31'),
      startDate: new Date('2020-09-01'),
    },
    {
      id: 'staff-demo-004',
      firstName: 'Amara', lastName: 'Diallo',
      email: 'amara.d@bridgeviewhousing.org.uk', phone: '07700 900321',
      jobTitle: 'Night Support Worker',
      dbsNumber: 'DBS004567890', dbsExpiryDate: new Date('2027-01-31'),
      startDate: new Date('2023-02-01'),
    },
  ];

  for (const staff of staffData) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {},
      create: { ...staff, organizationId: org.id, isActive: true },
    });
  }
  console.log('✓ Staff: 4 staff members with DBS records');

  // ── TENANTS ──────────────────────────────────────────────────
  const tenantsData = [
    {
      id: 'tenant-demo-001',
      firstName: 'Mohammed', lastName: 'Al-Rashid',
      email: 'm.alrashid@email.com', phone: '07800 111001',
      dateOfBirth: new Date('1989-04-12'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-002',
      firstName: 'Chloe', lastName: 'Bennett',
      email: 'c.bennett@email.com', phone: '07800 111002',
      dateOfBirth: new Date('2001-08-22'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-003',
      firstName: 'Derek', lastName: 'Osei',
      email: 'd.osei@email.com', phone: '07800 111003',
      dateOfBirth: new Date('1975-11-05'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-004',
      firstName: 'Fatima', lastName: 'Hussain',
      email: 'f.hussain@email.com', phone: '07800 111004',
      dateOfBirth: new Date('1994-02-17'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-005',
      firstName: 'Ryan', lastName: 'Murphy',
      email: 'r.murphy@email.com', phone: '07800 111005',
      dateOfBirth: new Date('1998-07-30'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-006',
      firstName: 'Aisha', lastName: 'Nkemdirim',
      email: 'a.nkemdirim@email.com', phone: '07800 111006',
      dateOfBirth: new Date('2003-01-14'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-007',
      firstName: 'Gary', lastName: 'Whitfield',
      email: 'g.whitfield@email.com',
      dateOfBirth: new Date('1968-09-03'),
      status: 'ACTIVE' as const,
    },
    {
      id: 'tenant-demo-008',
      firstName: 'Zara', lastName: 'Ahmed',
      email: 'z.ahmed@email.com', phone: '07800 111008',
      dateOfBirth: new Date('2000-05-25'),
      status: 'PENDING' as const,
    },
    {
      id: 'tenant-demo-009',
      firstName: 'Leon', lastName: 'Fitzgerald',
      email: 'l.fitzgerald@email.com', phone: '07800 111009',
      dateOfBirth: new Date('1985-12-08'),
      status: 'READY_FOR_TENANCY' as const,
    },
    {
      id: 'tenant-demo-010',
      firstName: 'Sandra', lastName: 'Kowalski',
      email: 's.kowalski@email.com', phone: '07800 111010',
      dateOfBirth: new Date('1971-06-19'),
      status: 'ACTIVE' as const,
    },
  ];

  for (const tenant of tenantsData) {
    await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: {},
      create: { ...tenant, organizationId: org.id },
    });
  }
  console.log(`✓ Tenants: ${tenantsData.length} residents across multiple statuses`);

  // ── TENANCIES (assign active tenants to rooms) ────────────────
  const tenancies = [
    { tenantId: 'tenant-demo-001', roomId: 'room-maple-101', startDate: new Date('2023-03-01') },
    { tenantId: 'tenant-demo-002', roomId: 'room-cedar-201', startDate: new Date('2023-06-15') },
    { tenantId: 'tenant-demo-003', roomId: 'room-birch-301', startDate: new Date('2022-11-01') },
    { tenantId: 'tenant-demo-004', roomId: 'room-maple-102', startDate: new Date('2023-09-01') },
    { tenantId: 'tenant-demo-005', roomId: 'room-cedar-202', startDate: new Date('2024-01-10') },
    { tenantId: 'tenant-demo-006', roomId: 'room-cedar-203', startDate: new Date('2024-04-01') },
    { tenantId: 'tenant-demo-007', roomId: 'room-birch-302', startDate: new Date('2023-01-20') },
    { tenantId: 'tenant-demo-010', roomId: 'room-maple-103', startDate: new Date('2022-08-15') },
  ];

  for (const t of tenancies) {
    const existing = await prisma.tenancy.findFirst({
      where: { tenantId: t.tenantId, isActive: true }
    });
    if (!existing) {
      await prisma.tenancy.create({
        data: { ...t, isActive: true, serviceChargeAmount: 195.00 },
      });
    }
  }
  console.log('✓ Tenancies: 8 active room assignments');

  // ── TENANT PROFILES ──────────────────────────────────────────
  const profiles = [
    {
      tenantId: 'tenant-demo-001',
      nationality: 'British', languagesSpoken: 'English, Arabic',
      ethnicity: 'ASIAN_OTHER' as const, religion: 'MUSLIM' as const,
      currentSituation: 'Previously rough sleeping. Referred by Birmingham City Council.',
      homelessnessReason: 'Eviction following relationship breakdown',
    },
    {
      tenantId: 'tenant-demo-002',
      nationality: 'British', languagesSpoken: 'English',
      ethnicity: 'WHITE_BRITISH' as const,
      currentSituation: 'Care leaver, 21 years old. Transitioning to independence.',
      homelessnessReason: 'Aged out of care system',
    },
    {
      tenantId: 'tenant-demo-003',
      nationality: 'British', languagesSpoken: 'English',
      ethnicity: 'BLACK_AFRICAN' as const,
      currentSituation: 'Long-term substance misuse recovery. 8 months sober.',
      disabilities: 'Hearing impairment (moderate)',
    },
  ];

  for (const p of profiles) {
    const existing = await prisma.tenantProfile.findUnique({ where: { tenantId: p.tenantId } });
    if (!existing) {
      await prisma.tenantProfile.create({ data: p });
    }
  }

  // ── INCIDENTS ────────────────────────────────────────────────
  const incidents = [
    {
      organizationId: org.id,
      residentId: 'tenant-demo-003',
      reportedById: supportUser1.id,
      incidentType: 'BEHAVIORAL' as const,
      severity: 'MEDIUM' as const,
      status: 'RESOLVED' as const,
      title: 'Verbal altercation in communal area',
      description: 'Resident had a verbal disagreement with a fellow resident in the kitchen at approximately 7pm. Voices were raised but no physical contact occurred. Both residents have been spoken to separately.',
      location: 'Birchwood Mews - Ground Floor Kitchen',
      actionsTaken: 'Both residents spoken to individually. Mediation session arranged for Thursday. Incident documented per safeguarding policy.',
      followUpRequired: true,
      followUpNotes: 'Review behaviour support plan at next keyworker session',
      occurredAt: new Date('2025-01-14T19:00:00'),
      resolvedAt: new Date('2025-01-16T14:00:00'),
    },
    {
      organizationId: org.id,
      residentId: 'tenant-demo-001',
      reportedById: supportUser2.id,
      incidentType: 'SAFEGUARDING' as const,
      severity: 'HIGH' as const,
      status: 'UNDER_INVESTIGATION' as const,
      title: 'Safeguarding concern raised by resident',
      description: 'Resident disclosed during keyworker session that they had received threatening messages from a former partner. Resident appeared distressed. Safeguarding lead notified immediately.',
      location: 'Maple House - Support Office',
      actionsTaken: 'Safeguarding lead informed. MARAC referral being considered. Resident advised on safety planning. Police referral discussed with resident.',
      followUpRequired: true,
      followUpNotes: 'Awaiting response from MARAC coordinator. Next review in 48 hours.',
      occurredAt: new Date('2025-01-20T10:30:00'),
    },
    {
      organizationId: org.id,
      reportedById: adminUser.id,
      incidentType: 'PROPERTY_DAMAGE' as const,
      severity: 'LOW' as const,
      status: 'CLOSED' as const,
      title: 'Broken window in room 205',
      description: 'Window latch broken in room 205, Cedar Court. Room is unoccupied. No security risk as window does not open fully.',
      location: 'Cedar Court - Room 205',
      actionsTaken: 'Maintenance contractor contacted. Repair scheduled for 28 January.',
      followUpRequired: false,
      occurredAt: new Date('2025-01-22T09:00:00'),
      resolvedAt: new Date('2025-01-28T11:00:00'),
    },
    {
      organizationId: org.id,
      residentId: 'tenant-demo-005',
      reportedById: supportUser1.id,
      incidentType: 'MISSING_PERSON' as const,
      severity: 'HIGH' as const,
      status: 'RESOLVED' as const,
      title: 'Resident absent without contact - 24 hours',
      description: 'Resident did not attend scheduled support session and has not responded to calls or messages for 24 hours. Room checked - belongings present.',
      location: 'Cedar Court',
      actionsTaken: 'Emergency contacts contacted. Police informed (non-emergency). Resident returned voluntarily the following morning and has been debriefed.',
      followUpRequired: true,
      followUpNotes: 'Risk assessment to be updated. Wellbeing check in 3 days.',
      occurredAt: new Date('2025-01-18T14:00:00'),
      resolvedAt: new Date('2025-01-19T08:30:00'),
    },
  ];

  for (const incident of incidents) {
    await prisma.incident.create({ data: incident });
  }
  console.log('✓ Incidents: 4 incidents (behavioural, safeguarding, property, missing person)');

  // ── COMPLIANCE ───────────────────────────────────────────────
  const compliance = [
    {
      organizationId: org.id,
      auditType: 'FIRE_SAFETY' as const,
      status: 'COMPLETED' as const,
      title: 'Annual Fire Safety Inspection - Maple House',
      description: 'Routine annual fire safety audit conducted by Birmingham Fire Service',
      auditDate: new Date('2024-11-15'),
      auditorName: 'Chief Inspector Dave Reece',
      auditorOrganization: 'West Midlands Fire Service',
      score: 94,
      findings: 'Fire exits clear and well signposted. Alarm system tested and operational. Minor issue: fire log book not updated since September 2024.',
      actionPlan: '1. Update fire log book immediately. 2. Retrain two staff members on fire procedure by December. 3. Schedule next inspection for November 2025.',
      completedAt: new Date('2024-11-20'),
      completedBy: complianceUser.id,
      dueDate: new Date('2025-11-15'),
    },
    {
      organizationId: org.id,
      auditType: 'SAFEGUARDING' as const,
      status: 'IN_PROGRESS' as const,
      title: 'Safeguarding Policy Review Q1 2025',
      description: 'Quarterly review of safeguarding procedures and case records',
      auditDate: new Date('2025-01-31'),
      auditorName: 'Linda Okafor',
      auditorOrganization: 'Bridgeview Housing Association (Internal)',
      findings: 'Review in progress. All staff DBS checks current except one pending renewal.',
      actionPlan: 'Complete DBS renewal for Priya Sharma by 28 February 2025.',
      dueDate: new Date('2025-01-31'),
    },
    {
      organizationId: org.id,
      auditType: 'CQC_INSPECTION' as const,
      status: 'PENDING' as const,
      title: 'CQC Scheduled Inspection - All Sites',
      description: 'Scheduled CQC inspection across all three supported living properties',
      auditDate: new Date('2025-03-10'),
      auditorName: 'TBC',
      auditorOrganization: 'Care Quality Commission',
      findings: 'Inspection not yet conducted',
      actionPlan: 'Preparation checklist to be completed by 28 February. Mock inspection scheduled for 3 March.',
      dueDate: new Date('2025-03-10'),
    },
    {
      organizationId: org.id,
      auditType: 'HEALTH_SAFETY' as const,
      status: 'COMPLETED' as const,
      title: 'Health & Safety Risk Assessment - Cedar Court',
      description: 'Annual H&S assessment for Cedar Court following refurbishment',
      auditDate: new Date('2024-09-20'),
      auditorName: 'James Patel',
      auditorOrganization: 'Bridgeview Housing Association (Internal)',
      score: 88,
      findings: 'General conditions good following refurbishment. Wet floor sign missing from ground floor bathroom. One fire extinguisher requires servicing.',
      actionPlan: 'Both issues resolved same day. Full reassessment scheduled September 2025.',
      completedAt: new Date('2024-09-25'),
      dueDate: new Date('2025-09-20'),
    },
  ];

  for (const c of compliance) {
    await prisma.compliance.create({ data: c });
  }
  console.log('✓ Compliance: 4 audit records (fire safety, safeguarding, CQC, H&S)');

  // ── SUPPORT NOTES ────────────────────────────────────────────
  const notes = [
    {
      organizationId: org.id,
      tenantId: 'tenant-demo-001',
      supportWorkerId: supportUser1.id,
      sessionDate: new Date('2025-01-21T10:00:00'),
      contactType: 'IN_PERSON' as const,
      attendanceStatus: 'PRESENT' as const,
      economicWellbeingNotes: 'Discussed Universal Credit claim. Resident has started saving £20/week. No current debt concerns.',
      healthNotes: 'Attending GP regularly. Mental health assessment booked for 14 February. Sleeping better this week.',
      staySafeNotes: 'Ongoing safeguarding concern being managed (see incident log). Safety plan reviewed with resident today and updated.',
      sessionComments: 'Good session overall. Resident engaged and positive. Expressed interest in finding part-time work in the next 3 months.',
      nextSessionDate: new Date('2025-01-28T10:00:00'),
    },
    {
      organizationId: org.id,
      tenantId: 'tenant-demo-002',
      supportWorkerId: supportUser2.id,
      sessionDate: new Date('2025-01-20T14:00:00'),
      contactType: 'IN_PERSON' as const,
      attendanceStatus: 'PRESENT' as const,
      enjoyAchieveNotes: 'Resident has applied for a part-time retail job at Bullring. Interview scheduled for 29 January. Supported with CV and application.',
      healthNotes: 'Physical health good. Declined counselling referral again - will revisit next session.',
      positiveContributionNotes: 'Has been helping newer residents settle in. Excellent peer support behaviour.',
      sessionComments: 'Making excellent progress. 8 months in placement and demonstrating strong independent living skills.',
      nextSessionDate: new Date('2025-01-27T14:00:00'),
    },
    {
      organizationId: org.id,
      tenantId: 'tenant-demo-003',
      supportWorkerId: supportUser1.id,
      sessionDate: new Date('2025-01-17T11:00:00'),
      contactType: 'IN_PERSON' as const,
      attendanceStatus: 'PRESENT' as const,
      healthNotes: '8 months sober. Attending NA meetings twice weekly. GP appointment next Thursday for hearing aid review.',
      economicWellbeingNotes: 'Benefits in place. Debt repayment plan reviewed - on track.',
      staySafeNotes: 'Following incident on 14 January, resident has engaged with mediation. Communal area behaviour much improved.',
      sessionComments: 'Strong progress on recovery journey. Resident wants to explore volunteering opportunities.',
      nextSessionDate: new Date('2025-01-24T11:00:00'),
    },
  ];

  for (const note of notes) {
    await prisma.supportNote.create({ data: note });
  }
  console.log('✓ Support Notes: 3 keyworker session records');

  // ── EMERGENCY CONTACTS ───────────────────────────────────────
  await prisma.tenantEmergencyContact.createMany({
    data: [
      { tenantId: 'tenant-demo-001', name: 'Khalid Al-Rashid', relationship: 'Brother', phone: '07900 200001', mobile: '07900 200001', isPrimary: true },
      { tenantId: 'tenant-demo-002', name: 'Claire Bennett', relationship: 'Aunt', phone: '07900 200002', isPrimary: true },
      { tenantId: 'tenant-demo-003', name: 'Grace Osei', relationship: 'Sister', phone: '07900 200003', isPrimary: true },
    ],
    skipDuplicates: true,
  });

  // ── FINANCE RECORDS ──────────────────────────────────────────
  const financeRecords = [
    { tenantId: 'tenant-demo-001', incomeSource: 'UNIVERSAL_CREDIT' as const, benefitAmount: 676.00, benefitFrequency: 'Monthly', hasNilIncome: false },
    { tenantId: 'tenant-demo-002', incomeSource: 'UNIVERSAL_CREDIT' as const, benefitAmount: 368.00, benefitFrequency: 'Monthly', hasNilIncome: false },
    { tenantId: 'tenant-demo-003', incomeSource: 'ESA' as const, benefitAmount: 428.00, benefitFrequency: 'Monthly', hasNilIncome: false },
  ];

  for (const f of financeRecords) {
    const existing = await prisma.tenantFinance.findUnique({ where: { tenantId: f.tenantId } });
    if (!existing) {
      await prisma.tenantFinance.create({ data: f });
    }
  }

  console.log('\n✅ Demo database seeded successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AccomPro — Bridgeview Housing Association Demo');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n  LOGIN CREDENTIALS (all use password: Demo1234!)');
  console.log('\n  Admin (full access):');
  console.log('    admin@bridgeviewhousing.org.uk');
  console.log('\n  Operations Manager:');
  console.log('    ops@bridgeviewhousing.org.uk');
  console.log('\n  Support Worker:');
  console.log('    sarah.w@bridgeviewhousing.org.uk');
  console.log('\n  Compliance Officer:');
  console.log('    compliance@bridgeviewhousing.org.uk');
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n  DEMO DATA SUMMARY');
  console.log('  • 3 properties (26 rooms total)');
  console.log('  • 10 tenants (8 active, 1 pending, 1 ready for tenancy)');
  console.log('  • 4 staff members with DBS records');
  console.log('  • 4 incidents (incl. safeguarding, missing person)');
  console.log('  • 4 compliance audits (fire safety, CQC, H&S, safeguarding)');
  console.log('  • 3 keyworker support note sessions');
  console.log('  • Emergency contacts, finance records, tenant profiles');
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
