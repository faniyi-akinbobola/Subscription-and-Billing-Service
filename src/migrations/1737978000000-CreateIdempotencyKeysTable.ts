import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateIdempotencyKeysTable1737978000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'idempotency_keys',
        columns: [
          {
            name: 'key',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'response',
            type: 'text',
          },
          {
            name: 'statusCode',
            type: 'int',
          },
          {
            name: 'method',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'path',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
        ],
      }),
      true,
    );

    // Create index for cleanup queries
    await queryRunner.createIndex(
      'idempotency_keys',
      new TableIndex({
        name: 'IDX_idempotency_keys_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    // Create index for expiration cleanup
    await queryRunner.createIndex(
      'idempotency_keys',
      new TableIndex({
        name: 'IDX_idempotency_keys_expiresAt',
        columnNames: ['expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('idempotency_keys');
  }
}
