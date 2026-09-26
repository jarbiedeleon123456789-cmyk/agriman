import Link from "next/link";
import { Hero } from "@/components/hero";
import { Counter, Reveal } from "@/components/motion";
import { Badge, BarChart, SectionHead } from "@/components/ui";
import { SpotlightCard, TiltCard, Magnetic, ShimmerButton, PulsingStatus } from "@/components/originkit";
import {
  listAnnouncements,
  listEquipment,
  listMeetings,
  listPrograms,
  listReservations,
  platformStats,
  requestsByBarangay,
  settingsMap,
} from "@/lib/queries";
import { getWeather, describe } from "@/lib/weather";
import { fmtDate, fmtRange, num } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MARQUEE = [
  "Harvester Scheduling",
  "Equipment Sharing",
  "Farmer Advisories",
  "Farm Mapping",
  "Market Prices",
  "Weather Watch",
  "MAO Programs",
  "Meeting Notices",
];

const FLOW = [
  { step: "01", title: "Request", text: "Farmer selects equipment or resource, preferred period and farm location." },
  { step: "02", title: "Conflict check", text: "AgriShare validates availability and flags overlapping bookings instantly." },
  { step: "03", title: "MAO review", text: "MAO personnel approve, reject or request a revision with remarks." },
  { step: "04", title: "Schedule & assign", text: "An approved request becomes a confirmed reservation with an operator." },
  { step: "05", title: "Service & close", text: "Status moves to In Progress then Completed, with a full audit trail." },
];

