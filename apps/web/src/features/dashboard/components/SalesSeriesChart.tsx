import type { DashboardSeriesPoint } from '@prince-net/types';
import { Card, CardContent } from '../../../components/ui/card';
import { formatMoney } from '../../../lib/currency';
import { formatShortDate } from '../../../lib/format';

/* رسم أعمدة SVG بسيط لآخر 14 يومًا — مبيعات مقابل تحصيلات.
   التحويل الرقمي هنا للعرض فقط (لا عمليات مالية). */

const WIDTH = 800;
const HEIGHT = 220;
const PADDING = { top: 16, right: 8, bottom: 28, left: 8 };

interface SalesSeriesChartProps {
  data: DashboardSeriesPoint[];
}

export function SalesSeriesChart({ data }: SalesSeriesChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(
    ...data.map((p) => Math.max(Number(p.sales), Number(p.collections))),
    1,
  );

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(groupWidth / 3, 22);

  return (
    <Card>
      <CardContent className="sm:pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">آخر 14 يومًا</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
              المبيعات
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              التحصيلات
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-44"
          role="img"
          aria-label="مبيعات وتحصيلات آخر 14 يومًا"
        >
          {/* خطوط شبكة أفقية */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={PADDING.top + plotHeight * f}
              y2={PADDING.top + plotHeight * f}
              className="stroke-border"
              strokeWidth={1}
            />
          ))}

          {data.map((point, i) => {
            const cx = PADDING.left + groupWidth * i + groupWidth / 2;
            const salesH = (Number(point.sales) / max) * plotHeight;
            const collH = (Number(point.collections) / max) * plotHeight;
            const isLast = i === data.length - 1;

            return (
              <g key={point.date}>
                <rect
                  x={cx - barWidth - 2}
                  y={PADDING.top + plotHeight - salesH}
                  width={barWidth}
                  height={Math.max(salesH, point.sales !== '0.00' && point.sales !== '0' ? 2 : 0)}
                  rx={2}
                  className="fill-primary"
                />
                <rect
                  x={cx + 2}
                  y={PADDING.top + plotHeight - collH}
                  width={barWidth}
                  height={Math.max(collH, point.collections !== '0.00' && point.collections !== '0' ? 2 : 0)}
                  rx={2}
                  className="fill-emerald-500"
                />
                {(i % 2 === 0 || isLast) && (
                  <text
                    x={cx}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {point.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="grid grid-cols-2 gap-2 mt-2 sm:hidden">
          {data.slice(-2).map((p) => (
            <div key={p.date} className="rounded-md border p-2 text-xs">
              <p className="text-muted-foreground">{formatShortDate(p.date)}</p>
              <p className="num">مبيعات: {formatMoney(p.sales)}</p>
              <p className="num text-green-600">
                تحصيلات: {formatMoney(p.collections)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
