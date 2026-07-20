"use client";

export default function CetakTombol({ label = "🖨️ Cetak Raport" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      {label}
    </button>
  );
}
