import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billings')
@UseGuards(JwtAuthGuard)
export class BillingsController {}
