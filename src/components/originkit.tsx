"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

/* ========================================================================= */
/* 1. OriginKit Cursor Context & Component                                   */
/* ========================================================================= */

type CursorContextType = {
  cursorText: string | null;
  cursorVariant: "default" | "hover" | "text" | "hidden";
  setCursorText: (text: string | null) => void;
  setCursorVariant: (variant: "default" | "hover" | "text" | "hidden") => void;
};

const CursorContext = createContext<CursorContextType>({
  cursorText: null,
  cursorVariant: "default",
  setCursorText: () => {},
  setCursorVariant: () => {},
});

export const useCursor = () => useContext(CursorContext);

export function OriginCursorProvider({ children }: { children: ReactNode }) {
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [cursorVariant, setCursorVariant] = useState<"default" | "hover" | "text" | "hidden">("default");

  return (
    <CursorContext.Provider value={{ cursorText, cursorVariant, setCursorText, setCursorVariant }}>
      {children}
      <CustomCursor />
    </CursorContext.Provider>
  );
}

function CustomCursor() {
  const { cursorText, cursorVariant, setCursorVariant, setCursorText } = useCursor();
  const [isTouch, setIsTouch] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const dotConfig = { damping: 45, stiffness: 800, mass: 0.1 };
  const dotX = useSpring(mouseX, dotConfig);
  const dotY = useSpring(mouseY, dotConfig);

  useEffect(() => {
    // Check if device supports hover (not purely touch)
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsTouch(!mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsTouch(!e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Global listener for data-cursor elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null;
      const textTarget = target.closest("[data-cursor-text]") as HTMLElement | null;
      const clickableTarget = target.closest("a, button, input, select, textarea, [role='button']");

      if (textTarget) {
        setCursorText(textTarget.getAttribute("data-cursor-text"));
        setCursorVariant("text");
      } else if (cursorTarget) {
        const variant = (cursorTarget.getAttribute("data-cursor") as "hover" | "text" | "hidden") || "hover";
        setCursorVariant(variant);
      } else if (clickableTarget) {
        setCursorVariant("hover");
        setCursorText(null);
      } else {
        setCursorVariant("default");
        setCursorText(null);
      }
    };

    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY, isVisible, setCursorText, setCursorVariant]);

  if (isTouch) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {/* Outer fluid trailing ring / pill */}
      <motion.div
        className="fixed left-0 top-0 flex items-center justify-center rounded-full will-change-transform"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: cursorVariant === "text" ? 88 : cursorVariant === "hover" ? 44 : 28,
          height: cursorVariant === "text" ? 36 : cursorVariant === "hover" ? 44 : 28,
          opacity: isVisible ? (cursorVariant === "hidden" ? 0 : 1) : 0,
          backgroundColor:
            cursorVariant === "text"
              ? "rgba(10, 31, 20, 0.92)"
              : cursorVariant === "hover"
                ? "rgba(190, 242, 100, 0.18)"
                : "rgba(4, 120, 87, 0.15)",
          borderColor:
            cursorVariant === "text"
              ? "rgba(190, 242, 100, 0.6)"
              : cursorVariant === "hover"
                ? "rgba(190, 242, 100, 0.85)"
                : "rgba(5, 150, 105, 0.4)",
          borderWidth: cursorVariant === "text" ? "1.5px" : "1.5px",
          backdropFilter: cursorVariant === "text" ? "blur(8px)" : "blur(2px)",
          boxShadow:
            cursorVariant === "hover"
              ? "0 0 20px rgba(190, 242, 100, 0.35)"
              : "0 0 10px rgba(5, 150, 105, 0.2)",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
      >
        <AnimatePresence>
          {cursorVariant === "text" && cursorText && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="px-2 text-[10px] font-black uppercase tracking-[0.16em] text-lime-300"
            >
              {cursorText}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Center glowing precision dot */}
      <motion.div
        className="fixed left-0 top-0 size-1.5 rounded-full bg-lime-400 will-change-transform"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          opacity: isVisible && cursorVariant !== "hidden" && cursorVariant !== "text" ? 1 : 0,
          scale: cursorVariant === "hover" ? 1.5 : 1,
          boxShadow: "0 0 8px #bef264, 0 0 16px #bef264",
        }}
        transition={{ duration: 0.15 }}
      />
    </div>
  );
}

