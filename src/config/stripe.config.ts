import { ConfigService } from '@nestjs/config';

export const stripeConfig = {
  provide: 'STRIPE_CONFIG',
  useFactory: async (configService: ConfigService) => ({
    secretKey: configService.get<string>('STRIPE_SECRET_KEY'),
    publishableKey: configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: configService.get<string>('STRIPE_WEBHOOK_SECRET'),
    apiVersion: '2023-10-16' as const,
  }),
  inject: [ConfigService],
};
