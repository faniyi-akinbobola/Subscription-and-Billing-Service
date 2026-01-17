import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PassportModule } from '@nestjs/passport';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';
import { SchedulerService } from './scheduler.service';
import { EmailModule } from '../email/email.module';
import { stripeConfig } from '../config/stripe.config';

@Module({
  imports: [
    EmailModule,
    PassportModule, // Import PassportModule for JWT authentication
    ScheduleModule.forRoot(),
  ],
  controllers: [BillingsController],
  providers: [BillingsService, SchedulerService, stripeConfig],
  exports: [BillingsService],
})
export class BillingsModule {}
