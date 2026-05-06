import mammoth from 'mammoth';

let pdfParseModule: any = null;

async function getPdfParser() {
  if (!pdfParseModule) {
    pdfParseModule = await import('pdf-parse');
  }
  return pdfParseModule;
}

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const mod = await getPdfParser();
    const PDFParse = mod.PDFParse || mod.default?.PDFParse;
    if (!PDFParse) {
      throw new Error('pdf-parse module loaded but PDFParse class not found');
    }
    const parser = new PDFParse({});
    await parser.load(buffer, 1);
    let text = '';
    try {
      const info = await parser.getInfo();
      const numPages = info?.numPages || 1;
      for (let i = 0; i < numPages; i++) {
        const pageText = await parser.getText(i);
        if (pageText) text += pageText + '\n';
      }
    } catch {
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
