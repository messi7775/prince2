import { formatDateTime } from './format';
import { formatMoney } from './currency';

/* ═══════════════════════════════════════════════════════════════
   Print utility — generates a formatted receipt in a hidden
   iframe and triggers the browser print dialog.
   ═══════════════════════════════════════════════════════════════ */

function escapePrintText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const STYLES = `
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', 'Noto Sans Arabic', sans-serif;
    padding: 24px;
    color: #000;
    direction: rtl;
  }
  @page { margin: 1.5cm; direction: rtl; }
  .doc-header { text-align: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #000; }
  .doc-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  .doc-subtitle { font-size: 13px; color: #555; margin: 0; }
  .info-grid { margin: 16px 0; }
  .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #ddd; font-size: 13px; }
  .info-label { color: #666; }
  .info-value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 12px; text-align: right; }
  th { background: #f0f0f0; font-weight: 600; }
  .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 16px; padding: 8px 0; border-top: 2px solid #000; }
  .notes { margin-top: 16px; padding: 8px 12px; background: #f9f9f9; border-radius: 4px; font-size: 12px; }
  .doc-footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-active { background: #dcfce7; color: #166534; }
  .badge-cancelled { background: #fee2e2; color: #991b1b; }
`;

export function printHTML(html: string, title = 'طباعة') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapePrintText(title)}</title>
  <style>${STYLES}</style>
</head>
<body>${html}
<div class="doc-footer">Prince Net — تم إنشاء هذا المستند بتاريخ ${new Date().toLocaleString('ar')}</div>
</body>
</html>`);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
}

/* ─── Receipt builders ─── */

export function buildExpenseReceipt(opts: {
    date: string;
    category: string;
    description: string;
    amount: string;
    status: string;
    notes?: string | null;
}) {
    const statusLabel = opts.status === 'ACTIVE' ? 'نشط' : 'معكوس';
    const badgeClass =
        opts.status === 'ACTIVE' ? 'badge-active' : 'badge-cancelled';
    return `
    <div class="doc-header">
      <p class="doc-title">سند مصروف</p>
      <p class="doc-subtitle">Prince Net</p>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">التاريخ</span><span class="info-value">${escapePrintText(opts.date)}</span></div>
      <div class="info-row"><span class="info-label">التصنيف</span><span class="info-value">${escapePrintText(opts.category)}</span></div>
      <div class="info-row"><span class="info-label">الوصف</span><span class="info-value">${escapePrintText(opts.description)}</span></div>
      <div class="info-row"><span class="info-label">الحالة</span><span class="info-value"><span class="badge ${badgeClass}">${statusLabel}</span></span></div>
    </div>
    <div class="total-row"><span>المبلغ الإجمالي</span><span>${opts.amount} ر.ي</span></div>
    ${opts.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${escapePrintText(opts.notes)}</div>` : ''}
  `;
}

export function buildWithdrawalReceipt(opts: {
    date: string;
    reason: string;
    amount: string;
    status: string;
    notes?: string | null;
}) {
    const statusLabel = opts.status === 'ACTIVE' ? 'نشط' : 'معكوس';
    const badgeClass =
        opts.status === 'ACTIVE' ? 'badge-active' : 'badge-cancelled';
    return `
    <div class="doc-header">
      <p class="doc-title">سند سحب مالك</p>
      <p class="doc-subtitle">Prince Net</p>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">التاريخ</span><span class="info-value">${escapePrintText(opts.date)}</span></div>
      <div class="info-row"><span class="info-label">السبب</span><span class="info-value">${escapePrintText(opts.reason)}</span></div>
      <div class="info-row"><span class="info-label">الحالة</span><span class="info-value"><span class="badge ${badgeClass}">${statusLabel}</span></span></div>
    </div>
    <div class="total-row"><span>المبلغ المسحوب</span><span>${opts.amount} ر.ي</span></div>
    ${opts.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${escapePrintText(opts.notes)}</div>` : ''}
  `;
}

export function buildSaleReceipt(opts: {
    invoiceNumber: string;
    date: string;
    distributorName: string;
    status: string;
    items: { packageNameSnapshot: string; quantity: number; unitPrice: string; totalPrice: string }[];
    totalAmount: string;
    paidAmount: string;
    remainingAmount: string;
    notes?: string | null;
}) {
    const statusLabel =
        opts.status === 'ACTIVE' ? 'نشطة' : opts.status === 'CANCELLED' ? 'ملغاة' : opts.status;
    const badgeClass =
        opts.status === 'ACTIVE' ? 'badge-active' : 'badge-cancelled';
    const itemsRows = opts.items
        .map(
            (item) => `<tr>
        <td>${escapePrintText(item.packageNameSnapshot)}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:left">${item.unitPrice}</td>
        <td style="text-align:left">${item.totalPrice}</td>
      </tr>`,
        )
        .join('');
    return `
    <div class="doc-header">
      <p class="doc-title">فاتورة ${escapePrintText(opts.invoiceNumber)}</p>
      <p class="doc-subtitle">Prince Net</p>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">رقم الفاتورة</span><span class="info-value">${escapePrintText(opts.invoiceNumber)}</span></div>
      <div class="info-row"><span class="info-label">التاريخ</span><span class="info-value">${escapePrintText(opts.date)}</span></div>
      <div class="info-row"><span class="info-label">الموزع</span><span class="info-value">${escapePrintText(opts.distributorName)}</span></div>
      <div class="info-row"><span class="info-label">الحالة</span><span class="info-value"><span class="badge ${badgeClass}">${statusLabel}</span></span></div>
    </div>
    <table>
      <thead>
        <tr><th>الباقة</th><th style="text-align:center">الكمية</th><th style="text-align:left">سعر الشدة</th><th style="text-align:left">الإجمالي</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">الإجمالي</span><span class="info-value">${opts.totalAmount} ر.ي</span></div>
      <div class="info-row"><span class="info-label">المدفوع</span><span class="info-value">${opts.paidAmount} ر.ي</span></div>
      <div class="info-row"><span class="info-label">المتبقي</span><span class="info-value">${opts.remainingAmount} ر.ي</span></div>
    </div>
    ${opts.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${escapePrintText(opts.notes)}</div>` : ''}
  `;
}


