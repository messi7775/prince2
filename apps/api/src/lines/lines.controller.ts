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
  createLineSchema,
  updateLineSchema,
  paginationSchema,
  type CreateLineInput,
  type UpdateLineInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LinesService } from './lines.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'INACTIVE';
}

@Controller('lines')
export class LinesController {
  constructor(private readonly linesService: LinesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('status') status?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(status === 'ACTIVE' || status === 'INACTIVE' ? { status } : {}),
    };
    return this.linesService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.linesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createLineSchema)) body: CreateLineInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.linesService.create(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLineSchema)) body: UpdateLineInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.linesService.update(id, body, user.userId, {
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
    return this.linesService.activate(id, user.userId, {
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
    return this.linesService.deactivate(id, user.userId, {
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
    return this.linesService.delete(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}