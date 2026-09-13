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
  console.log("");
  console.log("==============================================");
  console.log("INSPECT SUBCOUNTY 467 → 1478");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("==============================================");
  console.log("");

  const legacy = await prisma.subCounty.findUnique({
    where: {
      id: 467,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
      farms: {
        select: {
          id: true,
          farmName: true,
          farmerId: true,
          subCountyId: true,
          countyId: true,
          wardId: true,
          villageId: true,
        },
      },
      farmers: {
        select: {
          id: true,
          userId: true,
          phone: true,
          subCountyId: true,
          countyId: true,
          wardId: true,
          villageId: true,
        },
      },
    },
  });

  const target = await prisma.subCounty.findUnique({
    where: {
      id: 1478,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  if (!legacy) {
    console.log("ERROR: SubCounty 467 was not found.");
    return;
  }

  if (!target) {
    console.log("ERROR: Target SubCounty 1478 was not found.");
    return;
  }

  console.log("LEGACY SUBCOUNTY");
  console.log("----------------------------------------------");
  console.log(`ID:       ${legacy.id}`);
  console.log(`Name:     ${legacy.name}`);
  console.log(`County:   ${legacy.county.name} (${legacy.countyId})`);

  console.log("");
  console.log("LEGACY RELATION COUNTS");
  console.log("----------------------------------------------");
  console.log(`Wards:                 ${legacy._count.wards}`);
  console.log(`Farms:                 ${legacy._count.farms}`);
  console.log(`Farmers:               ${legacy._count.farmers}`);
  console.log(
    `Business Partners:     ${legacy._count.businessPartners}`,
  );
  console.log(
    `Destination Tx:        ${legacy._count.destinationTransactions}`,
  );
  console.log(
    `Source Tx:             ${legacy._count.sourceTransactions}`,
  );

  console.log("");
  console.log("TARGET SUBCOUNTY");
  console.log("----------------------------------------------");
  console.log(`ID:       ${target.id}`);
  console.log(`Name:     ${target.name}`);
  console.log(`County:   ${target.county.name} (${target.countyId})`);

  console.log("");
  console.log("TARGET RELATION COUNTS");
  console.log("----------------------------------------------");
  console.log(`Wards:                 ${target._count.wards}`);
  console.log(`Farms:                 ${target._count.farms}`);
  console.log(`Farmers:               ${target._count.farmers}`);
  console.log(
    `Business Partners:     ${target._count.businessPartners}`,
  );
  console.log(
    `Destination Tx:        ${target._count.destinationTransactions}`,
  );
  console.log(
    `Source Tx:             ${target._count.sourceTransactions}`,
  );

  console.log("");
  console.log("FARMS UNDER LEGACY 467");
  console.log("----------------------------------------------");

  if (legacy.farms.length === 0) {
    console.log("None");
  } else {
    for (const farm of legacy.farms) {
      console.log(
        `Farm ${farm.id}: ${farm.farmName ?? "(unnamed)"}`,
      );
      console.log(
        `  farmerId=${farm.farmerId} countyId=${farm.countyId} subCountyId=${farm.subCountyId} wardId=${farm.wardId} villageId=${farm.villageId}`,
      );
    }
  }

  console.log("");
  console.log("FARMERS UNDER LEGACY 467");
  console.log("----------------------------------------------");

  if (legacy.farmers.length === 0) {
    console.log("None");
  } else {
    for (const farmer of legacy.farmers) {
      console.log(
        `Farmer ${farmer.id}: userId=${farmer.userId} phone=${farmer.phone}`,
      );
      console.log(
        `  countyId=${farmer.countyId} subCountyId=${farmer.subCountyId} wardId=${farmer.wardId} villageId=${farmer.villageId}`,
      );
    }
  }

  console.log("");
  console.log("==============================================");
  console.log("INSPECTION COMPLETE");
  console.log("NO DATABASE CHANGES");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });