import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PaymentCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Special CORS handling for payment endpoints
    if (req.originalUrl.startsWith('/payments')) {
      // Allow Stripe webhook origins
      const allowedOrigins = [
        'https://js.stripe.com',
        'https://api.stripe.com',
        process.env.FRONTEND_URL || 'http://localhost:3000',
      ];

      const origin = req.headers.origin as string;

      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      res.header(
        'Access-Control-Allow-Methods',
        'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, stripe-signature',
      );
      res.header('Access-Control-Allow-Credentials', 'true');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
    }

    next();
  }
}
