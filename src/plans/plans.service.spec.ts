import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';
import { PinoLogger } from 'nestjs-pino';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
};

const mockPinoLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};

describe('PlansService', () => {
  let service: PlansService;
  let repository: Repository<Plan>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: `PinoLogger:PlansService`,
          useValue: mockPinoLogger,
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    repository = module.get<Repository<Plan>>(getRepositoryToken(Plan));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPlan', () => {
    const planData = {
      name: 'Basic Plan',
      price: 9.99,
      description: 'Basic subscription plan',
      isActive: true,
    };

    it('should create a plan successfully', async () => {
      const mockPlan = { id: 'plan-1', ...planData };

      mockRepository.findOneBy.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(mockPlan);
      mockRepository.save.mockResolvedValueOnce(mockPlan);

      const result = await service.createPlan(planData);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        name: planData.name,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(planData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPlan);
      expect(result).toEqual(mockPlan);
    });

    it('should throw ConflictException if plan name already exists', async () => {
      const existingPlan = { id: 'existing-1', ...planData };
      mockRepository.findOneBy.mockResolvedValueOnce(existingPlan);

      await expect(service.createPlan(planData)).rejects.toThrow(
        ConflictException,
      );

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        name: planData.name,
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getPlanByName', () => {
    it('should return plan when found', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockPlan);

      const result = await service.getPlanByName('Basic Plan');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        name: 'Basic Plan',
      });
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.getPlanByName('Nonexistent Plan')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllPlans', () => {
    it('should return all plans when they exist', async () => {
      const mockPlans = [
        { id: 'plan-1', name: 'Basic Plan' },
        { id: 'plan-2', name: 'Premium Plan' },
      ];
      mockRepository.find.mockResolvedValueOnce(mockPlans);

      const result = await service.getAllPlans();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockPlans);
    });

    it('should throw NotFoundException when no plans exist', async () => {
      mockRepository.find.mockResolvedValueOnce([]);

      await expect(service.getAllPlans()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPlanById', () => {
    it('should return plan when found', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockPlan);

      const result = await service.getPlanById('plan-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'plan-1' });
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.getPlanById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePlan', () => {
    it('should update plan successfully', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan', price: 9.99 };
      const updateData = { price: 19.99 };
      const updatedPlan = { ...mockPlan, ...updateData };

      mockRepository.findOneBy.mockResolvedValueOnce(mockPlan);
      mockRepository.save.mockResolvedValueOnce(updatedPlan);

      const result = await service.updatePlan('plan-1', updateData);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'plan-1' });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedPlan);
      expect(result).toEqual(updatedPlan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.updatePlan('nonexistent-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePlan', () => {
    it('should delete plan successfully', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockPlan);
      mockRepository.remove.mockResolvedValueOnce(undefined);

      await service.deletePlan('plan-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'plan-1' });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockPlan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.deletePlan('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivatePlan', () => {
    it('should deactivate plan successfully', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan', isActive: true };
      const deactivatedPlan = { ...mockPlan, isActive: false };

      mockRepository.findOneBy.mockResolvedValueOnce(mockPlan);
      mockRepository.save.mockResolvedValueOnce(deactivatedPlan);

      const result = await service.deactivatePlan('plan-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'plan-1' });
      expect(mockRepository.save).toHaveBeenCalledWith(deactivatedPlan);
      expect(result).toEqual(deactivatedPlan);
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.deactivatePlan('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activatePlan', () => {
    it('should activate plan successfully', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic Plan', isActive: false };
      const activatedPlan = { ...mockPlan, isActive: true };

      mockRepository.findOneBy.mockResolvedValueOnce(mockPlan);
      mockRepository.save.mockResolvedValueOnce(activatedPlan);

      const result = await service.activatePlan('plan-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'plan-1' });
      expect(mockRepository.save).toHaveBeenCalledWith(activatedPlan);
      expect(result).toEqual(activatedPlan);
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.activatePlan('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
