"use client";

import { useEffect } from "react";

/**
 * Mengirim detak kehadiran ke /api/hadir saat halaman siswa dibuka lalu tiap 60 dtk,
 * juga saat tab kembali terlihat. Dipakai guru untuk status online di Pantauan.
 * Diam-diam (tak menampilkan apa pun, gagal pun tak mengganggu siswa).
 */
export default function HeartbeatSiswa() {
  useEffect(() => {
    let henti = false;
    const ping = () => {
      if (henti) return;
      // keepalive agar tetap terkirim saat pindah halaman.
      fetch("/api/hadir", { method: "POST", keepalive: true }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      henti = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
