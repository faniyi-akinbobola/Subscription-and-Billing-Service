import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

/**
 * Circuit Breaker Service
 * 
 * Provides circuit breaker functionality to protect against cascading failures
 * when calling external services (Stripe API, Email SMTP, etc.)
 * 
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 * 
 * @example
 * ```typescript
 * const breaker = circuitBreakerService.createBreaker(
 *   async () => await stripe.customers.create(...),
 *   { timeout: 5000, errorThresholdPercentage: 50 }
 * );
 * const result = await breaker.fire();
 * ```
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Create or get a circuit breaker for a specific service
   * 
   * @param name - Unique identifier for the circuit breaker
   * @param action - The async function to protect with circuit breaker
   * @param options - Circuit breaker configuration options
   * @returns Configured circuit breaker instance
   */
  createBreaker<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    options?: CircuitBreaker.Options,
  ): CircuitBreaker<any[], T> {
    // Return existing breaker if already created
    if (this.breakers.has(name)) {
      return this.breakers.get(name) as CircuitBreaker<any[], T>;
    }

    // Default options optimized for external API calls
    const defaultOptions: CircuitBreaker.Options = {
      timeout: 10000, // 10 seconds timeout
      errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
      resetTimeout: 30000, // Try again after 30 seconds
      rollingCountTimeout: 10000, // 10 second rolling window
      rollingCountBuckets: 10, // 10 buckets in rolling window
      volumeThreshold: 5, // Minimum requests before opening circuit
      capacity: 10, // Max concurrent requests
      ...options,
    };

    const breaker = new CircuitBreaker(action, defaultOptions);

    // Event listeners for monitoring
    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker [${name}] opened - too many failures`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker [${name}] half-open - testing recovery`);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker [${name}] closed - service recovered`);
    });

    breaker.on('success', (result) => {
      this.logger.debug(`Circuit breaker [${name}] - successful call`);
    });

    breaker.on('failure', (error) => {
      this.logger.error(
        `Circuit breaker [${name}] - call failed: ${error.message}`,
      );
    });

    breaker.on('timeout', () => {
      this.logger.warn(`Circuit breaker [${name}] - call timed out`);
    });

    breaker.on('fallback', (result) => {
      this.logger.log(`Circuit breaker [${name}] - using fallback`);
    });

    breaker.on('reject', () => {
      this.logger.warn(
        `Circuit breaker [${name}] - request rejected (circuit open)`,
      );
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get an existing circuit breaker by name
   * 
   * @param name - Circuit breaker identifier
   * @returns Circuit breaker instance or undefined
   */
  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get stats for a specific circuit breaker
   * 
   * @param name - Circuit breaker identifier
   * @returns Circuit breaker statistics
   */
  getStats(name: string): CircuitBreaker.Stats | null {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.stats : null;
  }

  /**
   * Get stats for all circuit breakers
   * 
   * @returns Map of circuit breaker names to their statistics
   */
  getAllStats(): Map<string, CircuitBreaker.Stats> {
    const stats = new Map<string, CircuitBreaker.Stats>();
    this.breakers.forEach((breaker, name) => {
      stats.set(name, breaker.stats);
    });
    return stats;
  }

  /**
   * Reset a specific circuit breaker
   * 
   * @param name - Circuit breaker identifier
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.close();
      this.logger.log(`Circuit breaker [${name}] manually reset`);
    }
  }

  /**
   * Shutdown all circuit breakers
   */
  shutdown(): void {
    this.breakers.forEach((breaker, name) => {
      breaker.shutdown();
      this.logger.log(`Circuit breaker [${name}] shutdown`);
    });
    this.breakers.clear();
  }
}
