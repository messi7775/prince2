import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Sale } from '@prince-net/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { EmptyState } from '../../../components/ui/empty-state';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';

interface SalesTableProps {
    data: Sale[];
}

export function SalesTable({ data }: SalesTableProps) {
    if (data.length === 0) {
        return (
            <EmptyState
        icon= { ShoppingCart }
        title = "لا توجد مبيعات"
        description = "ابدأ بإنشاء فاتورة جديدة"
            />
    );
    }

    return (
        <div className= "rounded-md border bg-card" >
        <Table>
        <TableHeader>
        <TableRow>
        <TableHead>رقم الفاتورة </TableHead>
            < TableHead className = "hidden sm:table-cell" > الموزع </TableHead>
                < TableHead className = "hidden sm:table-cell" > التاريخ </TableHead>
                    < TableHead > الإجمالي </TableHead>
                    < TableHead > الحالة </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
    {
        data.map((sale) => (
            <TableRow key= { sale.id } >
            <TableCell>
            <Link
                  to={`/sales/${sale.id}`}
    className = "hover:underline num font-medium"
        >
    { sale.invoiceNumber }
        </Link>
        </TableCell>
        < TableCell className = "hidden sm:table-cell text-sm" >
        { sale.distributorName ?? '—' }
            </TableCell>
            < TableCell className = "hidden sm:table-cell text-sm whitespace-nowrap" >
            { formatDateTime(sale.saleDate) }
                </TableCell>
                < TableCell className = "num font-medium" >
                { formatMoney(sale.totalAmount) }
                    </TableCell>
                    < TableCell >
                    <InvoiceStatusBadge sale={sale} />
        </TableCell>
        </TableRow>
          ))
}
</TableBody>
    </Table>
    </div>
  );
}
