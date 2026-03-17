import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinCommand } from './commands/checkin.command';
import { TodayCheckinCommand } from './commands/today-checkin.command';
import { WeeklyCheckinCommand } from './commands/weekly-checkin.command';

@Module({
  providers: [
    CheckinService,
    CheckinCommand,
    TodayCheckinCommand,
    WeeklyCheckinCommand,
  ],
  exports: [CheckinService, CheckinCommand, TodayCheckinCommand, WeeklyCheckinCommand],
})
export class CheckinModule {}
