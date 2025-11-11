import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingsService } from './billings.service';
import { EmailService } from '../email/email.service';

@ApiTags('Billing')
@Controller('billings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BillingsController {
  constructor(
    private billingsService: BillingsService,
    private emailService: EmailService,
  ) {}

  /**
   * Get billing history for a customer
   */
  @Get('history/:customerId')
  @ApiOperation({
    summary: 'Get customer billing history',
    description: 'Retrieve all billing records for a specific customer',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Stripe customer ID',
    example: 'cus_1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          customerId: { type: 'string', example: 'cus_1234567890abcdef' },
          amount: { type: 'number', example: 2999 },
          currency: { type: 'string', example: 'usd' },
          status: { type: 'string', example: 'paid' },
          invoiceNumber: { type: 'string', example: 'INV-001' },
          paidAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid JWT token' })
  async getBillingHistory(@Param('customerId') customerId: string) {
    return await this.billingsService.getBillingHistory(customerId);
  }

  /**
   * Test endpoint to send a receipt email
   */
  @Post('test/receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test receipt email',
    description: 'Send a payment receipt email for testing purposes',
  })
  @ApiBody({
    description: 'Receipt email test data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'customer@example.com',
          description: 'Customer email address',
        },
        name: {
          type: 'string',
          example: 'John Doe',
          description: 'Customer name',
        },
        invoiceNumber: {
          type: 'string',
          example: 'INV-TEST-001',
          description: 'Invoice number',
        },
        amount: {
          type: 'number',
          example: 2999,
          description: 'Amount in cents',
        },
        currency: {
          type: 'string',
          example: 'usd',
          description: 'Currency code',
        },
        planName: {
          type: 'string',
          example: 'Premium Monthly Plan',
          description: 'Subscription plan name',
        },
        pdfUrl: {
          type: 'string',
          format: 'url',
          example: 'https://example.com/invoice.pdf',
          description: 'Optional PDF invoice URL',
        },
      },
      required: ['email', 'name', 'amount', 'currency'],
    },
    examples: {
      basic: {
        summary: 'Basic receipt email',
        value: {
          email: 'customer@example.com',
          name: 'John Doe',
          invoiceNumber: 'INV-TEST-001',
          amount: 2999,
          currency: 'usd',
          planName: 'Premium Monthly Plan',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Receipt email sent successfully' },
        sentTo: { type: 'string', example: 'customer@example.com' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid JWT token' })
  async testReceiptEmail(@Body() testData: any) {
    const receiptData = {
      customerEmail: testData.email || 'test@example.com',
      customerName: testData.name || 'Test Customer',
      invoiceNumber: testData.invoiceNumber || 'TEST-001',
      amount: testData.amount || 2999,
      currency: testData.currency || 'usd',
      paidAt: new Date(),
      planName: testData.planName || 'Premium Monthly Plan',
      period: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      pdfUrl: testData.pdfUrl || null,
    };

    await this.emailService.sendReceiptEmail(receiptData);

    return {
      message: 'Receipt email sent successfully',
      sentTo: receiptData.customerEmail,
    };
  }

  /**
   * Test endpoint to send a renewal reminder email
   */
  @Post('test/renewal-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test renewal reminder email',
    description:
      'Send a subscription renewal reminder email for testing purposes',
  })
  @ApiBody({
    description: 'Renewal reminder email test data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'customer@example.com',
          description: 'Customer email address',
        },
        name: {
          type: 'string',
          example: 'John Doe',
          description: 'Customer name',
        },
        planName: {
          type: 'string',
          example: 'Premium Monthly Plan',
          description: 'Subscription plan name',
        },
        amount: {
          type: 'number',
          example: 2999,
          description: 'Renewal amount in cents',
        },
        currency: {
          type: 'string',
          example: 'usd',
          description: 'Currency code',
        },
        subscriptionId: {
          type: 'string',
          example: 'sub_1234567890abcdef',
          description: 'Stripe subscription ID',
        },
      },
      required: ['email', 'name', 'planName', 'amount', 'currency'],
    },
    examples: {
      basic: {
        summary: 'Basic renewal reminder',
        value: {
          email: 'customer@example.com',
          name: 'John Doe',
          planName: 'Premium Monthly Plan',
          amount: 2999,
          currency: 'usd',
          subscriptionId: 'sub_test_123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Renewal reminder email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Renewal reminder email sent successfully',
        },
        sentTo: { type: 'string', example: 'customer@example.com' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid JWT token' })
  async testRenewalReminderEmail(@Body() testData: any) {
    const reminderData = {
      customerEmail: testData.email || 'test@example.com',
      customerName: testData.name || 'Test Customer',
      planName: testData.planName || 'Premium Monthly Plan',
      amount: testData.amount || 2999,
      currency: testData.currency || 'usd',
      renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      daysUntilRenewal: 3,
      subscriptionId: testData.subscriptionId || 'sub_test_123',
    };

    await this.emailService.sendRenewalReminderEmail(reminderData);

    return {
      message: 'Renewal reminder email sent successfully',
      sentTo: reminderData.customerEmail,
    };
  }
}
