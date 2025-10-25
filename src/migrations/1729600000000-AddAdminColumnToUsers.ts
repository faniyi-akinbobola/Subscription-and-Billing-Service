import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdminColumnToUsers1729600000000 implements MigrationInterface {
  name = 'AddAdminColumnToUsers1729600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'admin',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'admin');
  }
}
