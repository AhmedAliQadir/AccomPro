import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { format } from 'date-fns';

interface SupportNoteData {
  id: string;
  sessionDate: Date;
  contactType: string;
  attendanceStatus: string;
  economicWellbeingNotes?: string | null;
  enjoyAchieveNotes?: string | null;
  healthNotes?: string | null;
  staySafeNotes?: string | null;
  positiveContributionNotes?: string | null;
  specificSupportNeeds?: string | null;
  sessionComments?: string | null;
  clientSignature?: string | null;
  supportWorkerSignature?: string | null;
  nextSessionDate?: Date | null;
  createdAt: Date;
  tenant: {
    firstName: string;
    lastName: string;
  };
  supportWorker: {
    firstName: string;
    lastName: string;
  };
  organization: {
    name: string;
  };
}

export function generateSupportNotePDF(supportNote: SupportNoteData): PassThrough {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  
  doc.pipe(stream);

  // Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Weekly Support Session Note', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(supportNote.organization.name, { align: 'center' })
    .moveDown(1.5);

  // Client Information Section
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Client Information')
    .moveDown(0.3);

  doc.fontSize(10).font('Helvetica');
  
  addField(doc, 'Client Name', `${supportNote.tenant.firstName} ${supportNote.tenant.lastName}`);
  addField(doc, 'Session Date', format(new Date(supportNote.sessionDate), 'dd MMMM yyyy'));
  addField(doc, 'Contact Type', formatContactType(supportNote.contactType));
  addField(doc, 'Attendance Status', formatAttendanceStatus(supportNote.attendanceStatus));
  addField(doc, 'Support Worker', `${supportNote.supportWorker.firstName} ${supportNote.supportWorker.lastName}`);
  
  doc.moveDown(1);

  // Support Criteria Sections
  addSectionWithNotes(doc, 'Economic Wellbeing', 'Banking, Budgeting, Debt, Benefits', supportNote.economicWellbeingNotes);
  addSectionWithNotes(doc, 'Enjoy & Achieve', 'Employment, Education, Social networks, Volunteering', supportNote.enjoyAchieveNotes);
  addSectionWithNotes(doc, 'Be Healthy', 'Healthcare, Physical health, Substance misuse', supportNote.healthNotes);
  addSectionWithNotes(doc, 'Stay Safe', 'Living conditions, Life skills, Risk reduction', supportNote.staySafeNotes);
  addSectionWithNotes(doc, 'Positive Contribution', 'Anti-social behaviour, Probation, Relationships', supportNote.positiveContributionNotes);

  // Additional Sections
  if (supportNote.specificSupportNeeds) {
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Specific Support Needs');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').text(supportNote.specificSupportNeeds, { align: 'left' });
    doc.moveDown(0.5);
  }

  if (supportNote.sessionComments) {
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Session Comments');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').text(supportNote.sessionComments, { align: 'left' });
    doc.moveDown(0.5);
  }

  // Signatures Section
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('Signatures');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  
  if (supportNote.clientSignature) {
    addField(doc, 'Client Signature', supportNote.clientSignature);
  }
  
  if (supportNote.supportWorkerSignature) {
    addField(doc, 'Support Worker Signature', supportNote.supportWorkerSignature);
  }

  // Next Session
  if (supportNote.nextSessionDate) {
    doc.moveDown(0.5);
    addField(doc, 'Next Session Date', format(new Date(supportNote.nextSessionDate), 'dd MMMM yyyy'));
  }

  // Footer
  doc.moveDown(2);
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#666666')
    .text(
      `Generated on ${format(new Date(), 'dd MMMM yyyy HH:mm')} | Document ID: ${supportNote.id}`,
      { align: 'center' }
    );

  doc.end();
  
  return stream;
}

function addField(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc
    .font('Helvetica-Bold')
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .text(value);
}

function addSectionWithNotes(
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle: string,
  notes?: string | null
) {
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text(title);
  doc.fontSize(9).font('Helvetica').fillColor('#666666').text(subtitle);
  doc.fillColor('#000000');
  doc.moveDown(0.2);
  
  if (notes && notes.trim()) {
    doc.fontSize(10).font('Helvetica').text(notes, { align: 'left' });
  } else {
    doc.fontSize(10).font('Helvetica').fillColor('#999999').text('No notes recorded');
    doc.fillColor('#000000');
  }
  
  doc.moveDown(0.3);
}

function formatContactType(type: string): string {
  switch (type) {
    case 'IN_PERSON':
      return 'In Person';
    case 'PHONE_CALL':
      return 'Phone Call';
    default:
      return type;
  }
}

function formatAttendanceStatus(status: string): string {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'AUTHORISED_NON_ATTENDANCE':
      return 'Authorised Non-Attendance';
    case 'DID_NOT_ATTEND':
      return 'Did Not Attend';
    default:
      return status;
  }
}
