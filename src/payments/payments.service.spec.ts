import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { BillingsService } from '../billings/billings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';
import { Payment } from './entities/payment.entity';
import { Currency } from './dto/create-payment-intent.dto';
import { PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';

// Mock Stripe constructor
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    prices: {
      create: jest.fn(),
      list: jest.fn(),
    },
    paymentMethods: {
      attach: jest.fn(),
      list: jest.fn(),
    },
    invoices: {
      retrieve: jest.fn(),
      list: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let billingsService: BillingsService;
  let mockStripe: any;

  const mockBillingsService = {
    processPaymentReceipt: jest.fn().mockResolvedValue(undefined),
    processPaymentFailure: jest.fn().mockResolvedValue(undefined),
  };

  const mockSubscriptionsService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockUsersService = {
    findUserById: jest.fn(),
  };

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPinoLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: `PinoLogger:PaymentsService`,
          useValue: mockPinoLogger,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: BillingsService,
          useValue: mockBillingsService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: 'STRIPE_CONFIG',
          useValue: {
            secretKey: 'sk_test_12345',
            apiVersion: '2023-10-16',
            webhookSecret: 'whsec_test123',
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    billingsService = module.get<BillingsService>(BillingsService);

    // Get the mocked Stripe instance
    mockStripe = (Stripe as jest.MockedClass<typeof Stripe>).mock.results[0]
      .value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const customerDto = {
        email: 'test@example.com',
        name: 'Test Customer',
        phone: '+1234567890',
        metadata: { userId: '123' },
      };

      const mockCustomer = {
        id: 'cus_test123',
        email: customerDto.email,
        name: customerDto.name,
        phone: customerDto.phone,
        metadata: customerDto.metadata,
      };

      mockStripe.customers.create.mockResolvedValueOnce(mockCustomer);

      const result = await service.createCustomer(customerDto);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: customerDto.email,
        name: customerDto.name,
        phone: customerDto.phone,
        metadata: customerDto.metadata,
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should handle customer creation errors', async () => {
      const customerDto = {
        email: 'test@example.com',
        name: 'Test Customer',
      };

      mockStripe.customers.create.mockRejectedValueOnce(
        new Error('Invalid email'),
      );

      await expect(service.createCustomer(customerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const paymentIntentDto = {
        amount: 2999,
        currency: Currency.USD,
        customerId: 'cus_test123',
        description: 'Test payment',
        metadata: { orderId: '456' },
      };

      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: paymentIntentDto.amount,
        currency: paymentIntentDto.currency,
        customer: paymentIntentDto.customerId,
        description: paymentIntentDto.description,
        metadata: paymentIntentDto.metadata,
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);

      const result = await service.createPaymentIntent(paymentIntentDto);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: paymentIntentDto.amount,
        currency: paymentIntentDto.currency,
        customer: paymentIntentDto.customerId,
        description: paymentIntentDto.description,
        automatic_payment_methods: { enabled: true },
        metadata: paymentIntentDto.metadata,
      });
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should handle payment intent creation errors', async () => {
      const paymentIntentDto = {
        amount: 2999,
        currency: Currency.USD,
      };

      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Error('Insufficient funds'),
      );

      await expect(
        service.createPaymentIntent(paymentIntentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const subscriptionDto = {
        customerId: 'cus_test123',
        priceId: 'price_test456',
        paymentMethodId: 'pm_test789',
        metadata: { planName: 'Premium' },
      };

      const mockSubscription = {
        id: 'sub_test123',
        customer: subscriptionDto.customerId,
        items: {
          data: [{ price: { id: subscriptionDto.priceId } }],
        },
        default_payment_method: subscriptionDto.paymentMethodId,
        metadata: subscriptionDto.metadata,
      };

      mockStripe.subscriptions.create.mockResolvedValueOnce(mockSubscription);

      const result = await service.createSubscription(subscriptionDto);

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: subscriptionDto.customerId,
        items: [{ price: subscriptionDto.priceId }],
        default_payment_method: subscriptionDto.paymentMethodId,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: subscriptionDto.metadata,
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should handle subscription creation errors', async () => {
      const subscriptionDto = {
        customerId: 'cus_test123',
        priceId: 'invalid_price',
      };

      mockStripe.subscriptions.create.mockRejectedValueOnce(
        new Error('Invalid price'),
      );

      await expect(service.createSubscription(subscriptionDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('processWebhookEvent', () => {
    const mockWebhookPayload = 'webhook_payload';
    const mockWebhookSignature = 'webhook_signature';

    it('should process invoice.payment_succeeded event', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            amount_paid: 2999,
            status: 'paid',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const result = await service.processWebhookEvent(
        mockWebhookPayload,
        mockWebhookSignature,
      );

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockWebhookPayload,
        mockWebhookSignature,
        'whsec_test123',
        undefined,
      );
      expect(billingsService.processPaymentReceipt).toHaveBeenCalledWith(
        mockEvent.data.object,
      );
      expect(result).toEqual({ received: true });
    });

    it('should process invoice.payment_failed event', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test456',
            customer: 'cus_test123',
            attempt_count: 2,
            status: 'open',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const result = await service.processWebhookEvent(
        mockWebhookPayload,
        mockWebhookSignature,
      );

      expect(billingsService.processPaymentFailure).toHaveBeenCalledWith(
        mockEvent.data.object,
      );
      expect(result).toEqual({ received: true });
    });

    it('should handle webhook processing errors', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.processWebhookEvent(mockWebhookPayload, mockWebhookSignature),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCustomer', () => {
    it('should retrieve a customer successfully', async () => {
      const customerId = 'cus_test123';
      const mockCustomer = {
        id: customerId,
        email: 'test@example.com',
        name: 'Test Customer',
      };

      mockStripe.customers.retrieve.mockResolvedValueOnce(mockCustomer);

      const result = await service.getCustomer(customerId);

      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith(customerId);
      expect(result).toEqual(mockCustomer);
    });

    it('should handle customer not found', async () => {
      const customerId = 'cus_invalid';

      mockStripe.customers.retrieve.mockRejectedValueOnce(
        new Error('Customer not found'),
      );

      await expect(service.getCustomer(customerId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listPrices', () => {
    it('should list active prices successfully', async () => {
      const mockPrices = {
        data: [
          {
            id: 'price_test123',
            unit_amount: 2999,
            currency: Currency.USD,
            recurring: { interval: 'month' },
            product: { name: 'Premium Plan' },
          },
        ],
      };

      mockStripe.prices.list.mockResolvedValueOnce(mockPrices);

      const result = await service.listPrices();

      expect(mockStripe.prices.list).toHaveBeenCalledWith({
        active: true,
        expand: ['data.product'],
      });
      expect(result).toEqual(mockPrices);
    });

    it('should handle price listing errors', async () => {
      mockStripe.prices.list.mockRejectedValueOnce(
        new Error('API connection failed'),
      );

      await expect(service.listPrices()).rejects.toThrow(BadRequestException);
    });
  });
});
