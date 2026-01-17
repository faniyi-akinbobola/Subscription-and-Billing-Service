import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(IdempotencyInterceptor.name)
    private readonly logger: PinoLogger,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const idempotencyKey = request.headers['idempotency-key'];

    // Skip if no idempotency key provided
    if (!idempotencyKey) {
      return next.handle();
    }

    // Validate idempotency key format (should be a UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      throw new ConflictException(
        'Invalid Idempotency-Key format. Must be a valid UUID.',
      );
    }

    const userId = request.user?.id || null;
    const method = request.method;
    const path = request.path;

    this.logger.info(`Checking idempotency key: ${idempotencyKey}`);

    // Check if this key has been used before
    const existingKey = await this.idempotencyRepo.findOne({
      where: { key: idempotencyKey },
    });

    if (existingKey) {
      // Check if key has expired
      if (new Date() > existingKey.expiresAt) {
        this.logger.warn(
          `Expired idempotency key used: ${idempotencyKey}`,
        );
        // Delete expired key
        await this.idempotencyRepo.delete({ key: idempotencyKey });
      } else {
        // Return cached response
        this.logger.info(
          `Returning cached response for idempotency key: ${idempotencyKey}`,
        );
        response.status(existingKey.statusCode);
        return of(JSON.parse(existingKey.response));
      }
    }

    // Process the request and cache the response
    return next.handle().pipe(
      tap(async (data) => {
        try {
          const statusCode = response.statusCode;
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

          await this.idempotencyRepo.save({
            key: idempotencyKey,
            userId,
            response: JSON.stringify(data),
            statusCode,
            method,
            path,
            expiresAt,
          });

          this.logger.info(
            `Cached response for idempotency key: ${idempotencyKey}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to cache idempotency key: ${idempotencyKey}`,
            error,
          );
        }
      }),
    );
  }
}
