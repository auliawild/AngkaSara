-- CreateTable
CREATE TABLE "SkibaTopicState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "maxUnlocked" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 0,
    "recLevel" INTEGER NOT NULL DEFAULT 1,
    "progress" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkibaTopicState_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkibaProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "diagAttempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkibaProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SkibaTopicState_studentId_idx" ON "SkibaTopicState"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibaTopicState_studentId_topicId_key" ON "SkibaTopicState"("studentId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "SkibaProfile_studentId_key" ON "SkibaProfile"("studentId");
