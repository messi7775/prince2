import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* اختصارات لوحة المفاتيح العامة — تعمل فقط حين لا يكون
   التركيز داخل حقل إدخال ولا توجد مفاتيح تعديل مضغوطة.
   "/"  → البحث العام
   "d" → لوحة التحكم     "s" → المبيعات
   "c" → الصندوق         "r" → التقارير
   "p" → الباقات         "e" → المصروفات            */

const SHORTCUTS: Record<string, string> = {
  '/': '/search',
  d: '/dashboard',
  s: '/sales',
  c: '/cash',
  r: '/reports',
  p: '/packages',
  e: '/expenses',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key === 'Shift' ||
        isTypingTarget(e.target)
      ) {
        return;
      }

      const path = SHORTCUTS[e.key];
      if (path) {
        e.preventDefault();
        navigate(path);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
