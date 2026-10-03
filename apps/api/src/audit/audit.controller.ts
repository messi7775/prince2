import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  paginationSchema,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuditReadService } from './audit-read.service';

interface ListQuery extends PaginationInput {
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditReadService: AuditReadService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(userId ? { userId } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
    return this.auditReadService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.auditReadService.findById(id);
  }
}