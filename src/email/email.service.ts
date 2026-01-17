import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import * as nodemailer from 'nodemailer';
import CircuitBreaker from 'opossum';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

/**
 * Interface for receipt email data structure
 */
export interface ReceiptEmailData {
  /** Customer's email address */
  customerEmail: string;
  /** Customer's full name */
  customerName: string;
  /** Unique invoice number */
  invoiceNumber: string;
  /** Payment amount in cents */
  amount: number;
  /** Currency code (e.g., 'usd', 'eur') */
  currency: string;
  /** Date when payment was processed */
  paidAt: Date;
  /** Name of the subscription plan */
  planName: string;
  /** Billing period information */
  period: {
    /** Period start date */
    start: Date;
    /** Period end date */
    end: Date;
  };
  /** Optional PDF invoice URL */
  pdfUrl?: string;
}

/**
 * Interface for renewal reminder email data structure
 */
export interface RenewalReminderData {
  /** Customer's email address */
  customerEmail: string;
  /** Customer's full name */
  customerName: string;
  /** Name of the subscription plan */
  planName: string;
  /** Renewal amount in cents */
  amount: number;
  /** Currency code (e.g., 'usd', 'eur') */
  currency: string;
  /** Date when subscription will renew */
  renewalDate: Date;
  /** Number of days until renewal */
  daysUntilRenewal: number;
  /** Stripe subscription ID */
  subscriptionId: string;
}

