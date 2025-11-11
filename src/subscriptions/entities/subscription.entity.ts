// src/subscriptions/entities/subscription.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';

export enum SubscriptionStatus {
  PENDING = 'pending',
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('subscriptions')
@Index(['status', 'endDate']) // For querying expiring subscriptions
@Index(['user', 'status']) // For user subscription queries
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 👤 Linked user
  @ManyToOne(() => User, { eager: true })
  user: User;

  // 🧩 Linked plan
  @ManyToOne(() => Plan, { eager: true })
  plan: Plan;

  // 📅 Lifecycle dates
  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  renewedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  // Track plan changes
  @Column({ type: 'timestamptz', nullable: true })
  planChangedAt: Date;

  // 🆓 Trial period support
  @Column({ type: 'timestamptz', nullable: true })
  trialEndDate: Date;

  @Column({ default: false })
  isTrialPeriod: boolean;

  // 🔁 Auto-renew control
  @Column({ default: true })
  isAutoRenew: boolean;

  // 🏷️ Current status
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  // 🔄 Billing information
  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  // Price when subscribed (for tracking price changes)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  subscribedPrice: number;

  // 💳 Payment tracking
  @Column({ nullable: true })
  paymentReference: string;

  @Column({ type: 'timestamptz', nullable: true })
  nextBillingDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  gracePeriodEndDate: Date;

  // 📈 Metrics
  @Column({ default: 0 })
  renewalCount: number;

  // ❌ Cancellation tracking
  @Column({ nullable: true, length: 500 })
  cancellationReason: string;

  // 🕒 Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 🔧 Helper methods
  get isExpired(): boolean {
    return this.endDate && new Date() > this.endDate;
  }

  get isInTrial(): boolean {
    return (
      this.isTrialPeriod && this.trialEndDate && new Date() <= this.trialEndDate
    );
  }

  get daysUntilExpiry(): number | null {
    if (!this.endDate) return null;
    return Math.ceil(
      (this.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
