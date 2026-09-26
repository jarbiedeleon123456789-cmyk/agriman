"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/components/motion";
import { Magnetic } from "@/components/originkit";

const PRIMARY = [
  { href: "/diagnostics", label: "🔬 AI Crop Doctor" },
  { href: "/announcements", label: "Announcements" },
  { href: "/equipment", label: "Equipment" },
  { href: "/schedule", label: "Schedule" },
  { href: "/map", label: "Farm Map" },
  { href: "/programs", label: "Assistance" },
];

const ALL = [
  { href: "/", label: "Home", hint: "Start here" },
  { href: "/diagnostics", label: "AI Crop Doctor", hint: "Disease & Pest Diagnostics" },
  { href: "/announcements", label: "Announcements", hint: "Notices & advisories" },
  { href: "/equipment", label: "Equipment & Resources", hint: "Live inventory" },
  { href: "/schedule", label: "Harvester Schedule", hint: "Municipal calendar" },
  { href: "/map", label: "Farm Map", hint: "GIS service view" },
  { href: "/weather", label: "Weather", hint: "Live conditions" },
  { href: "/market", label: "Market Prices", hint: "Daily monitoring" },
  { href: "/crop-calendar", label: "Crop Calendar", hint: "Seasonal guide" },
  { href: "/programs", label: "Assistance", hint: "Programmes & aid" },
  { href: "/meetings", label: "Meetings", hint: "Notices & minutes" },
  { href: "/about", label: "About", hint: "The platform" },
  { href: "/contact", label: "Contact", hint: "Talk to the MAO" },
];

export function SiteNav({ user }: { user: { name: string; avatarEmoji: string } | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open ]);

  const dark = pathname === "/" && !scrolled;
  const ink = dark ? "text-white" : "text-emerald-950";

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-4 ${
            scrolled
              ? "bg-white/85 shadow-[0_12px_40px_-16px_rgba(10,31,20,0.35)] ring-1 ring-emerald-950/10 backdrop-blur-xl"
              : dark
                ? "bg-white/[0.06] ring-1 ring-white/15 backdrop-blur-md"
                : "bg-white/75 ring-1 ring-emerald-950/10 backdrop-blur-xl"
          }`}
        >
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-lg shadow-lg shadow-emerald-900/20 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              🌾
            </span>
            <span>
              <span className={`font-display block text-lg font-semibold leading-none tracking-tight ${ink}`}>
                AgriShare
              </span>
              <span
                className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
                  dark ? "text-lime-200/80" : "text-emerald-700/70"
                }`}
              >
                MAO Baco · Mindoro
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {PRIMARY.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                    active
                      ? dark
                        ? "bg-white/15 text-white"
                        : "bg-emerald-950 text-lime-300"
                      : dark
                        ? "text-white/75 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-emerald-950/5 hover:text-emerald-950"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Magnetic strength={0.25}>
                <Link
                  href="/dashboard"
                  data-cursor-text="DASH"
                  className="hidden items-center gap-2 rounded-full bg-emerald-950 px-4 py-2 text-sm font-bold text-lime-300 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-900 sm:flex"
                >
                  <span>{user.avatarEmoji}</span> Dashboard
                </Link>
              </Magnetic>
            ) : (
              <>
                <Magnetic strength={0.25}>
                  <Link
                    href="/login"
                    className={`hidden rounded-full px-4 py-2 text-sm font-bold transition sm:block ${
                      dark ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-emerald-900 hover:bg-emerald-950/5"
                    }`}
                  >
                    Login
                  </Link>
                </Magnetic>
                <Magnetic strength={0.25}>
                  <Link
                    href="/register"
                    data-cursor-text="JOIN"
                    className="hidden rounded-full bg-lime-300 px-4 py-2 text-sm font-bold text-emerald-950 shadow-[0_8px_24px_-8px_rgba(190,242,100,0.8)] transition hover:-translate-y-0.5 hover:bg-lime-200 sm:block"
                  >
                    Register
                  </Link>
                </Magnetic>
              </>
            )}
            <Magnetic strength={0.3}>
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                data-cursor-text="MENU"
                className={`flex size-10 flex-col items-center justify-center gap-1.5 rounded-full transition ${
                  dark ? "bg-white/10 hover:bg-white/20" : "bg-emerald-950 hover:bg-emerald-900"
                }`}
              >
                <span className={`h-0.5 w-5 rounded-full ${dark ? "bg-white" : "bg-lime-300"}`} />
                <span className={`h-0.5 w-5 rounded-full ${dark ? "bg-white" : "bg-lime-300"}`} />
              </button>
            </Magnetic>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] overflow-y-auto bg-[#0A1F14]"
            data-lenis-prevent
          >
            <div className="animate-drift pointer-events-none absolute -right-24 top-0 size-[28rem] rounded-full bg-lime-400/10 blur-[120px]" />
            <div className="animate-floaty pointer-events-none absolute -left-24 bottom-0 size-[24rem] rounded-full bg-emerald-400/10 blur-[120px]" />
            <div className="grain" />
            <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-lg">
                    🌾
                  </span>
                  <span className="font-display text-lg font-semibold text-white">AgriShare</span>
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex size-11 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:rotate-90 hover:bg-white/20"
                >
                  ✕
                </button>
              </div>

              <nav className="grid flex-1 content-center gap-1 py-10 sm:grid-cols-2">
                {ALL.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.045, duration: 0.5, ease: EASE }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-4 rounded-2xl px-4 py-2.5 transition hover:bg-white/5"
                    >
                      <span className="font-mono text-xs text-lime-300/50">{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span className="font-display block text-3xl font-medium tracking-tight text-white transition duration-300 group-hover:translate-x-1.5 group-hover:text-lime-200 sm:text-4xl">
                          {l.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                          {l.hint}
                        </span>
                      </span>
                      <span className="ml-auto text-xl text-lime-300 opacity-0 transition duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                        →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
              >
                <p className="text-xs text-white/50">
                  Municipal Agriculture Office of Baco, Oriental Mindoro · (043) 288-0123
                </p>
                <div className="flex gap-2">
                  {user ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-200"
                    >
                      {user.avatarEmoji} My Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-200"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed bottom-6 right-6 z-50">
          <Magnetic strength={0.4}>
            <motion.button
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              data-cursor-text="TOP"
              className="flex size-12 items-center justify-center rounded-full bg-emerald-950 text-lg text-lime-300 shadow-[0_12px_32px_-8px_rgba(10,31,20,0.6)] ring-1 ring-white/20 transition hover:-translate-y-1 hover:bg-emerald-900"
            >
              ↑
            </motion.button>
          </Magnetic>
        </div>
      )}
    </AnimatePresence>
  );
}
