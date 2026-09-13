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

// =======================================================
// AUTHORITATIVE TIATY WARDS
// =======================================================

const originalWardIds = [
  1840, // Silale
  1841, // Loiyamorok
  2190, // Tangulbei/korossi
  2193, // Churo/amaya
];

const duplicateWardIds = [
  2629, // Churo/amaya
  2630, // Loiyamorok
  2631, // Silale
  2632, // Tangulbei/korossi
];

const TARGET_SUBCOUNTY_ID = 463;
const OLD_SUBCOUNTY_ID = 757;
const COUNTY_ID = 90;
const CONSTITUENCY_ID = 463;

// =======================================================
// MAIN
// =======================================================

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("FIX TIATY DUPLICATE WARDS");
  console.log("============================================================");
  console.log("READ + VALIDATE + TARGETED UPDATE");
  console.log("============================================================");
  console.log("");

  // =====================================================
  // LOAD ORIGINAL RECORDS
  // =====================================================

  const originalWards =
    await prisma.ward.findMany({
      where: {
        id: {
          in: originalWardIds,
        },
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
        countyId: true,
        constituencyId: true,
        sourceGid: true,
        sourceUid: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Original wards found: ${originalWards.length}`
  );

  // =====================================================
  // LOAD DUPLICATE RECORDS
  // =====================================================

  const duplicateWards =
    await prisma.ward.findMany({
      where: {
        id: {
          in: duplicateWardIds,
        },
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
        countyId: true,
        constituencyId: true,
        sourceGid: true,
        sourceUid: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Duplicate wards found: ${duplicateWards.length}`
  );

  // =====================================================
  // VALIDATE EXACT EXPECTED RECORDS
  // =====================================================

  if (
    originalWards.length !==
    originalWardIds.length
  ) {
    throw new Error(
      `Expected ${originalWardIds.length} original wards, ` +
        `but found ${originalWards.length}.`
    );
  }

  if (
    duplicateWards.length !==
    duplicateWardIds.length
  ) {
    throw new Error(
      `Expected ${duplicateWardIds.length} duplicate wards, ` +
        `but found ${duplicateWards.length}.`
    );
  }

  // =====================================================
  // VALIDATE ORIGINAL WARDS
  // =====================================================

  for (const ward of originalWards) {
    if (
      ward.subCountyId !==
      OLD_SUBCOUNTY_ID
    ) {
      throw new Error(
        `Original Ward ${ward.id} (${ward.name}) ` +
          `is expected under SubCounty ${OLD_SUBCOUNTY_ID}, ` +
          `but is under ${ward.subCountyId}.`
      );
    }

    if (ward.countyId !== COUNTY_ID) {
      throw new Error(
        `Original Ward ${ward.id} (${ward.name}) ` +
          `has countyId ${ward.countyId}, ` +
          `expected ${COUNTY_ID}.`
      );
    }

    if (
      ward.constituencyId !==
      CONSTITUENCY_ID
    ) {
      throw new Error(
        `Original Ward ${ward.id} (${ward.name}) ` +
          `has constituencyId ${ward.constituencyId}, ` +
          `expected ${CONSTITUENCY_ID}.`
      );
    }

    if (
      ward.sourceGid === null ||
      ward.sourceUid === null
    ) {
      throw new Error(
        `Original Ward ${ward.id} (${ward.name}) ` +
          `is missing sourceGid or sourceUid.`
      );
    }
  }

  // =====================================================
  // VALIDATE DUPLICATES
  // =====================================================

  for (const ward of duplicateWards) {
    if (
      ward.subCountyId !==
      TARGET_SUBCOUNTY_ID
    ) {
      throw new Error(
        `Duplicate Ward ${ward.id} (${ward.name}) ` +
          `is expected under SubCounty ${TARGET_SUBCOUNTY_ID}, ` +
          `but is under ${ward.subCountyId}.`
      );
    }

    if (ward.countyId !== COUNTY_ID) {
      throw new Error(
        `Duplicate Ward ${ward.id} (${ward.name}) ` +
          `has countyId ${ward.countyId}, ` +
          `expected ${COUNTY_ID}.`
      );
    }

    if (
      ward.constituencyId !==
      CONSTITUENCY_ID
    ) {
      throw new Error(
        `Duplicate Ward ${ward.id} (${ward.name}) ` +
          `has constituencyId ${ward.constituencyId}, ` +
          `expected ${CONSTITUENCY_ID}.`
      );
    }
  }

  // =====================================================
  // VALIDATE SOURCE IDENTIFIERS MATCH
  // =====================================================

  const originalBySourceGid =
    new Map<
      number,
      {
        id: number;
        name: string;
        sourceUid: string;
      }
    >();

  for (const ward of originalWards) {
    if (
      ward.sourceGid === null ||
      ward.sourceUid === null
    ) {
      throw new Error(
        `Ward ${ward.id} has invalid source identifiers.`
      );
    }

    originalBySourceGid.set(
      ward.sourceGid,
      {
        id: ward.id,
        name: ward.name,
        sourceUid: ward.sourceUid,
      }
    );
  }

  for (const duplicate of duplicateWards) {
    if (
      duplicate.sourceGid === null ||
      duplicate.sourceUid === null
    ) {
      throw new Error(
        `Duplicate Ward ${duplicate.id} (${duplicate.name}) ` +
          `is missing source identifiers.`
      );
    }

    const original =
      originalBySourceGid.get(
        duplicate.sourceGid
      );

    if (!original) {
      throw new Error(
        `Duplicate Ward ${duplicate.id} (${duplicate.name}) ` +
          `has sourceGid ${duplicate.sourceGid}, ` +
          `but no matching original ward was found.`
      );
    }

    if (
      original.sourceUid !==
      duplicate.sourceUid
    ) {
      throw new Error(
        `Source UID mismatch for sourceGid ` +
          `${duplicate.sourceGid}. ` +
          `Original=${original.sourceUid}, ` +
          `Duplicate=${duplicate.sourceUid}.`
      );
    }

    if (
      original.name.trim() !==
      duplicate.name.trim()
    ) {
      throw new Error(
        `Ward name mismatch for sourceGid ` +
          `${duplicate.sourceGid}. ` +
          `Original=${original.name}, ` +
          `Duplicate=${duplicate.name}.`
      );
    }
  }

  console.log(
    "All eight Tiaty records passed validation."
  );

  // =====================================================
  // DISPLAY PLANNED CHANGES
  // =====================================================

  console.log("");
  console.log("PLANNED CHANGES:");
  console.log("");

  console.log(
    `DELETE duplicate Ward IDs: ${duplicateWardIds.join(", ")}`
  );

  console.log(
    `MOVE original Ward IDs: ${originalWardIds.join(", ")}`
  );

  console.log(
    `SubCounty: ${OLD_SUBCOUNTY_ID} → ${TARGET_SUBCOUNTY_ID}`
  );

  console.log("");

  // =====================================================
  // TARGETED TRANSACTION
  // =====================================================

  await prisma.$transaction(
    async (tx) => {
      // -------------------------------------------------
      // DELETE ONLY THE FOUR NEW DUPLICATES
      // -------------------------------------------------

      const deleted =
        await tx.ward.deleteMany({
          where: {
            id: {
              in: duplicateWardIds,
            },
          },
        });

      if (
        deleted.count !==
        duplicateWardIds.length
      ) {
        throw new Error(
          `Expected to delete ${duplicateWardIds.length} ` +
            `duplicates, but deleted ${deleted.count}.`
        );
      }

      // -------------------------------------------------
      // MOVE ONLY THE FOUR ORIGINAL WARDS
      // -------------------------------------------------

      const moved =
        await tx.ward.updateMany({
          where: {
            id: {
              in: originalWardIds,
            },
            subCountyId:
              OLD_SUBCOUNTY_ID,
          },
          data: {
            subCountyId:
              TARGET_SUBCOUNTY_ID,
          },
        });

      if (
        moved.count !==
        originalWardIds.length
      ) {
        throw new Error(
          `Expected to move ${originalWardIds.length} ` +
            `wards, but moved ${moved.count}.`
        );
      }
    },
    {
      timeout: 30000,
    }
  );

  // =====================================================
  // VERIFY RESULT
  // =====================================================

  const correctedWards =
    await prisma.ward.findMany({
      where: {
        id: {
          in: originalWardIds,
        },
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
        countyId: true,
        constituencyId: true,
        sourceGid: true,
        sourceUid: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  const remainingDuplicates =
    await prisma.ward.findMany({
      where: {
        id: {
          in: duplicateWardIds,
        },
      },
      select: {
        id: true,
      },
    });

  if (
    correctedWards.length !==
    originalWardIds.length
  ) {
    throw new Error(
      "Post-update validation failed: " +
        "not all original wards were found."
    );
  }

  if (
    remainingDuplicates.length !== 0
  ) {
    throw new Error(
      "Post-update validation failed: " +
        "duplicate ward records still exist."
    );
  }

  for (const ward of correctedWards) {
    if (
      ward.subCountyId !==
      TARGET_SUBCOUNTY_ID
    ) {
      throw new Error(
        `Ward ${ward.id} (${ward.name}) ` +
          `was not moved to SubCounty ${TARGET_SUBCOUNTY_ID}.`
      );
    }

    if (ward.countyId !== COUNTY_ID) {
      throw new Error(
        `Ward ${ward.id} (${ward.name}) ` +
          `has unexpected countyId ${ward.countyId}.`
      );
    }

    if (
      ward.constituencyId !==
      CONSTITUENCY_ID
    ) {
      throw new Error(
        `Ward ${ward.id} (${ward.name}) ` +
          `has unexpected constituencyId ` +
          `${ward.constituencyId}.`
      );
    }
  }

  // =====================================================
  // FINAL WARD COUNT
  // =====================================================

  const finalWardCount =
    await prisma.ward.count();

  console.log("");
  console.log("============================================================");
  console.log("CORRECTION COMPLETED");
  console.log("============================================================");

  console.log(
    `Deleted duplicate wards: ${duplicateWardIds.length}`
  );

  console.log(
    `Moved original wards:     ${originalWardIds.length}`
  );

  console.log(
    `Final database wards:     ${finalWardCount}`
  );

  console.log("");

  console.log(
    "Corrected Tiaty wards:"
  );

  for (const ward of correctedWards) {
    console.log(
      `  ${ward.id}: ${ward.name} → SubCounty ${ward.subCountyId}`
    );
  }

  console.log("");

  if (finalWardCount === 1450) {
    console.log(
      "✅ FINAL WARD COUNT = 1450"
    );
  } else {
    console.log(
      `⚠️ Final ward count is ${finalWardCount}, expected 1450.`
    );
  }

  console.log("");
}

// =======================================================
// EXECUTE
// =======================================================

main()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ Tiaty correction failed:"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });