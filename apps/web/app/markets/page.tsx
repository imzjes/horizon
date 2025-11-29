import Link from "next/link";
import {
  DEMO_MARKETS,
  DEMO_CATEGORIES,
  formatTimeAgo
} from "../../../packages/shared/src/demo-data";

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">
              Markets
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Demo markets powered by static data. Connect this view to your
              on‑chain contracts when ready.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/10"
          >
            Create market
          </Link>
        </header>

        <div className="mb-8 flex flex-wrap gap-2 text-xs">
          {DEMO_CATEGORIES.map((cat) => (
            <span
              key={cat.name}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-gray-300"
            >
              {cat.name} · {cat.count}
            </span>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {DEMO_MARKETS.map((m) => (
            <article
              key={m.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
                <span>{m.category}</span>
                <span>Created {formatTimeAgo(m.createdAt)}</span>
              </div>
              <h2 className="mb-2 text-lg font-medium">{m.title}</h2>
              <p className="mb-4 line-clamp-2 text-sm text-gray-300">
                {m.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-300">
                <div>
                  <div className="text-[0.7rem] uppercase text-gray-400">
                    Liquidity
                  </div>
                  <div>${Number(m.liquidityUsd) / 1e6}</div>
                </div>
                <div className="text-right">
                  <div className="text-[0.7rem] uppercase text-gray-400">
                    Status
                  </div>
                  <div className="capitalize">{m.status}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}


