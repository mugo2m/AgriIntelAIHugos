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
  console.log("INSPECT KAJIADO WARDS");
  console.log("SUBCOUNTY 467 → 1478");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("==============================================");
  console.log("");

  const wards = await prisma.ward.findMany({
    where: {
      subCountyId: 467,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      code: true,
      subCountyId: true,
      countyId: true,
      constituencyId: true,
      sourceGid: true,
      sourceUid: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      subCounty: {
        select: {
          id: true,
          name: true,
        },
      },
      constituency: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
    },
  });

  console.log(`Wards under SubCounty 467: ${wards.length}`);
  console.log("");

  for (const ward of wards) {
    console.log("----------------------------------------------");
    console.log(`Ward ID:          ${ward.id}`);
    console.log(`Name:             ${ward.name}`);
    console.log(`Code:             ${ward.code ?? "null"}`);
    console.log(`SubCounty ID:     ${ward.subCountyId}`);
    console.log(`SubCounty:        ${ward.subCounty?.name ?? "null"}`);
    console.log(`County ID:        ${ward.countyId}`);
    console.log(`County:           ${ward.county.name}`);
    console.log(`Constituency ID:  ${ward.constituencyId}`);
    console.log(`Constituency:     ${ward.constituency.name}`);
    console.log(`Source GID:       ${ward.sourceGid ?? "null"}`);
    console.log(`Source UID:       ${ward.sourceUid ?? "null"}`);
  }

  const farmerWard = await prisma.ward.findUnique({
    where: {
      id: 1859,
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
      countyId: true,
      constituencyId: true,
      sourceGid: true,
      sourceUid: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      subCounty: {
        select: {
          id: true,
          name: true,
        },
      },
      constituency: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log("");
  console.log("==============================================");
  console.log("FARMER 4 / FARM 1 WARD");
  console.log("==============================================");
  console.log("");

  if (!farmerWard) {
    console.log("ERROR: Ward 1859 was not found.");
  } else {
    console.log(`Ward ID:          ${farmerWard.id}`);
    console.log(`Name:             ${farmerWard.name}`);
    console.log(`SubCounty ID:     ${farmerWard.subCountyId}`);
    console.log(`SubCounty:        ${farmerWard.subCounty?.name ?? "null"}`);
    console.log(`County ID:        ${farmerWard.countyId}`);
    console.log(`County:           ${farmerWard.county.name}`);
    console.log(`Constituency ID:  ${farmerWard.constituencyId}`);
    console.log(`Constituency:     ${farmerWard.constituency.name}`);
    console.log(`Source GID:       ${farmerWard.sourceGid ?? "null"}`);
    console.log(`Source UID:       ${farmerWard.sourceUid ?? "null"}`);
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