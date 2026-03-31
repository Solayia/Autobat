-- Make Chantier address and GPS fields optional
ALTER TABLE "Chantier" ALTER COLUMN "adresse" DROP NOT NULL;
ALTER TABLE "Chantier" ALTER COLUMN "code_postal" DROP NOT NULL;
ALTER TABLE "Chantier" ALTER COLUMN "ville" DROP NOT NULL;
ALTER TABLE "Chantier" ALTER COLUMN "latitude" DROP NOT NULL;
ALTER TABLE "Chantier" ALTER COLUMN "longitude" DROP NOT NULL;
