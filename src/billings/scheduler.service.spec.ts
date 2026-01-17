import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { BillingsService } from './billings.service';
import { PaymentsService } from '../payments/payments.service';
import { PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';

// Mock Stripe constructor
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      list: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'sub_test123',
            customer: {
              id: 'cus_test123',
              email: 'test@example.com',
              name: 'Test Customer',
            },
            current_period_end: Math.floor(
              (Date.now() + 3 * 24 * 60 * 60 * 1000) / 1000,
            ),
            items: {
              data: [
                {
                  price: {
                    unit_amount: 2999,
                    currency: 'usd',
                    nickname: 'Premium Plan',
                  },
                },
              ],
            },
          },
        ],
      }),
    },
    invoices: {
      list: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'in_test123',
            status: 'open',
            attempt_count: 1,
            amount_paid: 2999,
            created: Math.floor(Date.now() / 1000),
          },
          {
            id: 'in_test456',
            status: 'paid',
            attempt_count: 0,
            amount_paid: 1999,
            created: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    },
  }));
});

describe('SchedulerService', () => {
  let service: SchedulerService;
  let billingsService: BillingsService;
  let paymentsService: PaymentsService;

  // Mock services
  const mockBillingsService = {
    scheduleRenewalReminders: jest.fn().mockResolvedValue(undefined),
    processPaymentFailure: jest.fn().mockResolvedValue(undefined),
  };

  const mockPaymentsService = {
    // No need for stripe property since SchedulerService creates its own instance
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
        SchedulerService,
        {
          provide: `PinoLogger:SchedulerService`,
          useValue: mockPinoLogger,
        },
        {
          provide: BillingsService,
          useValue: mockBillingsService,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: 'STRIPE_CONFIG',
          useValue: {
            secretKey: 'sk_test_12345',
            apiVersion: '2023-10-16',
          },
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    billingsService = module.get<BillingsService>(BillingsService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkUpcomingRenewals', () => {
    it('should call billing service to schedule renewal reminders', async () => {
      await service.checkUpcomingRenewals();

      expect(billingsService.scheduleRenewalReminders).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('should handle errors gracefully', async () => {
      mockBillingsService.scheduleRenewalReminders.mockRejectedValueOnce(
        new Error('Test error'),
      );

      await expect(service.checkUpcomingRenewals()).resolves.not.toThrow();
    });
  });

  describe('checkFailedPayments', () => {
    it('should process failed invoices', async () => {
      const mockStripeInstance = (Stripe as jest.MockedClass<typeof Stripe>)
        .mock.results[0].value;

      await service.checkFailedPayments();

      expect(mockStripeInstance.invoices.list).toHaveBeenCalledWith({
        status: 'open',
        limit: 50,
        created: {
          gte: expect.any(Number),
        },
      });

      expect(billingsService.processPaymentFailure).toHaveBeenCalledWith({
        id: 'in_test123',
        status: 'open',
        attempt_count: 1,
        amount_paid: 2999,
        created: expect.any(Number),
      });
    });

    it('should skip invoices with no retry attempts', async () => {
      const mockStripeInstance = (Stripe as jest.MockedClass<typeof Stripe>)
        .mock.results[0].value;
      const mockInvoicesWithNoAttempts = {
        data: [
          {
            id: 'in_test789',
            status: 'open',
            attempt_count: 0,
            amount_paid: 0,
            created: Math.floor(Date.now() / 1000),
          },
        ],
      };

      mockStripeInstance.invoices.list.mockResolvedValueOnce(
        mockInvoicesWithNoAttempts,
      );

      await service.checkFailedPayments();

      expect(billingsService.processPaymentFailure).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockStripeInstance = (Stripe as jest.MockedClass<typeof Stripe>)
        .mock.results[0].value;
      mockStripeInstance.invoices.list.mockRejectedValueOnce(
        new Error('Stripe error'),
      );

      await expect(service.checkFailedPayments()).resolves.not.toThrow();
    });
  });

  describe('generateWeeklyBillingSummary', () => {
    it('should generate weekly summary from invoices', async () => {
      const mockStripeInstance = (Stripe as jest.MockedClass<typeof Stripe>)
        .mock.results[0].value;

      await service.generateWeeklyBillingSummary();

      expect(mockStripeInstance.invoices.list).toHaveBeenCalledWith({
        created: { gte: expect.any(Number) },
        limit: 100,
      });
    });

    it('should handle errors gracefully', async () => {
      const mockStripeInstance = (Stripe as jest.MockedClass<typeof Stripe>)
        .mock.results[0].value;
      mockStripeInstance.invoices.list.mockRejectedValueOnce(
        new Error('Stripe error'),
      );

      await expect(
        service.generateWeeklyBillingSummary(),
      ).resolves.not.toThrow();
    });
  });
});
