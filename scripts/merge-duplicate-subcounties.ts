import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const MERGE_PAIRS = [
  {
    canonicalId: 297,
    duplicateId: 944,
    canonicalName: "LAMU EAST",
    duplicateName: "Lamu East",
    countyId: 58,
  },
  {
    canonicalId: 298,
    duplicateId: 945,
    canonicalName: "LAMU WEST",
    duplicateName: "Lamu West",
    countyId: 58,
  },
  {
    canonicalId: 324,
    duplicateId: 971,
    canonicalName: "MANDERA NORTH",
    duplicateName: "Mandera North",
    countyId: 63,
  },
  {
    canonicalId: 326,
    duplicateId: 970,
    canonicalName: "MANDERA EAST",
    duplicateName: "Mandera East",
    countyId: 63,
  },
  {
    canonicalId: 327,
    duplicateId: 976,
    canonicalName: "MOYALE",
    duplicateName: "Moyale",
    countyId: 64,
  },
  {
    canonicalId: 328,
    duplicateId: 977,
    canonicalName: "NORTH HORR",
    duplicateName: "North Horr",
    countyId: 64,
  },
  {
    canonicalId: 365,
    duplicateId: 965,
    canonicalName: "MANDERA WEST",
    duplicateName: "Mandera West",
    countyId: 63,
  },
  {
    canonicalId: 521,
    duplicateId: 968,
    canonicalName: "LAFEY",
    duplicateName: "Lafey",
    countyId: 63,
  },
];

