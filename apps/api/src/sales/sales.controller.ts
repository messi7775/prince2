import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  createSaleSchema,
  cancelSaleSchema,
  updateSaleSchema,
  paginationSchema,
  type CreateSaleInput,
  type CancelSaleInput,
  type UpdateSaleInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SalesService } from './sales.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  distributorId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
  dateFrom?: string;
  dateTo?: string;
}

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('distributorId') distributorId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(distributorId ? { distributorId } : {}),
      ...(status === 'ACTIVE' || status === 'CANCELLED' ? { status } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
    return this.salesService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createSaleSchema)) body: CreateSaleInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.salesService.create(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cancelSaleSchema)) body: CancelSaleInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.salesService.cancel(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSaleSchema)) body: UpdateSaleInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.salesService.update(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}