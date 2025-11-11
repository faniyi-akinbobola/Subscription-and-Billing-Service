# 🔄 Stripe Payment Testing Workflow

## 📋 **Prerequisites**

- ✅ Docker containers running (`subscription-service`, `postgres`, `redis`)
- ✅ Stripe API keys configured in `.env`
- ✅ Postman or VS Code REST Client extension

## 🚀 **Complete Testing Workflow**

### **Phase 1: Authentication Setup**

#### 1.1 Create Test User (if needed)

```http
POST http://localhost:3000/auth/signup
Content-Type: application/json

{
    "email": "stripe.test@example.com",
    "password": "password123"
}
```

#### 1.2 Sign In & Get JWT Token

```http
POST http://localhost:3000/auth/signin
Content-Type: application/json

{
    "email": "stripe.test@example.com",
    "password": "password123"
}
```

**📝 Copy the `access_token` from response - you'll need it for all subsequent requests!**

---

### **Phase 2: Customer Management**

#### 2.1 Create Stripe Customer

```http
POST http://localhost:3000/payments/customers
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "email": "customer@test.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "metadata": {
        "userId": "user_123"
    }
}
```

**📝 Save the `customer.id` (starts with `cus_`) for later use**

#### 2.2 Retrieve Customer Details

```http
GET http://localhost:3000/payments/customers/cus_CUSTOMER_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### **Phase 3: Payment Intent Testing (Custom Payments)**

#### 3.1 Create Payment Intent (Simple)

```http
POST http://localhost:3000/payments/payment-intents
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "amount": 2999,
    "currency": "usd",
    "description": "Premium subscription payment"
}
```

#### 3.2 Create Payment Intent with Customer

```http
POST http://localhost:3000/payments/payment-intents
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "amount": 4999,
    "currency": "usd",
    "customerId": "cus_CUSTOMER_ID",
    "description": "Enterprise plan upgrade",
    "metadata": {
        "upgrade": true,
        "previousPlan": "premium"
    }
}
```

**📝 Save the `payment_intent.id` and `client_secret` from response**

#### 3.3 Get Payment Intent Details

```http
GET http://localhost:3000/payments/payment-intents/pi_PAYMENT_INTENT_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 3.4 Confirm Payment Intent (with test card)

```http
POST http://localhost:3000/payments/payment-intents/pi_PAYMENT_INTENT_ID/confirm
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "paymentMethodId": "pm_card_visa"
}
```

---

### **Phase 4: Checkout Session Testing (Hosted Payments)**

#### 4.1 Create Checkout Session

```http
POST http://localhost:3000/payments/checkout-sessions
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "amount": 2999,
    "currency": "usd",
    "description": "Premium subscription payment",
    "success_url": "http://localhost:3000/payments/return?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "http://localhost:3000/payments/cancel"
}
```

**📝 Copy the `url` from response and visit it to complete payment flow**

#### 4.2 Create Checkout Session with Customer

```http
POST http://localhost:3000/payments/checkout-sessions
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "amount": 4999,
    "currency": "usd",
    "customerId": "cus_CUSTOMER_ID",
    "description": "Enterprise plan upgrade",
    "success_url": "http://localhost:3000/payments/return?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "http://localhost:3000/payments/cancel"
}
```

---

### **Phase 5: Subscription Management**

#### 5.1 Create Subscription

```http
POST http://localhost:3000/payments/subscriptions
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "customerId": "cus_CUSTOMER_ID",
    "priceId": "price_1SRqdjK94x7YK47vBd68Roog",
    "metadata": {
        "planType": "premium",
        "userId": "user_123"
    }
}
```

#### 5.2 Get Subscription Details

```http
GET http://localhost:3000/payments/subscriptions/sub_SUBSCRIPTION_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 5.3 Update Subscription (Change Plan)

```http
PATCH http://localhost:3000/payments/subscriptions/sub_SUBSCRIPTION_ID
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "priceId": "price_1SRuDQK94x7YK47vU92przPL"
}
```

#### 5.4 Cancel Subscription

```http
DELETE http://localhost:3000/payments/subscriptions/sub_SUBSCRIPTION_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### **Phase 6: Payment Method Management**

#### 6.1 Create Setup Intent (for saving cards)

```http
POST http://localhost:3000/payments/setup-intents
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "customerId": "cus_CUSTOMER_ID",
    "usage": "off_session"
}
```

#### 6.2 List Customer Payment Methods

