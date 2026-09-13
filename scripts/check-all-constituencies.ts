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
  console.log("Loading Constituency records from PostgreSQL...");
  console.log("");

  const constituencies = await prisma.constituency.findMany({
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
        id: "asc",
      },
    ],
  });

  console.log(
    `Total Constituency records: ${constituencies.length}`
  );
  console.log("");

  for (const constituency of constituencies) {
    console.log(
      `${constituency.county.name} :: ${constituency.name} [ID=${constituency.id}]`
    );
  }

  console.log("");
  console.log("Constituency check completed.");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Failed to check constituencies.");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });