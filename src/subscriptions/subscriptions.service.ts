import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, LessThanOrEqual } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { BillingCycle } from '../common/enums/billing-cycle.enum';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import { UpdateSubscriptionDto } from './dtos/update-subscription.dto';
import { FindAllSubscriptionsQuery } from './dtos/find-all-subscriptions-query.dto';
import { ChangePlanDto } from './dtos/change-plan.dto';
import { RenewPlanDto } from './dtos/renew-plan.dto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectPinoLogger(SubscriptionsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  /**
   * Create a new subscription for a user
   */
  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const { userId, planId, startDate, endDate, status, isAutoRenew } =
      createSubscriptionDto;

    this.logger.info(`Creating subscription for user: ${userId}, plan: ${planId}`);

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Subscription creation failed - user not found: ${userId}`);
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate plan exists
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      this.logger.warn(`Subscription creation failed - plan not found: ${planId}`);
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if user already has an active subscription to prevent duplicates
    const existingActiveSubscription =
      await this.subscriptionRepository.findOne({
        where: {
          user: { id: userId },
          status: SubscriptionStatus.ACTIVE,
        },
      });

    if (existingActiveSubscription) {
      this.logger.warn(`Subscription creation failed - user already has active subscription: ${userId}`);
      throw new ConflictException('User already has an active subscription');
    }

    // Calculate dates
    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    let subscriptionEndDate: Date;

    if (endDate) {
      subscriptionEndDate = new Date(endDate);
    } else {
      // Calculate end date based on plan billing cycle
      subscriptionEndDate = this.calculateEndDate(
        subscriptionStartDate,
        plan.billingCycle,
      );
    }

    // Calculate trial period end if applicable
    let trialEndDate: Date | undefined;
    if (plan.trialPeriodDays && plan.trialPeriodDays > 0) {
      trialEndDate = new Date(subscriptionStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + plan.trialPeriodDays);
    }

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      user,
      plan,
      status:
        status ||
        (trialEndDate ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE),
      startDate: subscriptionStartDate,
      endDate: subscriptionEndDate,
      trialEndDate,
      isAutoRenew: isAutoRenew !== undefined ? isAutoRenew : true,
      renewalCount: 0,
      subscribedPrice: plan.price,
      billingCycle: plan.billingCycle,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);
    this.logger.info(`Subscription created successfully: ${savedSubscription.id} for user ${userId}`);
    return savedSubscription;
  }

  /**
   * Find all subscriptions with filtering and pagination
   */
  async findAll(
    query: FindAllSubscriptionsQuery,
  ): Promise<{ data: Subscription[]; total: number }> {
    const { page = 1, limit = 10, status, userId, planId, isAutoRenew } = query;

    const options: FindManyOptions<Subscription> = {
      relations: ['user', 'plan'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    // Build where conditions
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.user = { id: userId };
    if (planId) where.plan = { id: planId };
    if (isAutoRenew !== undefined) where.isAutoRenew = isAutoRenew;

    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    const [data, total] =
      await this.subscriptionRepository.findAndCount(options);

    return { data, total };
  }

  /**
   * Find subscriptions for a specific user
   */
  async findByUser(userId: string): Promise<Subscription[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.subscriptionRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single subscription by ID
   */
  async findOne(id: string): Promise<Subscription> {
    this.logger.info(`Fetching subscription: ${id}`);
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'plan'],
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${id}`);
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    this.logger.info(`Subscription found: ${id} (user: ${subscription.user.email})`);
    return subscription;
  }

  /**
   * Update a subscription
   */
  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    this.logger.info(`Updating subscription: ${id}`, { updates: Object.keys(updateSubscriptionDto) });
    const subscription = await this.findOne(id);

    // Apply updates
    Object.assign(subscription, updateSubscriptionDto);

    // Handle specific business logic for status changes
    if (updateSubscriptionDto.status) {
      subscription.status = updateSubscriptionDto.status;

      // Update timestamps based on status
      if (updateSubscriptionDto.status === SubscriptionStatus.CANCELLED) {
        subscription.cancelledAt = new Date();
      }
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);
    this.logger.info(`Subscription updated successfully: ${id}`);
    return updatedSubscription;
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    id: string,
    changePlanDto: ChangePlanDto,
  ): Promise<Subscription> {
    this.logger.info(`Changing plan for subscription: ${id} to plan: ${changePlanDto.newPlanId}`);
    const subscription = await this.findOne(id);
    const { newPlanId } = changePlanDto;

    // Validate new plan exists
    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId },
    });
    if (!newPlan) {
      this.logger.warn(`Plan change failed - new plan not found: ${newPlanId}`);
      throw new NotFoundException(`Plan with ID ${newPlanId} not found`);
    }

    // Prevent changing to the same plan
    if (subscription.plan.id === newPlanId) {
      this.logger.warn(`Plan change failed - already using this plan: ${newPlanId}`);
      throw new BadRequestException('Subscription is already using this plan');
    }

    const oldPlanName = subscription.plan.name;
    // Update subscription with new plan
    subscription.plan = newPlan;
    subscription.planChangedAt = new Date();

    // Recalculate end date based on new plan's billing cycle
    subscription.endDate = this.calculateEndDate(
      new Date(),
      newPlan.billingCycle,
    );

    const updatedSubscription = await this.subscriptionRepository.save(subscription);
    this.logger.info(`Plan changed successfully: ${id} from ${oldPlanName} to ${newPlan.name}`);
    return updatedSubscription;
  }

  /**
   * Renew a subscription
   */
  async renew(id: string, renewPlanDto: RenewPlanDto): Promise<Subscription> {
    this.logger.info(`Renewing subscription: ${id}`);
    const subscription = await this.findOne(id);

    // Validate subscription can be renewed
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      this.logger.warn(`Renewal failed - subscription already cancelled: ${id}`);
      throw new BadRequestException('Cannot renew a cancelled subscription');
    }

    // Calculate new end date
    const currentEndDate = subscription.endDate || new Date();
    const newEndDate = renewPlanDto.customEndDate
      ? new Date(renewPlanDto.customEndDate)
      : this.calculateEndDate(currentEndDate, subscription.plan.billingCycle);

    // Update subscription
    subscription.endDate = newEndDate;
    subscription.renewedAt = new Date();
    subscription.renewalCount += 1;
    subscription.status = SubscriptionStatus.ACTIVE;

    const renewedSubscription = await this.subscriptionRepository.save(subscription);
    this.logger.info(`Subscription renewed successfully: ${id}, new end date: ${newEndDate.toISOString()}`);
    return renewedSubscription;
  }

  /**
   * Cancel a subscription
   */
  async cancel(id: string): Promise<Subscription> {
    this.logger.info(`Cancelling subscription: ${id}`);
    const subscription = await this.findOne(id);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      this.logger.warn(`Cancellation failed - already cancelled: ${id}`);
      throw new BadRequestException('Subscription is already cancelled');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.isAutoRenew = false;

    const cancelledSubscription = await this.subscriptionRepository.save(subscription);
    this.logger.info(`Subscription cancelled successfully: ${id}`);
    return cancelledSubscription;
  }

  /**
   * Permanently delete a subscription (admin only)
   */
  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.subscriptionRepository.remove(subscription);
  }

  /**
   * Get subscription statistics
   */
  async getStats(): Promise<any> {
    const totalSubscriptions = await this.subscriptionRepository.count();
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    const trialSubscriptions = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.TRIAL },
    });
    const cancelledSubscriptions = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.CANCELLED },
    });

    return {
      total: totalSubscriptions,
      active: activeSubscriptions,
      trial: trialSubscriptions,
      cancelled: cancelledSubscriptions,
    };
  }

  /**
   * Check and update expired subscriptions (for scheduled tasks)
   */
  async processExpiredSubscriptions(): Promise<{ updated: number }> {
    const now = new Date();

    // Find subscriptions that have expired
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: [
        {
          endDate: LessThanOrEqual(now),
          status: SubscriptionStatus.ACTIVE,
          isAutoRenew: false,
        },
        {
          endDate: LessThanOrEqual(now),
          status: SubscriptionStatus.TRIAL,
          isAutoRenew: false,
        },
      ],
    });

    // Update expired subscriptions
    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
    }

    if (expiredSubscriptions.length > 0) {
      await this.subscriptionRepository.save(expiredSubscriptions);
    }

    return { updated: expiredSubscriptions.length };
  }

  /**
   * Process auto-renewals for subscriptions (for scheduled tasks)
   */
  async processAutoRenewals(): Promise<{ renewed: number }> {
    const now = new Date();
    const renewalBuffer = new Date();
    renewalBuffer.setDate(renewalBuffer.getDate() + 1); // Renew 1 day before expiry

    // Find subscriptions that need auto-renewal
    const subscriptionsToRenew = await this.subscriptionRepository.find({
      where: {
        endDate: LessThanOrEqual(renewalBuffer),
        status: SubscriptionStatus.ACTIVE,
        isAutoRenew: true,
      },
      relations: ['plan'],
    });

    let renewedCount = 0;

    for (const subscription of subscriptionsToRenew) {
      try {
        await this.renew(subscription.id, {});
        renewedCount++;
      } catch (error) {
        console.error(
          `Failed to auto-renew subscription ${subscription.id}:`,
          error,
        );
        // Could implement notification system here
      }
    }

    return { renewed: renewedCount };
  }

  /**
   * Calculate end date based on start date and billing cycle
   */
  private calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case BillingCycle.WEEKLY:
        endDate.setDate(endDate.getDate() + 7);
        break;
      case BillingCycle.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        // Default to monthly if billing cycle is not recognized
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    return endDate;
  }
}
