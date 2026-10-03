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
  createDistributorSchema,
  updateDistributorSchema,
  paginationSchema,
  type CreateDistributorInput,
  type UpdateDistributorInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DistributorsService } from './distributors.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'INACTIVE';
}

@Controller('distributors')
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('status') status?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(status === 'ACTIVE' || status === 'INACTIVE' ? { status } : {}),
    };
    return this.distributorsService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.distributorsService.findById(id);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string) {
    return this.distributorsService.getBalance(id);
  }

  @Get(':id/sales')
  async getSales(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.distributorsService.getSales(id, query);
  }

  @Get(':id/payments')
  async getPayments(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.distributorsService.getPayments(id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createDistributorSchema))
    body: CreateDistributorInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.distributorsService.create(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDistributorSchema))
    body: UpdateDistributorInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.distributorsService.update(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.distributorsService.activate(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.distributorsService.deactivate(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}