async function main() {
  console.log("");
  console.log("==================================================");
  console.log("TRANSACTIONAL DUPLICATE SUBCOUNTY CLEANUP");
  console.log("==================================================");
  console.log("");

  console.log(
    `Planned duplicate SubCounties: ${MERGE_PAIRS.length}`
  );

  // ==================================================
  // PHASE 1 — READ-ONLY VALIDATION
  // ==================================================

  console.log("");
  console.log("PHASE 1: PRE-TRANSACTION VALIDATION");
  console.log("----------------------------------------------");

  for (const pair of MERGE_PAIRS) {
    const canonical =
      await prisma.subCounty.findUnique({
        where: {
          id: pair.canonicalId,
        },
        include: {
          wards: {
            select: {
              id: true,
              name: true,
              sourceGid: true,
              sourceUid: true,
              constituencyId: true,
            },
          },
        },
      });

    const duplicate =
      await prisma.subCounty.findUnique({
        where: {
          id: pair.duplicateId,
        },
        include: {
          wards: {
            select: {
              id: true,
              name: true,
              sourceGid: true,
              sourceUid: true,
              constituencyId: true,
            },
          },
        },
      });

    if (!canonical) {
      throw new Error(
        `Canonical SubCounty ${pair.canonicalId} "${pair.canonicalName}" was not found.`
      );
    }

    if (!duplicate) {
      throw new Error(
        `Duplicate SubCounty ${pair.duplicateId} "${pair.duplicateName}" was not found.`
      );
    }

    if (canonical.countyId !== pair.countyId) {
      throw new Error(
        `Canonical SubCounty ${pair.canonicalId} belongs to county ${canonical.countyId}, expected ${pair.countyId}.`
      );
    }

    if (duplicate.countyId !== pair.countyId) {
      throw new Error(
        `Duplicate SubCounty ${pair.duplicateId} belongs to county ${duplicate.countyId}, expected ${pair.countyId}.`
      );
    }

    if (duplicate.wards.length !== 0) {
      console.log("");
      console.log(
        `DUPLICATE SUBCOUNTY ${pair.duplicateId} HAS WARDS:`
      );

      console.table(duplicate.wards);

      throw new Error(
        `ABORTED: Duplicate SubCounty ${pair.duplicateId} has ${duplicate.wards.length} ward(s).`
      );
    }

    console.log(
      `✓ ${pair.duplicateId} "${pair.duplicateName}" → ${pair.canonicalId} "${pair.canonicalName}" | County ${pair.countyId} | 0 wards`
    );
  }

  console.log("");
  console.log(
    "✓ All eight duplicate SubCounties exist and are empty."
  );

  // ==================================================
  // PHASE 2 — REFERENCE CHECK
  // ==================================================

  console.log("");
  console.log("PHASE 2: REFERENCE SAFETY CHECK");
  console.log("----------------------------------------------");

  const duplicateIds = MERGE_PAIRS.map(
    (pair) => pair.duplicateId
  );

  const referencingWards =
    await prisma.ward.findMany({
      where: {
        subCountyId: {
          in: duplicateIds,
        },
      },
      select: {
        id: true,
        name: true,
        sourceGid: true,
        sourceUid: true,
        countyId: true,
        subCountyId: true,
        constituencyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  if (referencingWards.length > 0) {
    console.log("");
    console.log(
      "WARDS REFERENCING DUPLICATE SUBCOUNTIES:"
    );

    console.table(referencingWards);

    throw new Error(
      `ABORTED: ${referencingWards.length} ward(s) reference duplicate SubCounties.`
    );
  }

  console.log(
    "✓ No wards reference any duplicate SubCounty."
  );

  // ==================================================
  // PHASE 3 — TRANSACTION
  // ==================================================

  console.log("");
  console.log("PHASE 3: STARTING TRANSACTION");
  console.log("----------------------------------------------");

  await prisma.$transaction(
    async (tx) => {
      for (const pair of MERGE_PAIRS) {
        const canonical =
          await tx.subCounty.findUnique({
            where: {
              id: pair.canonicalId,
            },
          });

        const duplicate =
          await tx.subCounty.findUnique({
            where: {
              id: pair.duplicateId,
            },
            include: {
              wards: {
                select: {
                  id: true,
                },
              },
            },
          });

        if (!canonical) {
          throw new Error(
            `TRANSACTION ABORTED: Canonical SubCounty ${pair.canonicalId} disappeared.`
          );
        }

        if (!duplicate) {
          throw new Error(
            `TRANSACTION ABORTED: Duplicate SubCounty ${pair.duplicateId} disappeared.`
          );
        }

        if (
          canonical.countyId !==
          pair.countyId
        ) {
          throw new Error(
            `TRANSACTION ABORTED: Canonical SubCounty ${pair.canonicalId} county mismatch.`
          );
        }

        if (
          duplicate.countyId !==
          pair.countyId
        ) {
          throw new Error(
            `TRANSACTION ABORTED: Duplicate SubCounty ${pair.duplicateId} county mismatch.`
          );
        }

        if (duplicate.wards.length !== 0) {
          throw new Error(
            `TRANSACTION ABORTED: Duplicate SubCounty ${pair.duplicateId} now has ${duplicate.wards.length} ward(s).`
          );
        }

        const wardReferenceCount =
          await tx.ward.count({
            where: {
              subCountyId: pair.duplicateId,
            },
          });

        if (wardReferenceCount !== 0) {
          throw new Error(
            `TRANSACTION ABORTED: ${wardReferenceCount} ward(s) reference SubCounty ${pair.duplicateId}.`
          );
        }

        await tx.subCounty.delete({
          where: {
            id: pair.duplicateId,
          },
        });

        console.log(
          `Deleted duplicate SubCounty ${pair.duplicateId} "${pair.duplicateName}".`
        );
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  // ==================================================
  // PHASE 4 — POST-TRANSACTION VERIFICATION
  // ==================================================

  console.log("");
  console.log("PHASE 4: POST-TRANSACTION VERIFICATION");
  console.log("----------------------------------------------");

  const remainingDuplicates =
    await prisma.subCounty.findMany({
      where: {
        id: {
          in: duplicateIds,
        },
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  if (remainingDuplicates.length > 0) {
    console.table(remainingDuplicates);

    throw new Error(
      `POST-VERIFICATION FAILED: ${remainingDuplicates.length} duplicate records remain.`
    );
  }

  console.log(
    "✓ All eight duplicate SubCounty records were removed."
  );

  // ==================================================
  // PHASE 5 — FINAL COUNTS
  // ==================================================

  const [
    countryCount,
    countyCount,
    subCountyCount,
    constituencyCount,
    wardCount,
  ] = await Promise.all([
    prisma.country.count(),
    prisma.county.count(),
    prisma.subCounty.count(),
    prisma.constituency.count(),
    prisma.ward.count(),
  ]);

  console.log("");
  console.log("FINAL DATABASE COUNTS");
  console.log("----------------------------------------------");
  console.log("Countries:", countryCount);
  console.log("Counties:", countyCount);
  console.log("SubCounties:", subCountyCount);
  console.log("Constituencies:", constituencyCount);
  console.log("Wards:", wardCount);

  // ==================================================
  // FINAL RESULT
  // ==================================================

  if (
    countyCount !== 47 ||
    subCountyCount !== 623 ||
    constituencyCount !== 298 ||
    wardCount !== 1450
  ) {
    throw new Error(
      "FINAL COUNT VALIDATION FAILED."
    );
  }

  console.log("");
  console.log("==================================================");
  console.log("SUBCOUNTY CLEANUP COMMITTED SUCCESSFULLY");
  console.log("==================================================");
  console.log("");

  console.log(
    "Removed: 8 empty duplicate SubCounty records."
  );
  console.log(
    "Wards modified: 0."
  );
  console.log(
    "Wards deleted: 0."
  );
  console.log(
    "Constituencies modified: 0."
  );
  console.log("");
  console.log(
    "Expected final totals confirmed:"
  );
  console.log("Counties:        47");
  console.log("SubCounties:     623");
  console.log("Constituencies:  298");
  console.log("Wards:           1450");
  console.log("");
  console.log(
    "NEXT STEP:"
  );
  console.log(
    "npx tsx .\\scripts\\verify-hierarchy.ts"
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==================================================");
    console.error("SUBCOUNTY CLEANUP FAILED");
    console.error("==================================================");
    console.error("");
    console.error(error);
    console.error("");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });