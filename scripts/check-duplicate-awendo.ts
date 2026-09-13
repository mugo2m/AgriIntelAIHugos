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
  console.log("Checking Migori / Awendo SubCounty records...");
  console.log("");

  const rows = await prisma.subCounty.findMany({
    where: {
      name: {
        contains: "Awendo",
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
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          sourceTransactions: true,
          destinationTransactions: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(
    rows.map((sc) => ({
      id: sc.id,
      name: sc.name,
      countyId: sc.countyId,
      county: sc.county.name,
      wards: sc._count.wards,
      farms: sc._count.farms,
      farmers: sc._count.farmers,
      businessPartners: sc._count.businessPartners,
      sourceTransactions: sc._count.sourceTransactions,
      destinationTransactions: sc._count.destinationTransactions,
    }))
  );

  console.log("");
  console.log(`Records found: ${rows.length}`);
  console.log("");

  if (rows.length <= 1) {
    console.log("No duplicate Awendo records found.");
  } else {
    console.log("Duplicate Awendo records detected.");
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("Check failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });