// scripts/repair-duplicate-constituency-lungalunga.ts
//
// SAFE TRANSACTIONAL REPAIR
//
// Merge duplicate Constituency 445 (Lungalunga)
// into canonical Constituency 444 (Lunga Lunga).
//
// BEFORE:
//   444 Lunga Lunga -> 1 ward
//   445 Lungalunga  -> 3 wards
//
// AFTER:
//   444 Lunga Lunga -> 4 wards
//   445             -> deleted
//
// This script modifies ONLY:
//   - Ward.constituencyId for wards currently assigned to 445
//   - Constituency 445 (deleted)
//
// County and SubCounty records are NOT modified.

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const CANONICAL_CONSTITUENCY_ID = 444;
const DUPLICATE_CONSTITUENCY_ID = 445;

async function main() {
  console.log("=".repeat(100));
  console.log("LUNGA LUNGA DUPLICATE CONSTITUENCY REPAIR");
  console.log("=".repeat(100));
  console.log();

  console.log("Canonical Constituency:");
  console.log("  ID 444 | Lunga Lunga");
  console.log();

  console.log("Duplicate Constituency:");
  console.log("  ID 445 | Lungalunga");
  console.log();

  console.log("Planned operation:");
  console.log("  Move wards 445 -> 444");
  console.log("  Delete constituency 445");
  console.log();

  const result = await prisma.$transaction(async (tx) => {
    const canonical = await tx.constituency.findUnique({
      where: {
        id: CANONICAL_CONSTITUENCY_ID,
      },
      include: {
        county: true,
        wards: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    const duplicate = await tx.constituency.findUnique({
      where: {
        id: DUPLICATE_CONSTITUENCY_ID,
      },
      include: {
        county: true,
        wards: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!canonical) {
      throw new Error(
        `Canonical constituency ${CANONICAL_CONSTITUENCY_ID} does not exist.`,
      );
    }

    if (!duplicate) {
      throw new Error(
        `Duplicate constituency ${DUPLICATE_CONSTITUENCY_ID} does not exist.`,
      );
    }

    if (canonical.countyId !== duplicate.countyId) {
      throw new Error(
        `SAFETY STOP: County mismatch. Canonical countyId=${canonical.countyId}, duplicate countyId=${duplicate.countyId}`,
      );
    }

    console.log("PRE-REPAIR VERIFICATION");
    console.log("-".repeat(100));
    console.log(
      `Canonical: ${canonical.id} | ${canonical.name} | County: ${canonical.county?.name}`,
    );
    console.log(`Canonical wards: ${canonical.wards.length}`);
    console.log(
      `Duplicate: ${duplicate.id} | ${duplicate.name} | County: ${duplicate.county?.name}`,
    );
    console.log(`Duplicate wards: ${duplicate.wards.length}`);
    console.log();

    if (canonical.wards.length !== 1) {
      throw new Error(
        `SAFETY STOP: Expected canonical constituency 444 to have exactly 1 ward, found ${canonical.wards.length}.`,
      );
    }

    if (duplicate.wards.length !== 3) {
      throw new Error(
        `SAFETY STOP: Expected duplicate constituency 445 to have exactly 3 wards, found ${duplicate.wards.length}.`,
      );
    }

    console.log("WARDS TO BE MOVED");
    console.log("-".repeat(100));

    for (const ward of duplicate.wards) {
      console.log(
        `ID ${ward.id} | ${ward.name} | SubCounty ${ward.subCountyId}`,
      );
    }

    console.log();

    const moved = await tx.ward.updateMany({
      where: {
        constituencyId: DUPLICATE_CONSTITUENCY_ID,
      },
      data: {
        constituencyId: CANONICAL_CONSTITUENCY_ID,
      },
    });

    console.log(`Moved wards: ${moved.count}`);

    if (moved.count !== duplicate.wards.length) {
      throw new Error(
        `SAFETY STOP: Expected to move ${duplicate.wards.length} wards but moved ${moved.count}.`,
      );
    }

    const remaining = await tx.ward.count({
      where: {
        constituencyId: DUPLICATE_CONSTITUENCY_ID,
      },
    });

    if (remaining !== 0) {
      throw new Error(
        `SAFETY STOP: ${remaining} wards still reference duplicate constituency 445.`,
      );
    }

    const updatedCanonicalWardCount = await tx.ward.count({
      where: {
        constituencyId: CANONICAL_CONSTITUENCY_ID,
      },
    });

    if (updatedCanonicalWardCount !== 4) {
      throw new Error(
        `SAFETY STOP: Expected canonical constituency 444 to have 4 wards after repair, found ${updatedCanonicalWardCount}.`,
      );
    }

    await tx.constituency.delete({
      where: {
        id: DUPLICATE_CONSTITUENCY_ID,
      },
    });

    const deletedCheck = await tx.constituency.findUnique({
      where: {
        id: DUPLICATE_CONSTITUENCY_ID,
      },
    });

    if (deletedCheck !== null) {
      throw new Error(
        "SAFETY STOP: Duplicate constituency 445 still exists after delete.",
      );
    }

    return {
      movedWards: moved.count,
      canonicalWardCount: updatedCanonicalWardCount,
    };
  });

  console.log();
  console.log("=".repeat(100));
  console.log("REPAIR COMPLETED SUCCESSFULLY");
  console.log("=".repeat(100));
  console.log();
  console.log(`Wards moved:              ${result.movedWards}`);
  console.log(`Lunga Lunga wards:        ${result.canonicalWardCount}`);
  console.log("Duplicate 445:            DELETED");
  console.log();
  console.log("No County records changed.");
  console.log("No SubCounty records changed.");
  console.log("No other Constituency records changed.");
  console.log();
  console.log("🟢 TRANSACTION COMMITTED");
  console.log("=".repeat(100));
}

main()
  .catch((error) => {
    console.error();
    console.error("🔴 REPAIR FAILED — TRANSACTION ROLLED BACK");
    console.error();
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });