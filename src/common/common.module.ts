import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';

/**
 * Common Module
 * 
 * Provides shared services used across the application:
 * - CircuitBreakerService: Protection against cascading failures
 * 
 * Marked as @Global() so circuit breakers can be used anywhere without importing
 */
@Global()
@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CommonModule {}
