import mammoth from 'mammoth';

// pdf-parse has non-standard exports; use require for compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as { PDFParse: any };

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const parser = new pdfParse.PDFParse({});
    await parser.load(buffer, 1);
    let text = '';
    // Extract text from all pages
    try {
      const info = await parser.getInfo();
      const numPages = info?.numPages || 1;
      for (let i = 0; i < numPages; i++) {
        const pageText = await parser.getText(i);
        if (pageText) text += pageText + '\n';
      }
    } catch {
      // Fallback: try single page
      const pageText = await parser.getText(0);
      text = pageText || '';
    }
    return text;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
