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
  console.log("Inspecting Isiolo SubCounty usage...");
  console.log("");

  const subCounties = await prisma.subCounty.findMany({
    where: {
      countyId: 48,
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

  console.table(subCounties);

  console.log("");
  console.log("Checking Ward references...");
  console.log("");

  const wards = await prisma.ward.findMany({
    where: {
      subCountyId: {
        in: subCounties.map((sc) => sc.id),
      },
    },
    select: {
      id: true,
      name: true,
      code: true,
      subCountyId: true,
    },
    orderBy: {
      subCountyId: "asc",
    },
  });

  console.table(wards);

  console.log("");
  console.log(`Ward records found: ${wards.length}`);
  console.log("");

  for (const subCounty of subCounties) {
    const referencedWards = wards.filter(
      (ward) => ward.subCountyId === subCounty.id
    );

    console.log(
      `ID ${subCounty.id} | ${subCounty.name} | wards: ${referencedWards.length}`
    );
  }

  console.log("");
  console.log("Inspection complete.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Inspection failed.");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });