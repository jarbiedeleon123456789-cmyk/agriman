import { NextResponse } from "next/server";
import { db } from "@/db";
import { plantDiagnoses, auditLogs, notifications, users } from "@/db/mysql-schema";
import { getCurrentUser } from "@/lib/session";
import { analyzePlantImage } from "@/lib/plant-ai";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      imageUrl,
      cropType,
      notes,
      barangayId,
      farmerName,
    } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image data or photo is required for plant diagnosis." },
        { status: 400 }
      );
    }

    // Run AI diagnostic engine
    const diagnosis = analyzePlantImage(imageUrl, cropType, notes);

    // Save diagnosis to database
    let savedId: number | null = null;
    try {
      const inserted = await db
        .insert(plantDiagnoses)
        .values({
          userId: user?.id ?? null,
          farmerName: farmerName || user?.name || "Guest Farmer",
          barangayId: barangayId ? Number(barangayId) : user?.barangayId ?? null,
          cropType: diagnosis.crop,
          diseaseName: diagnosis.diseaseName,
          scientificName: diagnosis.scientificName,
          confidence: diagnosis.confidence.toFixed(2),
          severity: diagnosis.severity,
          imageUrl: imageUrl.length > 500000 ? imageUrl.slice(0, 50000) : imageUrl, // handle payload length safely
          symptoms: diagnosis.symptoms,
          causes: diagnosis.causes,
          treatments: {
            organic: diagnosis.organicTreatments,
            chemical: diagnosis.chemicalTreatments,
            cultural: diagnosis.culturalControl,
          },
          prevention: diagnosis.prevention,
          status: diagnosis.severity === "Severe" ? "Pending Review" : "Verified by MAO",
          technologistNotes: diagnosis.technologistAdvisory,
        })
        .$returningId();

      savedId = inserted[0]?.id ?? null;

      // Log in audit trail
      if (user) {
        await db.insert(auditLogs).values({
          userId: user.id,
          userName: user.name,
          action: "DIAGNOSE",
          module: "AI Crop Doctor",
          recordId: `DIAG-${savedId}`,
          details: `AI diagnosis detected ${diagnosis.diseaseName} on ${diagnosis.crop} (${diagnosis.confidence}% confidence).`,
        });

        // Notify user
        await db.insert(notifications).values({
          userId: user.id,
          type: "ai_diagnosis",
          title: `AI Diagnosis: ${diagnosis.diseaseName}`,
          message: `Detected ${diagnosis.diseaseName} (${diagnosis.severity} severity) on ${diagnosis.crop}. Tap to view prescription and treatments.`,
          link: `/diagnostics?id=${savedId}`,
        });
      }

      // If severe, alert MAO staff
      if (diagnosis.severity === "Severe") {
        const staffUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(sql`${users.role} in ('admin', 'staff')`);

        for (const staff of staffUsers) {
          await db.insert(notifications).values({
            userId: staff.id,
            type: "alert",
            title: `Severe Crop Outbreak Alert: ${diagnosis.diseaseName}`,
            message: `A farmer submitted a plant scan detecting ${diagnosis.diseaseName} (${diagnosis.crop}) in Baco. Technologist review advised.`,
            link: `/dashboard/diagnostics?id=${savedId}`,
          });
        }
      }
    } catch (dbError) {
      console.error("Diagnosis database recording error:", dbError);
      // Still return the diagnosis even if DB recording has an issue
    }

    return NextResponse.json({
      success: true,
      id: savedId,
      diagnosis,
    });
  } catch (error) {
    console.error("AI diagnosis endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to process plant diagnosis. Please check image format and try again." },
      { status: 500 }
    );
  }
}
