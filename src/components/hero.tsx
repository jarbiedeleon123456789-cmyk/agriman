"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { EASE } from "@/components/motion";
import { Magnetic, PulsingStatus } from "@/components/originkit";

export function Hero({ stats }: { stats: { farmerCount: number; brgyCount: number; assocCount: number } }) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "22%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#0A1F14]">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.12]" aria-hidden>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hero.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1F14]/85 via-[#0A1F14]/45 to-[#0A1F14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F14]/60 via-transparent to-[#0A1F14]/40" />
      </motion.div>
      <div className="animate-drift absolute -left-24 top-1/4 size-96 rounded-full bg-lime-400/15 blur-[120px]" aria-hidden />
      <div className="animate-floaty absolute -right-20 bottom-1/4 size-80 rounded-full bg-emerald-400/15 blur-[100px]" aria-hidden />
      <div className="grain" aria-hidden />

      <motion.div
        style={{ opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-40 text-center sm:pt-44"
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className="inline-block"
        >
          <PulsingStatus label="MAO Baco · Oriental Mindoro" tone="lime" />
        </motion.div>

        <h1 className="font-display mx-auto mt-6 max-w-5xl text-[clamp(2.9rem,8.5vw,6.8rem)] font-medium leading-[0.98] tracking-[-0.02em] text-white">
          <span className="block overflow-hidden pb-1">
            <motion.span
              className="block"
              initial={{ y: "112%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
            >
              Every harvest,
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-1">
            <motion.span
              className="block italic text-lime-300"
              initial={{ y: "112%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.37 }}
            >
              beautifully
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span
              className="block"
              initial={{ y: "112%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.49 }}
            >
              coordinated.
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.68 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
        >
          AgriShare unites equipment sharing, harvester scheduling, advisories and farm mapping for the whole
          municipality — one digital hub for the MAO and every farmer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.8 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Magnetic strength={0.25}>
            <Link
              href="/dashboard/requests/new"
              data-cursor-text="BOOK"
              className="group inline-flex items-center gap-2 rounded-full bg-lime-300 px-7 py-3.5 text-sm font-black text-emerald-950 shadow-[0_16px_50px_-12px_rgba(190,242,100,0.7)] transition-all hover:-translate-y-0.5 hover:bg-lime-200 hover:shadow-[0_20px_60px_-12px_rgba(190,242,100,0.8)]"
            >
              🚜 Request equipment
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </Magnetic>
          <Magnetic strength={0.25}>
            <Link
              href="/schedule"
              data-cursor-text="CALENDAR"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15"
            >
              🗓️ View harvest schedule
            </Link>
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2.5">
            {["🧑‍🌾", "👩‍🌾", "🧑‍💼", "👷", "👩‍💻"].map((e, i) => (
              <span
                key={i}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-base ring-2 ring-[#0A1F14] backdrop-blur"
              >
                {e}
              </span>
            ))}
          </div>
          <p className="text-left text-xs leading-snug text-white/60">
            Trusted by <span className="font-bold text-white">{stats.farmerCount}+ farmers</span>
            <br />
            {stats.assocCount} associations · {stats.brgyCount} barangays
          </p>
        </motion.div>
      </motion.div>

      <motion.a
        href="#services"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
        aria-label="Scroll to content"
      >
        <span className="flex size-11 items-center justify-center rounded-full border border-white/25 text-white/80 backdrop-blur transition hover:bg-white/10">
          <span className="animate-cue">↓</span>
        </span>
      </motion.a>
    </section>
  );
}
