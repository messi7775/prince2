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
  createPaymentSchema,
  updatePaymentSchema,
  reversePaymentSchema,
  paginationSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type ReversePaymentInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'REVERSED';
}

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('sales/:saleId/payments')
  async listBySale(
    @Param('saleId') saleId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('status') status?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(status === 'ACTIVE' || status === 'REVERSED' ? { status } : {}),
    };
    return this.paymentsService.listBySale(saleId, normalized);
  }

  @Post('sales/:saleId/payments')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('saleId') saleId: string,
    @Body(new ZodValidationPipe(createPaymentSchema)) body: CreatePaymentInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.paymentsService.create(saleId, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch('payments/:id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePaymentSchema))
    body: UpdatePaymentInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.paymentsService.update(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post('payments/:id/reverse')
  @HttpCode(HttpStatus.OK)
  async reverse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reversePaymentSchema))
    body: ReversePaymentInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.paymentsService.reverse(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}