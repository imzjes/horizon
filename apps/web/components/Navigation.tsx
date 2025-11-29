import Link from "next/link";

export function Navigation() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/40" />
          <span className="text-sm font-medium tracking-[0.22em] uppercase text-gray-200">
            Horizon
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-gray-300">
          <Link
            href="/markets"
            className="transition-colors hover:text-white"
          >
            Markets
          </Link>
          <Link
            href="/create"
            className="transition-colors hover:text-white"
          >
            Create
          </Link>
          <Link
            href="/creator"
            className="hidden rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:bg-white/10 sm:inline-flex"
          >
            Creator Console
          </Link>
        </nav>
      </div>
    </header>
  );
}


