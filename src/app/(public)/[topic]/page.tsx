import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, Stat, TableShell, btn } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { listCropCalendar, listMarketPrices, listMeetings, listPrograms, meetingAttendees, settingsMap } from "@/lib/queries";
import { describe, getWeather } from "@/lib/weather";
import { fmtDate, fmtDateTime, fmtRange, num, peso } from "@/lib/utils";
import { SpotlightCard, PulsingStatus } from "@/components/originkit";

export const dynamic = "force-dynamic";

const TOPICS = ["weather", "market", "crop-calendar", "programs", "meetings", "about", "contact"];

const TOPIC_META: Record<string, { eyebrow: string; title: string; sub: string; emoji: string }> = {
  weather: {
    eyebrow: "Field intelligence · Live API",
    title: "Weather & agricultural conditions",
    sub: "Live conditions and a 7-day agricultural forecast for Baco, Oriental Mindoro (13.36°N, 121.10°E) — cached server-side every 30 minutes.",
    emoji: "🌦️",
  },
  market: {
    eyebrow: "MAO market monitoring",
    title: "Market information",
    sub: "Prevailing farm-gate and market prices monitored by the MAO Baco market monitoring team.",
    emoji: "💹",
  },
  "crop-calendar": {
    eyebrow: "Seasonal planning",
    title: "Crop calendar",
    sub: "Seasonal planting and harvesting windows used for planning harvester demand across Baco.",
    emoji: "🌱",
  },
  programs: {
    eyebrow: "Subsidies · Grants · Training",
    title: "Assistance & programs",
    sub: "Subsidies, machinery grants and trainings offered by the Municipal Agriculture Office of Baco.",
    emoji: "🎁",
  },
  meetings: {
    eyebrow: "Coordination",
    title: "Meetings & assemblies",
    sub: "Notices, agenda, venue and minutes of MAO coordination meetings and barangay assemblies.",
    emoji: "👥",
  },
  about: {
    eyebrow: "The platform & the office",
    title: "About AgriShare & the MAO",
    sub: "A web-based agricultural resource-sharing and scheduling platform for the Municipal Agriculture Office of Baco, Oriental Mindoro.",
    emoji: "🌾",
  },
  contact: {
    eyebrow: "We're here to help",
    title: "Contact the MAO",
    sub: "For account assistance, equipment coordination or programme inquiries.",
    emoji: "☎️",
  },
};

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!TOPICS.includes(topic)) notFound();
  const meta = TOPIC_META[topic];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHero eyebrow={meta.eyebrow} title={meta.title} sub={meta.sub} emoji={meta.emoji} />
      {topic === "weather" && <WeatherSection />}
      {topic === "market" && <MarketSection />}
      {topic === "crop-calendar" && <CropSection />}
      {topic === "programs" && <ProgramSection />}
      {topic === "meetings" && <MeetingSection />}
      {topic === "about" && <AboutSection />}
      {topic === "contact" && <ContactSection />}
    </div>
  );
}

/* ------------------------------ weather ------------------------------ */

