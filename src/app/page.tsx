import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">AngkaSara</h1>
        <p className="mt-2 text-lg text-zinc-500">
          Portal Literasi &amp; Numerasi · SMK Negeri 1 Badegan
        </p>
      </div>
      <Link
        href="/masuk"
        className="rounded-full bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        Masuk
      </Link>
    </main>
  );
}
