-- CreateTable
CREATE TABLE "SkibacaSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "gradedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkibacaSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkibacaSummary_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "SkibacaPassage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SkibacaPassage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jurusanKode" TEXT NOT NULL,
    "jurusanFull" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'kuis',
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL
);
INSERT INTO "new_SkibacaPassage" ("icon", "id", "jurusanFull", "jurusanKode", "level", "text", "title", "urutan", "wordCount") SELECT "icon", "id", "jurusanFull", "jurusanKode", "level", "text", "title", "urutan", "wordCount" FROM "SkibacaPassage";
DROP TABLE "SkibacaPassage";
ALTER TABLE "new_SkibacaPassage" RENAME TO "SkibacaPassage";
CREATE INDEX "SkibacaPassage_jurusanKode_level_idx" ON "SkibacaPassage"("jurusanKode", "level");
CREATE UNIQUE INDEX "SkibacaPassage_jurusanKode_level_urutan_key" ON "SkibacaPassage"("jurusanKode", "level", "urutan");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SkibacaSummary_studentId_idx" ON "SkibacaSummary"("studentId");

-- CreateIndex
CREATE INDEX "SkibacaSummary_gradedAt_idx" ON "SkibacaSummary"("gradedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkibacaSummary_studentId_passageId_key" ON "SkibacaSummary"("studentId", "passageId");
