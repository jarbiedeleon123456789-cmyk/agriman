import Link from "next/link";
import { Badge, Card, EmptyState, inputClass, btn } from "@/components/ui";
import { listAnnouncements } from "@/lib/queries";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import { markAnnouncementReadAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { SpotlightCard } from "@/components/originkit";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "all",
  "General Announcement",
  "Agriculture Advisory",
  "Weather Warning",
  "Program",
  "Assistance",
  "Meeting",
  "Equipment Notice",
  "Schedule Change",
];

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; category?: string; q?: string; archive?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const all = await listAnnouncements({ category: sp.category, q: sp.q });
  const showArchive = sp.archive === "1";
  const items = all.filter((a) => (showArchive ? a.status === "Archived" : a.status !== "Archived"));
  const selected = sp.id ? all.find((a) => a.id === Number(sp.id)) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHero
        eyebrow="MAO Baco · Official communications"
        title="Announcements & advisories"
        sub="Official notices of the Municipal Agriculture Office of Baco — categorised, prioritised and targeted per barangay or association."
        emoji="📢"
      />

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <label className="grow">
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Search</span>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search title or content…" className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Category</span>
          <select name="category" defaultValue={sp.category ?? "all"} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input type="checkbox" name="archive" value="1" defaultChecked={showArchive} className="size-4" />
          Show archive
        </label>
        <button className={btn.primary}>Filter</button>
        <Link href="/announcements" className={btn.ghost}>
          Reset
        </Link>
      </form>

      {selected && (
        <Card className="mb-6 border-emerald-500/40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge value={selected.priority} />
            <Badge value={selected.category} />
            <Badge value={selected.status} />
            <span className="text-xs text-slate-500">Published {fmtDateTime(selected.publishAt)}</span>
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-900">{selected.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Audience: {selected.audience}
            {selected.barangay ? ` · Brgy. ${selected.barangay}` : ""} · Author: {selected.author ?? "MAO Baco"} ·{" "}
            {selected.views} views
            {selected.expiresAt ? ` · Expires ${fmtDate(selected.expiresAt)}` : ""}
          </p>
          <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{selected.body}</div>
          {selected.attachmentName && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
              📎 {selected.attachmentName}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={markAnnouncementReadAction}>
              <input type="hidden" name="id" value={selected.id} />
              <button className={btn.small}>{user ? "✓ Mark as read" : "👁 Record view"}</button>
            </form>
            <Link href="/announcements" className={btn.smallGhost}>
              Close
            </Link>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState icon="📭" title="No announcements match your filter" hint="Try clearing the search or selecting another category." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <SpotlightCard key={a.id} cursorText="READ">
              <Link
                href={`/announcements?id=${a.id}`}
                className="flex h-full flex-col p-6 transition hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={a.priority} />
                  <Badge value={a.category} />
                </div>
                <h3 className="font-display mt-3 text-xl font-semibold tracking-tight text-slate-900">{a.title}</h3>
                <p className="mt-2 line-clamp-3 grow text-sm text-slate-600">{a.body}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span>{fmtDate(a.publishAt)}</span>
                  <span>
                    {a.audience}
                    {a.barangay ? ` · ${a.barangay}` : ""}
                  </span>
                </div>
              </Link>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
}
