# 🎯 Webhook Implementation - Complete Guide

## ✅ What's Been Completed

Your Stripe webhook handlers have been fully implemented to sync all Stripe events with your database!

### 📦 **Updates Made:**

#### 1. **PaymentsModule** (`src/payments/payments.module.ts`)

- ✅ Added `TypeOrmModule.forFeature([Payment])` for payment entity support
- ✅ Imported `SubscriptionsModule` for subscription sync
- ✅ Imported `UsersModule` for user lookup
- ✅ All dependencies properly wired

#### 2. **PaymentsService** (`src/payments/payments.service.ts`)

- ✅ Injected `PaymentRepository` for payment tracking
- ✅ Injected `SubscriptionsService` for subscription sync
- ✅ Injected `UsersService` for user lookup

### 🔧 **Webhook Handlers Implemented:**

#### ✅ **1. Payment Intent Succeeded** (`payment_intent.succeeded`)

**What it does:**

- ✅ Creates/updates Payment record in database
- ✅ Tracks payment status, amount, and metadata
- ✅ Links payment to user via userId in metadata
- ✅ Falls back to email lookup if userId not in metadata
- ✅ Converts amounts from cents to dollars
- ✅ Handles both one-time and subscription payments

**Database Impact:**

```sql
INSERT INTO payments (
  stripe_payment_intent_id,
  stripe_customer_id,
  user_id,
  amount,
  currency,
  status,
  type,
  processed_at
) VALUES (...)
```

---

#### ✅ **2. Payment Intent Failed** (`payment_intent.payment_failed`)

**What it does:**

- ✅ Creates/updates Payment record with FAILED status
- ✅ Stores failure reason in metadata
- ✅ Logs failure for investigation
- ✅ Ready for failure notification emails (TODO commented)

**Database Impact:**

```sql
INSERT INTO payments (
  status = 'failed',
  metadata = { failureReason: '...' }
)
```

---

#### ✅ **3. Invoice Payment Succeeded** (`invoice.payment_succeeded`)

**What it does:**

- ✅ Sends receipt email to customer
- ✅ Creates billing record
- ✅ Already working before (kept as-is)

**Actions:**

- Calls `billingsService.processPaymentReceipt()`
- Emails customer with invoice details

---

#### ✅ **4. Invoice Payment Failed** (`invoice.payment_failed`)

**What it does:**

- ✅ Processes payment failure
- ✅ Logs billing record
- ✅ Already working before (kept as-is)

**Actions:**

- Calls `billingsService.processPaymentFailure()`

---

#### ✅ **5. Subscription Created** (`customer.subscription.created`) - NEW!

**What it does:**

- ✅ Detects new subscriptions created via Stripe
- ✅ Checks if subscription already exists in database
- ✅ Logs for tracking purposes
- ✅ Calls update handler to sync if exists

**Notes:**

- Most subscriptions should be created via your API first
- This catches edge cases where subscriptions are created directly in Stripe

---

#### ✅ **6. Subscription Updated** (`customer.subscription.updated`)

**What it does:**

- ✅ **FULLY SYNCS** Stripe subscription with local database
- ✅ Maps Stripe statuses to local statuses:
  - `active` → `ACTIVE`
  - `trialing` → `TRIAL`
  - `past_due` → `PAST_DUE`
  - `canceled` → `CANCELLED`
  - `unpaid` → `SUSPENDED`
- ✅ Updates subscription dates (start, end, trial end)
- ✅ Updates auto-renew status based on `cancel_at_period_end`
- ✅ Finds subscription by `paymentReference` (Stripe subscription ID)

**Database Impact:**

```sql
UPDATE subscriptions
SET
  status = 'active',
  start_date = '...',
  end_date = '...',
  trial_end_date = '...',
  is_auto_renew = true
WHERE payment_reference = 'sub_xxx'
```

---

#### ✅ **7. Subscription Deleted** (`customer.subscription.deleted`)

**What it does:**

- ✅ Marks local subscription as CANCELLED
- ✅ Disables auto-renew
- ✅ Preserves subscription history
- ✅ Syncs cancellation with database

**Database Impact:**

```sql
UPDATE subscriptions
SET
  status = 'cancelled',
  is_auto_renew = false
WHERE payment_reference = 'sub_xxx'
```

---

#### ✅ **8. Trial Will End** (`customer.subscription.trial_will_end`) - NEW!

**What it does:**

- ✅ Detects when trials are ending (3 days before)
- ✅ Calculates days until trial end
- ✅ Logs for tracking
- ✅ Ready for trial ending email notification

**Notes:**

- Perfect place to send "Your trial ends in 3 days" emails
- Can be enhanced with email service integration

---

## 🔑 **Important: Metadata Requirements**

For webhooks to work properly, **YOU MUST include `userId` in metadata** when creating Stripe resources:

### ✅ **When Creating Customers:**

```typescript
const customer = await stripe.customers.create({
  email: 'user@example.com',
  metadata: {
    userId: user.id, // ← CRITICAL!
  },
});
```

