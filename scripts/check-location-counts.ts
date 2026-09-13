import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

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
  console.log("=======================================");
  console.log("LOCATION DATABASE DIAGNOSTIC");
  console.log("=======================================");

  const counties = await prisma.county.count();
  const subCounties = await prisma.subCounty.count();
  const constituencies = await prisma.constituency.count();
  const wards = await prisma.ward.count();

  console.log("");
  console.log(`Counties:         ${counties}`);
  console.log(`SubCounties:      ${subCounties}`);
  console.log(`Constituencies:   ${constituencies}`);
  console.log(`Wards:            ${wards}`);
  console.log("");

  console.log("=======================================");
  console.log("SAMPLE CONSTITUENCIES");
  console.log("=======================================");

  const constituencyRows =
    await prisma.constituency.findMany({
      take: 20,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  console.table(constituencyRows);

  console.log("");
  console.log("=======================================");
  console.log("SAMPLE WARDS");
  console.log("=======================================");

  const wardRows =
    await prisma.ward.findMany({
      take: 10,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        constituencyId: true,
        subCountyId: true,
      },
    });

  console.table(wardRows);

  console.log("");
  console.log("=======================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("=======================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Diagnostic failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });