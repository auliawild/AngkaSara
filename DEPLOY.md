# Deploy AngkaSara (Produksi — PostgreSQL + Docker Compose)

Panduan menaikkan AngkaSara ke server/VPS. **Dev lokal tetap SQLite** (tanpa Docker);
produksi memakai **PostgreSQL** di dalam Docker. Perbedaan hanya di `DATABASE_URL` —
adapter Prisma dipilih otomatis dari skema URL (`postgres://` → Postgres, selain itu → SQLite).

## Arsitektur compose

`docker compose up` menjalankan tiga service berurutan:

1. **db** — PostgreSQL 17 (volume `pgdata`, tidak diekspos ke publik).
2. **migrate** — `prisma migrate deploy` (schema `prisma/postgres/`), lalu keluar.
3. **app** — server Next.js standalone di port `3000` (menunggu `migrate` selesai sukses).

Service **seed** (profil `seed`) dijalankan **sekali** untuk mengisi data awal.

Reverse proxy / HTTPS **tidak** termasuk (pilihan app-only) — atur sendiri (nginx,
Caddy, atau Cloudflare Tunnel) mengarah ke `http://127.0.0.1:3000`.

## Prasyarat server

- Docker Engine + Docker Compose plugin (v2.17+; butuh `service_completed_successfully`).
- Kode ter-clone: `git clone https://github.com/auliawild/AngkaSara.git && cd AngkaSara`.

## Langkah

```bash
# 1) Siapkan environment
cp .env.example .env
#    Edit .env — untuk PRODUKSI:
#    - KOMENTARI baris DATABASE_URL SQLite, aktifkan blok PostgreSQL.
#    - Set POSTGRES_PASSWORD & samakan di DATABASE_URL (host = db).
#    - Isi BETTER_AUTH_SECRET & STUDENT_SESSION_SECRET (openssl rand -base64 32).
#    - Set BETTER_AUTH_URL ke URL publik (mis. https://angkasara.sekolah.sch.id).
#    - Set ADMIN_PASSWORD yang kuat.

# 2) Build + jalankan (db → migrasi → app)
docker compose up -d --build

# 3) Isi data awal — SEKALI saja (idempoten, aman diulang)
docker compose run --rm seed
#    → 5 jurusan, 46 kelas, bank Check Point, 500 bacaan SKIBACA, 1 akun admin.

# 4) Cek
docker compose ps
docker compose logs -f app
# Buka http://<server>:3000  → login admin (email + ADMIN_PASSWORD).
```

Impor guru & siswa dilakukan dari UI admin (menu Kelola) memakai berkas Excel/CSV
(contoh ada di `contoh-impor/`).

## Operasional

```bash
docker compose logs -f app          # log aplikasi
docker compose restart app          # restart app
docker compose down                 # stop (data DB tetap di volume pgdata)
docker compose up -d --build        # deploy versi baru (migrasi jalan otomatis)
```

### Backup / restore database

```bash
# Backup
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
# Restore (ke DB kosong)
cat backup-YYYY-MM-DD.sql | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## Menambah/mengubah tabel (migrasi baru)

Model tetap ditulis di `prisma/schema.prisma` (dev, SQLite). Setelah mengubahnya:

```bash
# 1) Migrasi dev (SQLite) seperti biasa
npx prisma migrate dev --name <nama>

# 2) Sinkronkan schema Postgres dari schema dev
npm run db:pg:sync

# 3) Buat migrasi Postgres baru (offline, tanpa DB) ke folder migrasi berikutnya
#    Bandingkan schema LAMA (dari git, sebelum perubahan) dengan schema BARU.
git show <commit-sebelum-ubah>:prisma/postgres/schema.prisma > /tmp/pg-old.prisma
mkdir -p prisma/postgres/migrations/<n>_<nama>
npx prisma migrate diff \
  --from-schema /tmp/pg-old.prisma \
  --to-schema prisma/postgres/schema.prisma \
  --script --output prisma/postgres/migrations/<n>_<nama>/migration.sql
#    (penomoran urut setelah 0_init)

# 4) Verifikasi offline: hasil `--from-empty --to-schema` harus memuat objek yang sama
npx prisma migrate diff --from-empty --to-schema prisma/postgres/schema.prisma --script | less

# 5) Commit kedua set migrasi. `docker compose up -d --build` menerapkannya di produksi.
```

> ⚠️ **Jangan pakai `--from-migrations`** di laptop dev: opsi itu butuh **shadow database
> Postgres** yang tidak tersedia di sini, dan akan gagal. Diff **dua file schema**
> (`--from-schema` → `--to-schema`) murni offline dan itulah cara yang dipakai untuk
> migrasi `2_kelas_aktif` & `3_kelas_penilai`.
>
> ⚠️ **Jangan menyalin SQL migrasi dev (SQLite) ke folder Postgres** — bentuknya berbeda.
> Contoh nyata: relasi m2m implisit `_PenilaiKelas` memakai **`UNIQUE INDEX _AB_unique`**
> di SQLite tapi **`PRIMARY KEY _AB_pkey`** di Postgres; menambah kolom di SQLite
> menulis ulang seluruh tabel, di Postgres cukup `ALTER TABLE … ADD COLUMN`.

`prisma/postgres/schema.prisma` **dihasilkan** dari `prisma/schema.prisma` — jangan
edit manual (jalankan `npm run db:pg:sync`).

## Catatan

- **Verifikasi live belum dilakukan di mesin dev** (laptop ~4 GB RAM, tanpa Docker/Postgres).
  Build & boot compose perlu diuji sekali di server. Yang sudah diverifikasi offline:
  schema Postgres valid, SQL migrasi ter-generate (18 tabel), dev SQLite utuh (tsc + 117 tes).
- **Migrasi Postgres yang ada:** `0_init`, `1_skiba_diag_score`, `2_kelas_aktif`, `3_kelas_penilai`.
  Semuanya **belum pernah dijalankan terhadap Postgres sungguhan** — `migrate deploy` pertama di
  server adalah ujian nyatanya. Jalankan di DB kosong/kloningan dulu sebelum ke data produksi.
- Jangan ekspos port `5432` ke publik. Gunakan reverse proxy + HTTPS untuk port 3000.
- Ganti semua nilai contoh di `.env` sebelum produksi.
