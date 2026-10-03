import { Module } from '@nestjs/common';
import { LinePaymentsController } from './line-payments.controller';
import { LinePaymentsService } from './line-payments.service';

@Module({
  controllers: [LinePaymentsController],
  providers: [LinePaymentsService],
  exports: [LinePaymentsService],
})
export class LinePaymentsModule {}