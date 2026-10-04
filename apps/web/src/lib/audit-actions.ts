import type { AuditAction } from '@prince-net/types';

export interface AuditActionOption {
  value: AuditAction;
  label: string;
}

export const AUDIT_ACTIONS: AuditActionOption[] = [
  { value: 'LOGIN', label: 'تسجيل دخول' },
  { value: 'LOGIN_FAILED', label: 'فشل تسجيل دخول' },
  { value: 'PACKAGE_CREATED', label: 'إنشاء باقة' },
  { value: 'PACKAGE_UPDATED', label: 'تعديل باقة' },
  { value: 'INVENTORY_ADDED', label: 'إضافة مخزون' },
  { value: 'INVENTORY_ADJUSTED', label: 'تعديل مخزون' },
  { value: 'INVENTORY_RETURNED', label: 'إعادة مخزون' },
  { value: 'INVENTORY_BATCH_UPDATED', label: 'تعديل دفعة مخزون' },
  { value: 'INVENTORY_BATCH_DELETED', label: 'حذف دفعة مخزون' },
  { value: 'DISTRIBUTOR_CREATED', label: 'إضافة موزع' },
  { value: 'DISTRIBUTOR_UPDATED', label: 'تعديل موزع' },
  { value: 'DISTRIBUTOR_ACTIVATED', label: 'تفعيل موزع' },
  { value: 'DISTRIBUTOR_DEACTIVATED', label: 'تعطيل موزع' },
  { value: 'SALE_CREATED', label: 'إنشاء بيع' },
  { value: 'SALE_CANCELLED', label: 'إلغاء بيع' },
  { value: 'SALE_UPDATED', label: 'تعديل بيع' },
  { value: 'PAYMENT_CREATED', label: 'إنشاء دفعة' },
  { value: 'PAYMENT_UPDATED', label: 'تعديل دفعة' },
  { value: 'PAYMENT_DELETED', label: 'حذف دفعة' },
  { value: 'PAYMENT_REVERSED', label: 'عكس دفعة' },
  { value: 'LINE_CREATED', label: 'إضافة خط' },
  { value: 'LINE_UPDATED', label: 'تعديل خط' },
  { value: 'LINE_DELETED', label: 'حذف خط' },
  { value: 'LINE_ACTIVATED', label: 'تفعيل خط' },
  { value: 'LINE_DEACTIVATED', label: 'تعطيل خط' },
  { value: 'LINE_PAYMENT_CREATED', label: 'إنشاء دفعة خط' },
  { value: 'LINE_PAYMENT_REVERSED', label: 'عكس دفعة خط' },
  { value: 'EXPENSE_CREATED', label: 'إنشاء مصروف' },
  { value: 'EXPENSE_UPDATED', label: 'تعديل مصروف' },
  { value: 'EXPENSE_REVERSED', label: 'عكس مصروف' },
  { value: 'EXPENSE_DELETED', label: 'حذف مصروف' },
  { value: 'EXPENSE_CATEGORY_CREATED', label: 'إنشاء تصنيف مصروفات' },
  { value: 'EXPENSE_CATEGORY_UPDATED', label: 'تعديل تصنيف مصروفات' },
  { value: 'EXPENSE_CATEGORY_ACTIVATED', label: 'تفعيل تصنيف مصروفات' },
  { value: 'EXPENSE_CATEGORY_DEACTIVATED', label: 'تعطيل تصنيف مصروفات' },
  { value: 'EXPENSE_CATEGORY_DELETED', label: 'حذف تصنيف مصروفات' },
  { value: 'OWNER_WITHDRAWAL_CREATED', label: 'سحب المالك' },
  { value: 'OWNER_WITHDRAWAL_UPDATED', label: 'تعديل سحب المالك' },
  { value: 'OWNER_WITHDRAWAL_DELETED', label: 'حذف سحب المالك' },
  { value: 'OWNER_WITHDRAWAL_REVERSED', label: 'عكس سحب المالك' },
  { value: 'CASH_CLOSING_CREATED', label: 'إغلاق الصندوق' },
  { value: 'CASH_MANUAL_IN', label: 'إيداع يدوي' },
  { value: 'CASH_MANUAL_OUT', label: 'سحب يدوي' },
  { value: 'BACKUP_CREATED', label: 'إنشاء نسخة احتياطية' },
  { value: 'BACKUP_RESTORED', label: 'استعادة نسخة' },
  { value: 'BACKUP_EXPORTED', label: 'تصدير نسخة إلى الجهاز' },
  { value: 'BACKUP_DELETED', label: 'حذف نسخة احتياطية' },
  { value: 'BACKUPS_PURGED', label: 'حذف جميع النسخ الاحتياطية' },
  { value: 'SETTINGS_UPDATED', label: 'تعديل الإعدادات' },
  { value: 'PASSWORD_CHANGED', label: 'تغيير كلمة المرور' },
];

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  Sale: 'مبيعة',
  Payment: 'دفعة',
  Package: 'باقة',
  PackageStock: 'دفعة مخزون',
  Distributor: 'موزع',
  Line: 'خط',
  LinePayment: 'دفعة خط',
  Expense: 'مصروف',
  ExpenseCategory: 'تصنيف مصروفات',
  OwnerWithdrawal: 'سحب المالك',
  CashMovement: 'حركة نقدية',
  CashClosing: 'إغلاق الصندوق',
  Settings: 'الإعدادات',
  Backup: 'نسخة احتياطية',
  User: 'مستخدم',
};

const FIELD_LABELS: Record<string, string> = {
  id: 'المعرّف',
  packageId: 'معرّف الباقة',
  distributorId: 'معرّف الموزع',
  saleId: 'معرّف المبيعة',
  paymentId: 'معرّف الدفعة',
  lineId: 'معرّف الخط',
  linePaymentId: 'معرّف دفعة الخط',
  expenseId: 'معرّف المصروف',
  categoryId: 'معرّف التصنيف',
  quantity: 'الكمية',
  unitPrice: 'سعر الوحدة',
  price: 'السعر',
  amount: 'المبلغ',
  initialPayment: 'الدفعة الأولى',
  name: 'الاسم',
  description: 'الوصف',
  notes: 'الملاحظات',
  reason: 'السبب',
  status: 'الحالة',
  type: 'النوع',
  method: 'طريقة الدفع',
  color: 'اللون',
  dataSizeMb: 'حجم البيانات',
  hours: 'الساعات',
  items: 'العناصر',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  CANCELLED: 'ملغاة',
  PAID: 'مدفوعة',
  PENDING: 'معلقة',
};

export function getAuditActionLabel(action: AuditAction | string): string {
  return AUDIT_ACTIONS.find((item) => item.value === action)?.label ?? action;
}

export function getEntityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

export function getAuditFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

export function formatAuditValue(value: unknown, key?: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value);
  if (key === 'status' && typeof value === 'string') return STATUS_LABELS[value] ?? value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length} عنصر`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function getAuditActionTone(action: AuditAction | string): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (action.endsWith('_CREATED') || action === 'LOGIN' || action === 'INVENTORY_ADDED' || action === 'CASH_MANUAL_IN') return 'success';
  if (action.includes('DELETED') || action.includes('CANCELLED') || action.includes('REVERSED') || action === 'LOGIN_FAILED' || action === 'CASH_MANUAL_OUT') return 'destructive';
  if (action.includes('UPDATED') || action.includes('ADJUSTED') || action.includes('RETURNED') || action.includes('DEACTIVATED')) return 'warning';
  return 'secondary';
}
