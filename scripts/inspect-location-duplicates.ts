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
    console.log("\nSTAGE 2C — LOCATION DUPLICATE / LEGACY VERIFICATION");
    console.log("====================================================");

    // 1. Counties
    const counties = await prisma.county.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            subCounties: true,
            wards: true,
            farmers: true,
            farms: true,
          },
        },
      },
    });

    console.log("\nCOUNTIES");
    console.log("========");

    for (const county of counties) {
      console.log(
        `${county.id} | ${county.name} | code=${county.code ?? "NULL"} | ` +
        `SubCounties=${county._count.subCounties} | ` +
        `Wards=${county._count.wards} | ` +
        `Farmers=${county._count.farmers} | ` +
        `Farms=${county._count.farms}`
      );
    }

    // 2. SubCounties with no wards
    const emptySubCounties = await prisma.subCounty.findMany({
      where: {
        wards: {
          none: {},
        },
      },
      orderBy: [
        { countyId: "asc" },
        { name: "asc" },
      ],
      include: {
        county: true,
      },
    });

    console.log("\nSUBCOUNTIES WITHOUT WARDS");
    console.log("=========================");

    console.log(`Total: ${emptySubCounties.length}`);

    for (const sc of emptySubCounties) {
      console.log(
        `${sc.id} | ${sc.name} | County: ${sc.county.name} (${sc.countyId})`
      );
    }

    // 3. SubCounties grouped by county/name
    const allSubCounties = await prisma.subCounty.findMany({
      orderBy: [
        { countyId: "asc" },
        { name: "asc" },
      ],
      include: {
        county: true,
        _count: {
          select: {
            wards: true,
            farmers: true,
            farms: true,
          },
        },
      },
    });

    console.log("\nALL SUBCOUNTIES");
    console.log("===============");

    for (const sc of allSubCounties) {
      console.log(
        `${sc.id} | ${sc.name} | County: ${sc.county.name} (${sc.countyId}) | ` +
        `Wards=${sc._count.wards} | Farmers=${sc._count.farmers} | Farms=${sc._count.farms}`
      );
    }

    // 4. Potential duplicate subcounty names within the same county
    const grouped = new Map<string, typeof allSubCounties>();

    for (const sc of allSubCounties) {
      const key = `${sc.countyId}::${sc.name.trim().toLowerCase()}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(sc);
    }

    console.log("\nEXACT DUPLICATE SUBCOUNTY NAMES");
    console.log("===============================");

    let duplicateCount = 0;

    for (const [key, records] of grouped.entries()) {
      if (records.length > 1) {
        duplicateCount++;

        console.log(`\n${key}`);

        for (const sc of records) {
          console.log(
            `  ID=${sc.id} | ${sc.name} | Wards=${sc._count.wards} | ` +
            `Farmers=${sc._count.farmers} | Farms=${sc._count.farms}`
          );
        }
      }
    }

    console.log(`\nExact duplicate groups: ${duplicateCount}`);

    // 5. Similar county names
    console.log("\nCOUNTIES WITH NORMALIZED NAMES");
    console.log("==============================");

    const countyGroups = new Map<string, typeof counties>();

    for (const county of counties) {
      const key = county.name.trim().toLowerCase();

      if (!countyGroups.has(key)) {
        countyGroups.set(key, []);
      }

      countyGroups.get(key)!.push(county);
    }

    for (const [name, records] of countyGroups.entries()) {
      if (records.length > 1) {
        console.log(`\n${name}`);

        for (const county of records) {
          console.log(
            `  ID=${county.id} | Name=${county.name} | Code=${county.code ?? "NULL"} | ` +
            `SubCounties=${county._count.subCounties} | Wards=${county._count.wards}`
          );
        }
      }
    }

    console.log("\nSTAGE 2C COMPLETE");
    console.log("==================");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});