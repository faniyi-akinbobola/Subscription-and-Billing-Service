import { Test, TestingModule } from '@nestjs/testing';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';
import { EmailService } from '../email/email.service';

describe('BillingsController', () => {
  let controller: BillingsController;
  let billingsService: BillingsService;
  let emailService: EmailService;

  // Mock services
  const mockBillingsService = {
    getBillingHistory: jest.fn().mockResolvedValue([]),
  };

  const mockEmailService = {
    sendReceiptEmail: jest.fn().mockResolvedValue(undefined),
    sendRenewalReminderEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingsController],
      providers: [
        {
          provide: BillingsService,
          useValue: mockBillingsService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<BillingsController>(BillingsController);
    billingsService = module.get<BillingsService>(BillingsService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBillingHistory', () => {
    it('should return billing history for a customer', async () => {
      const customerId = 'cus_test123';
      const result = await controller.getBillingHistory(customerId);

      expect(billingsService.getBillingHistory).toHaveBeenCalledWith(
        customerId,
      );
      expect(result).toEqual([]);
    });
  });

  describe('testReceiptEmail', () => {
    it('should send test receipt email with provided data', async () => {
      const testData = {
        email: 'test@example.com',
        name: 'Test Customer',
        invoiceNumber: 'TEST-001',
        amount: 2999,
        currency: 'usd',
        planName: 'Premium Plan',
      };

      const result = await controller.testReceiptEmail(testData);

      expect(emailService.sendReceiptEmail).toHaveBeenCalledWith({
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        invoiceNumber: 'TEST-001',
        amount: 2999,
        currency: 'usd',
        paidAt: expect.any(Date),
        planName: 'Premium Plan',
        period: {
          start: expect.any(Date),
          end: expect.any(Date),
        },
        pdfUrl: null,
      });

      expect(result).toEqual({
        message: 'Receipt email sent successfully',
        sentTo: 'test@example.com',
      });
    });

    it('should use default values when test data is incomplete', async () => {
      const testData = {};

      const result = await controller.testReceiptEmail(testData);

      expect(emailService.sendReceiptEmail).toHaveBeenCalledWith({
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        invoiceNumber: 'TEST-001',
        amount: 2999,
        currency: 'usd',
        paidAt: expect.any(Date),
        planName: 'Premium Monthly Plan',
        period: {
          start: expect.any(Date),
          end: expect.any(Date),
        },
        pdfUrl: null,
      });

      expect(result).toEqual({
        message: 'Receipt email sent successfully',
        sentTo: 'test@example.com',
      });
    });
  });

  describe('testRenewalReminderEmail', () => {
    it('should send test renewal reminder email', async () => {
      const testData = {
        email: 'test@example.com',
        name: 'Test Customer',
        planName: 'Premium Plan',
        amount: 2999,
        currency: 'usd',
        subscriptionId: 'sub_test123',
      };

      const result = await controller.testRenewalReminderEmail(testData);

      expect(emailService.sendRenewalReminderEmail).toHaveBeenCalledWith({
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        planName: 'Premium Plan',
        amount: 2999,
        currency: 'usd',
        renewalDate: expect.any(Date),
        daysUntilRenewal: 3,
        subscriptionId: 'sub_test123',
      });

      expect(result).toEqual({
        message: 'Renewal reminder email sent successfully',
        sentTo: 'test@example.com',
      });
    });

    it('should use default values when test data is incomplete', async () => {
      const testData = {};

      const result = await controller.testRenewalReminderEmail(testData);

      expect(emailService.sendRenewalReminderEmail).toHaveBeenCalledWith({
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        planName: 'Premium Monthly Plan',
        amount: 2999,
        currency: 'usd',
        renewalDate: expect.any(Date),
        daysUntilRenewal: 3,
        subscriptionId: 'sub_test_123',
      });

      expect(result).toEqual({
        message: 'Renewal reminder email sent successfully',
        sentTo: 'test@example.com',
      });
    });
  });
});
