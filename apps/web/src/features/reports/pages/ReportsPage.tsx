import { useRef, useState } from 'react';
import { Printer, Share2 } from 'lucide-react';
import { useSharePdf } from '../../../lib/use-share-pdf';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { ReportDateRange } from '../components/ReportDateRange';
import { SalesReportTab } from '../components/SalesReportTab';
import { CashReportTab } from '../components/CashReportTab';
import { InventoryReportTab } from '../components/InventoryReportTab';
import { DistributorsReportTab } from '../components/DistributorsReportTab';
import { ExpensesReportTab } from '../components/ExpensesReportTab';
import { LinesReportTab } from '../components/LinesReportTab';
import { CollectionsReportTab } from '../components/CollectionsReportTab';
import { OwnerWithdrawalsReportTab } from '../components/OwnerWithdrawalsReportTab';

function getDefaultDateFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function getDefaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { shareElement } = useSharePdf();

  const handleSharePdf = async () => {
    if (!contentRef.current || isSharingPdf) return;
    setIsSharingPdf(true);
    try {
      await shareElement(contentRef.current, `تقرير-${dateTo}.pdf`);
    } finally {
      setIsSharingPdf(false);
    }
  };

  return (
    <div ref={contentRef} className="space-y-6">
      <PageHeader
        title="التقارير"
        description="تقارير مالية وتشغيلية"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="me-2 h-4 w-4" />
              طباعة
            </Button>
            <Button variant="outline" onClick={handleSharePdf} disabled={isSharingPdf}>
              <Share2 className="me-2 h-4 w-4" />
              {isSharingPdf ? 'جارٍ الإنشاء...' : 'مشاركة PDF'}
            </Button>
          </div>
        }
      />

      <ReportDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="collections">التحصيلات</TabsTrigger>
          <TabsTrigger value="cash">الصندوق</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="distributors">الموزعون</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="owner-withdrawals">سحوبات المالك</TabsTrigger>
          <TabsTrigger value="lines">الخطوط</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReportTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="collections">
          <CollectionsReportTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="cash">
          <CashReportTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryReportTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="distributors">
          <DistributorsReportTab />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesReportTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="owner-withdrawals">
          <OwnerWithdrawalsReportTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="lines">
          <LinesReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
