import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuditModule } from './audit/audit.module';
import { CsrfModule } from './csrf/csrf.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PackagesModule } from './packages/packages.module';
import { InventoryModule } from './inventory/inventory.module';
import { DistributorsModule } from './distributors/distributors.module';
import { SalesModule } from './sales/sales.module';
import { PaymentsModule } from './payments/payments.module';
import { CashModule } from './cash/cash.module';
import { LinesModule } from './lines/lines.module';
import { LinePaymentsModule } from './line-payments/line-payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { OwnerWithdrawalsModule } from './owner-withdrawals/owner-withdrawals.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { BackupsModule } from './backupss/backups.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { validateEnv } from './config/env.validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../../.env', '.env'],
            cache: true,
            validate: validateEnv,
        }),

        ThrottlerModule.forRoot([
            {
                ttl: 60_000,
                limit: 120,
            },
        ]),

        PrismaModule,
        CommonModule,
        AuditModule,
        CsrfModule,
        UsersModule,
        AuthModule,
        PackagesModule,
        InventoryModule,
        DistributorsModule,
        SalesModule,
        PaymentsModule,
        CashModule,
        LinesModule,
        LinePaymentsModule,
        ExpensesModule,
        ExpenseCategoriesModule,
        OwnerWithdrawalsModule,
        ReportsModule,
        SearchModule,
        BackupsModule,
        SettingsModule,
        DashboardModule,
        HealthModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule { }