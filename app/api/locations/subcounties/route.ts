import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const countyId = Number(
      searchParams.get("countyId"),
    );

    if (!countyId || Number.isNaN(countyId)) {
      return NextResponse.json(
        {
          error: "A valid countyId is required",
        },
        {
          status: 400,
        },
      );
    }

    const subCounties =
      await prisma.subCounty.findMany({
        where: {
          countyId,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      });

    return NextResponse.json(subCounties);
  } catch (error) {
    console.error(
      "Failed to fetch subcounties:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch subcounties",
      },
      {
        status: 500,
      },
    );
  }
}