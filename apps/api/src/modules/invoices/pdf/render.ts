import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Fonts live next to the bundled code (dist/fonts locally, /var/task/fonts in
// Lambda) — copy-assets.mjs puts them there. Never process.cwd(): Lambda's
// working directory is not guaranteed.
const fontsDir = join(dirname(fileURLToPath(import.meta.url)), 'fonts');

const printer = new PdfPrinter({
  Roboto: {
    normal: join(fontsDir, 'Roboto-Regular.ttf'),
    bold: join(fontsDir, 'Roboto-Bold.ttf'),
    italics: join(fontsDir, 'Roboto-Italic.ttf'),
    bolditalics: join(fontsDir, 'Roboto-BoldItalic.ttf'),
  },
});

// Backend-main streamed the document into the HTTP response; on Lambda the
// PDF is buffered in full and handed to S3 instead.
export const renderPdf = (docDefinition: TDocumentDefinitions): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
