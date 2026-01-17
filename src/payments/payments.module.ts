import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BillingsModule } from '../billings/billings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { stripeConfig } from '../config/stripe.config';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { PaymentLoggingMiddleware } from './middleware/payment-logging.middleware';
import { PaymentCorsMiddleware } from './middleware/payment-cors.middleware';
import { WebhookVerificationMiddleware } from './middleware/webhook-verification.middleware';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule, // Import PassportModule for JWT authentication
    TypeOrmModule.forFeature([Payment]),
    BillingsModule,
    SubscriptionsModule,
    UsersModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute per user
      },
      {
        name: 'medium',
        ttl: 900000, // 15 minutes
        limit: 100, // 100 requests per 15 minutes
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, stripeConfig],
  exports: [PaymentsService],
})
export class PaymentsModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middlewares in specific order
    consumer
      .apply(PaymentCorsMiddleware)
      .forRoutes({ path: 'payments/*', method: RequestMethod.ALL });

    consumer
      .apply(PaymentLoggingMiddleware)
      .forRoutes({ path: 'payments/*', method: RequestMethod.ALL });

    consumer
      .apply(WebhookVerificationMiddleware)
      .forRoutes({ path: 'payments/webhooks', method: RequestMethod.POST });

    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({ path: 'payments/webhooks', method: RequestMethod.POST });
  }
}
