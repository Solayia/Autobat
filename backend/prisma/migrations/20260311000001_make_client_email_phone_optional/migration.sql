-- AlterTable: make email and telephone optional on Client
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "telephone" DROP NOT NULL;
