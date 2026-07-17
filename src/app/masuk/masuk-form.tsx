"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { masukSiswa } from "@/server/student-auth";
import { signIn } from "@/lib/auth-client";

type Tab = "siswa" | "staf";

export default function MasukForm() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next");
  const [tab, setTab] = useState<Tab>(params.get("tab") === "staf" ? "staf" : "siswa");

  return (
    <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">AngkaSara</h1>
        <p className="mt-1 text-sm text-zinc-500">Literasi &amp; Numerasi · SMKN 1 Badegan</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <TabBtn active={tab === "siswa"} onClick={() => setTab("siswa")}>
          Siswa
        </TabBtn>
        <TabBtn active={tab === "staf"} onClick={() => setTab("staf")}>
          Guru / Staf
        </TabBtn>
      </div>

      {tab === "siswa" ? (
        <SiswaForm next={next} router={router} />
      ) : (
        <StafForm next={next} router={router} />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md py-2 text-sm font-medium transition-colors " +
        (active ? "bg-white shadow-sm dark:bg-zinc-700" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

type FormProps = { next: string | null; router: ReturnType<typeof useRouter> };

function SiswaForm({ next, router }: FormProps) {
  const [nisn, setNisn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await masukSiswa(nisn);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal masuk.");
      return;
    }
    router.push(next && next.startsWith("/siswa") ? next : "/siswa");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="nisn">
        NISN
      </label>
      <input
        id="nisn"
        inputMode="numeric"
        autoComplete="off"
        value={nisn}
        onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
        placeholder="Masukkan NISN"
        className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-white/20"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || nisn.length < 4}
        className="mt-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Memeriksa…" : "Masuk sebagai Siswa"}
      </button>
      <p className="text-center text-xs text-zinc-400">Tanpa kata sandi — cukup NISN dari guru.</p>
    </form>
  );
}

function StafForm({ next, router }: FormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Email atau kata sandi salah.");
      return;
    }
    router.push(next && next.startsWith("/guru") ? next : "/guru");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@sekolah.sch.id"
        className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-white/20"
      />
      <label className="text-sm font-medium" htmlFor="password">
        Kata sandi
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-white/20"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !email || !password}
        className="mt-2 rounded-lg bg-zinc-900 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {loading ? "Masuk…" : "Masuk sebagai Staf"}
      </button>
    </form>
  );
}
