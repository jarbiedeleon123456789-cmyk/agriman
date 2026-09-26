"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type DashGroups = { group: string; items: { href: string; label: string; icon: string }[] }[];

export function SidebarNav({
  groups,
  unread,
  id,
}: {
  groups: DashGroups;
  unread: number;
  id: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="space-y-5" data-lenis-prevent>
      {groups.map((g) => (
        <div key={g.group}>
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-lime-200/50">{g.group}</p>
          <ul className="mt-1.5 space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      active ? "text-emerald-950" : "text-emerald-50/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={`dash-active-${id}`}
                        className="absolute inset-0 rounded-xl bg-lime-300 shadow-[0_8px_24px_-8px_rgba(190,242,100,0.7)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </span>
                    {item.href === "/dashboard/notifications" && unread > 0 && (
                      <span
                        className={`relative rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                          active ? "bg-emerald-950 text-lime-300" : "bg-rose-500 text-white"
                        }`}
                      >
                        {unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function ContentFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
