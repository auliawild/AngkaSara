-- CreateTable
CREATE TABLE "Jurusan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tingkat" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "rombel" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "Kelas_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "Jurusan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nisn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GURU',
    "authUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PracticeActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "kelasLabel" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "wpm" INTEGER,
    "stars" INTEGER,
    "points" INTEGER,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckpointResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "kelasLabel" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "numerasi" INTEGER NOT NULL,
    "literasi" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "benarNum" INTEGER NOT NULL,
    "totalNum" INTEGER NOT NULL,
    "benarLit" INTEGER NOT NULL,
    "totalLit" INTEGER NOT NULL,
    "durasiDetik" INTEGER NOT NULL,
    "waktuHabis" BOOLEAN NOT NULL DEFAULT false,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    CONSTRAINT "CheckpointResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingPassage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CHECKPOINT',
    "aktif" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ReadingQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passageId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "q" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    CONSTRAINT "ReadingQuestion_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "ReadingPassage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurusan_kode_key" ON "Jurusan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_label_key" ON "Kelas"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_tingkat_jurusanId_rombel_key" ON "Kelas"("tingkat", "jurusanId", "rombel");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nisn_key" ON "Student"("nisn");

-- CreateIndex
CREATE INDEX "Student_kelasId_idx" ON "Student"("kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_authUserId_key" ON "Staff"("authUserId");

-- CreateIndex
CREATE INDEX "PracticeActivity_studentId_createdAt_idx" ON "PracticeActivity"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeActivity_kelasLabel_createdAt_idx" ON "PracticeActivity"("kelasLabel", "createdAt");

-- CreateIndex
CREATE INDEX "CheckpointResult_kelasLabel_period_idx" ON "CheckpointResult"("kelasLabel", "period");

-- CreateIndex
CREATE UNIQUE INDEX "CheckpointResult_studentId_period_key" ON "CheckpointResult"("studentId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingPassage_kode_key" ON "ReadingPassage"("kode");

-- CreateIndex
CREATE INDEX "ReadingQuestion_passageId_idx" ON "ReadingQuestion"("passageId");
