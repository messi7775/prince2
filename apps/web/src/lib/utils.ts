import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — دمج classNames مع حلّ التعارضات في Tailwind.
 * تُستخدم في كل مكونات shadcn/ui.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