async function WeatherSection() {
  const weather = await getWeather();
  const current = describe(weather.data.current.code);
  const rainy = weather.data.daily.filter((d) => d.rainChance >= 60);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1" title="Current conditions">
          <div className="flex items-center gap-4">
            <span className="text-6xl">{current.icon}</span>
            <div>
              <p className="font-display text-5xl font-medium tracking-tight text-slate-900">{num(weather.data.current.temperature, 1)}°C</p>
              <p className="font-semibold text-slate-600">{current.label}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["Humidity", `${weather.data.current.humidity}%`, "💧"],
              ["Wind", `${num(weather.data.current.windSpeed, 1)} km/h`, "🌬️"],
              ["Rainfall", `${num(weather.data.current.precipitation, 1)} mm`, "☔"],
            ].map(([k, v, i]) => (
              <div key={k} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-lg">{i}</p>
                <p className="text-sm font-bold text-slate-800">{v}</p>
                <p className="text-[10px] uppercase text-slate-500">{k}</p>
              </div>
            ))}
          </dl>
          <div className={`mt-4 rounded-2xl p-3 text-[11px] ${weather.live ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-amber-50 text-amber-900 border border-amber-200"}`}>
            <div className="flex items-center justify-between gap-2">
              <PulsingStatus
                label={weather.live ? "Live Open-Meteo Feed" : "Cached Dataset"}
                tone={weather.live ? "emerald" : "amber"}
              />
              <span className="text-[10px] text-slate-400">30m cache</span>
            </div>
            <p className="mt-2 text-slate-600">Source: {weather.source}</p>
            <p className="text-slate-500">Retrieved: {fmtDateTime(weather.fetchedAt)}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2" title="7-day agricultural forecast">
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {weather.data.daily.map((d) => {
              const w = describe(d.code);
              return (
                <div key={d.date} className="rounded-2xl border border-slate-200 p-3 text-center transition hover:-translate-y-1 hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    {new Date(d.date).toLocaleDateString("en-PH", { weekday: "short" })}
                  </p>
                  <p className="text-2xl">{w.icon}</p>
                  <p className="text-xs font-bold text-slate-800">
                    {Math.round(d.max)}° / {Math.round(d.min)}°
                  </p>
                  <p className="mt-1 text-[10px] text-sky-700">☔ {d.rainChance}%</p>
                  <p className="text-[10px] text-slate-500">{num(d.rain, 1)} mm</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Linked agricultural advisories</h3>
            {rainy.length ? (
              rainy.map((d) => (
                <div key={d.date} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-bold">
                    ⚠ High chance of rain on {fmtDate(d.date)} ({d.rainChance}%)
                  </p>
                  <p className="mt-0.5 text-[13px]">
                    Advise farmers with mature palay in low-lying barangays to advance harvesting schedules and to
                    secure drying areas. Harvester requests for this date may be prioritised by the MAO.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                ✅ No significant rainfall expected in the coming week — favourable window for harvesting and drying
                operations.
              </div>
            )}
            <Link href="/announcements" className="inline-block text-sm font-bold text-emerald-700 hover:underline">
              See published weather advisories →
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ------------------------------- market ------------------------------ */

async function MarketSection() {
  const prices = await listMarketPrices();
  const groups = Array.from(new Set(prices.map((p) => p.category)));
  const latest = prices.reduce((acc, p) => (p.priceDate > acc ? p.priceDate : acc), prices[0]?.priceDate ?? "");

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Monitored commodities" value={prices.length} icon="🧺" />
        <Stat label="Monitoring points" value={new Set(prices.map((p) => p.market)).size} icon="🏪" tone="sky" />
        <Stat label="Last update" value={fmtDate(latest)} icon="🕗" tone="amber" />
      </div>

      {groups.map((g) => (
        <Card key={g} className="mb-6" title={`${g} commodities`} subtitle="Price per unit with movement against the previous monitoring">
          <TableShell head={["Commodity", "Market / source", "Unit", "Price", "Change", "Date"]}>
            {prices
              .filter((p) => p.category === g)
              .map((p) => {
                const diff = Number(p.price) - Number(p.previousPrice);
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-800">{p.crop}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{p.market}</td>
                    <td className="px-3 py-2 text-xs">{p.unit}</td>
                    <td className="px-3 py-2 text-sm font-bold text-emerald-700">{peso(p.price)}</td>
                    <td className="px-3 py-2 text-xs font-semibold">
                      {Number(p.previousPrice) === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-600">▲ {peso(Math.abs(diff))}</span>
                      ) : diff < 0 ? (
                        <span className="text-rose-600">▼ {peso(Math.abs(diff))}</span>
                      ) : (
                        <span className="text-slate-400">no change</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(p.priceDate)}</td>
                  </tr>
                );
              })}
          </TableShell>
        </Card>
      ))}

      <p className="text-xs text-slate-500">
        Source: MAO Baco Market Monitoring · Prices are indicative and are updated every monitoring day. Always confirm
        with the trading post before transacting.
      </p>
    </>
  );
}

/* ---------------------------- crop calendar -------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function CropSection() {
  const crops = await listCropCalendar();
  const idx = (m: string) => MONTHS.findIndex((x) => m.startsWith(x));

  return (
    <>
      <Card className="mb-6" title="Seasonal overview" subtitle="Green = planting window · Amber = harvesting window">
        <div className="space-y-3 overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[minmax(130px,190px)_repeat(12,1fr)] gap-1 text-[10px] font-bold uppercase text-slate-500">
            <span />
            {MONTHS.map((m) => (
              <span key={m} className="text-center">
                {m}
              </span>
            ))}
          </div>
          {crops.map((c) => {
            const ps = idx(c.plantingStart);
            const pe = idx(c.plantingEnd);
            const hs = idx(c.harvestStart);
            const he = idx(c.harvestEnd);
            const inRange = (i: number, a: number, b: number) => (a <= b ? i >= a && i <= b : i >= a || i <= b);
            return (
              <div key={c.id} className="grid min-w-[720px] grid-cols-[minmax(130px,190px)_repeat(12,1fr)] items-center gap-1">
                <span className="truncate text-xs font-semibold text-slate-700" title={c.crop}>
                  {c.crop}
                </span>
                {MONTHS.map((m, i) => {
                  const planting = inRange(i, ps, pe);
                  const harvest = inRange(i, hs, he);
                  return (
                    <span
                      key={m}
                      className={`h-5 rounded ${
                        planting && harvest
                          ? "bg-gradient-to-r from-emerald-400 to-amber-400"
                          : planting
                            ? "bg-emerald-400"
                            : harvest
                              ? "bg-amber-400"
                              : "bg-slate-100"
                      }`}
                      title={`${c.crop} · ${m}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Crop details">
        <TableShell head={["Crop", "Season", "Planting", "Harvesting", "Duration", "Advisory"]}>
          {crops.map((c) => (
            <tr key={c.id}>
              <td className="px-3 py-2 text-sm font-semibold text-slate-800">{c.crop}</td>
              <td className="px-3 py-2 text-xs">
                <Badge value={c.season} />
              </td>
              <td className="px-3 py-2 text-xs">
                {c.plantingStart} – {c.plantingEnd}
              </td>
              <td className="px-3 py-2 text-xs">
                {c.harvestStart} – {c.harvestEnd}
              </td>
              <td className="px-3 py-2 text-xs">{c.durationDays} days</td>
              <td className="px-3 py-2 text-xs text-slate-600">{c.advisory}</td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </>
  );
}

/* ------------------------------ programs ----------------------------- */

async function ProgramSection() {
  const programs = await listPrograms();
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {programs.map((p) => (
          <SpotlightCard key={p.id} cursorText="APPLY">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={p.status} />
                <Badge value={p.assistanceType} />
              </div>
              <h2 className="font-display mt-2 text-xl font-semibold tracking-tight text-slate-900">{p.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{p.description}</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                <p>
                  <span className="font-bold text-slate-700">Eligibility:</span> {p.eligibility}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-slate-700">Application period:</span> {fmtDate(p.opensAt)} –{" "}
                  {fmtDate(p.deadline)} · <span className="font-bold text-slate-700">{p.slots}</span> slots
                </p>
              </div>
              <Link
                href="/dashboard/programs"
                className={`mt-4 ${p.status === "Open" ? btn.small : btn.smallGhost}`}
                aria-disabled={p.status !== "Open"}
              >
                {p.status === "Open" ? "Apply through my dashboard" : "View program record"}
              </Link>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </>
  );
}

/* ------------------------------ meetings ----------------------------- */

async function MeetingSection() {
  const [meetings, attendees] = await Promise.all([listMeetings(), meetingAttendees()]);
  const upcoming = meetings.filter((m) => m.status === "Upcoming" || m.status === "Ongoing");
  const past = meetings.filter((m) => m.status === "Completed" || m.status === "Cancelled");

  return (
    <>
      <Card className="mb-6" title="📌 Upcoming meetings">
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((m) => {
              const confirmed = attendees.filter((a) => a.meetingId === m.id && a.status === "Confirmed").length;
              const invited = attendees.filter((a) => a.meetingId === m.id).length;
              return (
                <div key={m.id} className="rounded-[1.2rem] border border-emerald-950/10 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <Badge value={m.status} />
                    <span className="text-xs text-slate-500">{m.audience}</span>
                  </div>
                  <h3 className="font-display mt-2 text-lg font-semibold tracking-tight text-slate-900">{m.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">🗓️ {fmtRange(m.startAt, m.endAt)}</p>
                  <p className="text-xs text-slate-500">📍 {m.venue}</p>
                  <p className="text-xs text-slate-500">👤 {m.organizer}</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-xs text-slate-600">{m.agenda}</pre>
                  <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                    {confirmed} confirmed / {invited} invited
                  </p>
                  <Link href="/dashboard/meetings" className="mt-2 inline-block text-xs font-bold text-emerald-700 hover:underline">
                    Confirm attendance in my dashboard →
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="👥" title="No upcoming meetings posted" />
        )}
      </Card>

      <Card title="🗄️ Meeting history & minutes">
        <div className="space-y-4">
          {past.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                <Badge value={m.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {fmtRange(m.startAt, m.endAt)} · {m.venue}
              </p>
              {m.minutes && (
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  <span className="font-bold text-slate-700">Minutes: </span>
                  {m.minutes}
                </p>
              )}
            </div>
          ))}
          {!past.length && <EmptyState icon="🗄️" title="No archived meetings" />}
        </div>
      </Card>
    </>
  );
}

/* -------------------------------- about ------------------------------ */

const OBJECTIVES = [
  "Centralised web platform for agricultural resource and equipment management.",
  "Structured announcement and advisory system for MAO-to-farmer communication.",
  "Meeting scheduling, notices, attendance and record management.",
  "Equipment inventory with status, availability, maintenance and assignment history.",
  "Reservation and request workflow for equipment and shared resources.",
  "Harvester scheduling across barangays with automatic conflict detection.",
  "Farmer profiles and agricultural records needed by the MAO.",
  "Farm and service-location mapping using GIS-enabled tools.",
  "Dashboards, statistics and reports for administrative monitoring.",
  "Appropriate emerging technologies for automation and decision support.",
];

const PHASES = [
  ["Phase 1 — Core prototype", "Landing page, login, dashboards, farmer profiles, announcements, equipment catalog, request forms, admin CRUD."],
  ["Phase 2 — Scheduling", "Harvester calendar, reservations, conflict detection, approvals, assignments, notifications."],
  ["Phase 3 — Agricultural information", "Weather API, market information, crop calendar, assistance and programs."],
  ["Phase 4 — Mapping", "Leaflet / OpenStreetMap integration, farm and service locations, directions."],
  ["Phase 5 — Analytics", "MAO dashboard charts, utilisation, demand by barangay, reports and exports."],
  ["Phase 6 — Modern enhancements", "PWA, real-time notifications, QR equipment identification, advanced analytics."],
  ["Phase 7 — Future integrations", "IoT telemetry, external government data sources, decision-support features."],
];

async function AboutSection() {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="🎯 Project objectives">
          <ol className="grid gap-2 sm:grid-cols-2">
            {OBJECTIVES.map((o, i) => (
              <li key={o} className="flex gap-2 rounded-2xl bg-emerald-50/60 p-3 text-sm text-slate-700">
                <span className="font-black text-emerald-700">{i + 1}.</span>
                {o}
              </li>
            ))}
          </ol>
        </Card>

        <Card title="🚫 Scope boundary">
          <p className="text-sm text-slate-600">
            AI pest and disease detection is <strong>not</strong> part of the AgriShare core scope — existing solutions
            already address that function. Blockchain and advanced computer vision are likewise excluded. Innovation is
            focused on resource sharing, scheduling, coordination, mapping, communication and administrative decision
            support.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Emerging technologies used: GIS mapping, REST API integration (weather), role-based access control, audit
            logging, analytics, and a responsive interface prepared for PWA packaging.
          </p>
        </Card>

        <Card className="lg:col-span-3" title="🧭 Users and roles">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["MAO Administrator", "Full control: users, content, equipment, approvals, reports, settings, audit trail."],
              ["MAO Staff / Coordinator", "Operational queues: requests, schedules, advisories, farmer records."],
              ["Farmer", "Profile, farms, requests, schedule, announcements, programs, notifications."],
              ["Association Officer", "Association-level requests and member coordination."],
              ["Barangay Representative", "Barangay schedules, announcements and request visibility."],
              ["Driver / Technician", "Assignments, destinations, directions, job status, maintenance logging."],
              ["System Auditor", "Read-only reports, logs and monitoring screens."],
              ["Public visitor", "Announcements, equipment catalog, schedules, weather, market, programs."],
            ].map(([role, text]) => (
              <div key={role} className="rounded-2xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-sm font-bold text-emerald-800">{role}</p>
                <p className="mt-1 text-xs text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3" title="🛠️ Development phases">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PHASES.map(([title, text]) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-xs text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ------------------------------- contact ----------------------------- */

async function ContactSection() {
  const cfg = await settingsMap();
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1" title="🏛️ Office information">
          <ul className="space-y-3 text-sm text-slate-700">
            <li>
              <span className="block text-[11px] font-bold uppercase text-slate-500">Office</span>
              {cfg.office_name}
            </li>
            <li>
              <span className="block text-[11px] font-bold uppercase text-slate-500">Address</span>
              {cfg.office_address}
            </li>
            <li>
              <span className="block text-[11px] font-bold uppercase text-slate-500">Hotline</span>
              {cfg.office_hotline}
            </li>
            <li>
              <span className="block text-[11px] font-bold uppercase text-slate-500">Email</span>
              <a className="text-emerald-700 hover:underline" href={`mailto:${cfg.office_email}`}>
                {cfg.office_email}
              </a>
            </li>
            <li>
              <span className="block text-[11px] font-bold uppercase text-slate-500">Office hours</span>
              {cfg.office_hours}
            </li>
          </ul>
        </Card>

        <Card className="lg:col-span-2" title="❓ Frequently asked questions">
          <div className="space-y-3">
            {[
              ["How do I request a harvester?", "Register an account, add your farm, then open Request Equipment from your dashboard. Select the unit, your preferred period and submit. The system checks conflicts before your request reaches the MAO review queue."],
              ["How long does approval take?", "MAO personnel review requests within office hours. You receive an in-app notification once your request is approved, rejected or returned for revision."],
              ["What if the unit I need is already booked?", "AgriShare shows the next free service windows and lets you submit your request to the waiting list. MAO personnel assign the next available unit."],
              ["Can the barangay file on behalf of farmers?", "Yes. Association officers and barangay representatives have coordination access for their members, subject to MAO authorisation."],
              ["Is my personal information public?", "No. Farmer details and exact farm locations are only visible to authorised MAO personnel, the assigned operator and the farm owner."],
            ].map(([q, a]) => (
              <details key={q} className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300">
                <summary className="cursor-pointer text-sm font-bold text-slate-800">{q}</summary>
                <p className="mt-2 text-sm text-slate-600">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`mailto:${cfg.office_email}`} className={btn.primary}>
              ✉️ Email the MAO
            </a>
            <Link href="/register" className={btn.ghost}>
              Create a farmer account
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
