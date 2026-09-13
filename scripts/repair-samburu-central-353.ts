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

const SOURCE_ID = 1423;
const TARGET_ID = 1422;

const EXPECTED_GIDS = [661, 662, 663, 664, 665, 670, 671];

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("REPAIR SAMBURU CENTRAL / V10 ERROR");
  console.log("==============================================");
  console.log("");
  console.log("Source SubCounty: 1423 Samburu East");
  console.log("Target SubCounty: 1422 Samburu Central");
  console.log(
    "Wards: GIDs 661, 662, 663, 664, 665, 670, 671",
  );
  console.log("");

  // ------------------------------------------------------------
  // 1. READ SOURCE AND TARGET
  // ------------------------------------------------------------

  const source = await prisma.subCounty.findUnique({
    where: {
      id: SOURCE_ID,
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

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_ID,
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

  if (!source) {
    throw new Error(`SOURCE SUBCOUNTY ${SOURCE_ID} NOT FOUND.`);
  }

  if (!target) {
    throw new Error(`TARGET SUBCOUNTY ${TARGET_ID} NOT FOUND.`);
  }

  console.log("SOURCE:");
  console.log(`  ${source.id} ${source.name}`);
  console.log(`  County ID: ${source.countyId}`);
  console.log(`  Wards: ${source._count.wards}`);
  console.log(`  Farmers: ${source._count.farmers}`);
  console.log(`  Business partners: ${source._count.businessPartners}`);
  console.log(
    `  Source transactions: ${source._count.sourceTransactions}`,
  );
  console.log(
    `  Destination transactions: ${source._count.destinationTransactions}`,
  );
  console.log("");

  console.log("TARGET:");
  console.log(`  ${target.id} ${target.name}`);
  console.log(`  County ID: ${target.countyId}`);
  console.log(`  Wards: ${target._count.wards}`);
  console.log(`  Farmers: ${target._count.farmers}`);
  console.log(`  Business partners: ${target._count.businessPartners}`);
  console.log(
    `  Source transactions: ${target._count.sourceTransactions}`,
  );
  console.log(
    `  Destination transactions: ${target._count.destinationTransactions}`,
  );
  console.log("");

  // ------------------------------------------------------------
  // 2. BASIC SAFETY CHECKS
  // ------------------------------------------------------------

  if (source.countyId !== target.countyId) {
    throw new Error(
      `COUNTY MISMATCH: source county ${source.countyId}, target county ${target.countyId}.`,
    );
  }

  if (source.id === target.id) {
    throw new Error("SOURCE AND TARGET ARE THE SAME SUBCOUNTY.");
  }

  if (target._count.wards !== 0) {
    throw new Error(
      `TARGET NOT EMPTY: ${TARGET_ID} has ${target._count.wards} wards.`,
    );
  }

  if (target._count.farmers !== 0) {
    throw new Error(
      `TARGET NOT EMPTY: ${TARGET_ID} has ${target._count.farmers} farmers.`,
    );
  }

  if (target._count.businessPartners !== 0) {
    throw new Error(
      `TARGET NOT EMPTY: ${TARGET_ID} has ${target._count.businessPartners} business partners.`,
    );
  }

  if (target._count.sourceTransactions !== 0) {
    throw new Error(
      `TARGET NOT EMPTY: ${TARGET_ID} has ${target._count.sourceTransactions} source transactions.`,
    );
  }

  if (target._count.destinationTransactions !== 0) {
    throw new Error(
      `TARGET NOT EMPTY: ${TARGET_ID} has ${target._count.destinationTransactions} destination transactions.`,
    );
  }

  // ------------------------------------------------------------
  // 3. READ THE SEVEN EXPECTED WARDS
  // ------------------------------------------------------------

  const wards = await prisma.ward.findMany({
    where: {
      sourceGid: {
        in: EXPECTED_GIDS,
      },
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      subCountyId: true,
      constituencyId: true,
      subCounty: {
        select: {
          id: true,
          name: true,
        },
      },
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

  console.log("WARDS TO MOVE:");
  console.log("");

  for (const ward of wards) {
    console.log(
      `GID ${ward.sourceGid}: ${ward.name} ` +
        `(DB ${ward.id}, ` +
        `SubCounty ${ward.subCountyId}, ` +
        `${ward.subCounty?.name ?? "NULL"})`,
    );

    console.log(
      `  Constituency ID: ${ward.constituencyId}`,
    );

    console.log(
      `  Farmers: ${ward._count.farmers}, ` +
        `Farms: ${ward._count.farms}, ` +
        `Business partners: ${ward._count.businessPartners}, ` +
        `Source transactions: ${ward._count.sourceTransactions}, ` +
        `Destination transactions: ${ward._count.destinationTransactions}`,
    );
  }

  console.log("");

  // ------------------------------------------------------------
  // 4. VERIFY EXACT WARD SET
  // ------------------------------------------------------------

  if (wards.length !== EXPECTED_GIDS.length) {
    throw new Error(
      `WARD COUNT MISMATCH: expected ${EXPECTED_GIDS.length}, found ${wards.length}.`,
    );
  }

  const actualGids = wards
    .map((ward) => ward.sourceGid)
    .filter((gid): gid is number => gid !== null)
    .sort((a, b) => a - b);

  const expectedGids = [...EXPECTED_GIDS].sort(
    (a, b) => a - b,
  );

  if (
    JSON.stringify(actualGids) !==
    JSON.stringify(expectedGids)
  ) {
    throw new Error(
      `GID MISMATCH.\nExpected: ${JSON.stringify(
        expectedGids,
      )}\nFound: ${JSON.stringify(actualGids)}`,
    );
  }

  // ------------------------------------------------------------
  // 5. VERIFY EVERY WARD IS CURRENTLY IN 1423
  // ------------------------------------------------------------

  const wrongSourceWards = wards.filter(
    (ward) => ward.subCountyId !== SOURCE_ID,
  );

  if (wrongSourceWards.length > 0) {
    console.log("");
    console.log("WARDS NOT CURRENTLY IN SOURCE:");

    for (const ward of wrongSourceWards) {
      console.log(
        `GID ${ward.sourceGid}: DB SubCounty ${ward.subCountyId}`,
      );
    }

    throw new Error(
      "WARD SOURCE VALIDATION FAILED. No changes made.",
    );
  }

  // ------------------------------------------------------------
  // 6. VERIFY ALL DIRECT WARD RELATIONS ARE ZERO
  // ------------------------------------------------------------

  for (const ward of wards) {
    const totalRelations =
      ward._count.farmers +
      ward._count.farms +
      ward._count.businessPartners +
      ward._count.sourceTransactions +
      ward._count.destinationTransactions;

    if (totalRelations !== 0) {
      throw new Error(
        `WARD ${ward.id} / GID ${ward.sourceGid} HAS DEPENDENT RELATIONS. No changes made.`,
      );
    }
  }

  console.log("PREFLIGHT: PASS");
  console.log("");

  // ------------------------------------------------------------
  // 7. EXECUTE TRANSACTION
  // ------------------------------------------------------------

  console.log("EXECUTING TRANSACTION");

  await prisma.$transaction(async (tx) => {
    const currentTarget = await tx.subCounty.findUnique({
      where: {
        id: TARGET_ID,
      },
      select: {
        id: true,
        name: true,
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

    if (!currentTarget) {
      throw new Error(
        `TARGET ${TARGET_ID} DISAPPEARED BEFORE TRANSACTION.`,
      );
    }

    if (currentTarget._count.wards !== 0) {
      throw new Error(
        `TRANSACTION TARGET NOT EMPTY: ${TARGET_ID} has ${currentTarget._count.wards} wards.`,
      );
    }

    const currentWards = await tx.ward.findMany({
      where: {
        sourceGid: {
          in: EXPECTED_GIDS,
        },
      },
      select: {
        id: true,
        sourceGid: true,
        subCountyId: true,
      },
    });

    if (currentWards.length !== EXPECTED_GIDS.length) {
      throw new Error(
        `TRANSACTION WARD COUNT MISMATCH: expected ${EXPECTED_GIDS.length}, found ${currentWards.length}.`,
      );
    }

    for (const ward of currentWards) {
      if (ward.subCountyId !== SOURCE_ID) {
        throw new Error(
          `TRANSACTION SOURCE MISMATCH: GID ${ward.sourceGid} is under SubCounty ${ward.subCountyId}.`,
        );
      }
    }

    const result = await tx.ward.updateMany({
      where: {
        sourceGid: {
          in: EXPECTED_GIDS,
        },
        subCountyId: SOURCE_ID,
      },
      data: {
        subCountyId: TARGET_ID,
      },
    });

    if (result.count !== EXPECTED_GIDS.length) {
      throw new Error(
        `WARD UPDATE COUNT MISMATCH: expected ${EXPECTED_GIDS.length}, moved ${result.count}.`,
      );
    }

    console.log(`Moved ${result.count} wards.`);

    // Delete the legacy SubCounty 353 only after confirming
    // that it has no remaining wards or dependent relations.
    const remainingSource = await tx.subCounty.findUnique({
      where: {
        id: SOURCE_ID,
      },
      select: {
        id: true,
        name: true,
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

    if (!remainingSource) {
      throw new Error(
        `SOURCE ${SOURCE_ID} DISAPPEARED BEFORE DELETE.`,
      );
    }

    if (remainingSource._count.wards !== 0) {
      throw new Error(
        `SOURCE STILL HAS ${remainingSource._count.wards} WARDS.`,
      );
    }

    if (remainingSource._count.farmers !== 0) {
      throw new Error(
        `SOURCE STILL HAS ${remainingSource._count.farmers} FARMERS.`,
      );
    }

    if (remainingSource._count.businessPartners !== 0) {
      throw new Error(
        `SOURCE STILL HAS ${remainingSource._count.businessPartners} BUSINESS PARTNERS.`,
      );
    }

    if (remainingSource._count.sourceTransactions !== 0) {
      throw new Error(
        `SOURCE STILL HAS ${remainingSource._count.sourceTransactions} SOURCE TRANSACTIONS.`,
      );
    }

    if (remainingSource._count.destinationTransactions !== 0) {
      throw new Error(
        `SOURCE STILL HAS ${remainingSource._count.destinationTransactions} DESTINATION TRANSACTIONS.`,
      );
    }

    await tx.subCounty.delete({
      where: {
        id: SOURCE_ID,
      },
    });

    console.log(
      `Deleted legacy SubCounty: ${SOURCE_ID} ${source.name}`,
    );
  });

  // ------------------------------------------------------------
  // 8. POST-CHECK
  // ------------------------------------------------------------

  const finalTarget = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_ID,
    },
    select: {
      id: true,
      name: true,
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

  const finalSource = await prisma.subCounty.findUnique({
    where: {
      id: SOURCE_ID,
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

  if (!finalTarget) {
    throw new Error(
      `POST-CHECK FAILED: target ${TARGET_ID} not found.`,
    );
  }

  if (finalTarget._count.wards !== EXPECTED_GIDS.length) {
    throw new Error(
      `POST-CHECK FAILED: target has ${finalTarget._count.wards} wards; expected ${EXPECTED_GIDS.length}.`,
    );
  }

  if (finalSource) {
    throw new Error(
      `POST-CHECK FAILED: legacy source ${SOURCE_ID} still exists.`,
    );
  }

  const finalWards = await prisma.ward.findMany({
    where: {
      sourceGid: {
        in: EXPECTED_GIDS,
      },
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      sourceGid: "asc",
    },
  });

  if (finalWards.length !== EXPECTED_GIDS.length) {
    throw new Error(
      `POST-CHECK FAILED: expected ${EXPECTED_GIDS.length} wards, found ${finalWards.length}.`,
    );
  }

  for (const ward of finalWards) {
    if (ward.subCountyId !== TARGET_ID) {
      throw new Error(
        `POST-CHECK FAILED: GID ${ward.sourceGid} is under SubCounty ${ward.subCountyId}.`,
      );
    }
  }

  console.log("");
  console.log("POST-CHECK: PASS");
  console.log(
    `Target ${TARGET_ID} ${finalTarget.name} now has ${finalTarget._count.wards} wards.`,
  );
  console.log("");
  console.log("CONSTITUENCY IDS WERE NOT CHANGED.");
  console.log("");
  console.log("REPAIR COMPLETE");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("REPAIR SAMBURU FAILED");
    console.error(
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });