import { Suspense } from "react";
import MasukForm from "./masuk-form";

export const metadata = { title: "Masuk — AngkaSara" };

export default function MasukPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense>
        <MasukForm />
      </Suspense>
    </main>
  );
}
