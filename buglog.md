# Bug & Error Log — AngkaSara

> Catatan tiap error/bug yang ditemui selama pengembangan + cara mengatasinya.
> Format: **ID — Judul** · Gejala · Sebab · Solusi · Status. Entri terbaru di ATAS.

---

## BOOT-01 — Node.js / npm / Docker belum terpasang
- **Gejala:** `node -v`, `npm -v`, `docker -v` semua "NOT FOUND" di Bash maupun PowerShell; folder instalasi umum (`C:\Program Files\nodejs`, dll.) kosong.
- **Sebab:** Toolchain memang belum pernah dipasang di mesin ini.
- **Solusi (dijalankan user di terminal ADMIN):**
  ```powershell
  # PowerShell sebagai Administrator
  winget install -e --id OpenJS.NodeJS.LTS   --accept-source-agreements --accept-package-agreements
  winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
  ```
  Lalu **restart** (Docker Desktop butuh WSL2 + reboot), buka **Docker Desktop** sekali agar engine jalan.
  Verifikasi terminal baru: `node -v` (harus v24.x), `npm -v`, `docker -v`, `docker compose version`.
- **Catatan:** shell Claude tidak elevated, jadi instalasi tak bisa dari sini. WSL sudah ada di mesin.
- **Status:** ⛔ menunggu user.

---

<!-- Template entri baru:
## KODE-XX — Judul singkat
- **Gejala:**
- **Sebab:**
- **Solusi:**
- **Status:** ✅ solved / 🚧 workaround / ⛔ open
-->
