# 🎯 **Complete Stripe + Subscription Integration Guide**

## 🚀 **Quick Start Guide**

### 1. **Setup Your Stripe Account**

```bash
# 1. Go to: https://dashboard.stripe.com/test/apikeys
# 2. Copy your keys and update .env file:

STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. **Start Your Application**

```bash
# Build and start
npm run build
npm run start:dev

# Or with Docker
docker-compose up --build
```

## 💳 **Complete Payment Flow Examples**

### **Scenario 1: One-Time Payment**

```javascript
// 1. Create a customer in Stripe
const customer = await fetch('http://localhost:3000/payments/customers', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'customer@example.com',
    name: 'John Doe',
  }),
});

// 2. Create a payment intent
const payment = await fetch('http://localhost:3000/payments/payment-intents', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 2000, // $20.00 in cents
    currency: 'usd',
    customerId: customer.id,
    description: 'Premium subscription upgrade',
  }),
});

// 3. Confirm payment (in your frontend)
// Use Stripe Elements or payment form to collect payment method
// Then confirm the payment intent
```

### **Scenario 2: Recurring Subscription**

```javascript
// 1. Create customer (if not exists)
const customer = await createStripeCustomer();

// 2. Create a price for your plan
const price = await fetch('http://localhost:3000/payments/prices', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 2999, // $29.99 in cents
    currency: 'usd',
    interval: 'month',
  }),
});

// 3. Create subscription
const subscription = await fetch(
  'http://localhost:3000/payments/subscriptions',
  {
    method: 'POST',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: customer.id,
      priceId: price.id,
      paymentMethodId: 'pm_1234567890', // From Stripe Elements
    }),
  },
);

// 4. Create local subscription record
const localSubscription = await fetch(
  'http://localhost:3000/subscriptions/create',
  {
    method: 'POST',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'current-user-id',
      planId: 'plan-uuid',
      paymentReference: subscription.id, // Link to Stripe subscription
      status: 'active',
    }),
  },
);
```

### **Scenario 3: Plan Upgrade/Downgrade**

```javascript
// 1. Get current subscription
const currentSubscription = await fetch(
  `http://localhost:3000/payments/subscriptions/${stripeSubscriptionId}`,
  {
    headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' },
  },
);

// 2. Update subscription with new price
const updatedSubscription = await fetch(
  `http://localhost:3000/payments/subscriptions/${stripeSubscriptionId}`,
  {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: newPriceId,
    }),
  },
);

// 3. Update local subscription
await fetch(
  `http://localhost:3000/subscriptions/${localSubscriptionId}/change-plan`,
  {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId: newPlanId,
    }),
  },
);
```

## 🔄 **Webhook Integration**

### **Setup Webhook Endpoint**

```bash
# 1. In Stripe Dashboard → Webhooks
# 2. Add endpoint: https://your-domain.com/payments/webhooks
# 3. Select events:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - invoice.payment_succeeded
#    - invoice.payment_failed
#    - customer.subscription.updated
#    - customer.subscription.deleted
```

### **Webhook Handler Examples**

The webhook handler is already implemented in `PaymentsService.processWebhookEvent()`. Here's what happens:

```typescript
// When payment succeeds → Update subscription status
case 'payment_intent.succeeded':
  await this.handlePaymentIntentSucceeded(paymentIntent);
  // You can add logic here to:
  // - Update subscription status to 'active'
  // - Send welcome email
  // - Grant access to premium features

// When subscription is cancelled → Update local records
case 'customer.subscription.deleted':
  await this.handleSubscriptionDeleted(subscription);
  // You can add logic here to:
  // - Update local subscription status to 'cancelled'
  // - Revoke premium access
  // - Send cancellation confirmation
```

## 🧪 **Testing with Postman/curl**

### **1. Authentication First**

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testing003@example.com",
    "password": "password123"
  }'

# Copy the access_token from response
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **2. Create Customer**

```bash
curl -X POST http://localhost:3000/payments/customers \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "metadata": {
      "userId": "internal-user-id-123"
    }
  }'
```

### **3. Create Payment Intent**

```bash
curl -X POST http://localhost:3000/payments/payment-intents \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2999,
    "currency": "usd",
    "description": "Premium Plan Subscription",
    "metadata": {
      "planId": "premium-plan-uuid",
      "userId": "user-uuid"
    }
  }'
```

### **4. List Available Prices**

```bash
curl -X GET http://localhost:3000/payments/prices \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### **5. Create Price/Plan**

```bash
curl -X POST http://localhost:3000/payments/prices \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2999,
    "currency": "usd",
    "interval": "month"
  }'
```

## 🎨 **Frontend Integration Example**

### **React/Next.js Example**

```javascript
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('your_publishable_key_here');

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    // 1. Create payment intent on your server
    const { client_secret } = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2999 }),
    }).then((res) => res.json());

    // 2. Confirm payment with Stripe
    const { error } = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Customer Name',
        },
      },
    });

    if (error) {
      console.error('Payment failed:', error);
    } else {
      console.log('Payment succeeded!');
      // Redirect to success page
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  );
}

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

## 🛡️ **Security Best Practices**

### **1. Environment Variables**

```bash
# Never commit real keys to git!
# Use different keys for development/production

# Development
STRIPE_SECRET_KEY=your_development_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_development_publishable_key_here

# Production
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
```

### **2. Webhook Signature Verification**

```typescript
// Already implemented in PaymentsService
async processWebhookEvent(payload: string, signature: string) {
  try {
    // This verifies the webhook came from Stripe
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.stripeConfig.webhookSecret
    );
    // Process event...
  } catch (error) {
    throw new BadRequestException('Invalid webhook signature');
  }
}
```

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**

```sql
-- Payment success rate
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM payments
GROUP BY status;

-- Revenue by month
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as total_revenue,
  COUNT(*) as payment_count
FROM payments
WHERE status = 'succeeded'
GROUP BY month
ORDER BY month DESC;

-- Subscription churn rate
SELECT
  plan_id,
  COUNT(*) as total_subscriptions,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as churn_rate
FROM subscriptions
GROUP BY plan_id;
```

## 🚨 **Troubleshooting Common Issues**

### **1. Webhook Not Receiving Events**

```bash
# Check webhook URL is accessible
curl https://your-domain.com/payments/webhooks

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/payments/webhooks
```

### **2. Payment Intent Fails**

```typescript
// Check Stripe logs in dashboard
// Common issues:
// - Invalid card number (use test cards)
// - Insufficient funds (test card: 4000000000000002)
// - Card declined (test card: 4000000000000341)
```

### **3. Authentication Issues**

```bash
# Verify JWT token is valid
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

🎉 **You now have a complete, production-ready Stripe payment integration!**

This system handles:

- ✅ One-time payments
- ✅ Recurring subscriptions
- ✅ Plan upgrades/downgrades
- ✅ Customer management
- ✅ Webhook event processing
- ✅ Security & error handling
- ✅ Integration with your existing subscription system

Start testing with the examples above, and you'll be processing payments in no time! 💳✨
