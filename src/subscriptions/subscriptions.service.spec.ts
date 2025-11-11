import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
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

const mockSubscriptionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
};

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockPlanRepository = {
  findOne: jest.fn(),
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: Repository<Subscription>;
  let userRepository: Repository<User>;
  let planRepository: Repository<Plan>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockPlan = {
    id: 'plan-1',
    name: 'Basic Plan',
    price: 9.99,
    billingCycle: BillingCycle.MONTHLY,
    trialPeriodDays: 7,
  };

  const mockSubscription = {
    id: 'subscription-1',
    user: mockUser,
    plan: mockPlan,
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isAutoRenew: true,
    renewalCount: 0,
    subscribedPrice: 9.99,
    billingCycle: BillingCycle.MONTHLY,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: mockPlanRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    planRepository = module.get<Repository<Plan>>(getRepositoryToken(Plan));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSubscriptionDto: CreateSubscriptionDto = {
      userId: 'user-1',
      planId: 'plan-1',
      isAutoRenew: true,
    };

    it('should create a subscription successfully', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockPlanRepository.findOne.mockResolvedValueOnce(mockPlan);
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(null); // No existing active subscription
      mockSubscriptionRepository.create.mockReturnValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValueOnce(mockSubscription);

      const result = await service.create(createSubscriptionDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(planRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
      });
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: 'user-1' },
          status: SubscriptionStatus.ACTIVE,
        },
      });
      expect(subscriptionRepository.create).toHaveBeenCalled();
      expect(subscriptionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createSubscriptionDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createSubscriptionDto)).rejects.toThrow(
        'User with ID user-1 not found',
      );
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockPlanRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createSubscriptionDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user already has active subscription', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockPlanRepository.findOne.mockResolvedValueOnce(mockPlan);
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );

      await expect(service.create(createSubscriptionDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create subscription with trial status when plan has trial period', async () => {
      const planWithTrial = { ...mockPlan, trialPeriodDays: 14 };
      const trialSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.TRIAL,
        trialEndDate: expect.any(Date),
      };

      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockPlanRepository.findOne.mockResolvedValueOnce(planWithTrial);
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(null);
      mockSubscriptionRepository.create.mockReturnValue(trialSubscription);
      mockSubscriptionRepository.save.mockResolvedValueOnce(trialSubscription);

      const result = await service.create(createSubscriptionDto);

      expect(result.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.trialEndDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    const query: FindAllSubscriptionsQuery = {
      page: 1,
      limit: 10,
    };

    it('should return paginated subscriptions', async () => {
      const mockData = [mockSubscription];
      const mockTotal = 1;
      mockSubscriptionRepository.findAndCount.mockResolvedValueOnce([
        mockData,
        mockTotal,
      ]);

      const result = await service.findAll(query);

      expect(subscriptionRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['user', 'plan'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ data: mockData, total: mockTotal });
    });

    it('should apply filters correctly', async () => {
      const filteredQuery: FindAllSubscriptionsQuery = {
        page: 1,
        limit: 10,
        status: SubscriptionStatus.ACTIVE,
        userId: 'user-1',
        planId: 'plan-1',
        isAutoRenew: true,
      };

      mockSubscriptionRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.findAll(filteredQuery);

      expect(subscriptionRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['user', 'plan'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        where: {
          status: SubscriptionStatus.ACTIVE,
          user: { id: 'user-1' },
          plan: { id: 'plan-1' },
          isAutoRenew: true,
        },
      });
    });
  });

  describe('findByUser', () => {
    it('should return user subscriptions', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockSubscriptionRepository.find.mockResolvedValueOnce([mockSubscription]);

      const result = await service.findByUser('user-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(subscriptionRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
        relations: ['user', 'plan'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockSubscription]);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findByUser('nonexistent-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return subscription when found', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );

      const result = await service.findOne('subscription-1');

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'subscription-1' },
        relations: ['user', 'plan'],
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateSubscriptionDto = {
      status: SubscriptionStatus.SUSPENDED,
    };

    it('should update subscription successfully', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );
      const updatedSubscription = { ...mockSubscription, ...updateDto };
      mockSubscriptionRepository.save.mockResolvedValueOnce(
        updatedSubscription,
      );

      const result = await service.update('subscription-1', updateDto);

      expect(subscriptionRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(SubscriptionStatus.SUSPENDED);
    });

    it('should set cancelledAt when status is CANCELLED', async () => {
      const cancelDto = { status: SubscriptionStatus.CANCELLED };
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      };
      mockSubscriptionRepository.save.mockResolvedValueOnce(
        cancelledSubscription,
      );

      const result = await service.update('subscription-1', cancelDto);

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
    });
  });

  describe('changePlan', () => {
    const changePlanDto: ChangePlanDto = {
      newPlanId: 'plan-2',
    };

    const newPlan = {
      id: 'plan-2',
      name: 'Premium Plan',
      price: 19.99,
      billingCycle: BillingCycle.MONTHLY,
    };

    it('should change plan successfully', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );
      mockPlanRepository.findOne.mockResolvedValueOnce(newPlan);
      mockSubscriptionRepository.save.mockResolvedValueOnce({
        ...mockSubscription,
        plan: newPlan,
        planChangedAt: new Date(),
      });

      const result = await service.changePlan('subscription-1', changePlanDto);

      expect(planRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-2' },
      });
      expect(result.plan).toEqual(newPlan);
      expect(result.planChangedAt).toBeDefined();
    });

    it('should throw NotFoundException if new plan not found', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );
      mockPlanRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.changePlan('subscription-1', changePlanDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if changing to same plan', async () => {
      const subscriptionWithSamePlan = {
        ...mockSubscription,
        plan: { ...mockPlan, id: 'plan-1' },
      };
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        subscriptionWithSamePlan,
      );
      mockPlanRepository.findOne.mockResolvedValueOnce(mockPlan);

      const samePlanDto = { newPlanId: 'plan-1' };
      await expect(
        service.changePlan('subscription-1', samePlanDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('renew', () => {
    const renewDto: RenewPlanDto = {};

    it('should renew subscription successfully', async () => {
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      };
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        activeSubscription,
      );
      const renewedSubscription = {
        ...activeSubscription,
        renewedAt: new Date(),
        renewalCount: 1,
        status: SubscriptionStatus.ACTIVE,
      };
      mockSubscriptionRepository.save.mockResolvedValueOnce(
        renewedSubscription,
      );

      const result = await service.renew('subscription-1', renewDto);

      expect(result.renewedAt).toBeDefined();
      expect(result.renewalCount).toBe(1);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should throw BadRequestException for cancelled subscription', async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        cancelledSubscription,
      );

      await expect(service.renew('subscription-1', renewDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use custom end date when provided', async () => {
      const customDate = '2024-12-31';
      const customRenewDto = { customEndDate: customDate };
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      };

      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        activeSubscription,
      );
      mockSubscriptionRepository.save.mockResolvedValueOnce({
        ...activeSubscription,
        endDate: new Date(customDate),
      });

      const result = await service.renew('subscription-1', customRenewDto);

      expect(result.endDate).toEqual(new Date(customDate));
    });
  });

  describe('cancel', () => {
    it('should cancel active subscription', async () => {
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      };
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        activeSubscription,
      );
      const cancelledSubscription = {
        ...activeSubscription,
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        isAutoRenew: false,
      };
      mockSubscriptionRepository.save.mockResolvedValueOnce(
        cancelledSubscription,
      );

      const result = await service.cancel('subscription-1');

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.isAutoRenew).toBe(false);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should throw BadRequestException if already cancelled', async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        cancelledSubscription,
      );

      await expect(service.cancel('subscription-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove subscription successfully', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        mockSubscription,
      );
      mockSubscriptionRepository.remove.mockResolvedValueOnce(undefined);

      await service.remove('subscription-1');

      expect(subscriptionRepository.remove).toHaveBeenCalledWith(
        mockSubscription,
      );
    });
  });

  describe('getStats', () => {
    it('should return subscription statistics', async () => {
      mockSubscriptionRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // active
        .mockResolvedValueOnce(10) // trial
        .mockResolvedValueOnce(15); // cancelled

      const stats = await service.getStats();

      expect(stats).toEqual({
        total: 100,
        active: 75,
        trial: 10,
        cancelled: 15,
      });
    });
  });

  describe('processExpiredSubscriptions', () => {
    it('should update expired subscriptions', async () => {
      const expiredSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        isAutoRenew: false,
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      mockSubscriptionRepository.find.mockResolvedValueOnce([
        expiredSubscription,
      ]);
      mockSubscriptionRepository.save.mockResolvedValueOnce([
        {
          ...expiredSubscription,
          status: SubscriptionStatus.EXPIRED,
        },
      ]);

      const result = await service.processExpiredSubscriptions();

      expect(result.updated).toBe(1);
      expect(subscriptionRepository.find).toHaveBeenCalledWith({
        where: [
          {
            endDate: expect.any(Object), // LessThanOrEqual(now)
            status: SubscriptionStatus.ACTIVE,
            isAutoRenew: false,
          },
          {
            endDate: expect.any(Object), // LessThanOrEqual(now)
            status: SubscriptionStatus.TRIAL,
            isAutoRenew: false,
          },
        ],
      });
    });

    it('should return 0 if no expired subscriptions', async () => {
      mockSubscriptionRepository.find.mockResolvedValueOnce([]);

      const result = await service.processExpiredSubscriptions();

      expect(result.updated).toBe(0);
    });
  });

  describe('processAutoRenewals', () => {
    it('should process auto-renewals successfully', async () => {
      const subscriptionToRenew = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        isAutoRenew: true,
        endDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      };

      mockSubscriptionRepository.find.mockResolvedValueOnce([
        subscriptionToRenew,
      ]);
      // Mock the renew method call
      mockSubscriptionRepository.findOne.mockResolvedValueOnce(
        subscriptionToRenew,
      );
      mockSubscriptionRepository.save.mockResolvedValueOnce({
        ...subscriptionToRenew,
        renewedAt: new Date(),
        renewalCount: 1,
      });

      const result = await service.processAutoRenewals();

      expect(result.renewed).toBe(1);
    });

    it('should handle renewal failures gracefully', async () => {
      const subscriptionToRenew = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        isAutoRenew: true,
        endDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      };

      mockSubscriptionRepository.find.mockResolvedValueOnce([
        subscriptionToRenew,
      ]);
      mockSubscriptionRepository.findOne.mockRejectedValueOnce(
        new Error('Renewal failed'),
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.processAutoRenewals();

      expect(result.renewed).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('calculateEndDate (private method)', () => {
    it('should calculate weekly end date correctly', () => {
      const startDate = new Date('2024-01-01');
      // Access private method through service instance
      const endDate = (service as any).calculateEndDate(
        startDate,
        BillingCycle.WEEKLY,
      );
      const expectedDate = new Date('2024-01-08');

      expect(endDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should calculate monthly end date correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = (service as any).calculateEndDate(
        startDate,
        BillingCycle.MONTHLY,
      );
      const expectedDate = new Date('2024-02-01');

      expect(endDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should calculate quarterly end date correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = (service as any).calculateEndDate(
        startDate,
        BillingCycle.QUARTERLY,
      );
      const expectedDate = new Date('2024-04-01');

      expect(endDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should calculate yearly end date correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = (service as any).calculateEndDate(
        startDate,
        BillingCycle.YEARLY,
      );
      const expectedDate = new Date('2025-01-01');

      expect(endDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should default to monthly for unknown billing cycle', () => {
      const startDate = new Date('2024-01-01');
      const endDate = (service as any).calculateEndDate(
        startDate,
        'UNKNOWN' as BillingCycle,
      );
      const expectedDate = new Date('2024-02-01');

      expect(endDate.toDateString()).toBe(expectedDate.toDateString());
    });
  });
});
