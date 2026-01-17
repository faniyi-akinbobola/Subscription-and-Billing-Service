import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Plan } from './entities/plan.entity';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class PlansService {
  constructor(
    @InjectPinoLogger(PlansService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async createPlan(planData: {
    name: string;
    price: number;
    description: string;
    isActive: boolean;
  }): Promise<Plan> {
    const { name, price, description, isActive } = planData;

    this.logger.info(`Creating plan: ${name} at $${price / 100}`);

    const existingPlan = await this.plansRepository.findOneBy({ name: name });
    if (existingPlan) {
      this.logger.warn(`Plan creation failed - name already exists: ${name}`);
      throw new ConflictException('Plan with this name already exists.');
    }

    const newPlan = this.plansRepository.create(planData);
    const savedPlan = await this.plansRepository.save(newPlan);
    
    // Invalidate all plans cache
    await this.invalidatePlansCache();
    
    this.logger.info(`Plan created successfully: ${savedPlan.id} (${name})`);
    return savedPlan;
  }

  async getPlanByName(name: string): Promise<Plan> {
    this.logger.info(`Fetching plan by name: ${name}`);
    const plan = await this.plansRepository.findOneBy({ name });
    if (!plan) {
      this.logger.warn(`Plan not found with name: ${name}`);
      throw new NotFoundException(`Plan with name ${name} not found.`);
    }
    this.logger.info(`Plan found: ${plan.id} (${name})`);
    return plan;
  }

  async getAllPlans(): Promise<Plan[]> {
    this.logger.info('Fetching all plans');
    const plans = await this.plansRepository.find();
    if (plans.length === 0) {
      this.logger.warn('No plans found in database');
      throw new NotFoundException('No plans found.');
    }
    this.logger.info(`Found ${plans.length} plans`);
    return plans;
  }

  async getPlanById(id: string): Promise<Plan> {
    this.logger.info(`Fetching plan by ID: ${id}`);
    const plan = await this.plansRepository.findOneBy({ id: id });
    if (!plan) {
      this.logger.warn(`Plan not found with ID: ${id}`);
      throw new NotFoundException(`Plan with ID ${id} not found.`);
    }
    this.logger.info(`Plan found: ${plan.name}`);
    return plan;
  }

  async updatePlan(id: string, updateData: Partial<Plan>): Promise<Plan> {
    this.logger.info(`Updating plan: ${id}`, {
      updates: Object.keys(updateData),
    });
    const plan = await this.getPlanById(id);
    if (!plan) {
      this.logger.warn(`Update failed - plan not found: ${id}`);
      throw new NotFoundException(`Plan with ID ${id} not found.`);
    }
    Object.assign(plan, updateData);
    const updatedPlan = await this.plansRepository.save(plan);
    
    // Invalidate cache after update
    await this.invalidatePlansCache();
    
    this.logger.info(`Plan updated successfully: ${id} (${plan.name})`);
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    this.logger.info(`Deleting plan: ${id}`);
    const plan = await this.getPlanById(id);
    if (!plan) {
      this.logger.warn(`Delete failed - plan not found: ${id}`);
      throw new NotFoundException(`Plan with ID ${id} not found.`);
    }
    await this.plansRepository.remove(plan);
    
    // Invalidate cache after deletion
    await this.invalidatePlansCache();
    
    this.logger.info(`Plan deleted successfully: ${id} (${plan.name})`);
  }

  async deactivatePlan(id: string): Promise<Plan> {
    this.logger.info(`Deactivating plan: ${id}`);
    const plan = await this.getPlanById(id);
    if (!plan) {
      this.logger.warn(`Deactivation failed - plan not found: ${id}`);
      throw new NotFoundException(`Plan with ID ${id} not found.`);
    }
    plan.isActive = false;
    const deactivatedPlan = await this.plansRepository.save(plan);
    
    // Invalidate cache after deactivation
    await this.invalidatePlansCache();
    
    this.logger.info(`Plan deactivated successfully: ${id} (${plan.name})`);
    return deactivatedPlan;
  }

  async activatePlan(id: string): Promise<Plan> {
    this.logger.info(`Activating plan: ${id}`);
    const plan = await this.getPlanById(id);
    if (!plan) {
      this.logger.warn(`Activation failed - plan not found: ${id}`);
      throw new NotFoundException(`Plan with ID ${id} not found.`);
    }
    plan.isActive = true;
    const activatedPlan = await this.plansRepository.save(plan);
    
    // Invalidate cache after activation
    await this.invalidatePlansCache();
    
    this.logger.info(`Plan activated successfully: ${id} (${plan.name})`);
    return activatedPlan;
  }

  /**
   * Invalidate all plans-related cache entries
   * Called after create, update, delete, activate, or deactivate operations
   */
  private async invalidatePlansCache(): Promise<void> {
    try {
      // Clear all plan-related cache keys
      await this.cacheManager.del('/plans');
      this.logger.info('Plans cache invalidated successfully');
    } catch (error) {
      this.logger.error('Failed to invalidate plans cache', error);
    }
  }
}
