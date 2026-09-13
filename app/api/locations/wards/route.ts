import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const countyId = Number(searchParams.get("countyId"));
    const subCountyId = Number(searchParams.get("subCountyId"));
    const constituencyId = Number(searchParams.get("constituencyId"));

    if (
      !Number.isInteger(countyId) ||
      countyId <= 0 ||
      !Number.isInteger(subCountyId) ||
      subCountyId <= 0 ||
      !Number.isInteger(constituencyId) ||
      constituencyId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "countyId, subCountyId and constituencyId are required.",
        },
        { status: 400 },
      );
    }

    const wards = await prisma.ward.findMany({
      where: {
        countyId,
        subCountyId,
        constituencyId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        countyId: true,
        subCountyId: true,
        constituencyId: true,
      },
    });

    return NextResponse.json(wards, { status: 200 });
  } catch (error) {
    console.error("GET /api/locations/wards error:", error);

    return NextResponse.json(
      {
        error: "Failed to load wards.",
      },
      { status: 500 },
    );
  }
}