import Link from "next/link";

export default function CreateMarketPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <header className="mb-8">
          <h1 className="text-3xl font-light tracking-tight sm:text-4xl">
            Create market
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            This is a placeholder create flow. In your full app, wire this view
            to your on‑chain contracts and shared form components.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="mb-4 text-sm text-gray-300">
            For now, use this deployment as a polished marketing/demo surface.
            When you&apos;re ready, we can port the full creation form from
            your original project into this route.
          </p>
          <Link
            href="/markets"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/10"
          >
            Back to demo markets
          </Link>
        </section>
      </div>
    </main>
  );
}


