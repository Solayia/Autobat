-- CreateTable
CREATE TABLE IF NOT EXISTS "ChantierMessage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChantierMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChantierMessage" ADD CONSTRAINT "ChantierMessage_chantier_id_fkey"
    FOREIGN KEY ("chantier_id") REFERENCES "Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChantierMessage" ADD CONSTRAINT "ChantierMessage_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS "ChantierMessage_chantier_id_idx" ON "ChantierMessage"("chantier_id");
CREATE INDEX IF NOT EXISTS "ChantierMessage_tenant_id_idx" ON "ChantierMessage"("tenant_id");
