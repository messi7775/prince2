import { Global, Module } from '@nestjs/common';

/**
 * CommonModule — Global.
 * يجمع كل البنية التحتية المشتركة (guards, interceptors, filters, utils).
 *
 * لا يوفّر providers بنفسه — كل الأدوات stateless.
 * الغرض منه: توثيق البنية + تسهيل الإضافات المستقبلية.
 */
@Global()
@Module({})
export class CommonModule {}