/* ========================================================================= */
/* 2. OriginKit Magnetic Component (Spring physics cursor attractor)         */
/* ========================================================================= */

export function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { damping: 18, stiffness: 220, mass: 0.3 });
  const springY = useSpring(y, { damping: 18, stiffness: 220, mass: 0.3 });

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;
    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ========================================================================= */
/* 3. OriginKit Spotlight Card (Mouse-following radial border & glow)        */
/* ========================================================================= */

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(190, 242, 100, 0.12)",
  borderColor = "rgba(190, 242, 100, 0.4)",
  cursorText,
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
  cursorText?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-cursor-text={cursorText}
      className={`group relative overflow-hidden rounded-[1.6rem] border border-emerald-950/10 bg-white shadow-[0_12px_32px_-20px_rgba(10,31,20,0.35)] transition-all duration-300 hover:shadow-[0_24px_48px_-20px_rgba(10,31,20,0.45)] ${className}`}
    >
      {/* Dynamic border highlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.6rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 65%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1.5px",
        }}
      />

      {/* Dynamic inner surface highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.6rem] transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ========================================================================= */
/* 4. OriginKit 3D Tilt Card (Physics-based parallax perspective tilt)       */
/* ========================================================================= */

export function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [0, 1], [-maxTilt, maxTilt]);

  const springRotateX = useSpring(rotateX, { damping: 20, stiffness: 200 });
  const springRotateY = useSpring(rotateY, { damping: 20, stiffness: 200 });

  const glareX = useTransform(x, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(y, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative overflow-hidden rounded-[1.6rem] transition-shadow duration-300 ${className}`}
      >
        {children}

        {glare && (
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.2), transparent 60%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ========================================================================= */
/* 5. OriginKit Interactive Background Grid & Ambient Glow                   */
/* ========================================================================= */

export function BackgroundGlowPattern() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: "radial-gradient(#059669 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(190,242,100,0.14),transparent)]" />
    </div>
  );
}

/* ========================================================================= */
/* 6. OriginKit Shimmer Button                                               */
/* ========================================================================= */

export function ShimmerButton({
  children,
  className = "",
  onClick,
  href,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <span className="relative flex items-center gap-2">
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <span className="absolute -inset-full animate-[shimmer_2.5s_infinite] bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.45)_50%,transparent_75%)]" />
    </span>
  );

  const buttonClasses = `relative inline-flex items-center justify-center overflow-hidden rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-12px_rgba(4,120,87,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_18px_36px_-12px_rgba(4,120,87,0.85)] active:translate-y-0 active:scale-[0.98] ${className}`;

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={buttonClasses}>
      {content}
    </button>
  );
}

/* ========================================================================= */
/* 7. OriginKit Live Pulsing Indicator                                       */
/* ========================================================================= */

export function PulsingStatus({ label, tone = "emerald" }: { label: string; tone?: "emerald" | "lime" | "amber" | "rose" }) {
  const colors = {
    emerald: { bg: "bg-emerald-500", glow: "bg-emerald-400", ring: "text-emerald-800 bg-emerald-50 border-emerald-200" },
    lime: { bg: "bg-lime-400", glow: "bg-lime-300", ring: "text-emerald-950 bg-lime-300 border-lime-400" },
    amber: { bg: "bg-amber-500", glow: "bg-amber-400", ring: "text-amber-800 bg-amber-50 border-amber-200" },
    rose: { bg: "bg-rose-500", glow: "bg-rose-400", ring: "text-rose-800 bg-rose-50 border-rose-200" },
  };

  const c = colors[tone];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${c.ring}`}>
      <span className="relative flex size-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${c.glow}`} />
        <span className={`relative inline-flex size-2 rounded-full ${c.bg}`} />
      </span>
      {label}
    </span>
  );
}
