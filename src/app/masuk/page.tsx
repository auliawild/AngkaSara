import { Suspense } from "react";
import MasukForm from "./masuk-form";

export const metadata = { title: "Masuk — AngkaSara" };

export default function MasukPage() {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-12">
      {/* latar dekoratif */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="as-blob absolute -left-24 top-0 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-600/20" />
        <div className="as-blob absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-700/20" style={{ animationDelay: "4s" }} />
        <div className="as-blob absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-600/10" style={{ animationDelay: "7s" }} />
      </div>
      <Suspense>
        <MasukForm />
      </Suspense>
    </div>
  );
}
