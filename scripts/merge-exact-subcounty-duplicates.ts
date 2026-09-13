import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

const MERGES = [
  // MIGORI
  { legacyId: 1219, canonicalId: 263, countyId: 49, name: "Kuria East" },
  { legacyId: 1220, canonicalId: 262, countyId: 49, name: "Kuria West" },
  { legacyId: 1223, canonicalId: 258, countyId: 49, name: "Suna East" },
  { legacyId: 1224, canonicalId: 259, countyId: 49, name: "Suna West" },
  { legacyId: 1218, canonicalId: 257, countyId: 49, name: "Awendo" },
  { legacyId: 1221, canonicalId: 261, countyId: 49, name: "Nyatike" },
  { legacyId: 1222, canonicalId: 256, countyId: 49, name: "Rongo" },
  { legacyId: 1225, canonicalId: 260, countyId: 49, name: "Uriri" },

  // HOMA BAY
  { legacyId: 1211, canonicalId: 272, countyId: 51, name: "Ndhiwa" },
  { legacyId: 1215, canonicalId: 270, countyId: 51, name: "Rangwe" },

  // MACHAKOS
  { legacyId: 1023, canonicalId: 306, countyId: 50, name: "Kangundo" },
  { legacyId: 1024, canonicalId: 308, countyId: 50, name: "Kathiani" },
  { legacyId: 1025, canonicalId: 265, countyId: 50, name: "Machakos" },
  { legacyId: 1026, canonicalId: 304, countyId: 50, name: "Masinga" },
  { legacyId: 1027, canonicalId: 307, countyId: 50, name: "Matungulu" },
  { legacyId: 1028, canonicalId: 266, countyId: 50, name: "Mwala" },
  { legacyId: 1029, canonicalId: 305, countyId: 50, name: "Yatta" },
  { legacyId: 1021, canonicalId: 264, countyId: 50, name: "Athi River" },

  // VIHIGA
  { legacyId: 1176, canonicalId: 277, countyId: 52, name: "Emuhaya" },
  { legacyId: 1178, canonicalId: 274, countyId: 52, name: "Sabatia" },
  { legacyId: 1177, canonicalId: 278, countyId: 52, name: "Vihiga" },
] as const;

const CONFIRMATION = "YES";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getMode(): "DRY_RUN" | "EXECUTE" {
  return process.env.CONFIRM_MERGE === CONFIRMATION
    ? "EXECUTE"
    : "DRY_RUN";
}

type Counts = {
  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  destinationTransactions: number;
  sourceTransactions: number;
};

function dependencyTotal(counts: Counts): number {
  return (
    counts.wards +
    counts.farmers +
    counts.farms +
    counts.businessPartners +
    counts.destinationTransactions +
    counts.sourceTransactions
  );
}

