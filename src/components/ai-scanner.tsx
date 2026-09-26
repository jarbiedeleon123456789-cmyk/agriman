"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard, TiltCard, Magnetic, PulsingStatus, ShimmerButton } from "@/components/originkit";
import { CROP_DISEASES_DB, type DiagnosisResult } from "@/lib/plant-ai";

export function AiCropScanner({
  initialDiagnosis,
  userBarangayId,
  userName,
  barangays,
}: {
  initialDiagnosis?: DiagnosisResult | null;
  userBarangayId?: number | null;
  userName?: string;
  barangays?: { id: number; name: string }[];
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("auto");
  const [selectedBarangay, setSelectedBarangay] = useState<string>(userBarangayId ? String(userBarangayId) : "");
  const [farmerNotes, setFarmerNotes] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [result, setResult] = useState<DiagnosisResult | null>(initialDiagnosis || null);
  const [activeTab, setActiveTab] = useState<"organic" | "chemical" | "cultural">("organic");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload from file or camera
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setErrorMsg(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Run AI analysis
  const runDiagnosis = async (imgOverride?: string, cropOverride?: string) => {
    const imgToUse = imgOverride || selectedImage;
    if (!imgToUse) {
      setErrorMsg("Please select or upload a crop photo first.");
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    // Multi-phase simulation for high-tech scanning HUD experience
    setScanStep("Inspecting plant leaf geometry and color vectors...");
    await new Promise((r) => setTimeout(r, 600));

    setScanStep("Cross-referencing Philippine crop pathogen database...");
    await new Promise((r) => setTimeout(r, 650));

    setScanStep("Calculating disease probability and DA treatment matrix...");
    await new Promise((r) => setTimeout(r, 600));

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imgToUse,
          cropType: cropOverride || selectedCrop,
          notes: farmerNotes,
          barangayId: selectedBarangay,
          farmerName: userName || "AgriShare Farmer",
        }),
      });

      const data = await response.json();
      if (data.success && data.diagnosis) {
        setResult(data.diagnosis);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network or processing error. Please try again with a clear photo.");
    } finally {
      setIsScanning(false);
      setScanStep("");
    }
  };

  const selectSample = (sample: typeof CROP_DISEASES_DB[0]) => {
    setSelectedImage(sample.sampleImageUrl);
    setSelectedCrop(sample.crop);
    setFarmerNotes(`Sample test for ${sample.diseaseName}`);
    setErrorMsg(null);
    runDiagnosis(sample.sampleImageUrl, sample.crop);
  };

  return (
    <div className="space-y-10">
      {/* Interactive Scanner Control Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Image Upload & Viewfinder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <SpotlightCard
            cursorText="CAMERA"
            className="border-emerald-950/15 !bg-[#0A1F14] text-white p-6 sm:p-8 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-lime-300 text-lg text-emerald-950">
                  🔬
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">AI Crop Health Scanner</h3>
                  <p className="text-xs text-lime-200/70">Doktor ng Taniman · Visual Diagnostic Engine</p>
                </div>
              </div>
              <PulsingStatus label="AI Model Active" tone="lime" />
            </div>

            {/* Viewfinder Canvas */}
            <div className="mt-6 relative flex flex-col items-center justify-center min-h-[320px] rounded-2xl border-2 border-dashed border-white/20 bg-black/40 overflow-hidden">
              {selectedImage ? (
                <div className="relative size-full min-h-[320px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Plant to diagnose"
                    className="max-h-[360px] w-full object-contain rounded-xl"
                  />

                  {/* Scanning Laser HUD Animation */}
                  {isScanning && (
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: ["0%", "280%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-lime-300 to-transparent shadow-[0_0_15px_#bef264,0_0_30px_#bef264]"
                    />
                  )}

                  {/* High-tech Viewfinder Overlays */}
                  <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl">
                    <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-lime-300 -translate-x-1 -translate-y-1" />
                    <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-lime-300 translate-x-1 -translate-y-1" />
                    <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-lime-300 -translate-x-1 translate-y-1" />
                    <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-lime-300 translate-x-1 translate-y-1" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/10 text-3xl">
                    📸
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">Take a photo or upload crop image</p>
                    <p className="text-xs text-white/60 max-w-sm mt-1">
                      Snap a clear, well-lit picture of affected leaves, stems, or fruits for maximum diagnostic accuracy.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-lime-300 px-5 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-lime-200"
                    >
                      📁 Browse / Take Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Scanning status banner */}
              {isScanning && (
                <div className="absolute bottom-3 inset-x-3 rounded-xl bg-[#0A1F14]/90 p-3 border border-lime-300/40 backdrop-blur text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin text-lime-300 text-sm">✦</span>
                    <span className="text-xs font-bold text-lime-200">{scanStep}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  🔄 Change Photo
                </button>
                {selectedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                    }}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                  >
                    Clear
                  </button>
                )}
              </div>

              {selectedImage && !isScanning && (
                <Magnetic strength={0.3}>
                  <button
                    type="button"
                    onClick={() => runDiagnosis()}
                    className="rounded-full bg-lime-300 px-6 py-2.5 text-xs font-black text-emerald-950 shadow-[0_0_25px_rgba(190,242,100,0.6)] transition hover:bg-lime-200 hover:scale-105"
                  >
                    🔍 Run Diagnostic AI Scan
                  </button>
                </Magnetic>
              )}
            </div>

            {errorMsg && (
              <p className="mt-3 rounded-xl bg-rose-500/20 border border-rose-400/40 p-3 text-xs text-rose-200 font-semibold">
                ⚠️ {errorMsg}
              </p>
            )}
          </SpotlightCard>

          {/* Quick-test 1-Click Samples */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
                ⚡ Quick Test Sample Library
              </p>
              <span className="text-[11px] text-slate-500">Tap any crop disease below to diagnose</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CROP_DISEASES_DB.slice(0, 4).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => selectSample(sample)}
                  className="group relative flex flex-col items-start p-3 rounded-2xl border border-emerald-950/10 bg-white shadow-sm hover:shadow-md hover:border-lime-400 transition text-left"
                >
                  <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700">
                    {sample.crop}: {sample.diseaseName}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{sample.localName}</span>
                  <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-lime-700 group-hover:underline">
                    Test Sample →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Controls & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <SpotlightCard className="p-6 bg-white space-y-4">
            <h4 className="font-display text-lg font-semibold text-emerald-950">Crop Context Parameters</h4>
            <p className="text-xs text-slate-500">
              Provide optional field context to boost AI classification confidence for your specific barangay plot.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Crop Type
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="auto">🤖 Auto-Detect from Photo</option>
                  <option value="Rice">🌾 Rice (Palay)</option>
                  <option value="Corn">🌽 Corn (Mais)</option>
                  <option value="Eggplant">🍆 Eggplant (Talong)</option>
                  <option value="Tomato">🍅 Tomato (Kamatis)</option>
                  <option value="Banana">🍌 Banana (Saging)</option>
                  <option value="Coconut">🥥 Coconut (Niyog)</option>
                  <option value="Chili / Pepper">🌶️ Chili / Pepper (Sili)</option>
                </select>
              </div>

              {barangays && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Farm Location / Barangay
                  </label>
                  <select
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    <option value="">Select Barangay in Baco...</option>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        Brgy. {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Visible Symptoms / Farmer Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={farmerNotes}
                  onChange={(e) => setFarmerNotes(e.target.value)}
                  placeholder="e.g. Diamond brown spots after continuous monsoon rains..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Scientific reference: DA-PhilRice / BPI</span>
              <span>Oriental Mindoro Protocol</span>
            </div>
          </SpotlightCard>

          {/* Quick FAQ / Guidance */}
          <div className="rounded-2xl border border-emerald-950/10 bg-emerald-50/50 p-5 space-y-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
              💡 Tips for Best Scanning Results:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Focus closely on the border between healthy green tissue and diseased lesions.</li>
              <li>Avoid extreme backlighting or blurry camera movement.</li>
              <li>For fruit borers or worms, capture the entry hole and surrounding frass.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Diagnostic Result Presentation (Generated on scan) */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 pt-4"
          >
            {/* Top Diagnostic Prescription Certificate Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0A1F14] text-white p-7 sm:p-10 shadow-[0_24px_60px_-20px_rgba(10,31,20,0.6)] border border-lime-300/30">
              <div className="grain" aria-hidden />
              <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-lime-300 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-950">
                      ✓ AI Confirmed Diagnosis
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-black ${
                        result.severity === "Severe"
                          ? "bg-rose-500 text-white"
                          : result.severity === "Moderate"
                          ? "bg-amber-400 text-emerald-950"
                          : "bg-emerald-500 text-white"
                      }`}
                    >
                      {result.severity} Severity
                    </span>
                    <span className="text-xs text-white/60">Target Crop: {result.crop}</span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-white mt-3">
                    {result.diseaseName}
                  </h2>
                  <p className="text-sm font-semibold text-lime-200 mt-1">
                    Tagalog: {result.localName} · <em>{result.scientificName}</em>
                  </p>
                  <p className="text-xs text-white/70 max-w-2xl mt-3 leading-relaxed">
                    {result.description}
                  </p>
                </div>

                {/* Accuracy Radial Meter */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur text-center min-w-[130px]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime-300">Confidence</span>
                  <span className="font-display text-4xl font-black text-white mt-1">
                    {result.confidence}%
                  </span>
                  <span className="text-[10px] text-white/60 mt-0.5">Visual Match Score</span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="relative mt-8 flex flex-wrap items-center gap-3 border-t border-white/15 pt-6">
                <Link
                  href="/dashboard/requests/new"
                  className="rounded-full bg-lime-300 px-5 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-lime-200"
                >
                  🚜 Request Knapsack Sprayer / Inputs
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  🧑‍🌾 Request MAO Technologist Farm Visit
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10"
                >
                  🖨️ Print Prescription
                </button>
              </div>
            </div>

            {/* Detailed Diagnostic Tabs & Symptom Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left 5 cols: Key Visual Symptoms & Cause triggers */}
              <div className="lg:col-span-5 space-y-6">
                <SpotlightCard className="p-6 bg-white space-y-4">
                  <h4 className="font-display text-base font-bold text-emerald-950 flex items-center gap-2">
                    <span>🔍</span> Key Identified Symptoms
                  </h4>
                  <ul className="space-y-2.5">
                    {result.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-slate-100">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Environmental Triggers & Causes:
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                      {result.causes}
                    </p>
                  </div>
                </SpotlightCard>
              </div>

              {/* Right 7 cols: Interactive Treatment & Control Matrix */}
              <div className="lg:col-span-7 space-y-6">
                <SpotlightCard className="p-6 bg-white space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h4 className="font-display text-base font-bold text-emerald-950">
                      Recommended Treatment & Control Protocol
                    </h4>
                    {/* Tab Switcher */}
                    <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveTab("organic")}
                        className={`rounded-lg px-3 py-1.5 transition ${
                          activeTab === "organic"
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🌿 Organic
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("chemical")}
                        className={`rounded-lg px-3 py-1.5 transition ${
                          activeTab === "chemical"
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🧪 DA-Approved
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("cultural")}
                        className={`rounded-lg px-3 py-1.5 transition ${
                          activeTab === "cultural"
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🌾 Cultural
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents */}
                  <div>
                    {activeTab === "organic" && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 font-semibold">
                          Organic and biological treatments safe for beneficial pollinators:
                        </p>
                        <ul className="space-y-2">
                          {result.organicTreatments.map((t, idx) => (
                            <li
                              key={idx}
                              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950 font-medium flex items-start gap-2"
                            >
                              <span className="text-emerald-700 font-bold">🌱</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === "chemical" && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 font-semibold">
                          Standardized DA / PhilRice protective rates for knapsack sprayers:
                        </p>
                        <ul className="space-y-2">
                          {result.chemicalTreatments.map((t, idx) => (
                            <li
                              key={idx}
                              className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-950 font-medium flex items-start gap-2"
                            >
                              <span className="text-sky-700 font-bold">🧪</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === "cultural" && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 font-semibold">
                          Sanitation, spacing, and water management controls:
                        </p>
                        <ul className="space-y-2">
                          {result.culturalControl.map((t, idx) => (
                            <li
                              key={idx}
                              className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950 font-medium flex items-start gap-2"
                            >
                              <span className="text-amber-700 font-bold">🌾</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Prevention Note */}
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                    <p className="text-xs font-bold text-slate-800">🛡️ Long-Term Prevention:</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{result.prevention}</p>
                  </div>
                </SpotlightCard>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
