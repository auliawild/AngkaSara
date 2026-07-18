-- AlterTable
ALTER TABLE "user" ADD COLUMN "nip" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_nip_key" ON "user"("nip");
