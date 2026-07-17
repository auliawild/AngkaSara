-- CreateTable
CREATE TABLE "SkibacaDiagnostic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "jurusanKode" TEXT NOT NULL,
    "recommended" INTEGER NOT NULL,
    "scores" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkibacaDiagnostic_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SkibacaDiagnostic_studentId_idx" ON "SkibacaDiagnostic"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibacaDiagnostic_studentId_jurusanKode_key" ON "SkibacaDiagnostic"("studentId", "jurusanKode");
