
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
  console.log("Checking Kericho / Soin Sigowet SubCounty records...");
  console.log("");

  const records = await prisma.subCounty.findMany({
    where: {
      county: {
        name: {
          equals: "Kericho",
          mode: "insensitive",
        },
      },
      OR: [
        {
          name: {
            contains: "Soin",
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: "Sigowet",
            mode: "insensitive",
          },
        },
      ],
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
    records.map((row) => ({
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
  console.log(`Records found: ${records.length}`);
  console.log("");

  if (records.length === 0) {
    console.log("No Soin Sigowet records found.");
  } else {
    console.log("These are the records causing the generator conflict.");
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Check failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

