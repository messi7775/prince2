import {
  Body,
  Controller,
  Delete,
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
  createOwnerWithdrawalSchema,
  updateOwnerWithdrawalSchema,
  reverseOwnerWithdrawalSchema,
  paginationSchema,
  type CreateOwnerWithdrawalInput,
  type UpdateOwnerWithdrawalInput,
  type ReverseOwnerWithdrawalInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnerWithdrawalsService } from './owner-withdrawals.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

@Controller('owner-withdrawals')
export class OwnerWithdrawalsController {
  constructor(
    private readonly ownerWithdrawalsService: OwnerWithdrawalsService,
  ) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(status === 'ACTIVE' || status === 'REVERSED' ? { status } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
    return this.ownerWithdrawalsService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ownerWithdrawalsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createOwnerWithdrawalSchema))
    body: CreateOwnerWithdrawalInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.ownerWithdrawalsService.create(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOwnerWithdrawalSchema))
    body: UpdateOwnerWithdrawalInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.ownerWithdrawalsService.update(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.ownerWithdrawalsService.delete(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  async reverse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reverseOwnerWithdrawalSchema))
    body: ReverseOwnerWithdrawalInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.ownerWithdrawalsService.reverse(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}