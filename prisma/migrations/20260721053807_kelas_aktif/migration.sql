-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tingkat" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "rombel" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Kelas_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "Jurusan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Kelas" ("id", "jurusanId", "label", "rombel", "tingkat") SELECT "id", "jurusanId", "label", "rombel", "tingkat" FROM "Kelas";
DROP TABLE "Kelas";
ALTER TABLE "new_Kelas" RENAME TO "Kelas";
CREATE UNIQUE INDEX "Kelas_label_key" ON "Kelas"("label");
CREATE UNIQUE INDEX "Kelas_tingkat_jurusanId_rombel_key" ON "Kelas"("tingkat", "jurusanId", "rombel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
