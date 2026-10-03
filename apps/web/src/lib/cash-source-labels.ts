import type { CashSourceType } from '@prince-net/types';

const LABELS: Record<CashSourceType, string> = {
  OPENING: 'رصيد افتتاحي',
  SALE_PAYMENT: 'دفعة مبيعات',
  SALE_PAYMENT_REVERSAL: 'عكس دفعة مبيعات',
  EXPENSE: 'مصروف',
  EXPENSE_REVERSAL: 'عكس مصروف',
  LINE_PAYMENT: 'دفعة خط',
  LINE_PAYMENT_REVERSAL: 'عكس دفعة خط',
  OWNER_WITHDRAWAL: 'سحب المالك',
  OWNER_WITHDRAWAL_REVERSAL: 'عكس سحب المالك',
  MANUAL: 'يدوي',
};

export function cashSourceLabel(sourceType: string): string {
  return LABELS[sourceType as CashSourceType] ?? sourceType;
}
