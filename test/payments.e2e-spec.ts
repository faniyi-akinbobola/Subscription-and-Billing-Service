import request from 'supertest';

describe('Payments (e2e)', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let userId: string;
  let customerId: string;
  let paymentIntentId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    // Create and authenticate a user
    const signup = await request(baseUrl)
      .post('/auth/signup')
      .send({
        email: `payment-test-${Date.now()}@example.com`,
        password: 'PaymentTest123!',
        firstName: 'Payment',
        lastName: 'Tester',
      });
    userId = signup.body.user.id;

    const signin = await request(baseUrl).post('/auth/signin').send({
      email: signup.body.user.email,
      password: 'PaymentTest123!',
    });
    authToken = signin.body.access_token;
  });

  describe('/payments/customers (POST)', () => {
    it('should create a Stripe customer', () => {
      return request(baseUrl)
        .post('/payments/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: `customer-${Date.now()}@example.com`,
          name: 'Test Customer',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toMatch(/^cus_/);
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name', 'Test Customer');
          customerId = res.body.id; // Save for later tests
        });
    });

    it('should fail without authentication', () => {
      return request(baseUrl)
        .post('/payments/customers')
        .send({
          email: `test-${Date.now()}@example.com`,
          name: 'Test',
        })
        .expect(401);
    });

    it('should fail with invalid email', () => {
      return request(baseUrl)
        .post('/payments/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'not-an-email',
          name: 'Test',
        })
        .expect(400);
    });
  });

  describe('/payments/customers/:customerId (GET)', () => {
    it('should get customer by id', () => {
      return request(baseUrl)
        .get(`/payments/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', customerId);
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
        });
    });

    it('should fail without authentication', () => {
      return request(baseUrl)
        .get(`/payments/customers/${customerId}`)
        .expect(401);
    });

    it('should fail with non-existent customer id', () => {
      return request(baseUrl)
        .get('/payments/customers/cus_nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Stripe returns 400 for invalid/non-existent resource IDs
    });
  });

  describe('/payments/payment-intents (POST)', () => {
    it('should create a payment intent', () => {
      return request(baseUrl)
        .post('/payments/payment-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000, // $10.00
          currency: 'usd',
          customerId: customerId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toMatch(/^pi_/);
          expect(res.body).toHaveProperty('amount', 1000);
          expect(res.body).toHaveProperty('currency', 'usd');
          expect(res.body).toHaveProperty('status');
          paymentIntentId = res.body.id; // Save for later tests
        });
    });

    it('should fail without authentication', () => {
      return request(baseUrl)
        .post('/payments/payment-intents')
        .send({
          amount: 1000,
          currency: 'usd',
        })
        .expect(401);
    });

    it('should fail with invalid amount', () => {
      return request(baseUrl)
        .post('/payments/payment-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100, // Negative amount
          currency: 'usd',
        })
        .expect(400);
    });

    it('should fail with invalid currency', () => {
      return request(baseUrl)
        .post('/payments/payment-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          currency: 'invalid',
        })
        .expect(400);
    });
  });

  describe('/payments/payment-intents/:id (GET)', () => {
    it('should get payment intent by id', () => {
      return request(baseUrl)
        .get(`/payments/payment-intents/${paymentIntentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', paymentIntentId);
          expect(res.body).toHaveProperty('amount');
          expect(res.body).toHaveProperty('currency');
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should fail without authentication', () => {
      return request(baseUrl)
        .get(`/payments/payment-intents/${paymentIntentId}`)
        .expect(401);
    });

    it('should fail with non-existent payment intent id', () => {
      return request(baseUrl)
        .get('/payments/payment-intents/pi_nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Stripe returns 400 for invalid/non-existent resource IDs
    });
  });

  describe('/payments/prices (POST and GET)', () => {
    let testPriceId: string;

    it('should create a price', () => {
      return request(baseUrl)
        .post('/payments/prices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1999, // $19.99
          currency: 'usd',
          interval: 'month',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toMatch(/^price_/);
          expect(res.body).toHaveProperty('unit_amount', 1999);
          expect(res.body).toHaveProperty('currency', 'usd');
          expect(res.body.recurring).toHaveProperty('interval', 'month');
          testPriceId = res.body.id;
        });
    });

    it('should list all prices', () => {
      return request(baseUrl)
        .get('/payments/prices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          // Check if our created price is in the list
          const createdPrice = res.body.data.find(
            (p: any) => p.id === testPriceId,
          );
          expect(createdPrice).toBeDefined();
        });
    });

    it('should fail to create price without authentication', () => {
      return request(baseUrl)
        .post('/payments/prices')
        .send({
          amount: 1999,
          currency: 'usd',
          interval: 'month',
        })
        .expect(401);
    });

    // Move checkout session tests here to use the created price
    describe('Checkout Sessions using created price', () => {
      it('should create a checkout session', () => {
        return request(baseUrl)
          .post('/payments/checkout-sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 1999, // $19.99
            currency: 'usd',
            customerId: customerId,
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
            description: 'Test payment',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.id).toMatch(/^cs_/);
            expect(res.body).toHaveProperty('url');
            expect(res.body.url).toContain('checkout.stripe.com');
          });
      });

      it('should fail without authentication', () => {
        return request(baseUrl)
          .post('/payments/checkout-sessions')
          .send({
            amount: 1999,
            currency: 'usd',
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
          })
          .expect(401);
      });
    });
  });

  describe('/payments/subscriptions (Stripe Subscriptions)', () => {
    it.skip('should create a Stripe subscription - SKIPPED: Requires valid payment method', () => {
      // NOTE: Creating a subscription requires a valid payment method attached to the customer
      // This would require Stripe test cards and payment method setup
      return request(baseUrl)
        .post('/payments/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customerId,
          priceId: 'price_test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toMatch(/^sub_/);
          subscriptionId = res.body.id;
        });
    });

    it.skip('should get Stripe subscription by id - SKIPPED: Requires subscription creation', () => {
      return request(baseUrl)
        .get(`/payments/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', subscriptionId);
          expect(res.body).toHaveProperty('status');
        });
    });

    it.skip('should update Stripe subscription - SKIPPED: Requires subscription creation', () => {
      return request(baseUrl)
        .patch(`/payments/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_new_test',
        })
        .expect(200);
    });

    it.skip('should cancel Stripe subscription - SKIPPED: Requires subscription creation', () => {
      return request(baseUrl)
        .delete(`/payments/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'canceled');
        });
    });
  });

  describe('/payments/invoices', () => {
    it('should list all invoices', () => {
      return request(baseUrl)
        .get('/payments/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(baseUrl).get('/payments/invoices').expect(401);
    });
  });

  describe('/payments/return (GET)', () => {
    it('should handle payment return callback', () => {
      return request(baseUrl)
        .get('/payments/return')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('redirect');
        });
    });
  });

  describe('Authentication checks', () => {
    it('should enforce authentication on all payment endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/payments/customers' },
        { method: 'get', path: '/payments/customers/cus_test' },
        { method: 'post', path: '/payments/payment-intents' },
        { method: 'get', path: '/payments/payment-intents/pi_test' },
        { method: 'post', path: '/payments/checkout-sessions' },
        { method: 'get', path: '/payments/prices' },
        { method: 'get', path: '/payments/invoices' },
      ];

      for (const endpoint of endpoints) {
        const req = request(baseUrl)[endpoint.method](endpoint.path);
        if (endpoint.method === 'post') {
          req.send({});
        }
        await req.expect(401);
      }
    });
  });
});
