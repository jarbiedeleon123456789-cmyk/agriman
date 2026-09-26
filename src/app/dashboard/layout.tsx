import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/actions";
import { ensureSeeded } from "@/lib/seed";
import { getCurrentUser, ROLE_LABELS, isMao } from "@/lib/session";
import { unreadCount } from "@/lib/queries";
import { SidebarNav, ContentFade } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

type NavItem = { href: string; label: string; icon: string; roles: string[] };

const ALL = ["admin", "staff", "farmer", "association", "barangay", "operator", "auditor"];
const MAO = ["admin", "staff"];

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ALL },
      { href: "/dashboard/notifications", label: "Notifications", icon: "🔔", roles: ALL },
    ],
  },
  {
    group: "My farm",
    items: [
      { href: "/dashboard/profile", label: "My Profile", icon: "👤", roles: ALL },
      { href: "/dashboard/farms", label: "My Farms", icon: "🌱", roles: ["farmer", "association", "admin", "staff"] },
      { href: "/dashboard/diagnostics", label: "AI Crop Doctor", icon: "🔬", roles: ALL },
      { href: "/dashboard/requests/new", label: "Request Equipment", icon: "➕", roles: ["farmer", "association", "barangay"] },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/dashboard/requests", label: "Requests", icon: "📋", roles: ALL },
      { href: "/dashboard/harvester", label: "Harvester Scheduling", icon: "🌾", roles: ALL },
      { href: "/dashboard/calendar", label: "Equipment Calendar", icon: "🗓️", roles: ALL },
      { href: "/dashboard/assignments", label: "Assignments", icon: "🚚", roles: ["operator", ...MAO] },
      { href: "/dashboard/equipment", label: "Equipment Inventory", icon: "🚜", roles: MAO },
      { href: "/dashboard/resources", label: "Resource Inventory", icon: "📦", roles: MAO },
      { href: "/dashboard/maintenance", label: "Maintenance", icon: "🧰", roles: ["operator", ...MAO] },
    ],
  },
  {
    group: "Community",
    items: [
      { href: "/dashboard/farmers", label: "Farmers", icon: "🧑‍🌾", roles: [...MAO, "association", "barangay", "auditor"] },
      { href: "/dashboard/associations", label: "Associations", icon: "🤝", roles: [...MAO, "association", "auditor"] },
      { href: "/dashboard/barangays", label: "Barangays", icon: "🏘️", roles: [...MAO, "barangay", "auditor"] },
      { href: "/dashboard/announcements", label: "Announcements", icon: "📢", roles: ALL },
      { href: "/dashboard/meetings", label: "Meetings", icon: "👥", roles: ALL },
      { href: "/dashboard/programs", label: "Programs & Assistance", icon: "🎁", roles: ALL },
    ],
  },
  {
    group: "Information",
    items: [
      { href: "/dashboard/map", label: "Farm & Service Map", icon: "🗺️", roles: ALL },
      { href: "/dashboard/market", label: "Market Data", icon: "💹", roles: ALL },
      { href: "/dashboard/reports", label: "Reports & Analytics", icon: "📊", roles: [...MAO, "auditor"] },
    ],
  },
  {
    group: "Administration",
    items: [
      { href: "/dashboard/users", label: "Users & Roles", icon: "🛡️", roles: ["admin"] },
      { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "🧾", roles: ["admin", "auditor"] },
      { href: "/dashboard/settings", label: "System Settings", icon: "⚙️", roles: ["admin"] },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const unread = await unreadCount(user.id);

  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(user.role)) })).filter(
    (g) => g.items.length,
  );

  return (
    <div className="flex min-h-screen bg-[#f6f7f2]">
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#0A1F14] via-[#0C2417] to-[#0A1F14] px-3 py-5 lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-lime-400/10 blur-[80px]" aria-hidden />
        <div className="pointer-events-none absolute -left-24 bottom-0 size-64 rounded-full bg-emerald-400/10 blur-[80px]" aria-hidden />
        <Link href="/" className="group relative mb-6 flex items-center gap-2.5 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-lg shadow-lg transition-transform duration-300 group-hover:rotate-6">
            🌾
          </span>
          <span>
            <span className="font-display block text-lg font-semibold leading-tight text-white">AgriShare</span>
            <span className="block text-[10px] leading-tight text-lime-200/60">MAO Baco · Or. Mindoro</span>
          </span>
        </Link>
        <div className="relative flex-1 overflow-y-auto pb-4" data-lenis-prevent>
          <SidebarNav groups={groups} unread={unread} id="desktop" />
        </div>
        <div className="relative mt-4 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10 backdrop-blur">
          <p className="text-[11px] font-bold text-lime-300">{ROLE_LABELS[user.role]}</p>
          <p className="mt-0.5 truncate text-xs text-white/70">{user.name}</p>
          <form action={logoutAction} className="mt-2.5">
            <button className="w-full rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-emerald-950/10 bg-white/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <details className="lg:hidden">
              <summary className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-950 text-base text-lime-300">
                ☰
              </summary>
              <div className="absolute left-2 right-2 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl bg-[#0A1F14] p-4 shadow-2xl ring-1 ring-white/10">
                <SidebarNav groups={groups} unread={unread} id="mobile" />
              </div>
            </details>
            <div>
              <p className="font-display text-base font-semibold text-emerald-950">
                {isMao(user.role) ? "MAO Control Center" : ROLE_LABELS[user.role]}
              </p>
              <p className="text-[11px] text-slate-500">Municipal Agriculture Office of Baco, Oriental Mindoro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:block"
            >
              Public site
            </Link>
            <Link
              href="/dashboard/notifications"
              className="relative flex size-9 items-center justify-center rounded-full border border-slate-300 text-sm transition hover:bg-slate-50"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                  {unread}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-full bg-emerald-950 py-1.5 pl-1.5 pr-3.5 transition hover:bg-emerald-900"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-white/15 text-base">
                {user.avatarEmoji}
              </span>
              <span className="hidden text-xs font-bold text-lime-200 sm:block">{user.name.split(" ")[0]}</span>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <ContentFade>{children}</ContentFade>
        </main>

        <footer className="border-t border-emerald-950/10 px-6 py-4 text-center text-[11px] text-slate-400">
          AgriShare prototype · Municipal Agriculture Office of Baco · Signed in as {user.email} (
          {ROLE_LABELS[user.role]})
        </footer>
      </div>
    </div>
  );
}
