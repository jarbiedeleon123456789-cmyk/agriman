import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Signature dark editorial header for inner public pages.
 * Pure server component — entrance animation runs on lightweight CSS keyframes.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  emoji = "🌾",
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  emoji?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="animate-rise relative mb-8 mt-24 overflow-hidden rounded-[2rem] bg-[#0A1F14] px-6 py-10 shadow-[0_24px_60px_-24px_rgba(10,31,20,0.5)] sm:px-10 sm:py-12">
      <div className="animate-drift absolute -right-16 -top-16 size-72 rounded-full bg-lime-400/15 blur-[90px]" aria-hidden />
      <div className="animate-floaty absolute -bottom-20 left-1/4 size-64 rounded-full bg-emerald-400/15 blur-[90px]" aria-hidden />
      <div className="grain" aria-hidden />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 rotate-12 select-none text-[11rem] leading-none opacity-[0.12] grayscale-[0.2] md:block"
      >
        {emoji}
      </span>

      <div className="relative max-w-3xl">
        <Link
          href="/"
          className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300/70 transition hover:text-lime-200"
        >
          ← AgriShare home
        </Link>
        <p className="animate-rise-1 mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-200 ring-1 ring-white/15">
          {eyebrow}
        </p>
        <h1 className="font-display animate-rise-1 mt-4 text-4xl font-medium tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="animate-rise-2 mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">{sub}</p>
        {actions && <div className="animate-rise-3 mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}
