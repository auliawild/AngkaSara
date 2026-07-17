# AngkaSara

Aplikasi Literasi & Numerasi SMK Negeri 1 Badegan — versi web (Next.js + PostgreSQL),
migrasi dari aplikasi HTML lama (`D:\LitNum`). Data terpusat, deploy via Docker ke VPS.

Modul: **SKIBA Math** (numerasi) · **SKIBACA** (literasi) · **Check Point** (ujian bulanan) ·
**Evaluasi** (dashboard guru lintas kelas).

## Dokumentasi

- **`CLAUDE.md`** — orientasi repo, stack, perintah, arsitektur, gotcha. Baca duluan.
- **`progress.md`** — posisi pengerjaan terkini.
- **`buglog.md`** — error & solusinya.
- **`plans/`** — rencana per fase + `schema.md` (skema DB).

## Mulai cepat

Butuh Node.js 24 LTS + Docker Desktop. Lihat `CLAUDE.md` → Setup.

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev
npm run seed
npm run dev        # http://localhost:3000
```

Status: **Phase 1 (backbone) — dalam pengerjaan.**