export default async function HomePage() {
  const [stats, announcements, equipment, reservations, meetings, programs, weather, byBarangay, cfg] =
    await Promise.all([
      platformStats(),
      listAnnouncements({ publicOnly: true }),
      listEquipment(),
      listReservations({ from: new Date() }),
      listMeetings(),
      listPrograms(),
      getWeather(),
      requestsByBarangay(),
      settingsMap(),
    ]);

  const featured = announcements.slice(0, 3);
  const upcoming = reservations.slice(0, 4);
  const upcomingMeetings = meetings.filter((m) => m.status === "Upcoming").slice(0, 2);
  const openPrograms = programs.filter((p) => p.status === "Open").slice(0, 3);
  const available = equipment.filter((e) => e.status === "Available");
  const current = describe(weather.data.current.code);

  return (
    <div>
      <Hero stats={{ farmerCount: stats.farmerCount, brgyCount: stats.brgyCount, assocCount: stats.assocCount }} />

      {/* marquee band */}
      <div className="relative z-20 overflow-hidden bg-[#0A1F14] py-3" aria-hidden>
        <div className="-rotate-1 scale-[1.03] bg-lime-300 py-3.5 shadow-[0_16px_40px_-16px_rgba(190,242,100,0.5)]">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {MARQUEE.map((t) => (
                  <span
                    key={`${copy}-${t}`}
                    className="mx-7 whitespace-nowrap text-sm font-black uppercase tracking-[0.2em] text-emerald-950"
                  >
                    {t} <span className="ml-7 text-emerald-800">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* live stats */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-[1.75rem] bg-emerald-950/10 shadow-[0_24px_60px_-30px_rgba(10,31,20,0.4)] ring-1 ring-emerald-950/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Registered farmers", value: <Counter value={stats.farmerCount} />, hint: `${stats.assocCount} associations` },
              { label: "Equipment ready", value: <Counter value={stats.availableCount} suffix={`/${stats.equipmentCount}`} />, hint: "Live availability" },
              { label: "Active requests", value: <Counter value={stats.pending + stats.approved} />, hint: `${stats.pending} in MAO review` },
              { label: "Barangays covered", value: <Counter value={stats.brgyCount} />, hint: "Municipality-wide" },
            ].map((s) => (
              <div key={s.label} className="bg-white/90 px-6 py-7 text-center backdrop-blur transition hover:bg-white">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">{s.label}</p>
                <p className="font-display mt-2 text-5xl font-medium tracking-tight text-emerald-950">{s.value}</p>
                <p className="mt-1.5 text-xs text-slate-500">{s.hint}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* quick actions bento */}
      <section id="services" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-20">
        <Reveal>
          <SectionHead
            eyebrow="Start here"
            title={
              <>
                Everything a farmer needs, <em className="text-emerald-600">one tap away.</em>
              </>
            }
            sub="Request machinery, check the municipal schedule, read advisories or explore the farm map — no more repeated trips to the municipal hall."
          />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Reveal className="md:col-span-2 lg:row-span-2" delay={0}>
            <Link
              href="/dashboard/requests/new"
              className="group relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-[1.75rem] p-7 text-left shadow-[0_24px_60px_-24px_rgba(10,31,20,0.5)]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                style={{ backgroundImage: "url('/images/hero.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F14] via-[#0A1F14]/45 to-transparent" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-950">
                  ★ Most used
                </span>
                <h3 className="font-display mt-3 text-4xl font-medium tracking-tight text-white">Request equipment</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
                  Book a harvester, tractor or shared resource with automatic conflict detection and MAO approval.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-lime-300">
                  Start a request
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </span>
              </div>
            </Link>
          </Reveal>

          {[
            { href: "/diagnostics", icon: "🔬", title: "AI Crop Doctor", text: "Upload or take a photo to identify crop disease & get treatment.", tag: "AI SCAN" },
            { href: "/schedule", icon: "🗓️", title: "View schedule", text: "Municipality-wide harvester calendar with live availability.", tag: "CALENDAR" },
            { href: "/announcements", icon: "📢", title: "Announcements", text: "Advisories, notices and urgent weather warnings.", tag: "ADVISORIES" },
            { href: "/map", icon: "🗺️", title: "Farm map", text: "Farms, equipment stations and service destinations.", tag: "GIS MAP" },
          ].map((c, i) => (
            <Reveal key={c.href} delay={0.08 + i * 0.07}>
              <SpotlightCard cursorText={c.tag}>
                <Link
                  href={c.href}
                  className="flex h-full min-h-[162px] flex-col p-6 transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    {c.icon}
                  </span>
                  <h3 className="font-display mt-4 text-xl font-semibold tracking-tight text-emerald-950">{c.title}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-slate-500">{c.text}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] font-bold text-emerald-700">
                    Open
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </Link>
              </SpotlightCard>
            </Reveal>
          ))}

          <Reveal delay={0.29}>
            <SpotlightCard
              cursorText="SIGN IN"
              spotlightColor="rgba(190, 242, 100, 0.25)"
              borderColor="rgba(190, 242, 100, 0.5)"
              className="!bg-[#0A1F14]"
            >
              <Link
                href="/login"
                className="group relative flex h-full min-h-[162px] flex-col p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="animate-drift absolute -right-10 -top-10 size-40 rounded-full bg-lime-400/20 blur-[60px]" />
                <span className="relative flex size-12 items-center justify-center rounded-2xl bg-lime-300 text-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  🔐
                </span>
                <h3 className="font-display relative mt-4 text-xl font-semibold tracking-tight text-white">Farmer login</h3>
                <p className="relative mt-1 text-[13px] leading-snug text-white/60">
                  Your dashboard, requests and notifications.
                </p>
                <span className="relative mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] font-bold text-lime-300">
                  Sign in
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </span>
              </Link>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A1F14] px-6 py-12 shadow-[0_32px_80px_-32px_rgba(10,31,20,0.6)] sm:px-12 sm:py-16">
            <div className="animate-drift absolute -left-20 top-0 size-96 rounded-full bg-lime-400/10 blur-[120px]" aria-hidden />
            <div className="grain" aria-hidden />
            <div className="relative">
              <p className="text-center text-[11px] font-black uppercase tracking-[0.25em] text-lime-300/80">
                Request → Approval → Scheduling → Assignment → Completion
              </p>
              <h2 className="font-display mx-auto mt-3 max-w-2xl text-center text-4xl font-medium tracking-tight text-white sm:text-5xl">
                How a request moves through <em className="text-lime-300">AgriShare</em>
              </h2>
              <ol className="mt-12 grid gap-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
                {FLOW.map((f, i) => (
                  <Reveal key={f.step} delay={i * 0.09}>
                    <li className="relative border-t border-white/15 pt-5">
                      <span className="font-display text-5xl font-light text-lime-300/90">{f.step}</span>
                      <p className="mt-3 text-base font-bold text-white">{f.title}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.text}</p>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </section>

      {/* announcements + schedule */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <Reveal>
          <SectionHead
            eyebrow="Field updates"
            title={
              <>
                Fresh from the <em className="text-emerald-600">Municipal Agriculture Office</em>
              </>
            }
          />
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {featured.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.08}>
                <SpotlightCard cursorText="READ">
                  <Link
                    href={`/announcements?id=${a.id}`}
                    className="group block p-6 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge value={a.priority} />
                      <Badge value={a.category} />
                      <span className="ml-auto text-xs text-slate-400">{fmtDate(a.publishAt)}</span>
                    </div>
                    <h3 className="font-display mt-3 text-2xl font-semibold leading-snug tracking-tight text-emerald-950 transition group-hover:text-emerald-700">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700">
                      Read story
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                    </span>
                  </Link>
                </SpotlightCard>
              </Reveal>
            ))}
            <Reveal delay={0.24}>
              <Magnetic strength={0.2}>
                <Link
                  href="/announcements"
                  className="flex items-center justify-center gap-2 rounded-full border border-emerald-950/15 bg-white/60 px-6 py-3 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-950 hover:text-lime-300"
                >
                  View all announcements →
                </Link>
              </Magnetic>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-[#0A1F14] p-6 shadow-[0_24px_60px_-24px_rgba(10,31,20,0.55)] sm:p-8">
              <div className="animate-floaty absolute -right-16 -top-16 size-64 rounded-full bg-emerald-400/15 blur-[80px]" aria-hidden />
              <div className="relative flex items-center justify-between">
                <h3 className="font-display text-2xl font-medium tracking-tight text-white">Upcoming deployments</h3>
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-lg">🗓️</span>
              </div>
              <ul className="relative mt-6 flex-1 space-y-3">
                {upcoming.map((r) => {
                  const d = new Date(r.startAt);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/[0.1]"
                    >
                      <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-lime-300 text-emerald-950">
                        <span className="text-lg font-black leading-none">{d.getDate()}</span>
                        <span className="text-[10px] font-bold uppercase">
                          {d.toLocaleDateString("en-PH", { month: "short" })}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white">
                          {r.isHarvester ? "🌾" : "🚜"} {r.equipmentName}
                        </span>
                        <span className="block truncate text-xs text-white/55">
                          {r.serviceType} · Brgy. {r.barangay ?? "—"} · {fmtRange(r.startAt, r.endAt)}
                        </span>
                      </span>
                      <span className="ml-auto shrink-0">
                        <Badge value={r.status} />
                      </span>
                    </li>
                  );
                })}
                {!upcoming.length && <p className="py-4 text-sm text-white/60">No upcoming deployments.</p>}
              </ul>
              <Link
                href="/schedule"
                className="relative mt-6 flex items-center justify-center gap-2 rounded-full bg-lime-300 py-3 text-sm font-black text-emerald-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
              >
                Open full calendar →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* field intelligence bento */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <Reveal>
          <SectionHead
            eyebrow="Field intelligence"
            title={
              <>
                Know your farm, <em className="text-emerald-600">every single day.</em>
              </>
            }
          />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Reveal className="lg:col-span-2" delay={0}>
            <TiltCard maxTilt={6}>
              <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden bg-gradient-to-br from-[#0A1F14] via-[#0E2D1D] to-[#1E4D2B] p-6 text-white shadow-[0_24px_60px_-24px_rgba(10,31,20,0.6)]">
                <div className="grain" aria-hidden />
                <p className="relative text-[11px] font-black uppercase tracking-[0.22em] text-lime-300">
                  🌦️ {cfg.weather_location}
                </p>
                <div className="relative mt-4 flex items-center gap-4">
                  <span className="text-6xl drop-shadow-lg">{current.icon}</span>
                  <div>
                    <p className="font-display text-6xl font-medium tracking-tight text-white">{num(weather.data.current.temperature, 1)}°</p>
                    <p className="text-sm font-bold text-lime-200">{current.label}</p>
                  </div>
                </div>
                <p className="relative mt-2 text-xs text-white/70">
                  💧 {weather.data.current.humidity}% · 🌬️ {num(weather.data.current.windSpeed, 1)} km/h · ☔{" "}
                  {num(weather.data.current.precipitation, 1)} mm
                </p>
                <p className="relative mt-3 rounded-xl bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-white/60">
                  {weather.live ? "● Live Open-Meteo API" : "● Cached / sample data"} · {weather.source}
                </p>
                <Link href="/weather" className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-lime-300 hover:text-lime-100">
                  7-day forecast <span>→</span>
                </Link>
              </div>
            </TiltCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.08}>
            <SpotlightCard cursorText="INVENTORY">
              <div className="flex h-full min-h-[320px] flex-col p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">✅ Ready to book</p>
                <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-emerald-950">
                  {available.length} of {equipment.length} units available
                </h3>
                <ul className="mt-4 space-y-2">
                  {available.slice(0, 4).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="truncate text-[13px] font-semibold text-slate-700">
                        {e.icon} {e.name}
                      </span>
                      <Badge value={e.status} />
                    </li>
                  ))}
                </ul>
                <Link href="/equipment" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                  Browse the catalog <span>→</span>
                </Link>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.16}>
            <SpotlightCard cursorText="GRANTS">
              <div className="flex h-full min-h-[320px] flex-col p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">🎁 Open now</p>
                <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-emerald-950">
                  Assistance & programs
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {openPrograms.map((p) => (
                    <li key={p.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[13px] font-bold text-slate-800">{p.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Deadline {fmtDate(p.deadline)} · {p.slots} slots
                      </p>
                    </li>
                  ))}
                </ul>
                <Link href="/programs" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                  See all programs <span>→</span>
                </Link>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={0.1}>
            <SpotlightCard cursorText="MEETINGS">
              <div className="flex h-full flex-col p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">👥 Coordination</p>
                <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-emerald-950">Upcoming meetings</h3>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {upcomingMeetings.map((m) => (
                    <li key={m.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[13px] font-bold text-slate-800">{m.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">📍 {m.venue}</p>
                      <p className="text-[11px] text-slate-500">{fmtRange(m.startAt, m.endAt)}</p>
                    </li>
                  ))}
                  {!upcomingMeetings.length && <p className="text-sm text-slate-500">No scheduled meetings.</p>}
                </ul>
                <Link href="/meetings" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                  Meeting calendar <span>→</span>
                </Link>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={0.18}>
            <SpotlightCard cursorText="ANALYTICS">
              <div className="flex h-full flex-col p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">📊 Demand signal</p>
                <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-emerald-950">
                  Requests by barangay
                </h3>
                <div className="mt-4">
                  <BarChart data={byBarangay.slice(0, 5).map((b) => ({ label: b.label ?? "—", value: Number(b.value) }))} />
                </div>
                <Link href="/dashboard/reports" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                  Open analytics <span>→</span>
                </Link>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-[0_32px_80px_-32px_rgba(10,31,20,0.6)]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/cta.jpg')" }} aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F14]/95 via-[#0A1F14]/75 to-[#0A1F14]/35" aria-hidden />
            <div className="grain" aria-hidden />
            <div className="relative max-w-2xl px-8 py-16 sm:px-14 sm:py-20">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-lime-300">For every Baco farmer</p>
              <h2 className="font-display mt-4 text-4xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                Your harvester is <em className="text-lime-300">one request</em> away.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
                Register your RSBSA profile, add your farm and submit your request online. The MAO reviews every
                request and confirms your schedule.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Magnetic strength={0.3}>
                  <Link
                    href="/register"
                    data-cursor-text="REGISTER"
                    className="group inline-flex items-center gap-2 rounded-full bg-lime-300 px-7 py-3.5 text-sm font-black text-emerald-950 transition-all hover:-translate-y-0.5 hover:bg-lime-200 shadow-xl"
                  >
                    Register as farmer
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                </Magnetic>
                <Magnetic strength={0.3}>
                  <Link
                    href="/login"
                    data-cursor-text="SIGN IN"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Sign in
                  </Link>
                </Magnetic>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
