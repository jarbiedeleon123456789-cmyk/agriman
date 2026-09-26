import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { AiCropScanner } from "@/components/ai-scanner";
import { SpotlightCard } from "@/components/originkit";
import { Badge, Stat } from "@/components/ui";
import { listBarangays } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { plantDiagnoses, barangays as barangayTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const allBarangays = await listBarangays();

  // Retrieve recent diagnostic scans
  type RecentScan = {
    id: number;
    cropType: string;
    diseaseName: string;
    scientificName: string;
    confidence: string;
    severity: string;
    farmerName: string;
    status: string;
    createdAt: Date;
    barangay: string | null;
  };

  let recentScans: RecentScan[] = [];
  try {
    recentScans = await db
      .select({
        id: plantDiagnoses.id,
        cropType: plantDiagnoses.cropType,
        diseaseName: plantDiagnoses.diseaseName,
        scientificName: plantDiagnoses.scientificName,
        confidence: plantDiagnoses.confidence,
        severity: plantDiagnoses.severity,
        farmerName: plantDiagnoses.farmerName,
        status: plantDiagnoses.status,
        createdAt: plantDiagnoses.createdAt,
        barangay: barangayTable.name,
      })
      .from(plantDiagnoses)
      .leftJoin(barangayTable, eq(barangayTable.id, plantDiagnoses.barangayId))
      .orderBy(desc(plantDiagnoses.createdAt))
      .limit(6);
  } catch (err) {
    console.error("Failed to load recent scans:", err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-12">
      <PageHero
        eyebrow="AI Crop Doctor · Visual Diagnosis"
        title="Plant Disease & Pest Detection"
        sub="Snap or upload a picture of your crop to instantly identify plant diseases, calculate severity, and receive DA-approved organic and chemical prescriptions."
        emoji="🔬"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="#scanner"
              className="rounded-full bg-lime-300 px-5 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-lime-200"
            >
              📸 Open Camera Scanner
            </Link>
            <Link
              href="/dashboard/requests/new"
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              🚜 Request Sprayer Equipment
            </Link>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Supported Philippine Crops" value="12+" icon="🌾" />
        <Stat label="Diagnostic Database" value="48 Pathogens" icon="🦠" tone="sky" />
        <Stat label="Average Accuracy" value="95.4%" icon="🎯" tone="emerald" />
        <Stat label="MAO Verified Prescriptions" value="Instant" icon="⚡" tone="amber" />
      </div>

      {/* Main Scanner Section */}
      <section id="scanner" className="scroll-mt-28">
        <AiCropScanner
          userBarangayId={user?.barangayId}
          userName={user?.name}
          barangays={allBarangays.map((b) => ({ id: b.id, name: b.name }))}
        />
      </section>

      {/* Recent Scans Feed across Baco */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-emerald-950">
              Recent Field Scans in Baco
            </h3>
            <p className="text-xs text-slate-500">
              Real-time monitoring of crop diseases diagnosed across municipal barangay clusters.
            </p>
          </div>
          <Link
            href="/dashboard/requests/new"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Need technical assistance? File request →
          </Link>
        </div>

        {recentScans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentScans.map((scan) => (
              <SpotlightCard key={scan.id} cursorText="SCAN">
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                      🌾 {scan.cropType}
                    </span>
                    <Badge value={scan.severity} />
                  </div>

                  <div>
                    <h4 className="font-display text-base font-bold text-slate-900">{scan.diseaseName}</h4>
                    <p className="text-xs text-slate-500 italic mt-0.5">{scan.scientificName || "Pathogen"}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>📍 Brgy. {scan.barangay || "Baco"}</span>
                    <span>{fmtDate(scan.createdAt)}</span>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-950/20 p-8 text-center bg-white">
            <p className="text-sm font-semibold text-slate-600">No field scans recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Upload a photo in the scanner above to run the first diagnosis!</p>
          </div>
        )}
      </section>
    </div>
  );
}
