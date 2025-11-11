import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentThrottlerGuard } from './middleware/payment-throttler.guard';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  CreateSubscriptionDto,
  CreateCustomerDto,
  CreateCheckoutSessionDto,
} from './dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, PaymentThrottlerGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 💳 Customer Management
  @Post('customers')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 per minute
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.paymentsService.createCustomer(createCustomerDto);
  }

  @Get('customers/:customerId')
  async getCustomer(@Param('customerId') customerId: string) {
    return this.paymentsService.getCustomer(customerId);
  }

  // 🎯 Payment Intent Management
  @Post('payment-intents')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 per minute for payment creation
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('payment-intents/:id/confirm')
  async confirmPaymentIntent(
    @Param('id') paymentIntentId: string,
    @Body() confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ) {
    return this.paymentsService.confirmPaymentIntent({
      ...confirmPaymentIntentDto,
      paymentIntentId,
    });
  }

  @Get('payment-intents/:id')
  async getPaymentIntent(@Param('id') paymentIntentId: string) {
    return this.paymentsService.getPaymentIntent(paymentIntentId);
  }

  // � Checkout Session Management (with return URLs)
  @Post('checkout-sessions')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 per minute
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(createCheckoutSessionDto);
  }

  // �📅 Subscription Management
  @Post('subscriptions')
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.paymentsService.createSubscription(createSubscriptionDto);
  }

  @Get('subscriptions/:id')
  async getSubscription(@Param('id') subscriptionId: string) {
    return this.paymentsService.getSubscription(subscriptionId);
  }

  @Patch('subscriptions/:id')
  async updateSubscription(
    @Param('id') subscriptionId: string,
    @Body('priceId') priceId: string,
  ) {
    return this.paymentsService.updateSubscription(subscriptionId, priceId);
  }

  @Delete('subscriptions/:id')
  async cancelSubscription(@Param('id') subscriptionId: string) {
    return this.paymentsService.cancelSubscription(subscriptionId);
  }

  // 💰 Price and Product Management
  @Post('prices')
  async createPrice(
    @Body()
    body: {
      amount: number;
      currency: string;
      interval: 'month' | 'year';
      productId?: string;
    },
  ) {
    return this.paymentsService.createPrice(
      body.amount,
      body.currency,
      body.interval,
      body.productId,
    );
  }

  @Get('prices')
  async listPrices() {
    return this.paymentsService.listPrices();
  }

  // 🎫 Payment Methods
  @Post('payment-methods/:id/attach')
  async attachPaymentMethod(
    @Param('id') paymentMethodId: string,
    @Body('customerId') customerId: string,
  ) {
    return this.paymentsService.attachPaymentMethod(
      paymentMethodId,
      customerId,
    );
  }

  @Get('customers/:customerId/payment-methods')
  async listPaymentMethods(@Param('customerId') customerId: string) {
    return this.paymentsService.listPaymentMethods(customerId);
  }

  // 📋 Invoices
  @Get('invoices/:id')
  async getInvoice(@Param('id') invoiceId: string) {
    return this.paymentsService.getInvoice(invoiceId);
  }

  @Get('invoices')
  async listInvoices(@Param('customerId') customerId?: string) {
    return this.paymentsService.listInvoices(customerId);
  }

  // 🔐 Webhook Endpoint
  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = (request as any).rawBody?.toString() || '';
    return this.paymentsService.processWebhookEvent(payload, signature);
  }

  // 🔄 Payment Return URL (for 3DS authentication)
  @Get('return')
  @HttpCode(HttpStatus.OK)
  async paymentReturn() {
    return {
      success: true,
      message: 'Payment authentication completed',
      redirect: '/dashboard',
    };
  }
}
