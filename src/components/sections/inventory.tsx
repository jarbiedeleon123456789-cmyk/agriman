import Link from "next/link";
import { Badge, Card, Disclosure, EmptyState, Field, Stat, TableShell, btn, inputClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/forms";
import { listBarangays, listCategories, listEquipment, listOperators, listResources, maintenanceFor } from "@/lib/queries";
import { addMaintenanceAction, saveEquipmentAction, saveResourceAction, setEquipmentStatusAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/session";
import { fmtDate, peso, toDateInput } from "@/lib/utils";

const STATUSES = ["Available", "Reserved", "In Use", "Under Maintenance", "Unavailable", "Retired"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Repair"];

function EquipmentForm({
  categories,
  barangays,
  operators,
  item,
}: {
  categories: { id: number; categoryName: string }[];
  barangays: { id: number; name: string }[];
  operators: { id: number; name: string }[];
  item?: Awaited<ReturnType<typeof listEquipment>>[number];
}) {
  return (
    <form action={saveEquipmentAction} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Equipment name">
          <input name="name" required defaultValue={item?.name} className={inputClass} />
        </Field>
        <Field label="Asset code">
          <input name="assetCode" required defaultValue={item?.assetCode} className={inputClass} placeholder="MAO-HRV-004" />
        </Field>
        <Field label="Category">
          <select name="categoryId" defaultValue={item?.categoryId ?? ""} className={inputClass}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={item?.status ?? "Available"} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Condition">
          <select name="condition" defaultValue={item?.condition ?? "Good"} className={inputClass}>
            {CONDITIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Home barangay">
          <select name="homeBarangayId" defaultValue={item?.homeBarangayId ?? ""} className={inputClass}>
            <option value="">Select…</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Station / location">
          <input name="location" defaultValue={item?.location} className={inputClass} />
        </Field>
        <Field label="Default operator">
          <select name="defaultOperatorId" defaultValue={item?.defaultOperatorId ?? ""} className={inputClass}>
            <option value="">None</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Latitude">
          <input name="lat" defaultValue={item?.lat ?? "13.357800"} className={inputClass} />
        </Field>
        <Field label="Longitude">
          <input name="lng" defaultValue={item?.lng ?? "121.100200"} className={inputClass} />
        </Field>
        <Field label="Service rate per ha (₱)">
          <input name="ratePerHa" type="number" step="0.01" defaultValue={item?.ratePerHa ?? "0"} className={inputClass} />
        </Field>
        <Field label="Capacity note">
          <input name="capacityNote" defaultValue={item?.capacityNote} className={inputClass} placeholder="≈1.2 ha per day" />
        </Field>
        <Field label="Next maintenance due">
          <input type="date" name="nextMaintenanceDue" defaultValue={toDateInput(item?.nextMaintenanceDue)} className={inputClass} />
        </Field>
        <Field label="Photo URL">
          <input name="imageUrl" defaultValue={item?.imageUrl} className={inputClass} />
        </Field>
      </div>
      <Field label="Description">
        <textarea name="description" rows={2} defaultValue={item?.description} className={inputClass} />
      </Field>
      <Field label="Internal notes">
        <input name="notes" defaultValue={item?.notes} className={inputClass} />
      </Field>
      <button className={btn.primary}>{item ? "Save changes" : "Add to inventory"}</button>
    </form>
  );
}

export async function EquipmentAdminSection() {
  const [items, categories, barangays, operators] = await Promise.all([
    listEquipment(),
    listCategories(),
    listBarangays(),
    listOperators(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Equipment Inventory</h1>
        <p className="text-sm text-slate-500">
          Municipal machinery, post-harvest facilities and irrigation units with status, assignment and maintenance
          information.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total units" value={items.length} icon="🚜" />
        <Stat label="Available" value={items.filter((i) => i.status === "Available").length} icon="✅" />
        <Stat label="Deployed" value={items.filter((i) => ["Reserved", "In Use"].includes(i.status)).length} icon="📍" tone="sky" />
        <Stat label="Under maintenance" value={items.filter((i) => i.status === "Under Maintenance").length} icon="🧰" tone="amber" />
      </div>

      <Card title="➕ Add new equipment">
        <Disclosure summary="Open the equipment registration form">
          <EquipmentForm categories={categories} barangays={barangays} operators={operators} />
        </Disclosure>
      </Card>

      <Card title="📦 Inventory list">
        <TableShell head={["Asset", "Category", "Status", "Condition", "Station", "Next maintenance", "Actions"]}>
          {items.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2">
                <Link href={`/dashboard/equipment/${e.id}`} className="text-xs font-bold text-emerald-800 hover:underline">
                  {e.name}
                </Link>
                <span className="block text-[10px] text-slate-400">{e.assetCode}</span>
              </td>
              <td className="px-3 py-2 text-xs">
                {e.icon} {e.category}
              </td>
              <td className="px-3 py-2">
                <Badge value={e.status} />
              </td>
              <td className="px-3 py-2 text-xs">{e.condition}</td>
              <td className="px-3 py-2 text-xs">{e.location}</td>
              <td className="px-3 py-2 text-xs">{fmtDate(e.nextMaintenanceDue)}</td>
              <td className="px-3 py-2">
                <form action={setEquipmentStatusAction} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={e.id} />
                  <select name="status" defaultValue={e.status} className={`${inputClass} !w-auto !py-1 text-[11px]`}>
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button className={btn.small}>Set</button>
                </form>
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>

      <Card title="✏️ Edit an existing unit">
        <div className="space-y-3">
          {items.map((e) => (
            <Disclosure key={e.id} summary={`${e.assetCode} — ${e.name}`} tone="ghost">
              <EquipmentForm categories={categories} barangays={barangays} operators={operators} item={e} />
            </Disclosure>
          ))}
        </div>
      </Card>
    </div>
  );
}

export async function ResourcesSection() {
  const resources = await listResources();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Shared Resource Inventory</h1>
        <p className="text-sm text-slate-500">Farm inputs, services and facilities shared through AgriShare requests.</p>
      </header>

      <Card title="➕ Register a shared resource">
        <Disclosure summary="Open resource form">
          <form action={saveResourceAction} className="grid gap-3 sm:grid-cols-2">
            <Field label="Resource name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Type">
              <select name="type" className={inputClass} defaultValue="Service">
                {["Farm Input", "Service", "Facility", "Tool"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Unit">
              <input name="unit" className={inputClass} placeholder="bag (20kg)" />
            </Field>
            <Field label="Availability">
              <select name="availability" className={inputClass} defaultValue="Available">
                {["Available", "Request-based", "Unavailable"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Total quantity">
              <input name="quantityTotal" type="number" className={inputClass} defaultValue={0} />
            </Field>
            <Field label="Available quantity">
              <input name="quantityAvailable" type="number" className={inputClass} defaultValue={0} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <input name="description" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <button className={btn.primary}>Save resource</button>
            </div>
          </form>
        </Disclosure>
      </Card>

      <Card title="📦 Resources">
        <TableShell head={["Resource", "Type", "Stock", "Availability", "Update"]}>
          {resources.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">
                <span className="text-xs font-bold text-slate-800">{r.name}</span>
                <span className="block text-[10px] text-slate-400">{r.description}</span>
              </td>
              <td className="px-3 py-2 text-xs">{r.type}</td>
              <td className="px-3 py-2 text-xs">
                {r.quantityAvailable} / {r.quantityTotal} {r.unit}
              </td>
              <td className="px-3 py-2">
                <Badge value={r.availability} />
              </td>
              <td className="px-3 py-2">
                <form action={saveResourceAction} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="name" value={r.name} />
                  <input type="hidden" name="type" value={r.type} />
                  <input type="hidden" name="unit" value={r.unit} />
                  <input type="hidden" name="description" value={r.description} />
                  <input type="hidden" name="quantityTotal" value={r.quantityTotal} />
                  <input name="quantityAvailable" type="number" defaultValue={r.quantityAvailable} className={`${inputClass} !w-20 !py-1 text-[11px]`} />
                  <select name="availability" defaultValue={r.availability} className={`${inputClass} !w-auto !py-1 text-[11px]`}>
                    {["Available", "Request-based", "Unavailable"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <button className={btn.small}>Save</button>
                </form>
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}

export async function MaintenanceSection({ user }: { user: SessionUser }) {
  const [records, equipment] = await Promise.all([maintenanceFor(), listEquipment()]);
  const due = equipment
    .filter((e) => e.nextMaintenanceDue)
    .sort((a, b) => String(a.nextMaintenanceDue).localeCompare(String(b.nextMaintenanceDue)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Equipment Maintenance</h1>
        <p className="text-sm text-slate-500">
          Preventive and corrective service records. Logging an in-progress repair automatically marks the unit as
          under maintenance.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="🧰 Maintenance records">
          {records.length ? (
            <TableShell head={["Date", "Unit", "Type", "Description", "Cost", "Next due", "Status"]}>
              {records.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-xs font-semibold">{fmtDate(m.serviceDate)}</td>
                  <td className="px-3 py-2 text-xs">
                    {m.equipmentName}
                    <span className="block text-[10px] text-slate-400">{m.assetCode}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{m.type}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{m.description}</td>
                  <td className="px-3 py-2 text-xs">{peso(m.cost)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(m.nextDue)}</td>
                  <td className="px-3 py-2">
                    <Badge value={m.status} />
                  </td>
                </tr>
              ))}
            </TableShell>
          ) : (
            <EmptyState icon="🧰" title="No maintenance records yet" />
          )}
        </Card>

        <div className="space-y-6">
          <Card title="➕ Log maintenance">
            <form action={addMaintenanceAction} className="space-y-3">
              <Field label="Equipment">
                <select name="equipmentId" required className={inputClass} defaultValue="">
                  <option value="">Select unit…</option>
                  {equipment.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.assetCode} — {e.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Service date">
                <input type="date" name="serviceDate" defaultValue={toDateInput(new Date())} className={inputClass} />
              </Field>
              <Field label="Type">
                <select name="type" className={inputClass} defaultValue="Preventive">
                  {["Preventive", "Corrective", "Inspection", "Calibration"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Description">
                <textarea name="description" rows={2} className={inputClass} />
              </Field>
              <Field label="Cost (₱)">
                <input name="cost" type="number" step="0.01" defaultValue="0" className={inputClass} />
              </Field>
              <Field label="Next due">
                <input type="date" name="nextDue" className={inputClass} />
              </Field>
              <Field label="Status">
                <select name="status" className={inputClass} defaultValue="Completed">
                  {["Completed", "In Progress", "Scheduled"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <ConfirmSubmit
                label="Save maintenance record"
                message="Save this maintenance record? Units marked In Progress become unavailable for booking."
                className={btn.primary}
              />
              <p className="text-[11px] text-slate-400">Recorded by {user.name}</p>
            </form>
          </Card>

          <Card title="⏰ Maintenance schedule">
            <ul className="space-y-2">
              {due.map((e) => {
                const soon = new Date(String(e.nextMaintenanceDue)).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 21;
                return (
                  <li key={e.id} className={`rounded-lg border px-3 py-2 ${soon ? "border-amber-200 bg-amber-50/70" : "border-slate-200"}`}>
                    <p className="text-xs font-bold text-slate-800">{e.name}</p>
                    <p className="text-[11px] text-slate-500">Due {fmtDate(e.nextMaintenanceDue)}</p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
