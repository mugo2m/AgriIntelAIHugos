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
    const totalSubCounties = await prisma.subCounty.count();

    const subCountiesWithoutWards = await prisma.subCounty.count({
      where: {
        wards: {
          none: {},
        },
      },
    });

    const wardsWithEmptyNames = await prisma.ward.count({
      where: {
        name: "",
      },
    });

    const duplicateWardNames = await prisma.$queryRawUnsafe(`
      SELECT
        "countyId",
        "subCountyId",
        LOWER(TRIM(name)) AS normalized_name,
        COUNT(*) AS occurrences
      FROM "Ward"
      GROUP BY
        "countyId",
        "subCountyId",
        LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY occurrences DESC
    `);

    const wardDistribution = await prisma.$queryRawUnsafe(`
      SELECT
        c.id AS county_id,
        c.name AS county,
        sc.id AS subcounty_id,
        sc.name AS subcounty,
        COUNT(w.id) AS ward_count
      FROM "County" c
      JOIN "SubCounty" sc
        ON sc."countyId" = c.id
      LEFT JOIN "Ward" w
        ON w."subCountyId" = sc.id
      GROUP BY
        c.id,
        c.name,
        sc.id,
        sc.name
      ORDER BY
        c.name,
        sc.name
    `);

    console.log("\nSTAGE 2B — ACTUAL LOCATION DATA");
    console.log("================================");

    console.log("Total SubCounties:", totalSubCounties);
    console.log("SubCounties without wards:", subCountiesWithoutWards);
    console.log("Wards with empty names:", wardsWithEmptyNames);

    console.log("\nDUPLICATE WARD NAMES");
    console.log("====================");

    console.log(
      JSON.stringify(
        duplicateWardNames,
        (_, value) =>
          typeof value === "bigint" ? Number(value) : value,
        2
      )
    );

    console.log("\nSUBCOUNTY → WARD DISTRIBUTION");
    console.log("=============================");

    console.log(
      JSON.stringify(
        wardDistribution,
        (_, value) =>
          typeof value === "bigint" ? Number(value) : value,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});