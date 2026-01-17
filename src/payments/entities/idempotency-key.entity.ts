import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('idempotency_keys')
@Index(['userId', 'createdAt']) // For cleanup queries
export class IdempotencyKey {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string;

  @Column({ type: 'text' })
  response: string; // Serialized JSON response

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'varchar', length: 50 })
  method: string; // POST, PATCH, etc.

  @Column({ type: 'varchar', length: 500 })
  path: string; // /payments/payment-intents

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date; // Keys expire after 24 hours
}
