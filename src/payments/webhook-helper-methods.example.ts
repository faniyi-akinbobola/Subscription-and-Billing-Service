/**
 * WEBHOOK HELPER METHODS - EXAMPLES
 *
 * These are example methods showing how to enhance your PaymentsService
 * to ensure metadata (especially userId) is always included for webhook sync.
 *
 * Copy these methods into your PaymentsService class and customize as needed.
 *
 * This file is for reference only and contains commented examples.
 */

/*

EXAMPLE 1: Enhanced Customer Creation with userId
==================================================

async createCustomerWithUser(
  createCustomerDto: CreateCustomerDto & { userId: string },
): Promise<Stripe.Customer> {
  try {
    const customer = await this.stripe.customers.create({
      email: createCustomerDto.email,
      name: createCustomerDto.name,
      phone: createCustomerDto.phone,
      metadata: {
        ...createCustomerDto.metadata,
        userId: createCustomerDto.userId, // Always include userId for webhooks
      },
    });

    this.logger.log(`Customer created with userId: ${customer.id}`);
    return customer;
  } catch (error) {
    this.logger.error(`Failed to create customer: ${error.message}`);
    throw new BadRequestException(
      `Failed to create customer: ${error.message}`,
    );
  }
}


EXAMPLE 2: Enhanced Payment Intent Creation with userId
========================================================

async createPaymentIntentWithUser(
  createPaymentIntentDto: CreatePaymentIntentDto & { userId: string },
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: createPaymentIntentDto.amount,
      currency: createPaymentIntentDto.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...createPaymentIntentDto.metadata,
        userId: createPaymentIntentDto.userId, // Always include userId
      },
    };

    if (createPaymentIntentDto.customerId) {
      paymentIntentData.customer = createPaymentIntentDto.customerId;
    }

    const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

    this.logger.log(`Payment intent created with userId: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    this.logger.error(`Failed to create payment intent: ${error.message}`);
    throw new BadRequestException(
      `Failed to create payment intent: ${error.message}`,
    );
  }
}


EXAMPLE 3: Enhanced Subscription Creation with Sync
====================================================

async createSubscriptionWithSync(
  createSubscriptionDto: CreateSubscriptionDto & { 
    userId: string;
    localSubscriptionId?: string; 
  },
): Promise<{ 
  stripeSubscription: Stripe.Subscription; 
}> {
  try {
    // Create Stripe subscription with userId in metadata
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: createSubscriptionDto.customerId,
      items: [{ price: createSubscriptionDto.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...createSubscriptionDto.metadata,
        userId: createSubscriptionDto.userId, // Critical for webhooks!
        localSubscriptionId: createSubscriptionDto.localSubscriptionId,
      },
    };

    const stripeSubscription = await this.stripe.subscriptions.create(subscriptionData);

    this.logger.log(`Stripe subscription created: ${stripeSubscription.id}`);

    // Update local subscription with Stripe reference
    if (createSubscriptionDto.localSubscriptionId) {
      try {
        await this.subscriptionsService.update(
          createSubscriptionDto.localSubscriptionId,
          {
            // Store Stripe subscription ID for webhook sync
            paymentReference: stripeSubscription.id,
          } as any,
        );
        this.logger.log(
          `Updated local subscription ${createSubscriptionDto.localSubscriptionId} with Stripe reference`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to update local subscription: ${error.message}`,
        );
      }
    }

    return { stripeSubscription };
  } catch (error) {
    this.logger.error(`Failed to create subscription: ${error.message}`);
    throw new BadRequestException(
      `Failed to create subscription: ${error.message}`,
    );
  }
}


USAGE EXAMPLES:
===============

// In your controller or service:

// 1. Create customer with user tracking
const customer = await this.paymentsService.createCustomerWithUser({
  email: user.email,
  name: user.name,
  userId: user.id, // ← This ensures webhooks can find the user
});

// 2. Create payment intent with user tracking
const paymentIntent = await this.paymentsService.createPaymentIntentWithUser({
  amount: 5000,
  currency: 'usd',
  customerId: customer.id,
  userId: user.id, // ← This ensures webhooks can find the user
});

// 3. Create subscription with automatic sync
const { stripeSubscription } = await this.paymentsService.createSubscriptionWithSync({
  customerId: customer.id,
  priceId: 'price_xxx',
  userId: user.id, // ← This ensures webhooks can find the user
  localSubscriptionId: localSub.id, // ← Links to local subscription
});


IMPORTANT NOTES:
================

1. Always include userId in metadata when creating Stripe resources
2. Store Stripe subscription ID in subscription.paymentReference field
3. This enables automatic webhook synchronization
4. Without userId in metadata, webhooks will fall back to email lookup

*/

export {}; // Make this a module to avoid TS errors
