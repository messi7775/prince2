import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  PackageEntity,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import type {
  CreatePackageInput,
  UpdatePackageInput,
} from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  normalizePagination,
  buildPaginationMeta,
  type PaginationInput,
} from '../common/utils/pagination.util';

interface PackageListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'INACTIVE';
}

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    query: PackageListQuery,
  ): Promise<PaginatedResponse<PackageEntity>> {
    const { page, limit, skip, take, search, order } =
      normalizePagination(query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take,
        orderBy: { name: order },
      }),
      this.prisma.package.count({ where }),
    ]);

    const data: PackageEntity[] = rows.map((row) => this.toEntity(row));
    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);

    return { success: true, data, meta };
  }

  async findById(id: string): Promise<PackageEntity> {
    const row = await this.prisma.package.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        message: 'الباقة غير موجودة',
        code: 'PACKAGE_NOT_FOUND',
      });
    }
    return this.toEntity(row);
  }

  async create(
    input: CreatePackageInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<PackageEntity> {
    const row = await this.prisma.package.create({
      data: {
        name: input.name,
        price: input.price,
        dataSizeMb: input.dataSizeMb,
        hours: input.hours,
        color: input.color ?? null,
        description: input.description ?? null,
        status: 'ACTIVE',
      },
    });

    await this.auditService.log({
      userId,
      action: 'PACKAGE_CREATED',
      entityType: 'Package',
      entityId: row.id,
      newValues: {
        name: row.name,
        price: row.price.toString(),
        dataSizeMb: row.dataSizeMb,
        hours: row.hours,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.toEntity(row);
  }

  async update(
    id: string,
    input: UpdatePackageInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<PackageEntity> {
    const existing = await this.prisma.package.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        message: 'الباقة غير موجودة',
        code: 'PACKAGE_NOT_FOUND',
      });
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (input.name !== undefined && input.name !== existing.name) {
      oldValues.name = existing.name;
      newValues.name = input.name;
    }
    if (
      input.price !== undefined &&
      input.price !== existing.price.toString()
    ) {
      oldValues.price = existing.price.toString();
      newValues.price = input.price;
    }
    if (
      input.dataSizeMb !== undefined &&
      input.dataSizeMb !== existing.dataSizeMb
    ) {
      oldValues.dataSizeMb = existing.dataSizeMb;
      newValues.dataSizeMb = input.dataSizeMb;
    }
    if (input.hours !== undefined && input.hours !== existing.hours) {
      oldValues.hours = existing.hours;
      newValues.hours = input.hours;
    }
    if (input.color !== undefined && input.color !== existing.color) {
      oldValues.color = existing.color;
      newValues.color = input.color;
    }
    if (
      input.description !== undefined &&
      input.description !== existing.description
    ) {
      oldValues.description = existing.description;
      newValues.description = input.description;
    }

    const row = await this.prisma.package.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.dataSizeMb !== undefined
          ? { dataSizeMb: input.dataSizeMb }
          : {}),
        ...(input.hours !== undefined ? { hours: input.hours } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
      },
    });

    await this.auditService.log({
      userId,
      action: 'PACKAGE_UPDATED',
      entityType: 'Package',
      entityId: id,
      oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
      newValues: Object.keys(newValues).length > 0 ? newValues : null,
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.toEntity(row);
  }

  async activate(id: string, userId: string): Promise<PackageEntity> {
    return this.setStatus(id, 'ACTIVE', userId);
  }

  async deactivate(id: string, userId: string): Promise<PackageEntity> {
    return this.setStatus(id, 'INACTIVE', userId);
  }

  private async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    userId: string,
  ): Promise<PackageEntity> {
    const existing = await this.prisma.package.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        message: 'الباقة غير موجودة',
        code: 'PACKAGE_NOT_FOUND',
      });
    }

    if (existing.status === status) {
      return this.toEntity(existing);
    }

    const row = await this.prisma.package.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      userId,
      action: 'PACKAGE_UPDATED',
      entityType: 'Package',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
    });

    return this.toEntity(row);
  }

  private toEntity(row: {
    id: string;
    name: string;
    price: { toString(): string };
    dataSizeMb: number;
    hours: number;
    color: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PackageEntity {
    return {
      id: row.id,
      name: row.name,
      price: row.price.toString(),
      dataSizeMb: row.dataSizeMb,
      hours: row.hours,
      color: row.color,
      status: row.status,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}