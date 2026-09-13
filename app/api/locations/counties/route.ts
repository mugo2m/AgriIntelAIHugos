import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const countryId = Number(
      searchParams.get("countryId"),
    );

    if (!countryId || Number.isNaN(countryId)) {
      return NextResponse.json(
        {
          error: "A valid countryId is required",
        },
        {
          status: 400,
        },
      );
    }

    const counties = await prisma.county.findMany({
      where: {
        countryId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        countryId: true,
      },
    });

    return NextResponse.json(counties);
  } catch (error) {
    console.error("Failed to fetch counties:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch counties",
      },
      {
        status: 500,
      },
    );
  }
}