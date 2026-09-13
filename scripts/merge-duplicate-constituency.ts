import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const COUNTY_ID = 53;
const CANONICAL_ID = 279;
const DUPLICATE_ID = 280;
const KAKATENY_GID = 1603;

async function main() {
  console.log("\n=== TRANSACTIONAL CONSTITUENCY MERGE ===\n");

  await prisma.$transaction(async (tx) => {
    const canonical = await tx.constituency.findUnique({
      where: { id: CANONICAL_ID },
      include: {
        wards: {
          select: {
            id: true,
            name: true,
            sourceGid: true,
            subCountyId: true,
          },
        },
      },
    });

    const duplicate = await tx.constituency.findUnique({
      where: { id: DUPLICATE_ID },
      include: {
        wards: {
          select: {
            id: true,
            name: true,
            sourceGid: true,
            subCountyId: true,
          },
        },
      },
    });

    if (!canonical) {
      throw new Error(`Canonical constituency ${CANONICAL_ID} was not found.`);
    }

    if (!duplicate) {
      throw new Error(`Duplicate constituency ${DUPLICATE_ID} was not found.`);
    }

    if (canonical.countyId !== COUNTY_ID) {
      throw new Error(
        `Canonical constituency ${CANONICAL_ID} belongs to county ${canonical.countyId}, expected ${COUNTY_ID}.`,
      );
    }

    if (duplicate.countyId !== COUNTY_ID) {
      throw new Error(
        `Duplicate constituency ${DUPLICATE_ID} belongs to county ${duplicate.countyId}, expected ${COUNTY_ID}.`,
      );
    }

    console.log(
      `Canonical:   ${canonical.id} - ${canonical.name}`,
    );

    console.log(
      `Duplicate:   ${duplicate.id} - ${duplicate.name}`,
    );

    console.log(
      `Canonical wards before merge: ${canonical.wards.length}`,
    );

    console.log(
      `Duplicate wards before merge: ${duplicate.wards.length}`,
    );

    if (duplicate.wards.length !== 1) {
      throw new Error(
        `Expected constituency ${DUPLICATE_ID} to contain exactly 1 ward, found ${duplicate.wards.length}.`,
      );
    }

    const kakateny = duplicate.wards[0];

    if (kakateny.sourceGid !== KAKATENY_GID) {
      throw new Error(
        `Expected duplicate ward sourceGid ${KAKATENY_GID}, found ${kakateny.sourceGid}.`,
      );
    }

    if (kakateny.name !== "Kakateny Ward") {
      throw new Error(
        `Expected Kakateny Ward, found "${kakateny.name}".`,
      );
    }

    console.log(
      `\nConfirmed duplicate ward: ${kakateny.id} - ${kakateny.name}`,
    );

    console.log(
      `Source GID: ${kakateny.sourceGid}`,
    );

    console.log(
      `SubCounty ID: ${kakateny.subCountyId}`,
    );

    const existingKakateny = await tx.ward.findFirst({
      where: {
        constituencyId: CANONICAL_ID,
        subCountyId: kakateny.subCountyId,
        name: kakateny.name,
      },
    });

    if (existingKakateny) {
      throw new Error(
        `A ward with the same constituency/subcounty/name already exists: ward ${existingKakateny.id}.`,
      );
    }

    await tx.ward.update({
      where: {
        id: kakateny.id,
      },
      data: {
        constituencyId: CANONICAL_ID,
      },
    });

    console.log(
      `\nReassigned ward ${kakateny.id} from constituency ${DUPLICATE_ID} to ${CANONICAL_ID}.`,
    );

    const remainingDuplicateWards =
      await tx.ward.count({
        where: {
          constituencyId: DUPLICATE_ID,
        },
      });

    if (remainingDuplicateWards !== 0) {
      throw new Error(
        `Constituency ${DUPLICATE_ID} still has ${remainingDuplicateWards} ward(s).`,
      );
    }

    await tx.constituency.delete({
      where: {
        id: DUPLICATE_ID,
      },
    });

    console.log(
      `Deleted duplicate constituency ${DUPLICATE_ID}.`,
    );

    const finalCanonical =
      await tx.constituency.findUnique({
        where: {
          id: CANONICAL_ID,
        },
        include: {
          wards: {
            select: {
              id: true,
              name: true,
              sourceGid: true,
              sourceUid: true,
              subCountyId: true,
            },
          },
        },
      });

    if (!finalCanonical) {
      throw new Error(
        `Canonical constituency ${CANONICAL_ID} disappeared during merge.`,
      );
    }

    if (finalCanonical.wards.length !== 6) {
      throw new Error(
        `Expected 6 wards after merge, found ${finalCanonical.wards.length}.`,
      );
    }

    const sourceGids = finalCanonical.wards
      .map((ward) => ward.sourceGid)
      .sort((a, b) => Number(a) - Number(b));

    const expectedGids = [
      1600,
      1601,
      1602,
      1603,
      1604,
      1605,
    ];

    if (
      JSON.stringify(sourceGids) !==
      JSON.stringify(expectedGids)
    ) {
      throw new Error(
        `Unexpected final source GIDs: ${JSON.stringify(sourceGids)}`,
      );
    }

    console.log("\nFINAL CONSTITUENCY STATE:");
    console.log(
      `${finalCanonical.id} - ${finalCanonical.name}`,
    );

    for (const ward of finalCanonical.wards) {
      console.log(
        `- ${ward.id} ${ward.name} | GID ${ward.sourceGid} | SubCounty ${ward.subCountyId}`,
      );
    }

    console.log("\nTRANSACTION VALIDATION PASSED.");
  });

  console.log("\n==============================================");
  console.log("CONSTITUENCY MERGE COMMITTED SUCCESSFULLY");
  console.log("==============================================\n");
}

main().catch((error) => {
  console.error("\nMERGE FAILED — TRANSACTION ROLLED BACK.\n");
  console.error(error);
  process.exit(1);
});