export function buildLinePaymentsReceipt(opts: {
    lineName: string;
    identifier: string;
    cost: string;
    payments: {
        amount: string;
        period: string;
        status: 'ACTIVE' | 'REVERSED';
        paymentDate: string;
        notes: string | null;
        reversalReason: string | null;
    }[];
}) {
    const toCents = (value: string): bigint => {
        const normalized = value.trim().replace(',', '.');
        const [integer = '0', fraction = ''] = normalized.split('.');
        const sign = integer.startsWith('-') ? -1n : 1n;
        const absInteger = integer.replace('-', '') || '0';
        const cents = (fraction.padEnd(2, '0').slice(0, 2));
        return sign * (BigInt(absInteger) * 100n + BigInt(cents || '0'));
    };

    const fromCents = (value: bigint): string => {
        const sign = value < 0n ? '-' : '';
        const abs = value < 0n ? -value : value;
        return `${sign}${(abs / 100n).toString()}.${(abs % 100n).toString().padStart(2, '0')}`;
    };

    const activeTotal = opts.payments
        .filter((payment) => payment.status === 'ACTIVE')
        .reduce((sum, payment) => sum + toCents(payment.amount), 0n);

    const rows = opts.payments
        .map((payment) => {
            const isActive = payment.status === 'ACTIVE';
            const statusLabel = isActive ? 'نشطة' : 'معكوسة';
            const badgeClass = isActive ? 'badge-active' : 'badge-cancelled';
            const note = payment.reversalReason
                ? `معكوسة: ${payment.reversalReason}`
                : (payment.notes ?? '—');
            return `<tr>
        <td>${escapePrintText(formatDateTime(payment.paymentDate))}</td>
        <td>${escapePrintText(payment.period || '—')}</td>
        <td style="text-align:left">${escapePrintText(formatMoney(payment.amount))} ر.ي</td>
        <td><span class="badge ${badgeClass}">${escapePrintText(statusLabel)}</span></td>
        <td>${escapePrintText(note)}</td>
      </tr>`;
        })
        .join('');

    return `
    <div class="doc-header">
      <p class="doc-title">سجل دفعات الخط</p>
      <p class="doc-subtitle">Prince Net</p>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">اسم الخط</span><span class="info-value">${escapePrintText(opts.lineName)}</span></div>
      <div class="info-row"><span class="info-label">المعرّف</span><span class="info-value">${escapePrintText(opts.identifier)}</span></div>
      <div class="info-row"><span class="info-label">التكلفة الشهرية</span><span class="info-value">${escapePrintText(opts.cost)} ر.ي</span></div>
    </div>
    <table>
      <thead>
        <tr><th>التاريخ</th><th>الفترة / الوصف</th><th style="text-align:left">المبلغ</th><th>الحالة</th><th>الملاحظات</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center">لا توجد دفعات</td></tr>'}</tbody>
    </table>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">إجمالي المدفوع</span><span class="info-value">${escapePrintText(formatMoney(fromCents(activeTotal)))} ر.ي</span></div>
      <div class="info-row"><span class="info-label">عدد الدفعات</span><span class="info-value">${opts.payments.length}</span></div>
    </div>
  `;
}
