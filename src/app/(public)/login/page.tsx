import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-28 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-3xl lg:block">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hero.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-900/70 to-emerald-700/40" />
        <div className="relative flex h-full flex-col justify-end p-8 text-white">
          <span className="text-4xl">🌾</span>
          <h2 className="mt-3 text-2xl font-black">Welcome back to AgriShare</h2>
          <p className="mt-2 text-sm text-emerald-50/90">
            Sign in to request equipment, track your schedule and receive advisories from the Municipal Agriculture
            Office of Baco, Oriental Mindoro.
          </p>
          <ul className="mt-5 space-y-1.5 text-sm text-emerald-100/90">
            <li>✅ Role-based dashboards for MAO staff, farmers and operators</li>
            <li>✅ Automatic conflict detection for harvester bookings</li>
            <li>✅ Notifications for approvals, schedules and advisories</li>
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-emerald-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Use your AgriShare account credentials.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
            Register as a farmer
          </Link>
        </p>
      </div>
    </div>
  );
}
