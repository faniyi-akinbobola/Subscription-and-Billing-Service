import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlansTable1761432922114 implements MigrationInterface {
    name = 'CreatePlansTable1761432922114'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "price" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "plans"`);
    }

}
