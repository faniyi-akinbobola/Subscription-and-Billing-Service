import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebhookVerificationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only apply to webhook endpoint
    if (req.originalUrl === '/payments/webhooks' && req.method === 'POST') {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        throw new BadRequestException('Missing Stripe signature header');
      }

      // Validate signature format
      if (!signature.includes('t=') || !signature.includes('v1=')) {
        throw new BadRequestException('Invalid Stripe signature format');
      }

      // Let Stripe handle timestamp validation internally
      // Custom timestamp validation removed for development flexibility
    }

    next();
  }
}
