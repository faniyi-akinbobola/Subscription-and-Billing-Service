import { Module } from '@nestjs/common';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';

@Module({
  controllers: [BillingsController],
  providers: [BillingsService]
})
export class BillingsModule {}
