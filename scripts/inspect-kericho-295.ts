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
  const sourceId = 295;
  const targetId = 1482;

  console.log("");
  console.log("============================================================");
  console.log("INSPECT KERICHO AINAMOI CONSOLIDATION");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const source = await prisma.subCounty.findUnique({
    where: {
      id: sourceId,
    },
    include: {
      county: true,
    },
  });

  const target = await prisma.subCounty.findUnique({
    where: {
      id: targetId,
    },
    include: {
      county: true,
    },
  });

  if (!source) {
    throw new Error(`Source SubCounty ${sourceId} not found.`);
  }

  if (!target) {
    throw new Error(`Target SubCounty ${targetId} not found.`);
  }

  console.log("SOURCE");
  console.log(`ID:       ${source.id}`);
  console.log(`Name:     ${source.name}`);
  console.log(`County:   ${source.county.name} (${source.countyId})`);
  console.log("");

  console.log("TARGET");
  console.log(`ID:       ${target.id}`);
  console.log(`Name:     ${target.name}`);
  console.log(`County:   ${target.county.name} (${target.countyId})`);
  console.log("");

  const sourceWards = await prisma.ward.findMany({
    where: {
      subCountyId: sourceId,
    },
    orderBy: {
      sourceGid: "asc",
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      constituencyId: true,
      countyId: true,
    },
  });

  const targetWards = await prisma.ward.findMany({
    where: {
      subCountyId: targetId,
    },
    orderBy: {
      sourceGid: "asc",
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      constituencyId: true,
      countyId: true,
    },
  });

  console.log("SOURCE WARDS");
  console.log(`Total: ${sourceWards.length}`);
  console.log("");

  for (const ward of sourceWards) {
    const constituency = await prisma.constituency.findUnique({
      where: {
        id: ward.constituencyId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      `Ward ${ward.id}: ${ward.name}` +
        ` | constituency=${ward.constituencyId} ${constituency?.name ?? "UNKNOWN"}` +
        ` | gid=${ward.sourceGid ?? "null"}` +
        ` | uid=${ward.sourceUid ?? "null"}` +
        ` | countyId=${ward.countyId}`
    );
  }

  console.log("");

  console.log("TARGET WARDS");
  console.log(`Total: ${targetWards.length}`);
  console.log("");

  if (targetWards.length === 0) {
    console.log("Target currently has no wards.");
  } else {
    for (const ward of targetWards) {
      console.log(
        `Ward ${ward.id}: ${ward.name}` +
          ` | gid=${ward.sourceGid ?? "null"}` +
          ` | uid=${ward.sourceUid ?? "null"}`
      );
    }
  }

  console.log("");

  const [
    farmers,
    farms,
    businessPartners,
    destinationTransactions,
    sourceTransactions,
  ] = await Promise.all([
    prisma.farmer.count({
      where: {
        subCountyId: sourceId,
      },
    }),

    prisma.farm.count({
      where: {
        subCountyId: sourceId,
      },
    }),

    prisma.businessPartner.count({
      where: {
        subCountyId: sourceId,
      },
    }),

    prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: sourceId,
      },
    }),

    prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: sourceId,
      },
    }),
  ]);

  console.log("SOURCE DIRECT RELATIONS");
  console.log("");
  console.log(`Farmers:              ${farmers}`);
  console.log(`Farms:                ${farms}`);
  console.log(`Business Partners:    ${businessPartners}`);
  console.log(`Destination Tx:       ${destinationTransactions}`);
  console.log(`Source Tx:            ${sourceTransactions}`);
  console.log("");

  console.log("TARGET RELATION COUNTS");
  console.log("");

  const targetFarmers = await prisma.farmer.count({
    where: {
      subCountyId: targetId,
    },
  });

  const targetFarms = await prisma.farm.count({
    where: {
      subCountyId: targetId,
    },
  });

  const targetBusinessPartners =
    await prisma.businessPartner.count({
      where: {
        subCountyId: targetId,
      },
    });

  const targetDestinationTransactions =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: targetId,
      },
    });

  const targetSourceTransactions =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: targetId,
      },
    });

  console.log(`Farmers:              ${targetFarmers}`);
  console.log(`Farms:                ${targetFarms}`);
  console.log(`Business Partners:    ${targetBusinessPartners}`);
  console.log(
    `Destination Tx:       ${targetDestinationTransactions}`
  );
  console.log(
    `Source Tx:            ${targetSourceTransactions}`
  );

  console.log("");
  console.log("============================================================");
  console.log("INSPECTION COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("INSPECTION FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });