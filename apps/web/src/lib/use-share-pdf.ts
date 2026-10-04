import { useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';
import {
  shareReceiptAsPdf,
  shareElementAsPdf,
  type PdfShareResult,
} from './pdf';

/* Shared hook for the "مشاركة PDF" action — generates the PDF,
   shares it (mobile) or downloads it, and reports via toast. */

export function useSharePdf() {
  const { toast } = useToast();

  const report = useCallback(
    (result: PdfShareResult) => {
      if (result === 'shared') {
        toast({ title: 'تمت المشاركة' });
      } else if (result === 'downloaded') {
        toast({ title: 'تم تنزيل PDF' });
      }
    },
    [toast],
  );

  const shareReceipt = useCallback(
    async (html: string, filename: string) => {
      try {
        report(await shareReceiptAsPdf(html, filename));
      } catch {
        toast({
          variant: 'destructive',
          title: 'تعذّر إنشاء PDF',
          description: 'حدث خطأ أثناء إنشاء الملف',
        });
      }
    },
    [report, toast],
  );

  const shareElement = useCallback(
    async (element: HTMLElement, filename: string) => {
      try {
        report(await shareElementAsPdf(element, filename));
      } catch {
        toast({
          variant: 'destructive',
          title: 'تعذّر إنشاء PDF',
          description: 'حدث خطأ أثناء إنشاء الملف',
        });
      }
    },
    [report, toast],
  );

  return { shareReceipt, shareElement };
}