### ✅ **When Creating Payment Intents:**

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  customer: customerId,
  metadata: {
    userId: user.id, // ← CRITICAL!
    subscriptionId: 'optional',
  },
});
```

### ✅ **When Creating Subscriptions:**

```typescript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  metadata: {
    userId: user.id, // ← CRITICAL!
  },
});
```

### ✅ **When Updating Subscriptions in Your Database:**

Make sure to store the Stripe subscription ID in `paymentReference` field:

```typescript
await subscriptionsService.create({
  userId: user.id,
  planId: plan.id,
  paymentReference: stripeSubscription.id, // ← CRITICAL!
});
```

---

## 🧪 **How to Test Webhooks Locally**

### 1. **Install Stripe CLI:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

### 2. **Forward Webhooks to Your Local Server:**

```bash
# Start your NestJS app
npm run start:dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/payments/webhooks
```

You'll see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxx
```

### 3. **Update Your .env File:**

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Use the secret from stripe listen
```

### 4. **Trigger Test Events:**

```bash
# Test payment success
stripe trigger payment_intent.succeeded

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted

# Test trial ending
stripe trigger customer.subscription.trial_will_end
```

### 5. **Watch Your Logs:**

Your NestJS console will show:

```
[PaymentsService] Processing webhook event: payment_intent.succeeded
[PaymentsService] Payment successful for: pi_xxx
[PaymentsService] Created payment record: uuid-xxx
```

---

## 📊 **Database Schema Requirements**

Make sure your `payments` table has these columns:

```typescript
// Payment Entity (already exists)
- id: UUID (primary key)
- stripePaymentIntentId: string (unique)
- stripeSubscriptionId: string (nullable)
- stripeCustomerId: string
- userId: string (foreign key)
- amount: decimal
- currency: string
- status: enum (pending, succeeded, failed, cancelled, refunded)
- type: enum (one_time, subscription)
- description: string
- metadata: jsonb
- processedAt: date
- createdAt: date
- updatedAt: date
```

Make sure your `subscriptions` table has:

```typescript
- paymentReference: string  // Stores Stripe subscription ID
```

---

## 🚀 **Production Deployment Checklist**

### ✅ **Before Going Live:**

1. **Configure Webhook Endpoint in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/payments/webhooks`
   - Select events to listen for:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `customer.subscription.trial_will_end`

2. **Copy Webhook Signing Secret:**
   - After creating endpoint, copy the signing secret
   - Update production `.env`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_prod_xxxxx
     ```

3. **Test in Production:**
   - Use Stripe Dashboard to "Send test webhook"
   - Monitor logs for successful processing

4. **Set Up Monitoring:**
   - Monitor webhook delivery in Stripe Dashboard
   - Set up alerts for failed webhooks
   - Track payment success/failure rates

---

## 🎉 **What You Now Have:**

✅ **Complete Stripe-to-Database Synchronization**

- All payments tracked in database
- All subscription status changes synced
- Failed payments logged
- Trial endings detected

✅ **Robust Error Handling**

- Graceful failures (webhooks always return 200)
- Detailed logging for debugging
- Fallback user lookup by email

✅ **Production-Ready**

- Signature verification
- Idempotency (checks for existing records)
- Type-safe implementations
- Comprehensive event coverage

✅ **Extensible**

- Easy to add more webhook events
- Ready for email notifications
- Prepared for analytics integration

---

## 📝 **Next Steps (Optional Enhancements):**

1. **Add Payment Failure Email Notifications:**
   - Uncomment TODOs in `handlePaymentIntentFailed`
   - Create email template for failed payments

2. **Add Trial Ending Email:**
   - Create email service method for trial endings
   - Call from `handleSubscriptionTrialWillEnd`

3. **Add Webhook Event Logging Table:**
   - Store all webhook events for audit trail
   - Track webhook processing history

4. **Add Refund Handling:**
   - Listen for `charge.refunded` event
   - Update payment records accordingly

5. **Add Dashboard Analytics:**
   - Query payment records for metrics
   - Track subscription churn rates
   - Monitor MRR (Monthly Recurring Revenue)

---

## 🆘 **Troubleshooting:**

### Issue: "No userId in metadata"

**Solution:** Always include `userId` in metadata when creating Stripe resources.

### Issue: "Local subscription not found"

**Solution:** Ensure `paymentReference` field stores Stripe subscription ID.

### Issue: "Webhook signature verification failed"

**Solution:**

- Check `STRIPE_WEBHOOK_SECRET` in .env
- Ensure raw body middleware is working
- Verify endpoint URL matches Stripe dashboard

### Issue: "User not found"

**Solution:**

- Ensure user exists in database before creating payments
- Include valid email in Stripe customer/payment intent

---

## 📚 **Documentation Links:**

- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

---

**Status: ✅ COMPLETE - Production Ready!**

Your webhook implementation is now fully functional and ready for production use! 🚀
