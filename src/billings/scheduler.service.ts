import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { BillingsService } from './billings.service';
import Stripe from 'stripe';
import CircuitBreaker from 'opossum';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

@Injectable()
export class SchedulerService {
  private stripe: Stripe;
  private stripeCircuitBreaker: CircuitBreaker<any[], any>;

  constructor(
    @InjectPinoLogger(SchedulerService.name)
    private readonly logger: PinoLogger,
    private billingsService: BillingsService,
    @Inject('STRIPE_CONFIG') private stripeConfig: any,
    private circuitBreakerService: CircuitBreakerService,
  ) {
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: this.stripeConfig.apiVersion,
      timeout: 60000, // 60 seconds timeout
      maxNetworkRetries: 3, // Retry failed requests 3 times
      httpAgent: undefined, // Use default HTTP agent
    });
    this.setupCircuitBreaker();
  }

  /**
   * Setup circuit breaker for scheduled Stripe API calls
   * Protects scheduled jobs from Stripe API failures
   * 
   * @private
   */
  private setupCircuitBreaker() {
    this.stripeCircuitBreaker = this.circuitBreakerService.createBreaker(
      'stripe-scheduler',
      async (apiCall: () => Promise<any>) => {
        return await apiCall();
      },
      {
        timeout: 45000, // 45 seconds timeout for background jobs
        errorThresholdPercentage: 60, // More tolerant for background jobs
        resetTimeout: 120000, // Try again after 2 minutes
        volumeThreshold: 3, // Open after 3 failures
      },
    );

    // Fallback: Log and continue for scheduled jobs
    this.stripeCircuitBreaker.fallback(() => {
      this.logger.warn(
        'Stripe scheduler circuit breaker open - skipping this run',
      );
      return { skipped: true };
    });
  }

  /**
   * Execute Stripe API call with circuit breaker protection
   * 
   * @param apiCall - The Stripe API call function to execute
   * @returns Promise with the result of the API call
   */
  private async executeWithCircuitBreaker<T>(
    apiCall: () => Promise<T>,
  ): Promise<T> {
    return this.stripeCircuitBreaker.fire(apiCall);
  }

  /**
   * Check for upcoming renewals every day at 9 AM
   * Sends reminders 3 days before renewal
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkUpcomingRenewals(): Promise<void> {
    this.logger.info('Starting daily renewal reminder check...');

    try {
      await this.billingsService.scheduleRenewalReminders(this.stripe);
      this.logger.info('Daily renewal reminder check completed');
    } catch (error) {
      this.logger.error('Failed to check upcoming renewals:', error);
    }
  }

  /**
   * Optional: Check for failed payments and retry
   * Runs every hour during business hours
   */
  @Cron('0 9-17 * * 1-5') // Every hour from 9 AM to 5 PM, Monday to Friday
  async checkFailedPayments(): Promise<void> {
    this.logger.info('Checking for failed payments...');

    try {
      // Get recent failed invoices with circuit breaker protection
      const failedInvoices = await this.executeWithCircuitBreaker(() =>
        this.stripe.invoices.list({
          status: 'open',
          limit: 50,
          created: {
            gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // Last 24 hours
          },
        }),
      );

      if ((failedInvoices as any).skipped) {
        this.logger.warn('Skipped failed payments check due to circuit breaker');
        return;
      }

      for (const invoice of failedInvoices.data) {
        if (invoice.attempt_count > 0) {
          this.logger.info(
            `Found failed invoice: ${invoice.id}, attempts: ${invoice.attempt_count}`,
          );

          // Process failed payment for notification
          await this.billingsService.processPaymentFailure(invoice);
        }
      }
    } catch (error) {
      this.logger.error('Failed to check failed payments:', error);
    }
  }

  /**
   * Weekly billing summary - runs every Monday at 8 AM
   */
  @Cron('0 8 * * 1')
  async generateWeeklyBillingSummary(): Promise<void> {
    this.logger.info('Generating weekly billing summary...');

    try {
      // Get last week's invoices with circuit breaker protection
      const weekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      const invoices = await this.executeWithCircuitBreaker(() =>
        this.stripe.invoices.list({
          created: { gte: weekAgo },
          limit: 100,
        }),
      );

      if ((invoices as any).skipped) {
        this.logger.warn(
          'Skipped weekly billing summary due to circuit breaker',
        );
        return;
      }

      let totalRevenue = 0;
      let paidInvoices = 0;
      let failedInvoices = 0;

      for (const invoice of invoices.data) {
        if (invoice.status === 'paid') {
          totalRevenue += invoice.amount_paid;
          paidInvoices++;
        } else if (invoice.status === 'open' && invoice.attempt_count > 0) {
          failedInvoices++;
        }
      }

      this.logger.info(`Weekly Summary: 
        - Total Revenue: $${(totalRevenue / 100).toFixed(2)}
        - Paid Invoices: ${paidInvoices}
        - Failed Invoices: ${failedInvoices}
        - Total Invoices: ${invoices.data.length}`);
    } catch (error) {
      this.logger.error('Failed to generate weekly summary:', error);
    }
  }
}
