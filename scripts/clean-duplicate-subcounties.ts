
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

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+sub\s+county$/i, "")
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("CLEANING DUPLICATE SUBCOUNTIES");
  console.log("==============================================");

  const subCounties = await prisma.subCounty.findMany({
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

  console.log(`Loaded: ${subCounties.length} SubCounty records`);
  console.log("Scanning...");
  console.log("");

  const groups = new Map<string, typeof subCounties>();

  for (const sc of subCounties) {
    const key = `${normalize(sc.county.name)}::${normalize(sc.name)}`;

    const existing = groups.get(key) ?? [];
    existing.push(sc);
    groups.set(key, existing);
  }

  const duplicates = [...groups.entries()].filter(
    ([, records]) => records.length > 1
  );

  if (duplicates.length === 0) {
    console.log("RESULT: No duplicates found.");
    return;
  }

  console.log(`Duplicate groups found: ${duplicates.length}`);
  console.log("");

  let deleted = 0;
  let skipped = 0;

  const skippedRecords: string[] = [];
  const deletedRecords: string[] = [];

  for (const [key, records] of duplicates) {
    const withWards = records.filter(
      (record) => record.wards.length > 0
    );

    let keep: (typeof records)[number];

    // Exactly one record has wards: keep it.
    if (withWards.length === 1) {
      keep = withWards[0];
    }

    // More than one has wards: do NOT touch this group.
    else if (withWards.length > 1) {
      skipped++;

      skippedRecords.push(
        `${key} -> multiple records contain wards`
      );

      continue;
    }

    // None has wards: keep oldest ID.
    else {
      keep = records[0];
    }

    for (const candidate of records) {
      if (candidate.id === keep.id) {
        continue;
      }

      const references =
        candidate.wards.length +
        candidate.farms.length +
        candidate.farmers.length +
        candidate.businessPartners.length +
        candidate.sourceTransactions.length +
        candidate.destinationTransactions.length;

      if (references > 0) {
        skipped++;

        skippedRecords.push(
          `${key} -> ID ${candidate.id} "${candidate.name}" has ${references} references`
        );

        continue;
      }

      await prisma.subCounty.delete({
        where: {
          id: candidate.id,
        },
      });

      deleted++;

      deletedRecords.push(
        `${key} -> deleted ID ${candidate.id} "${candidate.name}"`
      );
    }
  }

  console.log("==============================================");
  console.log("CLEANUP COMPLETE");
  console.log("==============================================");
  console.log(`Original records: ${subCounties.length}`);
  console.log(`Duplicate groups: ${duplicates.length}`);
  console.log(`Records deleted: ${deleted}`);
  console.log(`Records skipped: ${skipped}`);
  console.log("");

  if (deletedRecords.length > 0) {
    console.log("DELETED:");
    for (const record of deletedRecords) {
      console.log(`  ${record}`);
    }
    console.log("");
  }

  if (skippedRecords.length > 0) {
    console.log("SKIPPED FOR SAFETY:");

    for (const record of skippedRecords) {
      console.log(`  ${record}`);
    }

    console.log("");
    console.log(
      "These require manual review."
    );
  } else {
    console.log(
      "No duplicate records were skipped."
    );
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("CLEANUP FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


