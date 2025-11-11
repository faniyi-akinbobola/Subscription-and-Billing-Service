# 📧 Billing System Testing Workflow

This guide walks you through testing the complete billing system with email automation.

## 🔧 Prerequisites

### 1. Email Configuration (Optional for Testing)

Update your `.env` file with email credentials:

```bash
# Gmail Configuration (recommended for testing)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password  # Not regular password!
EMAIL_FROM=noreply@yourcompany.com

# Alternative: SendGrid (for production)
# SENDGRID_API_KEY=your_sendgrid_api_key
```

**Note**: For Gmail, you need to:

- Enable 2FA on your Google account
- Generate an "App Password" for the application
- Use the App Password, not your regular Gmail password

### 2. System Status Check

```bash
# Verify the application is running
docker logs subscription-service --tail=10

# You should see:
# [Nest] Nest application successfully started
# BillingsController routes mapped
```

## 🧪 Testing Workflow

### Step 1: Test Basic Billing Routes

#### A. Get Billing History (Customer Data)

```http
GET http://localhost:3000/billings/history/cus_TOe08WknF9Gv9N
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Expected**: Empty array `[]` (since we're just starting)

### Step 2: Test Email Templates

#### B. Test Receipt Email

```http
POST http://localhost:3000/billings/test/receipt
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

{
  "email": "your_test_email@example.com",
  "name": "John Doe",
  "invoiceNumber": "TEST-RECEIPT-001",
  "amount": 2999,
  "currency": "usd",
  "planName": "Premium Monthly Plan"
}
```

**Expected Response**:

```json
{
  "message": "Receipt email sent successfully",
  "sentTo": "your_test_email@example.com"
}
```

**Check**:

- Application logs: `docker logs subscription-service -f`
- Look for: `Receipt email sent to your_test_email@example.com`
- If email configured: Check your email inbox

#### C. Test Renewal Reminder Email

```http
POST http://localhost:3000/billings/test/renewal-reminder
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

{
  "email": "your_test_email@example.com",
  "name": "Jane Smith",
  "planName": "Enterprise Annual Plan",
  "amount": 9999,
  "currency": "usd",
  "subscriptionId": "sub_test_renewal_reminder"
}
```

**Expected Response**:

```json
{
  "message": "Renewal reminder email sent successfully",
  "sentTo": "your_test_email@example.com"
}
```

### Step 3: Test Real Integration (Webhook Automation)

#### D. Create a Real Payment to Trigger Receipt Email

Use the existing Stripe integration to create a payment:

1. **Create Customer** (if you haven't already):

```http
POST http://localhost:3000/payments/customers
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

{
  "email": "billing.test@example.com",
  "name": "Billing Test Customer"
}
```

2. **Create Subscription** (this triggers invoice creation):

```http
POST http://localhost:3000/payments/subscriptions
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

{
  "customerId": "cus_from_step_above",
  "priceId": "price_1SRp5YK94x7YK47vOjpBkTGw"
}
```

3. **Trigger Webhook** (if Stripe CLI is running):

```bash
# In your stripe terminal:
stripe trigger invoice.payment_succeeded
```

**Expected**:

- Automatic receipt email sent to customer
- Billing record logged
- Check logs: `docker logs subscription-service -f`

### Step 4: Test Error Handling

#### E. Test Invalid Email Format

```http
POST http://localhost:3000/billings/test/receipt
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiUiMTIzNDU2Nzg5MCIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

{
  "email": "invalid-email-format"
}
```

**Expected**: Error response or logged error in application logs

#### F. Test Missing Authorization

```http
POST http://localhost:3000/billings/test/receipt
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Expected**: `401 Unauthorized` response

## 🔍 Debugging & Monitoring

### Real-time Log Monitoring

```bash
# Watch application logs for email activity
docker logs subscription-service -f | grep -i "email\|receipt\|reminder"

# Watch for billing activity
docker logs subscription-service -f | grep -i "billing\|invoice"

# Watch for scheduler activity (cron jobs)
docker logs subscription-service -f | grep -i "renewal\|schedule\|cron"
```

### Common Log Messages to Look For:

```
✅ Good Messages:
- "Receipt email sent to user@example.com for invoice inv_123"
- "Renewal reminder sent to user@example.com for subscription sub_123"
- "Starting daily renewal reminder check..."
- "Billing Record: {...}"

❌ Error Messages:
- "Failed to send receipt email to user@example.com:"
- "No email found for customer cus_123, skipping receipt"
- "Webhook processing failed:"
```

## 📊 Advanced Testing

### Scheduler Testing (Cron Jobs)

The system runs automated tasks:

1. **Daily Renewal Checks** (9:00 AM):

   ```
   # Check logs around 9 AM for:
   "Starting daily renewal reminder check..."
   ```

2. **Failed Payment Checks** (Hourly 9-5 weekdays):

   ```
   # Check logs during business hours for:
   "Checking for failed payments..."
   ```

3. **Weekly Billing Summary** (Monday 8 AM):
   ```
   # Check logs Monday mornings for:
   "Weekly Summary: - Total Revenue: $..."
   ```

### Load Testing

Test with multiple concurrent requests:

```bash
# Use curl for rapid testing:
for i in {1..5}; do
  curl -X POST http://localhost:3000/billings/test/receipt \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
    -d '{"email":"test'$i'@example.com","name":"Test User '$i'"}' &
done
wait
```

## ✅ Success Criteria

Your billing system is working correctly when:

1. ✅ All API endpoints return expected responses
2. ✅ Email logs show successful sending
3. ✅ No compilation or runtime errors in logs
4. ✅ Webhook integration triggers automatic emails
5. ✅ Scheduler jobs run without errors
6. ✅ Error handling works for invalid inputs

## 🚀 Production Readiness Checklist

Before going live:

- [ ] Configure production email service (SendGrid/AWS SES)
- [ ] Update email templates with your branding
- [ ] Set up proper error monitoring
- [ ] Configure database storage for billing records
- [ ] Test with real Stripe production webhooks
- [ ] Set up email delivery monitoring
- [ ] Configure proper logging levels

---

**Happy Testing!** 🧪📧✨
