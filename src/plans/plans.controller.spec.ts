import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';

const mockPlansService = {
  createPlan: jest.fn(),
  getAllPlans: jest.fn(),
  getPlanByName: jest.fn(),
  getPlanById: jest.fn(),
  updatePlan: jest.fn(),
  deletePlan: jest.fn(),
  deactivatePlan: jest.fn(),
  activatePlan: jest.fn(),
};

const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

// Mock the guards to bypass authentication for testing
const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockAdminGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('PlansController', () => {
  let controller: PlansController;
  let plansService: PlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [
        {
          provide: PlansService,
          useValue: mockPlansService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<PlansController>(PlansController);
    plansService = module.get<PlansService>(PlansService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPlan', () => {
    it('should create a new plan', async () => {
      const createPlanDto: CreatePlanDto = {
        name: 'Basic Plan',
        price: 9.99,
        description: 'Basic subscription plan',
        isActive: true,
      };

      const mockPlan = { id: 'plan-1', ...createPlanDto };
      mockPlansService.createPlan.mockResolvedValueOnce(mockPlan);

      const result = await controller.createPlan(createPlanDto);

      expect(plansService.createPlan).toHaveBeenCalledWith(createPlanDto);
      expect(result).toEqual(mockPlan);
    });
  });

  describe('getAllPlans', () => {
    it('should return all plans', async () => {
      const mockPlans = [
        { id: 'plan-1', name: 'Basic Plan' },
        { id: 'plan-2', name: 'Premium Plan' },
      ];
      mockPlansService.getAllPlans.mockResolvedValueOnce(mockPlans);

      const result = await controller.getAllPlans();

      expect(plansService.getAllPlans).toHaveBeenCalled();
      expect(result).toEqual(mockPlans);
    });
  });

  describe('getPlanByName', () => {
    it('should return plan by name', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan' };
      mockPlansService.getPlanByName.mockResolvedValueOnce(mockPlan);

      const result = await controller.getPlanByName('Basic Plan');

      expect(plansService.getPlanByName).toHaveBeenCalledWith('Basic Plan');
      expect(result).toEqual(mockPlan);
    });
  });

  describe('getPlanById', () => {
    it('should return plan by ID', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan' };
      mockPlansService.getPlanById.mockResolvedValueOnce(mockPlan);

      const result = await controller.getPlanById('plan-1');

      expect(plansService.getPlanById).toHaveBeenCalledWith('plan-1');
      expect(result).toEqual(mockPlan);
    });
  });

  describe('updatePlan', () => {
    it('should update plan', async () => {
      const updatePlanDto: UpdatePlanDto = {
        price: 19.99,
        description: 'Updated basic plan',
      };

      const mockUpdatedPlan = {
        id: 'plan-1',
        name: 'Basic Plan',
        ...updatePlanDto,
      };

      mockPlansService.updatePlan.mockResolvedValueOnce(mockUpdatedPlan);

      const result = await controller.updatePlan('plan-1', updatePlanDto);

      expect(plansService.updatePlan).toHaveBeenCalledWith(
        'plan-1',
        updatePlanDto,
      );
      expect(result).toEqual(mockUpdatedPlan);
    });
  });

  describe('deletePlan', () => {
    it('should delete plan', async () => {
      mockPlansService.deletePlan.mockResolvedValueOnce(undefined);

      const result = await controller.deletePlan('plan-1');

      expect(plansService.deletePlan).toHaveBeenCalledWith('plan-1');
      expect(result).toBeUndefined();
    });
  });

  describe('deactivatePlan', () => {
    it('should deactivate plan', async () => {
      const mockDeactivatedPlan = {
        id: 'plan-1',
        name: 'Basic Plan',
        isActive: false,
      };

      mockPlansService.deactivatePlan.mockResolvedValueOnce(
        mockDeactivatedPlan,
      );

      const result = await controller.deactivatePlan('plan-1');

      expect(plansService.deactivatePlan).toHaveBeenCalledWith('plan-1');
      expect(result).toEqual(mockDeactivatedPlan);
    });
  });

  describe('activatePlan', () => {
    it('should activate plan', async () => {
      const mockActivatedPlan = {
        id: 'plan-1',
        name: 'Basic Plan',
        isActive: true,
      };

      mockPlansService.activatePlan.mockResolvedValueOnce(mockActivatedPlan);

      const result = await controller.activatePlan('plan-1');

      expect(plansService.activatePlan).toHaveBeenCalledWith('plan-1');
      expect(result).toEqual(mockActivatedPlan);
    });
  });

  describe('Guard Integration', () => {
    it('should have JwtAuthGuard applied to all routes', () => {
      const guards = Reflect.getMetadata('__guards__', PlansController);
      expect(guards).toBeDefined();
    });

    it('should have AdminGuard applied to admin routes', () => {
      // Check create plan endpoint
      const createGuards = Reflect.getMetadata(
        '__guards__',
        controller.createPlan,
      );
      expect(createGuards).toBeDefined();

      // Check update plan endpoint
      const updateGuards = Reflect.getMetadata(
        '__guards__',
        controller.updatePlan,
      );
      expect(updateGuards).toBeDefined();

      // Check delete plan endpoint
      const deleteGuards = Reflect.getMetadata(
        '__guards__',
        controller.deletePlan,
      );
      expect(deleteGuards).toBeDefined();

      // Check deactivate plan endpoint
      const deactivateGuards = Reflect.getMetadata(
        '__guards__',
        controller.deactivatePlan,
      );
      expect(deactivateGuards).toBeDefined();

      // Check activate plan endpoint
      const activateGuards = Reflect.getMetadata(
        '__guards__',
        controller.activatePlan,
      );
      expect(activateGuards).toBeDefined();
    });
  });
});
