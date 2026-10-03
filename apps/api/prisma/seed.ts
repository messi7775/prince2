import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from '@node-rs/argon2';
import {
    DEFAULT_PACKAGES,
    DEFAULT_SETTINGS,
} from '@prince-net/config';

// ─── Helpers ──────────────────────────────────────────────────
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// ─── Main ─────────────────────────────────────────────────────
async function main(): Promise<void> {
    const connectionString = requireEnv('DATABASE_URL');
    const adminEmail = requireEnv('ADMIN_EMAIL').trim().toLowerCase();
    const adminPassword = requireEnv('ADMIN_PASSWORD');

    if (adminPassword.length < 12) {
        throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    }

    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });

    try {
        // ─── Admin user ───
        const passwordHash = await hash(adminPassword);

        const user = await prisma.user.upsert({
            where: { email: adminEmail },
            update: { passwordHash },
            create: {
                email: adminEmail,
                passwordHash,
            },
        });

        console.log(`✅ Admin user ready: ${user.email}`);

        // ─── Packages ───
        // الأسعار محوّلة من MoneyString إلى Prisma.Decimal
        // بدون Number() / parseFloat() / toFixed().
        for (const pkg of DEFAULT_PACKAGES) {
            await prisma.package.upsert({
                where: { name: pkg.name },
                update: {},
                create: {
                    name: pkg.name,
                    price: pkg.price,
                    dataSizeMb: pkg.dataSizeMb,
                    hours: pkg.hours,
                    color: pkg.color,
                    status: 'ACTIVE',
                },
            });
        }
        console.log(`✅ Packages seeded: ${DEFAULT_PACKAGES.length}`);

        // ─── Settings (singleton) ───
        // adminEmail: البريد الإداري الظاهر في الفواتير/المخرجات.
        // منفصل عن users.email (بريد تسجيل الدخول).
        await prisma.settings.upsert({
            where: { singletonKey: 'main' },
            update: {},
            create: {
                singletonKey: 'main',
                networkName: DEFAULT_SETTINGS.networkName,
                currencyName: DEFAULT_SETTINGS.currencyName,
                currencySymbol: DEFAULT_SETTINGS.currencySymbol,
                adminEmail,
                lowStockThreshold: DEFAULT_SETTINGS.lowStockThreshold,
            },
        });
        console.log(`✅ Settings initialized (singletonKey = "main")`);

        console.log('');
        console.log('🎉 Seed completed successfully.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
