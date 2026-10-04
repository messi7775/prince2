import { BadRequestException } from '@nestjs/common';

/** Date-only report inputs use complete UTC days; timestamps retain their offset. */
export function dateBoundary(value: string, end = false): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T${end ? '23:59:59.999' : '00:00:00.000'}Z` : value);
  if (Number.isNaN(date.getTime()) || (dateOnly && date.toISOString().slice(0, 10) !== value)) {
    throw new BadRequestException({ code: 'INVALID_DATE', message: 'التاريخ غير صالح' });
  }
  return date;
}

export function dateRange(query: { dateFrom?: string; dateTo?: string }) {
  const from = query.dateFrom ? dateBoundary(query.dateFrom) : null;
  const to = query.dateTo ? dateBoundary(query.dateTo, true) : null;
  if (from && to && from > to) {
    throw new BadRequestException({ code: 'INVALID_DATE_RANGE', message: 'بداية الفترة يجب أن تسبق نهايتها' });
  }
  return { from, to };
}
