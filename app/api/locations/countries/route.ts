import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error("Failed to fetch countries:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch countries",
      },
      {
        status: 500,
      },
    );
  }
}