```http
GET http://localhost:3000/payments/customers/cus_CUSTOMER_ID/payment-methods
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 6.3 Attach Payment Method to Customer

```http
POST http://localhost:3000/payments/payment-methods/pm_PAYMENT_METHOD_ID/attach
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "customerId": "cus_CUSTOMER_ID"
}
```

---

### **Phase 7: Invoice Management**

#### 7.1 Get Invoice Details

```http
GET http://localhost:3000/payments/invoices/in_INVOICE_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 7.2 List Customer Invoices

```http
GET http://localhost:3000/payments/invoices?customerId=cus_CUSTOMER_ID&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### **Phase 8: Price Creation (Admin Only)**

#### 8.1 Create Product Price

```http
POST http://localhost:3000/payments/prices
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
    "productId": "prod_TOdv9NzFEatCWS",
    "unitAmount": 4999,
    "currency": "usd",
    "recurring": {
        "interval": "month"
    },
    "nickname": "Enterprise Monthly Plan"
}
```

---

### **Phase 9: Webhook Testing**

#### 9.1 Test Return URL Handler

```http
GET http://localhost:3000/payments/return?session_id=cs_test_SESSION_ID&payment_intent=pi_PAYMENT_INTENT_ID
```

#### 9.2 Webhook Endpoint (for Stripe to call)

```http
POST http://localhost:3000/payments/webhooks
Content-Type: application/json
stripe-signature: STRIPE_SIGNATURE_HEADER

{
    "type": "customer.created",
    "data": {
        "object": {
            "id": "cus_test"
        }
    }
}
```

---

## 🧪 **Test Card Numbers**

### Successful Cards

- **Visa**: `4242424242424242`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`

### Failed Cards (for error testing)

- **Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Processing Error**: `4000000000000119`

### 3D Secure Cards (for authentication testing)

- **3D Secure Required**: `4000002500003155`
- **3D Secure Optional**: `4000002760003184`

---

## 🔍 **Expected Response Patterns**

### ✅ Success Response Pattern

```json
{
  "id": "pi_3SRwImK94x7YK47v13sDmqsS",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "requires_payment_method",
  "client_secret": "pi_3SRwImK94x7YK47v13sDmqsS_secret_..."
}
```

### ❌ Error Response Pattern

```json
{
  "message": "Customer not found: cus_invalid_id",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 📊 **Testing Checklist**

### Authentication ✅

- [ ] User signup works
- [ ] User signin returns valid JWT
- [ ] JWT token authenticates requests

### Customer Management ✅

- [ ] Create customer
- [ ] Retrieve customer details
- [ ] Customer validation errors

### Payment Intents ✅

- [ ] Create payment intent (simple)
- [ ] Create payment intent with customer
- [ ] Get payment intent details
- [ ] Confirm payment intent
- [ ] Handle payment failures

### Checkout Sessions ✅

- [ ] Create checkout session
- [ ] Redirect to Stripe hosted page
- [ ] Handle success/cancel URLs

### Subscriptions ✅

- [ ] Create subscription
- [ ] Update subscription plan
- [ ] Cancel subscription
- [ ] Handle subscription webhooks

### Error Handling ✅

- [ ] Invalid customer ID
- [ ] Invalid price ID
- [ ] Network timeouts
- [ ] Stripe API errors

---

## 🚨 **Common Issues & Solutions**

### "Unauthorized" (401)

- ❌ **Problem**: Expired or invalid JWT token
- ✅ **Solution**: Re-authenticate with `/auth/signin`

### "No such customer" (400)

- ❌ **Problem**: Invalid customer ID
- ✅ **Solution**: Use valid `cus_` prefixed customer ID

### "No such price" (400)

- ❌ **Problem**: Invalid or non-existent price ID
- ✅ **Solution**: Use valid `price_` prefixed price ID from Stripe dashboard

### "Webhook timestamp too old" (400)

- ❌ **Problem**: Fixed in latest version
- ✅ **Solution**: Already resolved by removing strict timestamp validation

---

## 📁 **Quick Reference Files**

- **Full HTTP Tests**: `stripe-payments.http`
- **Environment Variables**: `.env`
- **Docker Logs**: `docker logs subscription-service`
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 🎯 **Pro Testing Tips**

1. **Use Variables**: Save customer IDs, payment intent IDs in variables for reuse
2. **Test in Order**: Follow the workflow sequence for best results
3. **Check Logs**: Monitor `docker logs subscription-service` for errors
4. **Stripe Dashboard**: Verify events in Stripe dashboard
5. **Real Cards**: Use Stripe test cards for realistic testing
6. **Error Cases**: Test failure scenarios (declined cards, invalid IDs)
7. **Webhook Testing**: Use Stripe CLI for webhook testing
8. **Performance**: Test rate limiting and throttling
