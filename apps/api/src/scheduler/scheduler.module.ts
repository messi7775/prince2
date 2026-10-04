import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { BackupsModule } from '../backups/backups.module';

@Module({
  imports: [BackupsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
