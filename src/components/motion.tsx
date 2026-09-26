"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Scroll-triggered reveal wrapper */
export function Reveal({
  children,
  delay = 0,
  y = 30,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Animated number counter */
export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value.toLocaleString("en-PH"));
      return;
    }
    const controls = animate(0, value, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) =>
        setDisplay(
          v.toLocaleString("en-PH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
        ),
    });
    return () => controls.stop();
  }, [inView, value, decimals, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* Route-change entrance transition */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Buttery smooth scrolling (Lenis) */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduce]);
  return <>{children}</>;
}
