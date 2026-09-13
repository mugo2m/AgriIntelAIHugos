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

const SOURCE_SUBCOUNTY_ID = 1396;
const TARGET_SUBCOUNTY_ID = 1393;

const SOURCE_GIDS = [2110, 2111, 2112, 2113, 2114, 2115];

async function main() {
  console.log("==================================================");
  console.log("REPAIR MURANGA SOUTH / V10 ERROR");
  console.log("==================================================");
  console.log("Source SubCounty: 1396 Kandara");
  console.log("Target SubCounty: 1393 Murang'a South");
  console.log("Wards: GIDs 2110-2115");
  console.log("");

  console.log("READ-ONLY PREFLIGHT");
  console.log("--------------------------------------------------");

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          businessPartners: true,
          sourceTransactions: true,
          destinationTransactions: true,
        },
      },
    },
  });

  if (!target) {
    throw new Error(
      `Target SubCounty ${TARGET_SUBCOUNTY_ID} does not exist.`,
    );
  }

  const wards = await prisma.ward.findMany({
    where: {
      sourceGid: {
        in: SOURCE_GIDS,
      },
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      subCountyId: true,
      _count: {
        select: {
          farmers: true,
          farms: true,
          businessPartners: true,
          sourceTransactions: true,
          destinationTransactions: true,
        },
      },
    },
    orderBy: {
      sourceGid: "asc",
    },
  });

  if (wards.length !== SOURCE_GIDS.length) {
    throw new Error(
      `Expected ${SOURCE_GIDS.length} wards, found ${wards.length}.`,
    );
  }

  const missingGids = SOURCE_GIDS.filter(
    (gid) => !wards.some((ward) => ward.sourceGid === gid),
  );

  if (missingGids.length > 0) {
    throw new Error(
      `Missing authoritative GIDs: ${missingGids.join(", ")}`,
    );
  }

  const wrongSourceWards = wards.filter(
    (ward) => ward.subCountyId !== SOURCE_SUBCOUNTY_ID,
  );

  if (wrongSourceWards.length > 0) {
    throw new Error(
      `Unexpected SubCounty assignment for GIDs: ${wrongSourceWards
        .map((ward) => ward.sourceGid)
        .join(", ")}`,
    );
  }

  const wardsWithRelations = wards.filter(
    (ward) =>
      ward._count.farmers > 0 ||
      ward._count.farms > 0 ||
      ward._count.businessPartners > 0 ||
      ward._count.sourceTransactions > 0 ||
      ward._count.destinationTransactions > 0,
  );

  if (wardsWithRelations.length > 0) {
    throw new Error(
      "One or more wards have dependent records. Repair aborted.",
    );
  }

  if (
    target._count.wards !== 0 ||
    target._count.farmers !== 0 ||
    target._count.businessPartners !== 0 ||
    target._count.sourceTransactions !== 0 ||
    target._count.destinationTransactions !== 0
  ) {
    throw new Error(
      `Target ${TARGET_SUBCOUNTY_ID} is no longer empty. Repair aborted.`,
    );
  }

  console.log(`Target: ${target.id} ${target.name}`);
  console.log(`Target wards: ${target._count.wards}`);
  console.log(`Target farmers: ${target._count.farmers}`);
  console.log(
    `Target business partners: ${target._count.businessPartners}`,
  );
  console.log(
    `Target source transactions: ${target._count.sourceTransactions}`,
  );
  console.log(
    `Target destination transactions: ${target._count.destinationTransactions}`,
  );

  console.log("");
  console.log("WARDS TO MOVE:");

  for (const ward of wards) {
    console.log(
      `  GID ${ward.sourceGid}: ${ward.name} (DB ${ward.id})`,
    );
  }

  console.log("");
  console.log("PREFLIGHT: PASS");
  console.log("");

  console.log("EXECUTING TRANSACTION");
  console.log("--------------------------------------------------");

  await prisma.$transaction(async (tx) => {
    const result = await tx.ward.updateMany({
      where: {
        sourceGid: {
          in: SOURCE_GIDS,
        },
        subCountyId: SOURCE_SUBCOUNTY_ID,
      },
      data: {
        subCountyId: TARGET_SUBCOUNTY_ID,
      },
    });

    if (result.count !== SOURCE_GIDS.length) {
      throw new Error(
        `Expected to move ${SOURCE_GIDS.length} wards, moved ${result.count}.`,
      );
    }
  });

  console.log(`Moved ${SOURCE_GIDS.length} wards.`);
  console.log("");

  console.log("POST-CHECK");
  console.log("--------------------------------------------------");

  const moved = await prisma.ward.findMany({
    where: {
      sourceGid: {
        in: SOURCE_GIDS,
      },
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      subCountyId: true,
    },
    orderBy: {
      sourceGid: "asc",
    },
  });

  const failures = moved.filter(
    (ward) => ward.subCountyId !== TARGET_SUBCOUNTY_ID,
  );

  if (failures.length > 0) {
    throw new Error(
      `POST-CHECK FAILED for GIDs: ${failures
        .map((ward) => ward.sourceGid)
        .join(", ")}`,
    );
  }

  const targetAfter = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          wards: true,
        },
      },
    },
  });

  console.log("POST-CHECK: PASS");
  console.log(
    `Target ${targetAfter?.id} ${targetAfter?.name} now has ${targetAfter?._count.wards} wards.`,
  );

  console.log("");
  console.log("==================================================");
  console.log("REPAIR COMPLETE");
  console.log("==================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("REPAIR FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });