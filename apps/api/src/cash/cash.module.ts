import { Module } from '@nestjs/common';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';
import { CashClosingsService } from './cash-closings.service';

@Module({
  controllers: [CashController],
  providers: [CashService, CashClosingsService],
  exports: [CashService],
})
export class CashModule {}