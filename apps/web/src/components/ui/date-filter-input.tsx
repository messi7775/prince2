import { DatePicker } from './date-picker';

interface DateFilterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function toDateValue(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toDateString(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateFilterInput({
  value,
  onChange,
  placeholder,
  disabled,
}: DateFilterInputProps) {
  return (
    <DatePicker
      value={toDateValue(value)}
      onChange={(d) => onChange(toDateString(d))}
      placeholder={placeholder ?? 'اختر تاريخًا'}
      disabled={disabled}
    />
  );
}
