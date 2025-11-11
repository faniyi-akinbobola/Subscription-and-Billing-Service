import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePlansTable1762600941555 implements MigrationInterface {
    name = 'UpdatePlansTable1762600941555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('pending', 'trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_billingcycle_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, "renewedAt" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "planChangedAt" TIMESTAMP WITH TIME ZONE, "trialEndDate" TIMESTAMP WITH TIME ZONE, "isTrialPeriod" boolean NOT NULL DEFAULT false, "isAutoRenew" boolean NOT NULL DEFAULT true, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'pending', "billingCycle" "public"."subscriptions_billingcycle_enum" NOT NULL DEFAULT 'monthly', "subscribedPrice" numeric(10,2), "paymentReference" character varying, "nextBillingDate" TIMESTAMP WITH TIME ZONE, "gracePeriodEndDate" TIMESTAMP WITH TIME ZONE, "renewalCount" integer NOT NULL DEFAULT '0', "cancellationReason" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "planId" uuid, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f2a37d226c4f58242548e53c6b" ON "subscriptions" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_5e1e595231be6134ac7b1ae653" ON "subscriptions" ("status", "endDate") `);
        await queryRunner.query(`CREATE TYPE "public"."plans_billingcycle_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly')`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "billingCycle" "public"."plans_billingcycle_enum" NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "trialPeriodDays" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "trialPeriodDays"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "billingCycle"`);
        await queryRunner.query(`DROP TYPE "public"."plans_billingcycle_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e1e595231be6134ac7b1ae653"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2a37d226c4f58242548e53c6b"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_billingcycle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    }

}
