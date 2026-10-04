import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BackupsService } from '../backups/backups.service';

/**
 * المهام المجدولة (كل التوقيتات UTC).
 *
 *  - نسخة احتياطية كاملة تلقائية كل يوم جمعة منتصف الليل.
 *    createdBy تُنسب لأقدم مستخدم (الأدمن المبذور) لأن العملية
 *    تعمل خارج أي جلسة HTTP.
 *
 * تذكير الإغلاق الشهري لا يحتاج مجدولًا — يُحسب عند الطلب
 * في NotificationsService (مركز التنبيهات).
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupsService: BackupsService,
  ) {}

  /** نسخة احتياطية أسبوعية — الجمعة 00:00 UTC */
  @Cron('0 0 * * 5', { name: 'weekly-backup', timeZone: 'UTC' })
  async weeklyBackup(): Promise<void> {
    const admin = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!admin) {
      this.logger.error('النسخ الاحتياطي الأسبوعي: لا يوجد مستخدم — تم التخطي');
      return;
    }

    try {
      const backup = await this.backupsService.create(admin.id, {
        userAgent: 'prince-net-scheduler',
      });
      this.logger.log(
        `النسخة الأسبوعية أُنشئت: ${backup.fileName} (${backup.recordCount} سجل)`,
      );
    } catch (err) {
      this.logger.error(
        `فشل النسخ الاحتياطي الأسبوعي: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
