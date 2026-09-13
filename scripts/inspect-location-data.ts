import "dotenv/config";
import { PrismaClient } from "./lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  });

  try {
    const counties = await prisma.county.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            subCounties: true,
            wards: true,
          },
        },
      },
    });

    console.log("\n=== COUNTIES ===");
    console.log(JSON.stringify(counties, null, 2));

    const subCounties = await prisma.subCounty.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        countyId: true,
        _count: {
          select: {
            wards: true,
          },
        },
      },
    });

    console.log("\n=== SUB-COUNTIES ===");
    console.log(JSON.stringify(subCounties, null, 2));

    const wards = await prisma.ward.findMany({
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        countyId: true,
        subCountyId: true,
      },
    });

    console.log("\n=== FIRST 50 WARDS ===");
    console.log(JSON.stringify(wards, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});