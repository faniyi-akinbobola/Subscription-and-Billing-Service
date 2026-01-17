import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  Req,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import { UserSubscribeDto } from './dtos/user-subscribe.dto';
import { UpdateSubscriptionDto } from './dtos/update-subscription.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SubscriptionsService } from './subscriptions.service';
import { FindAllSubscriptionsQuery } from './dtos/find-all-subscriptions-query.dto';
import { ChangePlanDto } from './dtos/change-plan.dto';
import { RenewPlanDto } from './dtos/renew-plan.dto';

@Controller({ path: 'subscriptions', version: '1' })
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(AdminGuard)
  @Post('/create')
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return await this.subscriptionsService.create(createSubscriptionDto);
  }

  @Post('/subscribe')
  async subscribe(
    @Body() userSubscribeDto: UserSubscribeDto,
    @Req() request: any,
  ) {
    // For regular users, automatically set the userId to their own ID
    const subscriptionData = {
      ...userSubscribeDto,
      userId: request.user?.id,
    };
    return await this.subscriptionsService.create(subscriptionData);
  }

  @UseGuards(AdminGuard)
  @Get()
  async findAll(@Query() query: FindAllSubscriptionsQuery) {
    return await this.subscriptionsService.findAll(query);
  }

  @Get('/me')
  async findMySubscriptions(@Req() request: any) {
    const userId = request.user?.id;
    return await this.subscriptionsService.findByUser(userId);
  }

  @UseGuards(AdminGuard)
  @Get('/stats')
  async getStats() {
    return await this.subscriptionsService.getStats();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120) // Cache for 2 minutes (subscriptions change moderately)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() request: any,
  ) {
    // For non-admin users, ensure they can only update their own subscriptions
    if (!request.user?.isAdmin) {
      const subscription = await this.subscriptionsService.findOne(id);
      if (subscription.user.id !== request.user?.id) {
        throw new ForbiddenException(
          'You can only update your own subscriptions',
        );
      }
    }
    return await this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Patch(':id/change-plan')
  async changePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePlanDto: ChangePlanDto,
    @Req() request: any,
  ) {
    // For non-admin users, ensure they can only change their own subscription plans
    if (!request.user?.isAdmin) {
      const subscription = await this.subscriptionsService.findOne(id);
      if (subscription.user.id !== request.user?.id) {
        throw new ForbiddenException(
          'You can only change your own subscription plan',
        );
      }
    }
    return await this.subscriptionsService.changePlan(id, changePlanDto);
  }

  @Patch(':id/renew')
  async renewPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() renewPlanDto: RenewPlanDto,
    @Req() request: any,
  ) {
    // For non-admin users, ensure they can only renew their own subscriptions
    if (!request.user?.isAdmin) {
      const subscription = await this.subscriptionsService.findOne(id);
      if (subscription.user.id !== request.user?.id) {
        throw new ForbiddenException(
          'You can only renew your own subscriptions',
        );
      }
    }
    return await this.subscriptionsService.renew(id, renewPlanDto);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Req() request: any) {
    // For non-admin users, ensure they can only cancel their own subscriptions
    if (!request.user?.isAdmin) {
      const subscription = await this.subscriptionsService.findOne(id);
      if (subscription.user.id !== request.user?.id) {
        throw new ForbiddenException(
          'You can only cancel your own subscriptions',
        );
      }
    }
    return await this.subscriptionsService.cancel(id);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.subscriptionsService.remove(id);
  }
}
