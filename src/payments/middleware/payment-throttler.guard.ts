import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class PaymentThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track rate limits by user ID for authenticated requests
    return req.user?.id || req.ip;
  }

  protected async shouldSkip(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Skip rate limiting for webhooks (Stripe needs reliable delivery)
    if (request.url === '/payments/webhooks') {
      return true;
    }

    return false;
  }
}
