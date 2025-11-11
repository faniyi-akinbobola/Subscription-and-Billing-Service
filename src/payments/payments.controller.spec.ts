import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentThrottlerGuard } from './middleware/payment-throttler.guard';
import { Currency } from './dto/create-payment-intent.dto';
import { ThrottlerModule } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    createCustomer: jest.fn(),
    getCustomer: jest.fn(),
    createPaymentIntent: jest.fn(),
    confirmPaymentIntent: jest.fn(),
    getPaymentIntent: jest.fn(),
    createSubscription: jest.fn(),
    getSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    createPrice: jest.fn(),
    listPrices: jest.fn(),
    attachPaymentMethod: jest.fn(),
    listPaymentMethods: jest.fn(),
    getInvoice: jest.fn(),
    listInvoices: jest.fn(),
    processWebhookEvent: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPaymentThrottlerGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PaymentThrottlerGuard)
      .useValue(mockPaymentThrottlerGuard)
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const createCustomerDto = {
        email: 'test@example.com',
        name: 'Test Customer',
        phone: '+1234567890',
      };

      const mockCustomer = {
        id: 'cus_test123',
        email: createCustomerDto.email,
        name: createCustomerDto.name,
        phone: createCustomerDto.phone,
      };

      mockPaymentsService.createCustomer.mockResolvedValueOnce(mockCustomer);

      const result = await controller.createCustomer(createCustomerDto);

      expect(paymentsService.createCustomer).toHaveBeenCalledWith(
        createCustomerDto,
      );
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('getCustomer', () => {
    it('should get a customer by ID', async () => {
      const customerId = 'cus_test123';
      const mockCustomer = {
        id: customerId,
        email: 'test@example.com',
        name: 'Test Customer',
      };

      mockPaymentsService.getCustomer.mockResolvedValueOnce(mockCustomer);

      const result = await controller.getCustomer(customerId);

      expect(paymentsService.getCustomer).toHaveBeenCalledWith(customerId);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const createPaymentIntentDto = {
        amount: 2999,
        currency: Currency.USD,
        customerId: 'cus_test123',
        description: 'Test payment',
      };

      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency,
        customer: createPaymentIntentDto.customerId,
        description: createPaymentIntentDto.description,
      };

      mockPaymentsService.createPaymentIntent.mockResolvedValueOnce(
        mockPaymentIntent,
      );

      const result = await controller.createPaymentIntent(
        createPaymentIntentDto,
      );

      expect(paymentsService.createPaymentIntent).toHaveBeenCalledWith(
        createPaymentIntentDto,
      );
      expect(result).toEqual(mockPaymentIntent);
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const createSubscriptionDto = {
        customerId: 'cus_test123',
        priceId: 'price_test456',
        paymentMethodId: 'pm_test789',
        metadata: { planName: 'Premium' },
      };

      const mockSubscription = {
        id: 'sub_test123',
        customer: createSubscriptionDto.customerId,
        items: {
          data: [{ price: { id: createSubscriptionDto.priceId } }],
        },
        default_payment_method: createSubscriptionDto.paymentMethodId,
        metadata: createSubscriptionDto.metadata,
      };

      mockPaymentsService.createSubscription.mockResolvedValueOnce(
        mockSubscription,
      );

      const result = await controller.createSubscription(createSubscriptionDto);

      expect(paymentsService.createSubscription).toHaveBeenCalledWith(
        createSubscriptionDto,
      );
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription', async () => {
      const subscriptionId = 'sub_test123';
      const newPriceId = 'price_new456';

      const mockUpdatedSubscription = {
        id: subscriptionId,
        items: {
          data: [{ price: { id: newPriceId } }],
        },
      };

      mockPaymentsService.updateSubscription.mockResolvedValueOnce(
        mockUpdatedSubscription,
      );

      const result = await controller.updateSubscription(
        subscriptionId,
        newPriceId,
      );

      expect(paymentsService.updateSubscription).toHaveBeenCalledWith(
        subscriptionId,
        newPriceId,
      );
      expect(result).toEqual(mockUpdatedSubscription);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      const subscriptionId = 'sub_test123';

      const mockCancelledSubscription = {
        id: subscriptionId,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      };

      mockPaymentsService.cancelSubscription.mockResolvedValueOnce(
        mockCancelledSubscription,
      );

      const result = await controller.cancelSubscription(subscriptionId);

      expect(paymentsService.cancelSubscription).toHaveBeenCalledWith(
        subscriptionId,
      );
      expect(result).toEqual(mockCancelledSubscription);
    });
  });

  describe('createPrice', () => {
    it('should create a price', async () => {
      const priceData = {
        amount: 2999,
        currency: Currency.USD,
        interval: 'month' as const,
        productId: 'prod_test123',
      };

      const mockPrice = {
        id: 'price_test456',
        unit_amount: priceData.amount,
        currency: priceData.currency,
        recurring: { interval: priceData.interval },
        product: priceData.productId,
      };

      mockPaymentsService.createPrice.mockResolvedValueOnce(mockPrice);

      const result = await controller.createPrice(priceData);

      expect(paymentsService.createPrice).toHaveBeenCalledWith(
        priceData.amount,
        priceData.currency,
        priceData.interval,
        priceData.productId,
      );
      expect(result).toEqual(mockPrice);
    });
  });

  describe('listPrices', () => {
    it('should list prices', async () => {
      const mockPrices = {
        data: [
          {
            id: 'price_test123',
            unit_amount: 2999,
            currency: Currency.USD,
            recurring: { interval: 'month' },
            product: { name: 'Premium Plan' },
          },
          {
            id: 'price_test456',
            unit_amount: 9999,
            currency: Currency.USD,
            recurring: { interval: 'year' },
            product: { name: 'Premium Plan Annual' },
          },
        ],
      };

      mockPaymentsService.listPrices.mockResolvedValueOnce(mockPrices);

      const result = await controller.listPrices();

      expect(paymentsService.listPrices).toHaveBeenCalled();
      expect(result).toEqual(mockPrices);
    });
  });

  describe('attachPaymentMethod', () => {
    it('should attach a payment method to a customer', async () => {
      const paymentMethodId = 'pm_test123';
      const customerId = 'cus_test456';

      const mockPaymentMethod = {
        id: paymentMethodId,
        customer: customerId,
        type: 'card',
      };

      mockPaymentsService.attachPaymentMethod.mockResolvedValueOnce(
        mockPaymentMethod,
      );

      const result = await controller.attachPaymentMethod(
        paymentMethodId,
        customerId,
      );

      expect(paymentsService.attachPaymentMethod).toHaveBeenCalledWith(
        paymentMethodId,
        customerId,
      );
      expect(result).toEqual(mockPaymentMethod);
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook events', async () => {
      const mockRequest = {
        rawBody: Buffer.from('webhook_payload'),
      } as any;
      const stripeSignature = 'whsec_test_signature';

      const mockWebhookResponse = { received: true };

      mockPaymentsService.processWebhookEvent.mockResolvedValueOnce(
        mockWebhookResponse,
      );

      const result = await controller.handleWebhook(
        mockRequest,
        stripeSignature,
      );

      expect(paymentsService.processWebhookEvent).toHaveBeenCalledWith(
        'webhook_payload',
        stripeSignature,
      );
      expect(result).toEqual(mockWebhookResponse);
    });

    it('should handle webhook with no rawBody', async () => {
      const mockRequest = {} as any;
      const stripeSignature = 'whsec_test_signature';

      const mockWebhookResponse = { received: true };

      mockPaymentsService.processWebhookEvent.mockResolvedValueOnce(
        mockWebhookResponse,
      );

      const result = await controller.handleWebhook(
        mockRequest,
        stripeSignature,
      );

      expect(paymentsService.processWebhookEvent).toHaveBeenCalledWith(
        '',
        stripeSignature,
      );
      expect(result).toEqual(mockWebhookResponse);
    });
  });
});
