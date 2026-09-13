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
  console.log("Checking Migori / Nyatike SubCounty records...");
  console.log("");

  const records = await prisma.subCounty.findMany({
    where: {
      county: {
        name: {
          equals: "Migori",
          mode: "insensitive",
        },
      },
      name: {
        in: ["Nyatike", "Nyatike Sub County"],
        mode: "insensitive",
      },
    },
    include: {
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
      county: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(
    records.map((record) => ({
      id: record.id,
      name: record.name,
      countyId: record.countyId,
      county: record.county.name,
      wards: record._count.wards,
      farms: record._count.farms,
      farmers: record._count.farmers,
      businessPartners: record._count.businessPartners,
      sourceTransactions: record._count.sourceTransactions,
      destinationTransactions: record._count.destinationTransactions,
    })),
  );

  console.log("");
  console.log(`Records found: ${records.length}`);

  if (records.length > 1) {
    console.log("");
    console.log("Duplicate Nyatike records detected.");
  } else {
    console.log("");
    console.log("No duplicate Nyatike records detected.");
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("Failed to inspect Nyatike records.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });