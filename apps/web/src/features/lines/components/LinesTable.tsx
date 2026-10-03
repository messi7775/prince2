import { Link } from 'react-router-dom';
import { MoreHorizontal, Wifi } from 'lucide-react';
import type { Line } from '@prince-net/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { EmptyState } from '../../../components/ui/empty-state';
import { formatMoney } from '../../../lib/currency';

interface LinesTableProps {
  data: Line[];
  onEdit: (line: Line) => void;
  onToggleStatus: (line: Line) => void;
  isUpdating: boolean;
}

export function LinesTable({
  data,
  onEdit,
  onToggleStatus,
  isUpdating,
}: LinesTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Wifi}
        title="لا توجد خطوط"
        description="ابدأ بإضافة خط جديد"
      />
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead className="hidden sm:table-cell">المزود</TableHead>
            <TableHead className="hidden md:table-cell">المعرّف</TableHead>
            <TableHead>التكلفة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-medium">
                <Link to={`/lines/${line.id}`} className="hover:underline">
                  {line.name}
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">{line.provider}</TableCell>
              <TableCell className="hidden md:table-cell num text-sm">{line.identifier}</TableCell>
              <TableCell className="num">
                {formatMoney(line.cost)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={line.status === 'ACTIVE' ? 'success' : 'secondary'}
                >
                  {line.status === 'ACTIVE' ? 'مفعّل' : 'معطّل'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isUpdating}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/lines/${line.id}`}>عرض التفاصيل</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(line)}>
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(line)}
                      className={
                        line.status === 'ACTIVE'
                          ? 'text-destructive'
                          : 'text-green-600'
                      }
                    >
                      {line.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
