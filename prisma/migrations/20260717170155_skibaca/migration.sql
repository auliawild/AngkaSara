-- CreateTable
CREATE TABLE "SkibacaPassage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jurusanKode" TEXT NOT NULL,
    "jurusanFull" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SkibacaQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passageId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "q" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    CONSTRAINT "SkibacaQuestion_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "SkibacaPassage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkibacaProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "wpm" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkibacaProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkibacaProgress_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "SkibacaPassage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SkibacaPassage_jurusanKode_level_idx" ON "SkibacaPassage"("jurusanKode", "level");

-- CreateIndex
CREATE UNIQUE INDEX "SkibacaPassage_jurusanKode_level_urutan_key" ON "SkibacaPassage"("jurusanKode", "level", "urutan");

-- CreateIndex
CREATE INDEX "SkibacaQuestion_passageId_idx" ON "SkibacaQuestion"("passageId");

-- CreateIndex
CREATE INDEX "SkibacaProgress_studentId_idx" ON "SkibacaProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibacaProgress_studentId_passageId_key" ON "SkibacaProgress"("studentId", "passageId");
