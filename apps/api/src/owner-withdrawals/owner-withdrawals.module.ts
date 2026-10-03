import { Module } from '@nestjs/common';
import { OwnerWithdrawalsController } from './owner-withdrawals.controller';
import { OwnerWithdrawalsService } from './owner-withdrawals.service';

@Module({
  controllers: [OwnerWithdrawalsController],
  providers: [OwnerWithdrawalsService],
  exports: [OwnerWithdrawalsService],
})
export class OwnerWithdrawalsModule {}