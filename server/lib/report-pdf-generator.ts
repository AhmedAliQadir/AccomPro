import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { format } from 'date-fns';

interface ReportSection {
  title: string;
  content: string;
}

interface ReportData {
  organizationName: string;
  generatedBy: string;
  sections: ReportSection[];
}

export function generateInspectionReport(data: ReportData): PassThrough {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Title page
  doc.moveDown(6);
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('CQC Inspection Readiness Report', { align: 'center' })
    .moveDown(1);

  doc
    .fontSize(16)
    .font('Helvetica')
    .text(data.organizationName, { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, { align: 'center' })
    .moveDown(0.3);

  doc
    .fontSize(10)
    .fillColor('#666666')
    .text(`Prepared by: ${data.generatedBy}`, { align: 'center' })
    .fillColor('#000000')
    .moveDown(0.5);

  doc
    .fontSize(9)
    .fillColor('#999999')
    .text('CONFIDENTIAL — For internal use only', { align: 'center' })
    .fillColor('#000000');

  // Sections
  for (const section of data.sections) {
    doc.addPage();

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(section.title)
      .moveDown(0.5);

    // Draw a separator line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .stroke()
      .moveDown(0.5);

    // Render content with basic markdown-like formatting
    const lines = section.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        doc.moveDown(0.3);
        continue;
      }

      if (trimmed.startsWith('### ')) {
        doc.fontSize(13).font('Helvetica-Bold').text(trimmed.slice(4)).moveDown(0.2);
      } else if (trimmed.startsWith('## ')) {
        doc.fontSize(14).font('Helvetica-Bold').text(trimmed.slice(3)).moveDown(0.2);
      } else if (trimmed.startsWith('# ')) {
        doc.fontSize(16).font('Helvetica-Bold').text(trimmed.slice(2)).moveDown(0.2);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        doc.fontSize(10).font('Helvetica').text(`  \u2022  ${trimmed.slice(2)}`, { indent: 15 });
      } else if (/^\d+\.\s/.test(trimmed)) {
        doc.fontSize(10).font('Helvetica').text(`  ${trimmed}`, { indent: 10 });
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        doc.fontSize(10).font('Helvetica-Bold').text(trimmed.slice(2, -2));
      } else {
        doc.fontSize(10).font('Helvetica').text(trimmed);
      }

      // Check if we need a new page
      if (doc.y > 720) {
        doc.addPage();
      }
    }
  }

  // Final footer page
  doc.addPage();
  doc.moveDown(4);
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('End of Report', { align: 'center' })
    .moveDown(1);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#666666')
    .text(
      `This report was generated automatically by AccomPro AI on ${format(new Date(), 'dd MMMM yyyy')}. ` +
      'Data reflects the state of records at the time of generation. ' +
      'Please verify critical findings against source records before any inspection.',
      { align: 'center' }
    );

  doc.end();
  return stream;
}
