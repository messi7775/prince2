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
  createPackageSchema,
  updatePackageSchema,
  paginationSchema,
  type CreatePackageInput,
  type UpdatePackageInput,
  type PaginationInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PackagesService } from './packages.service';

type AuthUser = { userId: string; email: string };

interface ListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'INACTIVE';
}

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('status') status?: string,
  ) {
    const normalized: ListQuery = {
      ...query,
      ...(status === 'ACTIVE' || status === 'INACTIVE' ? { status } : {}),
    };
    return this.packagesService.list(normalized);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.packagesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createPackageSchema)) body: CreatePackageInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.packagesService.create(body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePackageSchema)) body: UpdatePackageInput,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.packagesService.update(id, body, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.packagesService.activate(id, user.userId);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.packagesService.deactivate(id, user.userId);
  }
}