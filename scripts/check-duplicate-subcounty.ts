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
  console.log("Checking Isiolo / Garbatulla records...");
  console.log("");

  const rows = await prisma.subCounty.findMany({
    where: {
      name: {
        equals: "Garbatulla",
        mode: "insensitive",
      },
      county: {
        name: {
          equals: "Isiolo",
          mode: "insensitive",
        },
      },
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
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(
    rows.map((row) => ({
      subCountyId: row.id,
      subCountyName: row.name,
      countyId: row.countyId,
      countyName: row.county.name,
    }))
  );

  console.log("");
  console.log(`Records found: ${rows.length}`);
  console.log("");

  if (rows.length > 1) {
    console.log("⚠️ DUPLICATE DETECTED");
    console.log("");
    console.log(
      "These records produce the same normalized key:"
    );
    console.log("");
    console.log("isiolo::garbatulla");
    console.log("");
    console.log(
      "DO NOT delete or merge anything yet."
    );
  } else if (rows.length === 1) {
    console.log("Only one Garbatulla record exists.");
  } else {
    console.log(
      "No Isiolo / Garbatulla record was found."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("Query failed.");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });