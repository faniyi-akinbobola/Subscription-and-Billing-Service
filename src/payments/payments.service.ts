import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  CreateSubscriptionDto,
  CreateCustomerDto,
  CreateCheckoutSessionDto,
} from './dto';
import { BillingsService } from '../billings/billings.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    @Inject('STRIPE_CONFIG') private stripeConfig: any,
    private billingsService: BillingsService,
  ) {
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: this.stripeConfig.apiVersion,
      timeout: 60000, // 60 seconds timeout
      maxNetworkRetries: 3, // Retry failed requests 3 times
      httpAgent: undefined, // Use default HTTP agent
    });
  }

  // 💳 Customer Management
  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: createCustomerDto.email,
        name: createCustomerDto.name,
        phone: createCustomerDto.phone,
        metadata: createCustomerDto.metadata,
      });

      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`);
      throw new BadRequestException(
        `Failed to create customer: ${error.message}`,
      );
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Failed to retrieve customer: ${error.message}`);
      throw new BadRequestException(`Customer not found: ${customerId}`);
    }
  }

  // 🎯 Payment Intent Management
  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: createPaymentIntentDto.metadata,
      };

      if (createPaymentIntentDto.customerId) {
        paymentIntentData.customer = createPaymentIntentDto.customerId;
      }

      if (createPaymentIntentDto.paymentMethodId) {
        paymentIntentData.payment_method =
          createPaymentIntentDto.paymentMethodId;
        paymentIntentData.confirm = true;
      }

      if (createPaymentIntentDto.description) {
        paymentIntentData.description = createPaymentIntentDto.description;
      }

      const paymentIntent =
        await this.stripe.paymentIntents.create(paymentIntentData);

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  async confirmPaymentIntent(
    confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        confirmPaymentIntentDto.paymentIntentId,
        {
          payment_method: confirmPaymentIntentDto.paymentMethodId,
          return_url: 'http://localhost:3000/payments/return',
        },
      );

      this.logger.log(`Payment intent confirmed: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`);
      throw new BadRequestException(
        `Failed to confirm payment intent: ${error.message}`,
      );
    }
  }

  // 🛒 Checkout Session Management
  async createCheckoutSession(
    createCheckoutSessionDto: CreateCheckoutSessionDto,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: createCheckoutSessionDto.currency,
              product_data: {
                name: createCheckoutSessionDto.description || 'Payment',
              },
              unit_amount: createCheckoutSessionDto.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: createCheckoutSessionDto.success_url,
        cancel_url: createCheckoutSessionDto.cancel_url,
        metadata: createCheckoutSessionDto.metadata || {},
      };

      if (createCheckoutSessionDto.customerId) {
        sessionData.customer = createCheckoutSessionDto.customerId;
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);

      this.logger.log(`Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException(
        `Failed to create checkout session: ${error.message}`,
      );
    }
  }

  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new BadRequestException(
        `Payment intent not found: ${paymentIntentId}`,
      );
    }
  }

  // 📅 Subscription Management
  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: createSubscriptionDto.customerId,
        items: [
          {
            price: createSubscriptionDto.priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: createSubscriptionDto.metadata,
      };

      if (createSubscriptionDto.paymentMethodId) {
        subscriptionData.default_payment_method =
          createSubscriptionDto.paymentMethodId;
      }

      const subscription =
        await this.stripe.subscriptions.create(subscriptionData);

      this.logger.log(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new BadRequestException(
        `Failed to create subscription: ${error.message}`,
      );
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription: ${error.message}`);
      throw new BadRequestException(
        `Subscription not found: ${subscriptionId}`,
      );
    }
  }

  async updateSubscription(
    subscriptionId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: priceId,
            },
          ],
        },
      );

      this.logger.log(`Subscription updated: ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
      throw new BadRequestException(
        `Failed to update subscription: ${error.message}`,
      );
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException(
        `Failed to cancel subscription: ${error.message}`,
      );
    }
  }

  // 💰 Price and Product Management
  async createPrice(
    amount: number,
    currency: string,
    interval: 'month' | 'year',
    productId?: string,
  ): Promise<Stripe.Price> {
    try {
      const priceData: Stripe.PriceCreateParams = {
        unit_amount: amount,
        currency,
        recurring: { interval },
        metadata: {},
      };

      if (productId) {
        priceData.product = productId;
      } else {
        priceData.product_data = {
          name: `Subscription Plan - ${interval}ly`,
        };
      }

      const price = await this.stripe.prices.create(priceData);

      this.logger.log(`Price created: ${price.id}`);
      return price;
    } catch (error) {
      this.logger.error(`Failed to create price: ${error.message}`);
      throw new BadRequestException(`Failed to create price: ${error.message}`);
    }
  }

  async listPrices(): Promise<Stripe.ApiList<Stripe.Price>> {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });
      return prices;
    } catch (error) {
      this.logger.error(`Failed to list prices: ${error.message}`);
      throw new BadRequestException(`Failed to list prices: ${error.message}`);
    }
  }

  // 🎫 Payment Methods
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        },
      );

      this.logger.log(
        `Payment method attached: ${paymentMethodId} to customer: ${customerId}`,
      );
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to attach payment method: ${error.message}`);
      throw new BadRequestException(
        `Failed to attach payment method: ${error.message}`,
      );
    }
  }

  async listPaymentMethods(
    customerId: string,
  ): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods;
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${error.message}`);
      throw new BadRequestException(
        `Failed to list payment methods: ${error.message}`,
      );
    }
  }

  // 📋 Invoices
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      this.logger.error(`Failed to retrieve invoice: ${error.message}`);
      throw new BadRequestException(`Invoice not found: ${invoiceId}`);
    }
  }

  async listInvoices(
    customerId?: string,
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    try {
      const params: Stripe.InvoiceListParams = {
        limit: 100,
      };

      if (customerId) {
        params.customer = customerId;
      }

      const invoices = await this.stripe.invoices.list(params);
      return invoices;
    } catch (error) {
      this.logger.error(`Failed to list invoices: ${error.message}`);
      throw new BadRequestException(
        `Failed to list invoices: ${error.message}`,
      );
    }
  }

  // 🔐 Webhook Event Processing
  async processWebhookEvent(payload: string, signature: string): Promise<any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeConfig.webhookSecret,
        undefined, // Default timestamp tolerance (5 minutes)
        // For testing/development, you can increase tolerance:
        // 600 // 10 minutes in seconds
      );

      this.logger.log(`Processing webhook event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw new BadRequestException(
        `Webhook processing failed: ${error.message}`,
      );
    }
  }

  // 🎯 Private Webhook Handlers
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment successful for: ${paymentIntent.id}`);
    // TODO: Update database records, send notification emails, etc.
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment failed for: ${paymentIntent.id}`);
    // TODO: Update database records, send failure notifications, etc.
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    this.logger.log(`Invoice payment successful: ${invoice.id}`);

    // Process receipt email and billing record
    await this.billingsService.processPaymentReceipt(invoice);
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    // Process payment failure
    await this.billingsService.processPaymentFailure(invoice);
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}`);
    // TODO: Update local subscription records
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    // TODO: Handle subscription cancellation
  }
}
