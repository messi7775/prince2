import { Injectable, NotFoundException } from '@nestjs/common';
import type { Settings } from '@prince-net/types';
import type { UpdateSettingsInput } from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const SINGLETON_KEY = 'main';

@Injectable()
export class SettingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async get(): Promise<Settings> {
        const row = await this.prisma.settings.findUnique({
            where: { singletonKey: SINGLETON_KEY },
        });
        if (!row) {
            throw new NotFoundException({
                message: 'الإعدادات غير موجودة',
                code: 'SETTINGS_NOT_FOUND',
            });
        }
        return this.toSettings(row);
    }

    async update(
        input: UpdateSettingsInput,
        userId: string,
        req: { ip?: string; userAgent?: string },
    ): Promise<Settings> {
        const existing = await this.prisma.settings.findUnique({
            where: { singletonKey: SINGLETON_KEY },
        });
        if (!existing) {
            throw new NotFoundException({
                message: 'الإعدادات غير موجودة',
                code: 'SETTINGS_NOT_FOUND',
            });
        }

        const oldValues: Record<string, unknown> = {};
        const newValues: Record<string, unknown> = {};

        if (input.networkName !== undefined && input.networkName !== existing.networkName) {
            oldValues.networkName = existing.networkName;
            newValues.networkName = input.networkName;
        }
        if (input.currencyName !== undefined && input.currencyName !== existing.currencyName) {
            oldValues.currencyName = existing.currencyName;
            newValues.currencyName = input.currencyName;
        }
        if (input.currencySymbol !== undefined && input.currencySymbol !== existing.currencySymbol) {
            oldValues.currencySymbol = existing.currencySymbol;
            newValues.currencySymbol = input.currencySymbol;
        }
        if (input.adminEmail !== undefined && input.adminEmail !== existing.adminEmail) {
            oldValues.adminEmail = existing.adminEmail;
            newValues.adminEmail = input.adminEmail;
        }
        if (input.lowStockThreshold !== undefined && input.lowStockThreshold !== existing.lowStockThreshold) {
            oldValues.lowStockThreshold = existing.lowStockThreshold;
            newValues.lowStockThreshold = input.lowStockThreshold;
        }

        const row = await this.prisma.settings.update({
            where: { singletonKey: SINGLETON_KEY },
            data: {
                ...(input.networkName !== undefined ? { networkName: input.networkName } : {}),
                ...(input.currencyName !== undefined ? { currencyName: input.currencyName } : {}),
                ...(input.currencySymbol !== undefined ? { currencySymbol: input.currencySymbol } : {}),
                ...(input.adminEmail !== undefined ? { adminEmail: input.adminEmail } : {}),
                ...(input.lowStockThreshold !== undefined ? { lowStockThreshold: input.lowStockThreshold } : {}),
            },
        });

        if (Object.keys(newValues).length > 0) {
            await this.auditService.log({
                userId,
                action: 'SETTINGS_UPDATED',
                entityType: 'Settings',
                entityId: row.id,
                oldValues,
                newValues,
                ipAddress: req.ip ?? null,
                userAgent: req.userAgent ?? null,
            });
        }

        return this.toSettings(row);
    }

    private toSettings(row: {
        id: string;
        networkName: string;
        currencyName: string;
        currencySymbol: string;
        adminEmail: string;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
    }): Settings {
        return {
            id: row.id,
            networkName: row.networkName,
            currencyName: row.currencyName,
            currencySymbol: row.currencySymbol,
            adminEmail: row.adminEmail,
            lowStockThreshold: row.lowStockThreshold,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }
}