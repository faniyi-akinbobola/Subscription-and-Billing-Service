import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PaymentLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PaymentLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';

    // Log all payment-related requests
    if (originalUrl.startsWith('/payments')) {
      const start = Date.now();

      // Log request
      this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);

      // Log response
      res.on('finish', () => {
        const { statusCode } = res;
        const duration = Date.now() - start;

        this.logger.log(
          `${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );

        // Log errors for failed payments
        if (statusCode >= 400) {
          this.logger.error(
            `Payment request failed: ${method} ${originalUrl} - Status: ${statusCode}`,
          );
        }
      });
    }

    next();
  }
}
