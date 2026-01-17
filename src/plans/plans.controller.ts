import {
  Controller,
  UseGuards,
  UseInterceptors,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @UseGuards(AdminGuard)
  @Post('/create')
  createPlan(@Body() body: CreatePlanDto) {
    return this.plansService.createPlan(body);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // Cache for 10 minutes (plans rarely change)
  getAllPlans() {
    return this.plansService.getAllPlans();
  }

  @Get('/name')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // Cache for 10 minutes
  getPlanByName(@Query('name') name: string) {
    return this.plansService.getPlanByName(name);
  }

  @Get('/:id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // Cache for 10 minutes
  getPlanById(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  @UseGuards(AdminGuard)
  @Patch('/:id')
  updatePlan(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    return this.plansService.updatePlan(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete('/:id')
  deletePlan(@Param('id') id: string) {
    return this.plansService.deletePlan(id);
  }

  @UseGuards(AdminGuard)
  @Patch('/:id/deactivate')
  deactivatePlan(@Param('id') id: string) {
    return this.plansService.deactivatePlan(id);
  }

  @UseGuards(AdminGuard)
  @Patch('/:id/activate')
  activatePlan(@Param('id') id: string) {
    return this.plansService.activatePlan(id);
  }
}
