"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  changePasswordAction,
  createRequestAction,
  loginAction,
  registerAction,
  type ActionState,
} from "@/lib/actions";
import { btn, Field, inputClass } from "@/components/ui";

export function SubmitButton({ label, className = btn.primary, pendingLabel = "Working…" }: { label: string; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ConfirmSubmit({
  label,
  message,
  className = btn.danger,
  name,
  value,
}: {
  label: string;
  message: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}

/* ------------------------------- login ------------------------------- */

const DEMO = [
  { role: "MAO Administrator", email: "admin@agrishare.gov.ph" },
  { role: "MAO Staff", email: "staff@agrishare.gov.ph" },
  { role: "Farmer", email: "farmer@agrishare.gov.ph" },
  { role: "Association Officer", email: "association@agrishare.gov.ph" },
  { role: "Barangay Rep.", email: "barangay@agrishare.gov.ph" },
  { role: "Driver / Operator", email: "operator@agrishare.gov.ph" },
  { role: "System Auditor", email: "auditor@agrishare.gov.ph" },
];

export function LoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, null);
  const [email, setEmail] = useState("farmer@agrishare.gov.ph");

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
        )}
        <Field label="Email / Username">
          <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required defaultValue="agrishare123" className={inputClass} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" name="remember" defaultChecked className="size-4 rounded border-slate-300" />
            Remember this session
          </label>
          <Link href="/contact" className="font-semibold text-emerald-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton label="Sign in to AgriShare" className={`${btn.primary} w-full`} pendingLabel="Signing in…" />
      </form>

      <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/60 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Demo accounts (password: agrishare123)</p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => setEmail(d.email)}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-xs shadow-sm ring-1 ring-emerald-900/5 transition hover:ring-emerald-500/40"
            >
              <span className="font-semibold text-slate-700">{d.role}</span>
              <span className="text-[10px] text-slate-500">{d.email.split("@")[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RegisterForm({ barangays }: { barangays: { id: number; name: string }[] }) {
  const [state, action] = useActionState<ActionState, FormData>(registerAction, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input name="name" required className={inputClass} placeholder="Juan P. Dela Cruz" />
        </Field>
        <Field label="Mobile number">
          <input name="phone" className={inputClass} placeholder="0917-000-0000" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required className={inputClass} placeholder="you@email.com" />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <input name="password" type="password" required className={inputClass} />
        </Field>
        <Field label="Barangay">
          <select name="barangayId" className={inputClass} defaultValue="">
            <option value="">Select barangay…</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="RSBSA number" hint="Optional — may be added later">
          <input name="rsbsaNumber" className={inputClass} placeholder="RSBSA-175-2024-00000" />
        </Field>
        <Field label="Main crop">
          <select name="mainCrop" className={inputClass} defaultValue="Rice">
            {["Rice", "Corn", "Vegetables", "Fruits", "Coconut", "Others"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Preferred contact">
          <select name="preferredContact" className={inputClass} defaultValue="Mobile">
            {["Mobile", "SMS", "Email", "Barangay Office"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Complete address">
        <input name="address" className={inputClass} placeholder="Sitio / Purok, Barangay, Baco, Oriental Mindoro" />
      </Field>
      <SubmitButton label="Create farmer account" className={`${btn.primary} w-full`} pendingLabel="Creating account…" />
      <p className="text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
          Sign in here
        </Link>
      </p>
    </form>
  );
}

/* ---------------------------- request form ---------------------------- */

type Option = { id: number; label: string; extra?: string };

export function RequestForm({
  equipment,
  resources,
  farms,
  barangays,
  defaultEquipmentId,
}: {
  equipment: (Option & { status: string })[];
  resources: Option[];
  farms: (Option & { barangayId: number | null; crop: string; area: string })[];
  barangays: Option[];
  defaultEquipmentId?: number;
}) {
  const [state, action] = useActionState<ActionState, FormData>(createRequestAction, null);
  const [kind, setKind] = useState<"equipment" | "resource">("equipment");
  const [equipmentId, setEquipmentId] = useState(defaultEquipmentId ? String(defaultEquipmentId) : "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [check, setCheck] = useState<{ ok: boolean; message: string; slots?: string[] } | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkAvailability() {
    if (!equipmentId || !start || !end) {
      setCheck({ ok: false, message: "Select equipment, start and end of the service period first." });
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/availability?equipmentId=${equipmentId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      const data = (await res.json()) as { available: boolean; conflicts: string[]; suggestions: string[] };
      setCheck({
        ok: data.available,
        message: data.available
          ? "✅ The unit is free for the selected period. You may submit your request."
          : `⚠ Conflict: ${data.conflicts.join(" | ")}`,
        slots: data.suggestions,
      });
    } catch {
      setCheck({ ok: false, message: "Unable to check availability right now." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-semibold">{state.error}</p>
          {state.conflicts?.length ? (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {state.conflicts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : null}
          {state.suggestions?.length ? (
            <p className="mt-2 text-xs">
              <span className="font-semibold">Available alternatives:</span> {state.suggestions.join(" • ")}
            </p>
          ) : null}
          <p className="mt-2 text-xs">
            You may also submit this request to the <span className="font-semibold">waiting list</span> using the button at the bottom of the
            form — MAO personnel will assign the next free unit.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["equipment", "resource"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              kind === k ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {k === "equipment" ? "🚜 Equipment / Machinery" : "📦 Shared Resource / Service"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "equipment" ? (
          <Field label="Equipment / machinery" className="sm:col-span-2">
            <select
              name="equipmentId"
              required
              className={inputClass}
              value={equipmentId}
              onChange={(e) => {
                setEquipmentId(e.target.value);
                setCheck(null);
              }}
            >
              <option value="">Select a unit…</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id} disabled={e.status === "Under Maintenance" || e.status === "Retired"}>
                  {e.label} — {e.status}
                  {e.extra ? ` (${e.extra})` : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Shared resource / service" className="sm:col-span-2">
            <select name="resourceId" required className={inputClass} defaultValue="">
              <option value="">Select a resource…</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                  {r.extra ? ` — ${r.extra}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Service type">
          <select name="serviceType" className={inputClass} defaultValue="Harvesting">
            {["Harvesting", "Land Preparation", "Threshing", "Drying", "Hauling", "Irrigation Support", "Milling", "Farm Input", "Technical Assistance"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" className={inputClass} defaultValue="Normal">
            {["Normal", "High", "Urgent"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Preferred start" hint="Minimum lead time: 3 days">
          <input
            type="datetime-local"
            name="requestedStart"
            required
            className={inputClass}
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setCheck(null);
            }}
          />
        </Field>
        <Field label="Expected end">
          <input
            type="datetime-local"
            name="requestedEnd"
            required
            className={inputClass}
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setCheck(null);
            }}
          />
        </Field>

        <Field label="Farm / service location">
          <select name="farmId" className={inputClass} defaultValue="">
            <option value="">Select farm…</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} · {f.crop} · {f.area} ha
              </option>
            ))}
          </select>
        </Field>
        <Field label="Barangay">
          <select name="barangayId" className={inputClass} defaultValue="">
            <option value="">Select barangay…</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Crop">
          <input name="cropType" className={inputClass} defaultValue="Rice" />
        </Field>
        <Field label="Area to be serviced (ha)">
          <input name="areaHa" type="number" step="0.01" min="0" className={inputClass} defaultValue="1.00" />
        </Field>
      </div>

      <Field label="Purpose of request">
        <textarea name="purpose" rows={3} className={inputClass} placeholder="e.g. Harvesting of 2 ha mature rice before the forecast rains." required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Additional notes for MAO">
          <input name="notes" className={inputClass} placeholder="Access road condition, contact person on site…" />
        </Field>
        <Field label="Supporting document" hint="File name is recorded in this prototype (no upload storage).">
          <input name="attachmentName" className={inputClass} placeholder="barangay-certification.pdf" />
        </Field>
      </div>

      {kind === "equipment" && (
        <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={checkAvailability} className={btn.smallGhost} disabled={checking}>
              {checking ? "Checking…" : "🔍 Check availability & conflicts"}
            </button>
            {check && (
              <span className={`text-sm font-semibold ${check.ok ? "text-emerald-700" : "text-rose-700"}`}>{check.message}</span>
            )}
          </div>
          {check?.slots?.length ? (
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-semibold">Next free slots:</span> {check.slots.join(" • ")}
            </p>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <SubmitButton label="Submit request to MAO" pendingLabel="Submitting…" />
        <button type="submit" name="mode" value="waitlist" className={btn.ghost}>
          Submit to waiting list instead
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state?.error && <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.success && <p className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>}
      <Field label="Current password">
        <input type="password" name="currentPassword" required className={inputClass} />
      </Field>
      <Field label="New password">
        <input type="password" name="newPassword" required className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton label="Update password" />
      </div>
    </form>
  );
}