async function verifyPair(
  tx: any,
  merge: (typeof MERGES)[number],
  position: number
): Promise<void> {
  const legacy = await tx.subCounty.findUnique({
    where: {
      id: merge.legacyId,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  if (!legacy) {
    throw new Error(
      `[${position}/${MERGES.length}] Legacy ${merge.legacyId} does not exist.`
    );
  }

  const canonical = await tx.subCounty.findUnique({
    where: {
      id: merge.canonicalId,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  if (!canonical) {
    throw new Error(
      `[${position}/${MERGES.length}] Canonical ${merge.canonicalId} does not exist.`
    );
  }

  if (legacy.countyId !== merge.countyId) {
    throw new Error(
      `[${position}/${MERGES.length}] Legacy ${merge.legacyId} has countyId=${legacy.countyId}, expected ${merge.countyId}.`
    );
  }

  if (canonical.countyId !== merge.countyId) {
    throw new Error(
      `[${position}/${MERGES.length}] Canonical ${merge.canonicalId} has countyId=${canonical.countyId}, expected ${merge.countyId}.`
    );
  }

  const expectedName = normalizeName(merge.name);
  const legacyName = normalizeName(legacy.name);
  const canonicalName = normalizeName(canonical.name);

  if (legacyName !== expectedName) {
    throw new Error(
      `[${position}/${MERGES.length}] Legacy ${merge.legacyId} name "${legacy.name}" does not match "${merge.name}".`
    );
  }

  if (canonicalName !== expectedName) {
    throw new Error(
      `[${position}/${MERGES.length}] Canonical ${merge.canonicalId} name "${canonical.name}" does not match "${merge.name}".`
    );
  }

  const legacyCounts: Counts = {
    wards: legacy._count.wards,
    farmers: legacy._count.farmers,
    farms: legacy._count.farms,
    businessPartners: legacy._count.businessPartners,
    destinationTransactions:
      legacy._count.destinationTransactions,
    sourceTransactions:
      legacy._count.sourceTransactions,
  };

  if (dependencyTotal(legacyCounts) !== 0) {
    throw new Error(
      `[${position}/${MERGES.length}] REFUSING TO DELETE ${merge.legacyId}. Dependencies found: ${JSON.stringify(legacyCounts)}`
    );
  }

  if (canonical._count.wards <= 0) {
    throw new Error(
      `[${position}/${MERGES.length}] Canonical ${merge.canonicalId} has no wards.`
    );
  }

  const legacyWardCount = await tx.ward.count({
    where: {
      subCountyId: merge.legacyId,
    },
  });

  if (legacyWardCount !== 0) {
    throw new Error(
      `[${position}/${MERGES.length}] REFUSING TO DELETE ${merge.legacyId}. ${legacyWardCount} wards still reference it.`
    );
  }

  console.log(
    `[${position}/${MERGES.length}] ${merge.legacyId} "${legacy.name}" -> ${merge.canonicalId} "${canonical.name}" | legacy empty | canonical wards=${canonical._count.wards}`
  );
}

async function main(): Promise<void> {
  const currentMode = getMode();

  console.log("");
  console.log("============================================================");
  console.log(" EXACT 21 SUBCOUNTY DUPLICATE REPAIR");
  console.log("============================================================");
  console.log(`Mode: ${currentMode}`);
  console.log(`Mappings: ${MERGES.length}`);
  console.log("");

  if (currentMode === "DRY_RUN") {
    console.log("DRY-RUN: No database rows will be deleted.");
    console.log("To execute the repair, set CONFIRM_MERGE=YES.");
  } else {
    console.log("EXECUTE MODE ENABLED.");
    console.log("Exactly 21 verified legacy records will be deleted.");
  }

  console.log("");

  await prisma.$transaction(
    async (tx) => {
      console.log("------------------------------------------------------------");
      console.log("PHASE 1: VERIFYING ALL 21 MERGE PAIRS");
      console.log("------------------------------------------------------------");

      for (let i = 0; i < MERGES.length; i++) {
        await verifyPair(tx, MERGES[i], i + 1);
      }

      console.log("");
      console.log(
        `ALL ${MERGES.length} MERGE PAIRS PASSED SAFETY VERIFICATION.`
      );
      console.log("");

      if (currentMode === "DRY_RUN") {
        console.log("------------------------------------------------------------");
        console.log("DRY-RUN COMPLETE");
        console.log("------------------------------------------------------------");
        console.log("");
        console.log("NO DATABASE CHANGES WERE MADE.");
        console.log("");
        return;
      }

      console.log("------------------------------------------------------------");
      console.log("PHASE 2: DELETING EXACTLY 21 LEGACY RECORDS");
      console.log("------------------------------------------------------------");

      const legacyIds = MERGES.map(
        (merge) => merge.legacyId
      );

      const deleteResult = await tx.subCounty.deleteMany({
        where: {
          id: {
            in: legacyIds,
          },
        },
      });

      if (deleteResult.count !== MERGES.length) {
        throw new Error(
          `SAFETY FAILURE: Expected ${MERGES.length} deletions but received ${deleteResult.count}.`
        );
      }

      console.log(
        `Deleted ${deleteResult.count} legacy SubCounty records.`
      );
      console.log("");

      console.log("------------------------------------------------------------");
      console.log("PHASE 3: VERIFYING DELETIONS");
      console.log("------------------------------------------------------------");

      const remainingLegacy = await tx.subCounty.count({
        where: {
          id: {
            in: legacyIds,
          },
        },
      });

      if (remainingLegacy !== 0) {
        throw new Error(
          `SAFETY FAILURE: ${remainingLegacy} legacy records still exist.`
        );
      }

      console.log("All 21 legacy IDs have been removed.");

      const canonicalIds = MERGES.map(
        (merge) => merge.canonicalId
      );

      const remainingCanonical =
        await tx.subCounty.count({
          where: {
            id: {
              in: canonicalIds,
            },
          },
        });

      if (remainingCanonical !== MERGES.length) {
        throw new Error(
          `SAFETY FAILURE: Expected ${MERGES.length} canonical records but found ${remainingCanonical}.`
        );
      }

      console.log("All 21 canonical records remain.");

      const orphanedWards = await tx.ward.count({
        where: {
          subCountyId: {
            not: null,
          },
          subCounty: null,
        },
      });

      if (orphanedWards !== 0) {
        throw new Error(
          `SAFETY FAILURE: ${orphanedWards} orphaned wards detected.`
        );
      }

      console.log("No orphaned wards detected.");
      console.log("");

      console.log("------------------------------------------------------------");
      console.log("PHASE 4: FINAL CANONICAL VERIFICATION");
      console.log("------------------------------------------------------------");

      for (const merge of MERGES) {
        const canonical =
          await tx.subCounty.findUnique({
            where: {
              id: merge.canonicalId,
            },
            select: {
              id: true,
              name: true,
              countyId: true,
              _count: {
                select: {
                  wards: true,
                },
              },
            },
          });

        if (!canonical) {
          throw new Error(
            `SAFETY FAILURE: Canonical ${merge.canonicalId} no longer exists.`
          );
        }

        if (canonical.countyId !== merge.countyId) {
          throw new Error(
            `SAFETY FAILURE: Canonical ${merge.canonicalId} countyId changed.`
          );
        }

        if (
          normalizeName(canonical.name) !==
          normalizeName(merge.name)
        ) {
          throw new Error(
            `SAFETY FAILURE: Canonical ${merge.canonicalId} name changed unexpectedly.`
          );
        }

        if (canonical._count.wards <= 0) {
          throw new Error(
            `SAFETY FAILURE: Canonical ${merge.canonicalId} has no wards.`
          );
        }
      }

      console.log("All 21 canonical records verified.");
      console.log("");

      console.log("============================================================");
      console.log(" TRANSACTION SAFETY CHECKS PASSED");
      console.log("============================================================");
      console.log("");
      console.log(
        "The transaction is allowed to commit."
      );
      console.log("");
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );

  console.log("============================================================");

  if (currentMode === "DRY_RUN") {
    console.log("DRY-RUN FINISHED - DATABASE UNCHANGED");
  } else {
    console.log("REPAIR COMPLETED - TRANSACTION COMMITTED");
  }

  console.log("============================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error(" REPAIR FAILED - TRANSACTION ROLLED BACK");
    console.error("============================================================");
    console.error("");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    console.error("");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });