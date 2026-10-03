import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  manualCashInSchema,
  manualCashOutSchema,
  paginationSchema,
  type ManualCashInInput,
  type ManualCashOutInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CashService } from './cash.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  direction?: 'IN' | 'OUT';
  sourceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('balance')
  async getBalance() {
    return this.cashService.getBalance();
  }

  @Get('movements')
  async listMovements(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('direction') direction?: string,
    @Query('sourceType') sourceType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(direction === 'IN' || direction === 'OUT' ? { direction } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
    return this.cashService.listMovements(normalized);
  }

  @Post('manual-in')
  @HttpCode(HttpStatus.CREATED)
  async manualIn(
    @Body(new ZodValidationPipe(manualCashInSchema))
    body: ManualCashInInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.cashService.manualIn(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post('manual-out')
  @HttpCode(HttpStatus.CREATED)
  async manualOut(
    @Body(new ZodValidationPipe(manualCashOutSchema))
    body: ManualCashOutInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.cashService.manualOut(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}