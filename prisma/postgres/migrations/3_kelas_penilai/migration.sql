-- CreateTable
CREATE TABLE "_PenilaiKelas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PenilaiKelas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PenilaiKelas_B_index" ON "_PenilaiKelas"("B");

-- AddForeignKey
ALTER TABLE "_PenilaiKelas" ADD CONSTRAINT "_PenilaiKelas_A_fkey" FOREIGN KEY ("A") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenilaiKelas" ADD CONSTRAINT "_PenilaiKelas_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
