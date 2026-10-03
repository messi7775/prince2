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
  createExpenseSchema,
  updateExpenseSchema,
  reverseExpenseSchema,
  paginationSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ReverseExpenseInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  categoryId?: string;
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(categoryId ? { categoryId } : {}),
      ...(status === 'ACTIVE' || status === 'REVERSED' ? { status } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
    return this.expensesService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.expensesService.create(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateExpenseSchema)) body: UpdateExpenseInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.expensesService.update(id, body, user.userId, {
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
    return this.expensesService.delete(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  async reverse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reverseExpenseSchema))
    body: ReverseExpenseInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.expensesService.reverse(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}