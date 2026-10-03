import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  createLinePaymentSchema,
  reverseLinePaymentSchema,
  paginationSchema,
  type CreateLinePaymentInput,
  type ReverseLinePaymentInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LinePaymentsService } from './line-payments.service';

type AuthUser = { userId: string; email: string };

@Controller()
export class LinePaymentsController {
  constructor(private readonly linePaymentsService: LinePaymentsService) {}

  @Get('lines/:lineId/payments')
  async listByLine(
    @Param('lineId') lineId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.linePaymentsService.listByLine(lineId, query);
  }

  @Post('lines/:lineId/payments')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('lineId') lineId: string,
    @Body(new ZodValidationPipe(createLinePaymentSchema))
    body: CreateLinePaymentInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.linePaymentsService.create(lineId, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post('line-payments/:id/reverse')
  @HttpCode(HttpStatus.OK)
  async reverse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reverseLinePaymentSchema))
    body: ReverseLinePaymentInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.linePaymentsService.reverse(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}