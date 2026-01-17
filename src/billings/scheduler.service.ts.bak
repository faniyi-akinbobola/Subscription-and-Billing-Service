import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingsService } from './billings.service';
import Stripe from 'stripe';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private stripe: Stripe;

  constructor(
    private billingsService: BillingsService,
    @Inject('STRIPE_CONFIG') private stripeConfig: any,
  ) {
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: this.stripeConfig.apiVersion,
      timeout: 60000, // 60 seconds timeout
      maxNetworkRetries: 3, // Retry failed requests 3 times
      httpAgent: undefined, // Use default HTTP agent
    });
  }

  /**
   * Check for upcoming renewals every day at 9 AM
   * Sends reminders 3 days before renewal
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkUpcomingRenewals(): Promise<void> {
    this.logger.log('Starting daily renewal reminder check...');

    try {
      await this.billingsService.scheduleRenewalReminders(this.stripe);
      this.logger.log('Daily renewal reminder check completed');
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
    this.logger.log('Checking for failed payments...');

    try {
      // Get recent failed invoices
      const failedInvoices = await this.stripe.invoices.list({
        status: 'open',
        limit: 50,
        created: {
          gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // Last 24 hours
        },
      });

      for (const invoice of failedInvoices.data) {
        if (invoice.attempt_count > 0) {
          this.logger.log(
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
    this.logger.log('Generating weekly billing summary...');

    try {
      // Get last week's invoices
      const weekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      const invoices = await this.stripe.invoices.list({
        created: { gte: weekAgo },
        limit: 100,
      });

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

      this.logger.log(`Weekly Summary: 
        - Total Revenue: $${(totalRevenue / 100).toFixed(2)}
        - Paid Invoices: ${paidInvoices}
        - Failed Invoices: ${failedInvoices}
        - Total Invoices: ${invoices.data.length}`);
    } catch (error) {
      this.logger.error('Failed to generate weekly summary:', error);
    }
  }
}
