import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/session";
import { ensureSeeded } from "@/lib/seed";
import { settingsMap } from "@/lib/queries";
import { SiteNav, BackToTop } from "@/components/site-nav";
import { PageFade } from "@/components/motion";

export const dynamic = "force-dynamic";

const SERVICES = [
  { href: "/diagnostics", label: "AI Crop Doctor" },
  { href: "/announcements", label: "Announcements" },
  { href: "/equipment", label: "Equipment & Resources" },
  { href: "/schedule", label: "Harvester Schedule" },
  { href: "/map", label: "Farm Map" },
  { href: "/weather", label: "Weather" },
  { href: "/market", label: "Market Prices" },
];

const INFO = [
  { href: "/crop-calendar", label: "Crop Calendar" },
  { href: "/programs", label: "Assistance" },
  { href: "/meetings", label: "Meetings" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login / Register" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const [user, cfg] = await Promise.all([getCurrentUser(), settingsMap()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav user={user ? { name: user.name, avatarEmoji: user.avatarEmoji } : null} />

      <main className="flex-1">
        <PageFade>{children}</PageFade>
      </main>

      <footer className="relative mt-24 overflow-hidden bg-[#0A1F14] text-emerald-50">
        <div className="animate-drift pointer-events-none absolute -left-24 top-0 size-96 rounded-full bg-lime-400/10 blur-[120px]" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pt-16">
          <div className="grid gap-10 pb-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
            <div>
              <p className="flex items-center gap-2.5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-xl shadow-lg">
                  🌾
                </span>
                <span className="font-display text-2xl font-semibold tracking-tight text-white">AgriShare</span>
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                A web-based agricultural resource-sharing and scheduling platform for the Municipal Agriculture Office
                of Baco, Oriental Mindoro.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/register"
                  className="rounded-full bg-lime-300 px-4 py-2 text-xs font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
                >
                  Join as farmer →
                </Link>
                <a
                  href="/agrishare-source.zip"
                  download
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                >
                  ⬇️ Source code (ZIP)
                </a>
                <a
                  href="/api/mysql-dump"
                  download="agrishare_mysql_phpmyadmin.sql"
                  className="rounded-full bg-emerald-800/80 px-4 py-2 text-xs font-bold text-lime-200 ring-1 ring-lime-300/30 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:text-white"
                >
                  🐬 phpMyAdmin SQL Dump
                </a>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-lime-300/80">Services</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                {SERVICES.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="transition hover:translate-x-1 hover:text-lime-200">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-lime-300/80">Information</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                {INFO.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="transition hover:translate-x-1 hover:text-lime-200">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-lime-300/80">
                Municipal Agriculture Office
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                <li>📍 {cfg.office_address}</li>
                <li>☎️ {cfg.office_hotline}</li>
                <li>✉️ {cfg.office_email}</li>
                <li>🕗 {cfg.office_hours}</li>
              </ul>
            </div>
          </div>

          <div aria-hidden className="font-display select-none overflow-hidden text-center text-[clamp(3.2rem,12.5vw,10.5rem)] font-black leading-[0.9] tracking-tight">
            <span className="text-stroke-lime">AGRISHARE</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} Municipal Agriculture Office of Baco · AgriShare Platform</span>
            <span>Prototype · AI pest detection intentionally out of scope · Sample data for demonstration</span>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
