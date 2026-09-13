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
  const subCountyId = 463;

  console.log("");
  console.log("============================================================");
  console.log("INSPECT BARINGO TIATY SUBCOUNTY 463");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const subCounty = await prisma.subCounty.findUnique({
    where: {
      id: subCountyId,
    },
    include: {
      county: true,
    },
  });

  if (!subCounty) {
    console.log(`SubCounty ${subCountyId} was not found.`);
    return;
  }

  console.log("CURRENT SUBCOUNTY");
  console.log(`ID:       ${subCounty.id}`);
  console.log(`Name:     ${subCounty.name}`);
  console.log(`County:   ${subCounty.county.name} (${subCounty.countyId})`);
  console.log("");

  const wards = await prisma.ward.findMany({
    where: {
      subCountyId,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      code: true,
      sourceGid: true,
      sourceUid: true,
      constituencyId: true,
      countyId: true,
    },
  });

  console.log("WARDS");
  console.log(`Total wards: ${wards.length}`);
  console.log("");

  for (const ward of wards) {
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
      `Ward ${ward.id}: ${ward.name} | ` +
        `constituency=${ward.constituencyId} ${constituency?.name ?? "UNKNOWN"} | ` +
        `gid=${ward.sourceGid ?? "null"} | ` +
        `uid=${ward.sourceUid ?? "null"}`
    );
  }

  console.log("");
  console.log("DIRECT RELATIONS");
  console.log("");

  const farmerCount = await prisma.farmer.count({
    where: {
      subCountyId,
    },
  });

  const farmCount = await prisma.farm.count({
    where: {
      subCountyId,
    },
  });

  const businessPartnerCount = await prisma.businessPartner.count({
    where: {
      subCountyId,
    },
  });

  const destinationTransactionCount =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: subCountyId,
      },
    });

  const sourceTransactionCount =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: subCountyId,
      },
    });

  console.log(`Farmers:              ${farmerCount}`);
  console.log(`Farms:                ${farmCount}`);
  console.log(`Business Partners:    ${businessPartnerCount}`);
  console.log(`Destination Tx:       ${destinationTransactionCount}`);
  console.log(`Source Tx:            ${sourceTransactionCount}`);

  console.log("");
  console.log("============================================================");
  console.log("CANONICAL BARINGO SUBCOUNTIES");
  console.log("============================================================");
  console.log("");

  const baringoSubCounties = await prisma.subCounty.findMany({
    where: {
      countyId: subCounty.countyId,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  for (const record of baringoSubCounties) {
    const wardCount = await prisma.ward.count({
      where: {
        subCountyId: record.id,
      },
    });

    console.log(
      `${record.id}: ${record.name} | wards=${wardCount}`
    );
  }

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