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
  const subCounties = await prisma.subCounty.findMany({
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
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  console.log(`Total SubCounty records: ${subCounties.length}`);
  console.log("");

  for (const item of subCounties) {
    console.log(
      `${item.county.name} :: ${item.name} [ID=${item.id}]`
    );
  }
}

main()
  .catch((error) => {
    console.error("Error:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });