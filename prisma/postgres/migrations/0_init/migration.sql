-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Jurusan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "rombel" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "nisn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GURU',
    "nip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeActivity" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointResult" (
    "id" TEXT NOT NULL,
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
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "CheckpointResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibaTopicState" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "maxUnlocked" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 0,
    "recLevel" INTEGER NOT NULL DEFAULT 1,
    "progress" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkibaTopicState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibaProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "diagAttempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkibaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibacaPassage" (
    "id" TEXT NOT NULL,
    "jurusanKode" TEXT NOT NULL,
    "jurusanFull" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'kuis',
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,

    CONSTRAINT "SkibacaPassage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibacaQuestion" (
    "id" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "q" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,

    CONSTRAINT "SkibacaQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibacaProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "wpm" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkibacaProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibacaSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkibacaSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkibacaDiagnostic" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "jurusanKode" TEXT NOT NULL,
    "recommended" INTEGER NOT NULL,
    "scores" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkibacaDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingPassage" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CHECKPOINT',
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReadingPassage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingQuestion" (
    "id" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "q" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,

    CONSTRAINT "ReadingQuestion_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_nip_key" ON "user"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "PracticeActivity_studentId_createdAt_idx" ON "PracticeActivity"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeActivity_kelasLabel_createdAt_idx" ON "PracticeActivity"("kelasLabel", "createdAt");

-- CreateIndex
CREATE INDEX "CheckpointResult_kelasLabel_period_idx" ON "CheckpointResult"("kelasLabel", "period");

-- CreateIndex
CREATE UNIQUE INDEX "CheckpointResult_studentId_period_key" ON "CheckpointResult"("studentId", "period");

-- CreateIndex
CREATE INDEX "SkibaTopicState_studentId_idx" ON "SkibaTopicState"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibaTopicState_studentId_topicId_key" ON "SkibaTopicState"("studentId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibaProfile_studentId_key" ON "SkibaProfile"("studentId");

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

-- CreateIndex
CREATE INDEX "SkibacaSummary_studentId_idx" ON "SkibacaSummary"("studentId");

-- CreateIndex
CREATE INDEX "SkibacaSummary_gradedAt_idx" ON "SkibacaSummary"("gradedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkibacaSummary_studentId_passageId_key" ON "SkibacaSummary"("studentId", "passageId");

-- CreateIndex
CREATE INDEX "SkibacaDiagnostic_studentId_idx" ON "SkibacaDiagnostic"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibacaDiagnostic_studentId_jurusanKode_key" ON "SkibacaDiagnostic"("studentId", "jurusanKode");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingPassage_kode_key" ON "ReadingPassage"("kode");

-- CreateIndex
CREATE INDEX "ReadingQuestion_passageId_idx" ON "ReadingQuestion"("passageId");

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "Jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeActivity" ADD CONSTRAINT "PracticeActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointResult" ADD CONSTRAINT "CheckpointResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibaTopicState" ADD CONSTRAINT "SkibaTopicState_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibaProfile" ADD CONSTRAINT "SkibaProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibacaQuestion" ADD CONSTRAINT "SkibacaQuestion_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "SkibacaPassage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibacaProgress" ADD CONSTRAINT "SkibacaProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibacaProgress" ADD CONSTRAINT "SkibacaProgress_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "SkibacaPassage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibacaSummary" ADD CONSTRAINT "SkibacaSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibacaSummary" ADD CONSTRAINT "SkibacaSummary_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "SkibacaPassage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkibacaDiagnostic" ADD CONSTRAINT "SkibacaDiagnostic_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingQuestion" ADD CONSTRAINT "ReadingQuestion_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "ReadingPassage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

