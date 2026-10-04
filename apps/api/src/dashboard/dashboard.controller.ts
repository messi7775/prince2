import { Controller, Get, Query } from '@nestjs/common';
import type { DashboardPeriod } from '@prince-net/types';
import { DashboardService } from './dashboard.service';

const VALID_PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'year'];

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async get(@Query('period') period?: string) {
    const normalized: DashboardPeriod =
      period && VALID_PERIODS.includes(period as DashboardPeriod)
        ? (period as DashboardPeriod)
        : 'today';
    return this.dashboardService.get(normalized);
  }
}
