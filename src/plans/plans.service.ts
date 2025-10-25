import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>,
    ) {}

    async createPlan(planData: {
        name: string;
        price: number;
        description: string;
        isActive: boolean;
    }): Promise<Plan> {
        const { name, price, description, isActive } = planData;

        const existingPlan = await this.plansRepository.findOneBy({ name: name });
        if (existingPlan) {
            throw new ConflictException('Plan with this name already exists.');
        }

        const newPlan = this.plansRepository.create(planData);
        return this.plansRepository.save(newPlan);
    }

    async getPlanByName(name: string): Promise<Plan> {
        const plan = await this.plansRepository.findOneBy({ name });
        if (!plan) {
            throw new NotFoundException(`Plan with name ${name} not found.`);
        }
        return plan;
    }

    async getAllPlans(): Promise<Plan[]> {
        const plans = await this.plansRepository.find();
        if (plans.length === 0) {
            throw new NotFoundException('No plans found.');
        }
        return plans;
    }

    async getPlanById(id: string): Promise<Plan> {
        const plan = await this.plansRepository.findOneBy({ id: id });
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found.`);
        }
        return plan;
    }

    async updatePlan(id: string, updateData: Partial<Plan>): Promise<Plan> {
        const plan = await this.getPlanById(id);
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found.`);
        }
        Object.assign(plan, updateData);
        return await this.plansRepository.save(plan);
    }

    async deletePlan(id: string): Promise<void> {
        const plan = await this.getPlanById(id);
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found.`);
        }
        await this.plansRepository.remove(plan);
    }

    async deactivatePlan(id: string): Promise<Plan> {
        const plan = await this.getPlanById(id);
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found.`);
        }
        plan.isActive = false;
        return this.plansRepository.save(plan);
    }

    async activatePlan(id: string): Promise<Plan> {
        const plan = await this.getPlanById(id);
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found.`);
        }
        plan.isActive = true;
        return this.plansRepository.save(plan);
    }

}
