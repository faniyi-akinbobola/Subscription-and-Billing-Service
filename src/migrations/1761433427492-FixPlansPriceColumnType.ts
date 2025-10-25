import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPlansPriceColumnType1761433427492
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change price column from integer to decimal(10,2) for proper monetary values
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "price" TYPE NUMERIC(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert price column back to integer
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "price" TYPE INTEGER`,
    );
  }
}
