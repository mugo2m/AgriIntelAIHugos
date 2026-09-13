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
  console.log("Checking duplicate Migori / Awendo SubCounty records...");
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
        in: ["Awendo", "Awendo Sub County"],
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

  if (records.length < 2) {
    console.log("");
    console.log("No duplicate Awendo records found.");
    return;
  }

  const unused = records.filter(
    (record) =>
      record._count.wards === 0 &&
      record._count.farms === 0 &&
      record._count.farmers === 0 &&
      record._count.businessPartners === 0 &&
      record._count.sourceTransactions === 0 &&
      record._count.destinationTransactions === 0,
  );

  const used = records.filter(
    (record) =>
      record._count.wards > 0 ||
      record._count.farms > 0 ||
      record._count.farmers > 0 ||
      record._count.businessPartners > 0 ||
      record._count.sourceTransactions > 0 ||
      record._count.destinationTransactions > 0,
  );

  if (used.length !== 1 || unused.length !== 1) {
    throw new Error(
      "Safety check failed: expected exactly one used record and one unused duplicate.",
    );
  }

  const keep = used[0];
  const remove = unused[0];

  console.log("");
  console.log(`KEEPING ID ${keep.id}: "${keep.name}"`);
  console.log(`DELETING ID ${remove.id}: "${remove.name}"`);
  console.log("");

  await prisma.subCounty.delete({
    where: {
      id: remove.id,
    },
  });

  console.log(`Successfully deleted duplicate ID ${remove.id}.`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Failed to remove duplicate Awendo record.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });