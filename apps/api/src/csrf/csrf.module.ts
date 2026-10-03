import { Global, Module } from '@nestjs/common';
import { CsrfService } from './csrf.service';

/**
 * CsrfModule — Global.
 * لا يعتمد على AuthModule.
 * يوفّر CsrfService للاستخدام في main.ts (middleware) و AuthController (D8-B).
 */
@Global()
@Module({
  providers: [CsrfService],
  exports: [CsrfService],
})
export class CsrfModule {}
