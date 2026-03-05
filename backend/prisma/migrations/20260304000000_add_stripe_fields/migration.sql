-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3);
