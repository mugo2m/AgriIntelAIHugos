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
  console.log("Loading Baringo sub-counties...");

  const subCounties = await prisma.subCounty.findMany({
    where: {
      county: {
        name: "Baringo",
      },
    },
    select: {
      id: true,
      name: true,
      county: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`Found ${subCounties.length} Baringo sub-counties:`);

  console.table(subCounties);
}

main()
  .catch((error) => {
    console.error("❌ Error:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });