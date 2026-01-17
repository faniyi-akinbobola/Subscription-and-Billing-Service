import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
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
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Module({
  imports: [
    ConfigModule,
    PassportModule, // Import PassportModule for JWT authentication
    TypeOrmModule.forFeature([Payment, IdempotencyKey]),
    BillingsModule,
    SubscriptionsModule,
    UsersModule,
    // ThrottlerModule removed - now configured globally in AppModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, stripeConfig, IdempotencyInterceptor],
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
