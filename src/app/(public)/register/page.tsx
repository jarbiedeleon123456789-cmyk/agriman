import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms";
import { listBarangays } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const barangays = await listBarangays();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-28">
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-emerald-900">Farmer registration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create your AgriShare account to request MAO equipment, shared resources and assistance programmes. Your
          RSBSA record will be validated by MAO personnel.
        </p>
        <div className="mt-6">
          <RegisterForm barangays={barangays.map((b) => ({ id: b.id, name: b.name }))} />
        </div>
      </div>
    </div>
  );
}
