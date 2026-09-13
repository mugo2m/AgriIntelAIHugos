import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const soilTypes = await prisma.soilType.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        phMin: true,
        phMax: true,
      },
    });

    return NextResponse.json(soilTypes, {
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/soil-types error:", error);

    return NextResponse.json(
      {
        error: "Failed to load soil types.",
      },
      {
        status: 500,
      },
    );
  }
}