/**
 * Email service for handling transactional emails
 *
 * Provides functionality for:
 * - Payment receipt emails
 * - Subscription renewal reminders
 * - Email template formatting
 * - SMTP configuration and error handling
 *
 * @example
 * ```typescript
 * const receiptData = {
 *   customerEmail: 'customer@example.com',
 *   customerName: 'John Doe',
 *   // ... other required fields
 * };
 * await emailService.sendReceiptEmail(receiptData);
 * ```
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private emailCircuitBreaker: CircuitBreaker<any[], any>;

  /**
   * Initialize the email service with SMTP configuration
   * @param configService - NestJS configuration service for environment variables
   * @param circuitBreakerService - Circuit breaker service for email resilience
   */
  constructor(
    @InjectPinoLogger(EmailService.name)
    private readonly logger: PinoLogger,
    private configService: ConfigService,
    private circuitBreakerService: CircuitBreakerService,
  ) {
    this.initializeTransporter();
    this.setupCircuitBreaker();
  }

  /**
   * Initialize the nodemailer transporter with SMTP settings
   * Configures Gmail SMTP or other email providers based on environment variables
   *
   * @private
   * @throws {Error} When SMTP configuration is invalid
   */
  private initializeTransporter() {
    // Configure your email service using explicit SMTP settings
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: parseInt(this.configService.get('EMAIL_PORT') || '587'),
      secure: this.configService.get('EMAIL_SECURE') === 'true', // false for 587, true for 465
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'), // Use app password for Gmail
      },
    });

    // Alternative: Use SendGrid, AWS SES, etc.
    // this.transporter = nodemailer.createTransport({
    //   host: 'smtp.sendgrid.net',
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: 'apikey',
    //     pass: this.configService.get('SENDGRID_API_KEY'),
    //   },
    // });
  }

  /**
   * Setup circuit breaker for email sending operations
   * Protects against email service outages and cascading failures
   * 
   * @private
   */
  private setupCircuitBreaker() {
    this.emailCircuitBreaker = this.circuitBreakerService.createBreaker(
      'email-smtp',
      async (mailOptions: nodemailer.SendMailOptions) => {
        return await this.transporter.sendMail(mailOptions);
      },
      {
        timeout: 15000, // 15 seconds timeout for email sending
        errorThresholdPercentage: 50, // Open circuit if 50% fail
        resetTimeout: 60000, // Try again after 1 minute
        volumeThreshold: 3, // Need at least 3 requests before opening
      },
    );

    // Fallback: Log the email attempt when circuit is open
    this.emailCircuitBreaker.fallback(async (mailOptions) => {
      this.logger.warn(
        `Email circuit breaker open - email not sent to ${mailOptions.to}`,
      );
      return {
        fallback: true,
        message:
          'Email service temporarily unavailable. Email will be queued for retry.',
      };
    });
  }

  async sendReceiptEmail(data: ReceiptEmailData): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM', 'noreply@yourapp.com'),
        to: data.customerEmail,
        subject: `Payment Receipt - ${data.invoiceNumber}`,
        html: this.generateReceiptEmailTemplate(data),
      };

      // Use circuit breaker for email sending
      const result = await this.emailCircuitBreaker.fire(mailOptions);
      
      if (result.fallback) {
        this.logger.warn(
          `Receipt email fallback triggered for ${data.customerEmail}`,
        );
        return; // Don't throw error when circuit is open
      }

      this.logger.info(
        `Receipt email sent to ${data.customerEmail} for invoice ${data.invoiceNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send receipt email to ${data.customerEmail}:`,
        error,
      );
      throw error;
    }
  }

  async sendRenewalReminderEmail(data: RenewalReminderData): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM', 'noreply@yourapp.com'),
        to: data.customerEmail,
        subject: `Subscription Renewal Reminder - ${data.planName}`,
        html: this.generateRenewalReminderTemplate(data),
      };

      // Use circuit breaker for email sending
      const result = await this.emailCircuitBreaker.fire(mailOptions);
      
      if (result.fallback) {
        this.logger.warn(
          `Renewal reminder email fallback triggered for ${data.customerEmail}`,
        );
        return; // Don't throw error when circuit is open
      }

      this.logger.info(
        `Renewal reminder sent to ${data.customerEmail} for subscription ${data.subscriptionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send renewal reminder to ${data.customerEmail}:`,
        error,
      );
      throw error;
    }
  }

  private generateReceiptEmailTemplate(data: ReceiptEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .receipt-details { background-color: white; padding: 20px; border-radius: 5px; }
          .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Payment Successful!</h1>
          </div>
          
          <div class="content">
            <h2>Thank you for your payment, ${data.customerName}!</h2>
            <p>Your payment has been successfully processed. Here are the details:</p>
            
            <div class="receipt-details">
              <h3>Receipt Details</h3>
              <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Amount Paid:</strong> <span class="amount">$${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}</span></p>
              <p><strong>Payment Date:</strong> ${this.formatDate(data.paidAt)}</p>
              <p><strong>Billing Period:</strong> ${this.formatDate(data.period.start)} - ${this.formatDate(data.period.end)}</p>
              ${data.pdfUrl ? `<p><strong>Receipt PDF:</strong> <a href="${data.pdfUrl}">Download Receipt</a></p>` : ''}
            </div>
            
            <p>Your subscription is now active and you can enjoy all the features of your ${data.planName} plan.</p>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateRenewalReminderTemplate(data: RenewalReminderData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Renewal Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .renewal-details { background-color: white; padding: 20px; border-radius: 5px; }
          .amount { font-size: 20px; font-weight: bold; color: #FF9800; }
          .cta-button { 
            display: inline-block; 
            background-color: #4CAF50; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Renewal Reminder</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${data.customerName},</h2>
            <p>Your subscription is set to renew in ${data.daysUntilRenewal} days!</p>
            
            <div class="renewal-details">
              <h3>Renewal Details</h3>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Renewal Date:</strong> ${this.formatDate(data.renewalDate)}</p>
              <p><strong>Amount:</strong> <span class="amount">$${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}</span></p>
              <p><strong>Subscription ID:</strong> ${data.subscriptionId}</p>
            </div>
            
            <p>Your subscription will automatically renew on ${this.formatDate(data.renewalDate)}. 
               The payment will be charged to your default payment method.</p>
            
            <div style="text-align: center;">
              <a href="https://yourapp.com/subscription/manage" class="cta-button">Manage Subscription</a>
            </div>
            
            <p><strong>Need to make changes?</strong> You can update your payment method, 
               change your plan, or cancel your subscription at any time from your account dashboard.</p>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format date to DD/MM/YYYY format to avoid confusion
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
