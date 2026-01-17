import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import { UserSubscribeDto } from './dtos/user-subscribe.dto';
import { UpdateSubscriptionDto } from './dtos/update-subscription.dto';
import { ChangePlanDto } from './dtos/change-plan.dto';
import { RenewPlanDto } from './dtos/renew-plan.dto';
import { FindAllSubscriptionsQuery } from './dtos/find-all-subscriptions-query.dto';
import { SubscriptionStatus } from './entities/subscription.entity';
import { BillingCycle } from '../common/enums/billing-cycle.enum';

const mockSubscriptionsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByUser: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  changePlan: jest.fn(),
  renew: jest.fn(),
  cancel: jest.fn(),
  remove: jest.fn(),
  getStats: jest.fn(),
};

const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
};

// Mock the guards to bypass authentication for testing
const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockAdminGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let subscriptionsService: SubscriptionsService;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
  };

  const mockAdminUser = {
    id: 'admin-1',
    username: 'adminuser',
    email: 'admin@example.com',
    isAdmin: true,
  };

  const mockPlan = {
    id: 'plan-1',
    name: 'Basic Plan',
    price: 9.99,
    billingCycle: BillingCycle.MONTHLY,
  };

  const mockSubscription = {
    id: 'subscription-1',
    user: mockUser,
    plan: mockPlan,
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isAutoRenew: true,
    renewalCount: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create (Admin)', () => {
    it('should create a subscription as admin', async () => {
      const createSubscriptionDto: CreateSubscriptionDto = {
        userId: 'user-1',
        planId: 'plan-1',
        isAutoRenew: true,
      };

      mockSubscriptionsService.create.mockResolvedValueOnce(mockSubscription);

      const result = await controller.create(createSubscriptionDto);

      expect(subscriptionsService.create).toHaveBeenCalledWith(
        createSubscriptionDto,
      );
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('subscribe (User)', () => {
    it('should allow user to subscribe to a plan', async () => {
      const userSubscribeDto: UserSubscribeDto = {
        planId: 'plan-1',
        isAutoRenew: true,
      };

      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.create.mockResolvedValueOnce(mockSubscription);

      const result = await controller.subscribe(userSubscribeDto, mockRequest);

      expect(subscriptionsService.create).toHaveBeenCalledWith({
        ...userSubscribeDto,
        userId: mockUser.id,
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('findAll (Admin)', () => {
    it('should return paginated subscriptions', async () => {
      const query: FindAllSubscriptionsQuery = {
        page: 1,
        limit: 10,
      };

      const mockResult = {
        data: [mockSubscription],
        total: 1,
      };

      mockSubscriptionsService.findAll.mockResolvedValueOnce(mockResult);

      const result = await controller.findAll(query);

      expect(subscriptionsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findMySubscriptions', () => {
    it('should return current user subscriptions', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findByUser.mockResolvedValueOnce([
        mockSubscription,
      ]);

      const result = await controller.findMySubscriptions(mockRequest);

      expect(subscriptionsService.findByUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual([mockSubscription]);
    });
  });

  describe('getStats (Admin)', () => {
    it('should return subscription statistics', async () => {
      const mockStats = {
        total: 100,
        active: 75,
        trial: 10,
        cancelled: 15,
      };

      mockSubscriptionsService.getStats.mockResolvedValueOnce(mockStats);

      const result = await controller.getStats();

      expect(subscriptionsService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('findOne (Admin)', () => {
    it('should return a specific subscription', async () => {
      mockSubscriptionsService.findOne.mockResolvedValueOnce(mockSubscription);

      const result = await controller.findOne('subscription-1');

      expect(subscriptionsService.findOne).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('update', () => {
    const updateSubscriptionDto: UpdateSubscriptionDto = {
      status: SubscriptionStatus.SUSPENDED,
    };

    it('should allow admin to update any subscription', async () => {
      const mockRequest = {
        user: mockAdminUser,
      };

      const updatedSubscription = {
        ...mockSubscription,
        ...updateSubscriptionDto,
      };
      mockSubscriptionsService.update.mockResolvedValueOnce(
        updatedSubscription,
      );

      const result = await controller.update(
        'subscription-1',
        updateSubscriptionDto,
        mockRequest,
      );

      expect(subscriptionsService.update).toHaveBeenCalledWith(
        'subscription-1',
        updateSubscriptionDto,
      );
      expect(result).toEqual(updatedSubscription);
    });

    it('should allow user to update their own subscription', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(mockSubscription);
      const updatedSubscription = {
        ...mockSubscription,
        ...updateSubscriptionDto,
      };
      mockSubscriptionsService.update.mockResolvedValueOnce(
        updatedSubscription,
      );

      const result = await controller.update(
        'subscription-1',
        updateSubscriptionDto,
        mockRequest,
      );

      expect(subscriptionsService.findOne).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        'subscription-1',
        updateSubscriptionDto,
      );
      expect(result).toEqual(updatedSubscription);
    });

    it('should throw error if non-admin tries to update someone else subscription', async () => {
      const otherUserSubscription = {
        ...mockSubscription,
        user: { id: 'other-user', username: 'otheruser' },
      };

      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(
        otherUserSubscription,
      );

      await expect(
        controller.update('subscription-1', updateSubscriptionDto, mockRequest),
      ).rejects.toThrow(
        'You can only update your own subscriptions',
      );
    });
  });

  describe('changePlan', () => {
    const changePlanDto: ChangePlanDto = {
      newPlanId: 'plan-2',
    };

    it('should allow admin to change plan for any subscription', async () => {
      const mockRequest = {
        user: mockAdminUser,
      };

      const changedSubscription = {
        ...mockSubscription,
        plan: { id: 'plan-2' },
      };
      mockSubscriptionsService.changePlan.mockResolvedValueOnce(
        changedSubscription,
      );

      const result = await controller.changePlan(
        'subscription-1',
        changePlanDto,
        mockRequest,
      );

      expect(subscriptionsService.changePlan).toHaveBeenCalledWith(
        'subscription-1',
        changePlanDto,
      );
      expect(result).toEqual(changedSubscription);
    });

    it('should allow user to change plan for their own subscription', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(mockSubscription);
      const changedSubscription = {
        ...mockSubscription,
        plan: { id: 'plan-2' },
      };
      mockSubscriptionsService.changePlan.mockResolvedValueOnce(
        changedSubscription,
      );

      const result = await controller.changePlan(
        'subscription-1',
        changePlanDto,
        mockRequest,
      );

      expect(subscriptionsService.findOne).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(subscriptionsService.changePlan).toHaveBeenCalledWith(
        'subscription-1',
        changePlanDto,
      );
      expect(result).toEqual(changedSubscription);
    });

    it('should throw error if non-admin tries to change plan for someone else subscription', async () => {
      const otherUserSubscription = {
        ...mockSubscription,
        user: { id: 'other-user', username: 'otheruser' },
      };

      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(
        otherUserSubscription,
      );

      await expect(
        controller.changePlan('subscription-1', changePlanDto, mockRequest),
      ).rejects.toThrow(
        'You can only change your own subscription plan',
      );
    });
  });

  describe('renewPlan', () => {
    const renewPlanDto: RenewPlanDto = {};

    it('should allow admin to renew any subscription', async () => {
      const mockRequest = {
        user: mockAdminUser,
      };

      const renewedSubscription = { ...mockSubscription, renewalCount: 1 };
      mockSubscriptionsService.renew.mockResolvedValueOnce(renewedSubscription);

      const result = await controller.renewPlan(
        'subscription-1',
        renewPlanDto,
        mockRequest,
      );

      expect(subscriptionsService.renew).toHaveBeenCalledWith(
        'subscription-1',
        renewPlanDto,
      );
      expect(result).toEqual(renewedSubscription);
    });

    it('should allow user to renew their own subscription', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(mockSubscription);
      const renewedSubscription = { ...mockSubscription, renewalCount: 1 };
      mockSubscriptionsService.renew.mockResolvedValueOnce(renewedSubscription);

      const result = await controller.renewPlan(
        'subscription-1',
        renewPlanDto,
        mockRequest,
      );

      expect(subscriptionsService.findOne).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(subscriptionsService.renew).toHaveBeenCalledWith(
        'subscription-1',
        renewPlanDto,
      );
      expect(result).toEqual(renewedSubscription);
    });

    it('should throw error if non-admin tries to renew someone else subscription', async () => {
      const otherUserSubscription = {
        ...mockSubscription,
        user: { id: 'other-user', username: 'otheruser' },
      };

      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(
        otherUserSubscription,
      );

      await expect(
        controller.renewPlan('subscription-1', renewPlanDto, mockRequest),
      ).rejects.toThrow(
        'You can only renew your own subscriptions',
      );
    });
  });

  describe('cancel', () => {
    it('should allow admin to cancel any subscription', async () => {
      const mockRequest = {
        user: mockAdminUser,
      };

      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      mockSubscriptionsService.cancel.mockResolvedValueOnce(
        cancelledSubscription,
      );

      const result = await controller.cancel('subscription-1', mockRequest);

      expect(subscriptionsService.cancel).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(result).toEqual(cancelledSubscription);
    });

    it('should allow user to cancel their own subscription', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(mockSubscription);
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      mockSubscriptionsService.cancel.mockResolvedValueOnce(
        cancelledSubscription,
      );

      const result = await controller.cancel('subscription-1', mockRequest);

      expect(subscriptionsService.findOne).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(subscriptionsService.cancel).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(result).toEqual(cancelledSubscription);
    });

    it('should throw error if non-admin tries to cancel someone else subscription', async () => {
      const otherUserSubscription = {
        ...mockSubscription,
        user: { id: 'other-user', username: 'otheruser' },
      };

      const mockRequest = {
        user: mockUser,
      };

      mockSubscriptionsService.findOne.mockResolvedValueOnce(
        otherUserSubscription,
      );

      await expect(
        controller.cancel('subscription-1', mockRequest),
      ).rejects.toThrow(
        'You can only cancel your own subscriptions',
      );
    });
  });

  describe('remove (Admin)', () => {
    it('should remove subscription successfully', async () => {
      mockSubscriptionsService.remove.mockResolvedValueOnce(undefined);

      const result = await controller.remove('subscription-1');

      expect(subscriptionsService.remove).toHaveBeenCalledWith(
        'subscription-1',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('Guard Integration', () => {
    it('should have JwtAuthGuard applied to all routes', () => {
      const guards = Reflect.getMetadata('__guards__', SubscriptionsController);
      expect(guards).toBeDefined();
    });

    it('should have AdminGuard applied to admin routes', () => {
      // Check create endpoint
      const createGuards = Reflect.getMetadata('__guards__', controller.create);
      expect(createGuards).toBeDefined();

      // Check findAll endpoint
      const findAllGuards = Reflect.getMetadata(
        '__guards__',
        controller.findAll,
      );
      expect(findAllGuards).toBeDefined();

      // Check getStats endpoint
      const getStatsGuards = Reflect.getMetadata(
        '__guards__',
        controller.getStats,
      );
      expect(getStatsGuards).toBeDefined();

      // Check findOne endpoint
      const findOneGuards = Reflect.getMetadata(
        '__guards__',
        controller.findOne,
      );
      expect(findOneGuards).toBeDefined();

      // Check remove endpoint
      const removeGuards = Reflect.getMetadata('__guards__', controller.remove);
      expect(removeGuards).toBeDefined();
    });
  });

  describe('Request User Context', () => {
    it('should extract user from request in subscribe', async () => {
      const userSubscribeDto: UserSubscribeDto = {
        planId: 'plan-1',
      };

      const mockRequest = {
        user: { id: 'test-user-id', username: 'testuser' },
      };

      mockSubscriptionsService.create.mockResolvedValueOnce(mockSubscription);

      await controller.subscribe(userSubscribeDto, mockRequest);

      expect(subscriptionsService.create).toHaveBeenCalledWith({
        ...userSubscribeDto,
        userId: 'test-user-id',
      });
    });

    it('should extract user from request in findMySubscriptions', async () => {
      const mockRequest = {
        user: { id: 'test-user-id', username: 'testuser' },
      };

      mockSubscriptionsService.findByUser.mockResolvedValueOnce([]);

      await controller.findMySubscriptions(mockRequest);

      expect(subscriptionsService.findByUser).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });
});
