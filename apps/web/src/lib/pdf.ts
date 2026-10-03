import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/* ═══════════════════════════════════════════════════════════════
   PDF utility — renders receipt HTML (same builders used by
   print.ts) into a professional A4 invoice PDF, then shares it
   via the Web Share API (mobile) or downloads it as a fallback.
   ═══════════════════════════════════════════════════════════════ */

const PDF_WIDTH_PX = 794; // A4 width @ 96dpi
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 10;

const PDF_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', 'Noto Sans Arabic', 'Tahoma', sans-serif;
    background: #ffffff;
    color: #0f172a;
    direction: rtl;
    -webkit-font-smoothing: antialiased;
  }
  .pdf-sheet { width: ${PDF_WIDTH_PX}px; padding: 44px 48px; background: #ffffff; direction: rtl; }
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 18px;
    border-bottom: 3px solid #0f766e;
    margin-bottom: 24px;
  }
  .doc-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
  .doc-subtitle { font-size: 15px; font-weight: 700; color: #0f766e; }
  .info-grid { display: flex; flex-wrap: wrap; gap: 10px 24px; margin-bottom: 20px; }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: calc(50% - 12px);
    padding: 9px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
  }
  .info-label { color: #64748b; font-size: 12px; }
  .info-value { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 20px; font-size: 12px; }
  th { background: #0f766e; color: #ffffff; font-weight: 600; padding: 9px 10px; text-align: right; border: 1px solid #0d5f59; }
  td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: right; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 4px;
    padding: 12px 16px;
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    border-right: 4px solid #0f766e;
    border-radius: 6px;
  }
  .notes { margin-top: 14px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .badge-active { background: #dcfce7; color: #166534; }
  .badge-cancelled { background: #fee2e2; color: #991b1b; }
  .doc-footer { margin-top: 28px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
`;

export type PdfShareResult = 'shared' | 'downloaded' | 'cancelled';

/* ─── Canvas → A4 PDF (slices long content into multiple pages) ─── */

function canvasToPdfBlob(canvas: HTMLCanvasElement, title: string): Blob {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.setProperties({ title });

  const usableWidth = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const usableHeight = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const totalHeightMm = (canvas.height * usableWidth) / canvas.width;

  if (totalHeightMm <= usableHeight) {
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      PAGE_MARGIN_MM,
      PAGE_MARGIN_MM,
      usableWidth,
      totalHeightMm,
    );
  } else {
    const chunkHeightPx = Math.floor(
      (canvas.width * usableHeight) / usableWidth,
    );
    let offset = 0;
    while (offset < canvas.height) {
      if (offset > 0) pdf.addPage();
      const sliceHeight = Math.min(chunkHeightPx, canvas.height - offset);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext('2d');
      if (!ctx) throw new Error('canvas context unavailable');
      ctx.drawImage(
        canvas,
        0,
        offset,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );
      pdf.addImage(
        slice.toDataURL('image/png'),
        'PNG',
        PAGE_MARGIN_MM,
        PAGE_MARGIN_MM,
        usableWidth,
        (sliceHeight * usableWidth) / canvas.width,
      );
      offset += chunkHeightPx;
    }
  }

  return pdf.output('blob');
}

/* ─── Renderers ─── */

export async function generatePdfBlob(
  html: string,
  title: string,
): Promise<Blob> {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;top:0;left:-99999px;width:${PDF_WIDTH_PX}px;background:#ffffff;direction:rtl;z-index:-1;`;
  host.innerHTML = `<style>${PDF_STYLES}</style><div class="pdf-sheet">${html}<div class="doc-footer">Prince Net — تم إنشاء هذا المستند بتاريخ ${new Date().toLocaleString('ar')}</div></div>`;
  document.body.appendChild(host);
  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    return canvasToPdfBlob(canvas, title);
  } finally {
    host.remove();
  }
}

export async function generatePdfBlobFromElement(
  element: HTMLElement,
  title: string,
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
  });
  return canvasToPdfBlob(canvas, title);
}

/* ─── Share / download ─── */

export async function sharePdfBlob(
  blob: Blob,
  filename: string,
): Promise<PdfShareResult> {
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // any other sharing failure → fall back to download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}

export async function shareReceiptAsPdf(
  html: string,
  filename: string,
): Promise<PdfShareResult> {
  const blob = await generatePdfBlob(html, filename);
  return sharePdfBlob(blob, filename);
}

export async function shareElementAsPdf(
  element: HTMLElement,
  filename: string,
): Promise<PdfShareResult> {
  const blob = await generatePdfBlobFromElement(element, filename);
  return sharePdfBlob(blob, filename);
}
