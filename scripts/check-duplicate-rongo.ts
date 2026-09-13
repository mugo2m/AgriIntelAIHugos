import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("");
  console.log("Checking Migori / Rongo SubCounty records...");
  console.log("");

  const rows = await prisma.subCounty.findMany({
    where: {
      name: {
        contains: "Rongo",
        mode: "insensitive",
      },
      county: {
        name: {
          equals: "Migori",
          mode: "insensitive",
        },
      },
    },
    include: {
      county: true,
      wards: true,
      farms: true,
      farmers: true,
      businessPartners: true,
      sourceTransactions: true,
      destinationTransactions: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      countyId: row.countyId,
      county: row.county.name,
      wards: row.wards.length,
      farms: row.farms.length,
      farmers: row.farmers.length,
      businessPartners: row.businessPartners.length,
      sourceTransactions: row.sourceTransactions.length,
      destinationTransactions: row.destinationTransactions.length,
    }))
  );

  console.log("");
  console.log(`Records found: ${rows.length}`);
  console.log("");

  if (rows.length > 1) {
    console.log("Duplicate Rongo records detected.");
  } else {
    console.log("No duplicate Rongo records found.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });