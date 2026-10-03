import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../ui/dialog';
import { Sidebar } from './Sidebar';

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const location = useLocation();

  // إغلاق تلقائي عند تغيير الصفحة
  useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-y-0 end-0 start-auto left-auto top-0 h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-s p-0 lg:hidden data-[state=open]:slide-in-from-end data-[state=closed]:slide-out-to-end"
      >
        <DialogTitle className="sr-only">القائمة الرئيسية</DialogTitle>

        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="text-lg font-bold">البرنس نت</span>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 opacity-70 hover:opacity-100"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="overflow-y-auto h-[calc(100dvh-4rem)]">
          <Sidebar />
        </div>
      </DialogContent>
    </Dialog>
  );
}