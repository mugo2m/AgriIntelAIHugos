import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [
      genders,
      educationLevels,
      occupations,
      maritalStatuses,
      farmerTypes,
      farmingActivities,
      languages,
      communicationPreferences,
      digitalLiteracyLevels,
    ] = await Promise.all([
      prisma.gender.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.educationLevel.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.occupation.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.maritalStatus.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.farmerType.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.farmingActivity.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.language.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.communicationPreference.findMany({
        orderBy: { name: "asc" },
      }),

      prisma.digitalLiteracyLevel.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json(
      {
        genders,
        educationLevels,
        occupations,
        maritalStatuses,
        farmerTypes,
        farmingActivities,
        languages,
        communicationPreferences,
        digitalLiteracyLevels,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/farmers/options error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load farmer options.",
      },
      { status: 500 }
    );
  }
}