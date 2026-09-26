import Link from "next/link";
import { Badge, Card, EmptyState, btn, inputClass } from "@/components/ui";
import { listCategories, listEquipment, listResources } from "@/lib/queries";
import { fmtDate, peso } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import { SpotlightCard } from "@/components/originkit";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "Available", "Reserved", "In Use", "Under Maintenance", "Unavailable", "Retired"];

export default async function EquipmentCatalog({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [items, categories, resources] = await Promise.all([
    listEquipment({ category: sp.category, status: sp.status, q: sp.q }),
    listCategories(),
    listResources(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHero
        eyebrow="Municipal inventory · Live availability"
        title="Equipment & shared resources"
        sub="Harvesters, tractors, threshers, post-harvest facilities and farm inputs shared across all barangays of Baco."
        emoji="🚜"
        actions={
          <Link href="/dashboard/requests/new" className={btn.primary}>
            📋 Request equipment
          </Link>
        }
      />

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <label className="grow">
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Search</span>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Equipment name or asset code…" className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Category</span>
          <select name="category" defaultValue={sp.category ?? "all"} className={inputClass}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.categoryName}>
                {c.icon} {c.categoryName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Status</span>
          <select name="status" defaultValue={sp.status ?? "all"} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Any status" : s}
              </option>
            ))}
          </select>
        </label>
        <button className={btn.primary}>Apply filters</button>
        <Link href="/equipment" className={btn.ghost}>
          Reset
        </Link>
      </form>

      {items.length === 0 ? (
        <EmptyState icon="🚜" title="No equipment matches your filters" hint="Adjust the category or status filter." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <SpotlightCard key={e.id} cursorText="INSPECT" className="!p-0">
              <article className="flex h-full flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.imageUrl} alt={e.name} className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105" />
                <div className="flex grow flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        {e.icon} {e.category}
                      </p>
                      <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900">{e.name}</h3>
                    </div>
                    <Badge value={e.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 grow text-sm text-slate-600">{e.description}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
                    <div>
                      <dt className="font-semibold uppercase text-slate-400">Asset code</dt>
                      <dd className="font-bold text-slate-700">{e.assetCode}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase text-slate-400">Condition</dt>
                      <dd className="font-bold text-slate-700">{e.condition}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase text-slate-400">Location</dt>
                      <dd className="truncate font-bold text-slate-700">{e.location}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase text-slate-400">Service rate</dt>
                      <dd className="font-bold text-emerald-700">{Number(e.ratePerHa) > 0 ? `${peso(e.ratePerHa)}/ha` : "Free / subsidized"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/equipment/${e.id}`} className={btn.small}>
                      View details
                    </Link>
                    <Link href={`/dashboard/requests/new?equipmentId=${e.id}`} className={btn.smallGhost}>
                      Request
                    </Link>
                  </div>
                </div>
              </article>
            </SpotlightCard>
          ))}
        </div>
      )}

      <Card className="mt-10" title="📦 Other shared resources and services" subtitle="Requested through the same workflow as machinery">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{r.name}</h3>
                <Badge value={r.availability} />
              </div>
              <p className="mt-1 text-xs text-slate-600">{r.description}</p>
              <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                {r.quantityAvailable} / {r.quantityTotal} {r.unit} available · {r.type}
              </p>
              <Link href="/dashboard/requests/new" className="mt-3 inline-block text-xs font-bold text-emerald-700 hover:underline">
                Request this resource →
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-400">Inventory snapshot as of {fmtDate(new Date())}.</p>
      </Card>
    </div>
  );
}
