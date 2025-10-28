import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface PresentationData {
  organizationName?: string;
  generatedDate: Date;
}

export function generateAccommodateMEPresentation(data: PresentationData): PassThrough {
  const doc = new PDFDocument({ 
    margin: 50, 
    size: 'A4',
    bufferPages: true 
  });
  const stream = new PassThrough();
  
  doc.pipe(stream);

  const primaryColor = '#1e40af'; // Professional blue
  const secondaryColor = '#3b82f6'; // Lighter blue
  const accentColor = '#60a5fa';
  const textColor = '#1f2937';
  const lightGray = '#6b7280';

  // ============ COVER PAGE ============
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f9ff');
  
  // Company branding
  doc.fontSize(32)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('ORBIXIO LTD', 50, 150, { align: 'center' });
  
  doc.fontSize(48)
    .fillColor(secondaryColor)
    .text('AccommodateME', 50, 200, { align: 'center' })
    .moveDown(0.5);
  
  doc.fontSize(18)
    .fillColor(textColor)
    .font('Helvetica')
    .text('Multi-Tenant SaaS Platform', { align: 'center' })
    .moveDown(0.3);
  
  doc.fontSize(16)
    .fillColor(lightGray)
    .text('for UK Supported Housing Providers', { align: 'center' })
    .moveDown(3);
  
  // Decorative line
  doc.moveTo(150, 400)
    .lineTo(doc.page.width - 150, 400)
    .strokeColor(accentColor)
    .lineWidth(2)
    .stroke();
  
  doc.fontSize(12)
    .fillColor(lightGray)
    .text(`Generated: ${data.generatedDate.toLocaleDateString('en-GB')}`, 50, doc.page.height - 100, { align: 'center' });

  // ============ EXECUTIVE SUMMARY ============
  doc.addPage();
  addPageHeader(doc, 'Executive Summary', primaryColor);
  
  doc.fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('What is AccommodateME?', 50, 150);
  
  doc.fontSize(11)
    .font('Helvetica')
    .fillColor(textColor)
    .text(
      'AccommodateME is a comprehensive multi-tenant SaaS platform specifically designed for UK supported housing ' +
      'and social care providers. It streamlines operations by providing a unified system for managing residents, ' +
      'staff, properties, incidents, compliance, and documentation within secure, isolated workspaces.',
      50, 180, { align: 'left', width: doc.page.width - 100 }
    )
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .text('Target Market', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• UK Housing Associations', 50, doc.y + 15)
    .text('• Social Services Organizations', 50, doc.y + 10)
    .text('• Supported Living Providers', 50, doc.y + 10)
    .text('• Community Care Organizations', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .text('Key Value Propositions', 50, doc.y);
  
  const valueProps = [
    'Complete data isolation with enterprise-grade multi-tenancy',
    'Role-based access control with 4 specialized user roles',
    'Comprehensive audit trails for regulatory compliance',
    'Mobile-first design for support workers in the field',
    'Encrypted document storage with AES-256-GCM encryption',
    'Real-time incident tracking and compliance management'
  ];
  
  doc.fontSize(11).font('Helvetica');
  valueProps.forEach(prop => {
    doc.text(`✓ ${prop}`, 50, doc.y + 10, { width: doc.page.width - 100 });
  });

  // ============ MULTI-TENANCY ARCHITECTURE ============
  doc.addPage();
  addPageHeader(doc, 'Multi-Tenancy Architecture', primaryColor);
  
  doc.fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('Data Isolation Strategy', 50, 150);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text(
      'AccommodateME implements a robust multi-tenancy model using a shared database with row-level isolation. ' +
      'Every data record is tagged with an organizationId foreign key, ensuring complete data segregation between organizations.',
      50, 180, { width: doc.page.width - 100 }
    )
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Security Model', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Automatic middleware filtering by organizationId', 50, doc.y + 15)
    .text('• Database-backed authorization with isPlatformAdmin flag', 50, doc.y + 10)
    .text('• JWT-based authentication with HTTP-only cookies', 50, doc.y + 10)
    .text('• Rate limiting on authentication endpoints', 50, doc.y + 10)
    .text('• Prevention of privilege escalation attacks', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Benefits', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Multiple organizations can use the same platform independently', 50, doc.y + 15)
    .text('• Lower operational costs through shared infrastructure', 50, doc.y + 10)
    .text('• Guaranteed data privacy and compliance', 50, doc.y + 10)
    .text('• Scalable architecture supporting unlimited tenants', 50, doc.y + 10);

  // ============ ROLE-BASED ACCESS CONTROL ============
  doc.addPage();
  addPageHeader(doc, 'Role-Based Access Control', primaryColor);
  
  const roles = [
    {
      name: 'Platform Admin',
      description: 'Cross-organization command center with full system access',
      permissions: [
        'View and manage all organizations',
        'Access cross-organization analytics',
        'System-wide configuration and settings',
        'User and organization creation'
      ]
    },
    {
      name: 'Organization Admin',
      description: 'Organization-scoped management and oversight',
      permissions: [
        'Full access to own organization data',
        'Manage staff, properties, and residents',
        'Configure organization settings',
        'View reports and analytics'
      ]
    },
    {
      name: 'Operations Manager',
      description: 'Operational oversight and reporting access',
      permissions: [
        'View residents, properties, and staff',
        'Monitor incidents and compliance',
        'Generate operational reports',
        'Read-only access to sensitive data'
      ]
    },
    {
      name: 'Support Worker',
      description: 'Mobile-first task cockpit for field work',
      permissions: [
        'View assigned residents and properties',
        'Create and update support notes',
        'Record incidents and observations',
        'Access resident documents'
      ]
    }
  ];
  
  let yPos = 150;
  roles.forEach((role, index) => {
    if (yPos > 650) {
      doc.addPage();
      addPageHeader(doc, 'Role-Based Access Control (continued)', primaryColor);
      yPos = 150;
    }
    
    doc.fontSize(13)
      .fillColor(secondaryColor)
      .font('Helvetica-Bold')
      .text(`${index + 1}. ${role.name}`, 50, yPos);
    
    doc.fontSize(10)
      .fillColor(textColor)
      .font('Helvetica-Oblique')
      .text(role.description, 50, yPos + 20, { width: doc.page.width - 100 });
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor(textColor);
    
    yPos += 50;
    role.permissions.forEach(perm => {
      doc.text(`  • ${perm}`, 50, yPos);
      yPos += 15;
    });
    
    yPos += 20;
  });

  // ============ CORE FEATURES ============
  doc.addPage();
  addPageHeader(doc, 'Core Features', primaryColor);
  
  const features = [
    {
      name: 'Resident Management',
      description: 'Comprehensive profiles for all residents including personal details, contact information, emergency contacts, and support requirements. Track resident history, tenancies, and care plans.'
    },
    {
      name: 'Property & Room Management',
      description: 'Hierarchical property structure with rooms and capacity tracking. Room allocation validation prevents double-booking. Monitor property compliance and maintenance schedules.'
    },
    {
      name: 'Staff Management',
      description: 'Staff profiles with role assignments and property allocations. Track certifications, training records, and working hours. Support worker assignment to specific properties.'
    },
    {
      name: 'Incident Tracking',
      description: 'Real-time incident logging with severity classification, witness statements, and action tracking. Audit trail for all incidents with timestamps and user attribution.'
    },
    {
      name: 'Compliance Management',
      description: 'Track regulatory requirements, certifications, and deadlines. Monitor compliance status across all properties and staff. Automated reminders for expiring certifications.'
    },
    {
      name: 'Support Notes System',
      description: 'Structured support session notes based on Every Child Matters framework. Track economic wellbeing, health, safety, and positive contribution. Generate PDF reports for external sharing.'
    },
    {
      name: 'Document Management',
      description: 'Encrypted document storage with AES-256-GCM encryption. Time-limited download tokens for secure access. Organize documents by resident, property, or organization.'
    }
  ];
  
  yPos = 150;
  features.forEach(feature => {
    if (yPos > 630) {
      doc.addPage();
      addPageHeader(doc, 'Core Features (continued)', primaryColor);
      yPos = 150;
    }
    
    doc.fontSize(12)
      .fillColor(secondaryColor)
      .font('Helvetica-Bold')
      .text(feature.name, 50, yPos);
    
    doc.fontSize(10)
      .fillColor(textColor)
      .font('Helvetica')
      .text(feature.description, 50, yPos + 18, { width: doc.page.width - 100 });
    
    yPos += 65;
  });

  // ============ SECURITY & DATA PROTECTION ============
  doc.addPage();
  addPageHeader(doc, 'Security & Data Protection', primaryColor);
  
  doc.fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('Encryption', 50, 150);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• AES-256-GCM encryption for all stored documents', 50, 175)
    .text('• SHA-256 hashing for file integrity verification', 50, doc.y + 10)
    .text('• Server-side encryption using Node.js crypto', 50, doc.y + 10)
    .text('• Secure key management with environment variables', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Authentication & Authorization', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• JWT-based authentication with 7-day session tokens', 50, doc.y + 15)
    .text('• HTTP-only cookies prevent XSS attacks', 50, doc.y + 10)
    .text('• bcrypt password hashing with salt rounds', 50, doc.y + 10)
    .text('• Database-backed isPlatformAdmin flag prevents escalation', 50, doc.y + 10)
    .text('• Rate limiting on login endpoints (5 attempts per 15 minutes)', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Audit Trails', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Comprehensive logging of all user actions', 50, doc.y + 15)
    .text('• Timestamp and user attribution for all changes', 50, doc.y + 10)
    .text('• Immutable audit records for compliance', 50, doc.y + 10)
    .text('• Track data access, modifications, and deletions', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Compliance Standards', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• GDPR-compliant data handling', 50, doc.y + 15)
    .text('• UK Data Protection Act 2018 alignment', 50, doc.y + 10)
    .text('• Secure data retention policies', 50, doc.y + 10)
    .text('• Right to erasure and data portability support', 50, doc.y + 10);

  // ============ TECHNICAL STACK ============
  doc.addPage();
  addPageHeader(doc, 'Technical Stack', primaryColor);
  
  doc.fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('Frontend Technologies', 50, 150);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• React 18 with TypeScript for type safety', 50, 175)
    .text('• Wouter for lightweight client-side routing', 50, doc.y + 10)
    .text('• TanStack Query v5 for server state management', 50, doc.y + 10)
    .text('• shadcn/ui with Radix UI primitives', 50, doc.y + 10)
    .text('• Tailwind CSS for utility-first styling', 50, doc.y + 10)
    .text('• Material Design 3 principles for enterprise UI', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Backend Technologies', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Express.js with TypeScript', 50, doc.y + 15)
    .text('• Drizzle ORM for type-safe database queries', 50, doc.y + 10)
    .text('• Neon PostgreSQL serverless database', 50, doc.y + 10)
    .text('• JWT authentication with jsonwebtoken', 50, doc.y + 10)
    .text('• Helmet.js for security headers', 50, doc.y + 10)
    .text('• Express Rate Limit for DDoS protection', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Development & Deployment', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Vite for lightning-fast frontend builds', 50, doc.y + 15)
    .text('• esbuild for backend TypeScript compilation', 50, doc.y + 10)
    .text('• Drizzle Kit for database migrations', 50, doc.y + 10)
    .text('• Replit hosting with auto-scaling', 50, doc.y + 10)
    .text('• Git-based version control', 50, doc.y + 10);

  // ============ BUSINESS VALUE ============
  doc.addPage();
  addPageHeader(doc, 'Business Value', primaryColor);
  
  doc.fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('For Housing Associations & Care Providers', 50, 150);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Reduced operational costs through digital transformation', 50, 175)
    .text('• Improved compliance and reduced regulatory risk', 50, doc.y + 10)
    .text('• Better resident outcomes through comprehensive tracking', 50, doc.y + 10)
    .text('• Mobile access for support workers in the field', 50, doc.y + 10)
    .text('• Real-time visibility into operations and incidents', 50, doc.y + 10)
    .text('• Secure, compliant document management', 50, doc.y + 10)
    .text('• Scalable solution that grows with your organization', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('For ORBIXIO LTD', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• Recurring SaaS revenue model', 50, doc.y + 15)
    .text('• Scalable multi-tenant architecture', 50, doc.y + 10)
    .text('• Low marginal cost per additional tenant', 50, doc.y + 10)
    .text('• Strong market positioning in UK social care sector', 50, doc.y + 10)
    .text('• Opportunities for additional services and customization', 50, doc.y + 10)
    .text('• Platform for future product expansion', 50, doc.y + 10)
    .moveDown(1.5);
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Return on Investment', 50, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .text('• 40-60% reduction in administrative time', 50, doc.y + 15)
    .text('• Improved compliance reduces risk of penalties', 50, doc.y + 10)
    .text('• Better staff utilization and productivity', 50, doc.y + 10)
    .text('• Enhanced reporting capabilities for funding applications', 50, doc.y + 10)
    .text('• Reduced IT infrastructure costs vs. on-premise solutions', 50, doc.y + 10);

  // ============ CONTACT PAGE ============
  doc.addPage();
  
  // Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f9ff');
  
  doc.fontSize(24)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('Get Started with AccommodateME', 50, 200, { align: 'center' })
    .moveDown(2);
  
  doc.fontSize(14)
    .fillColor(textColor)
    .font('Helvetica')
    .text('Contact ORBIXIO LTD', { align: 'center' })
    .moveDown(1);
  
  doc.fontSize(12)
    .fillColor(lightGray)
    .text('Business & Domestic Software Development', { align: 'center' })
    .moveDown(0.5)
    .text('Specialist in Multi-Tenant SaaS Solutions', { align: 'center' })
    .moveDown(2);
  
  doc.fontSize(11)
    .fillColor(textColor)
    .text('Email: info@orbixio.com', { align: 'center' })
    .moveDown(0.5)
    .text('Website: www.orbixio.com', { align: 'center' })
    .moveDown(0.5)
    .text('Support: support@accommodateme.com', { align: 'center' })
    .moveDown(3);
  
  doc.fontSize(10)
    .fillColor(lightGray)
    .text('© 2025 ORBIXIO LTD. All rights reserved.', { align: 'center' })
    .moveDown(0.3)
    .text(`Document generated: ${data.generatedDate.toLocaleString('en-GB')}`, { align: 'center' });

  // Finalize PDF
  doc.end();
  
  return stream;
}

function addPageHeader(doc: PDFKit.PDFDocument, title: string, color: string) {
  doc.fontSize(20)
    .fillColor(color)
    .font('Helvetica-Bold')
    .text(title, 50, 80);
  
  doc.moveTo(50, 120)
    .lineTo(doc.page.width - 50, 120)
    .strokeColor(color)
    .lineWidth(1)
    .stroke();
}
