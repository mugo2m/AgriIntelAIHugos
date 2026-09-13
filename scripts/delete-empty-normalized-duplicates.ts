import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// These are the EMPTY duplicate records.
// The corresponding older records contain the wards.
const DELETE_IDS = [
  601, // Banisa - duplicate of 518 BANISSA
  687, // Mukurwe-ini - duplicate of 376
  698, // Murang'a South - duplicate of 392
  743, // Marakwet East - duplicate of 446
  779, // Trans Mara East - duplicate of 515
  780, // Trans Mara West - duplicate of 411
];

async function main() {
  console.log("");
  console.log("REMOVING EMPTY NORMALIZED SUBCOUNTY DUPLICATES");
  console.log("==============================================");
  console.log("");

  const records = await prisma.subCounty.findMany({
    where: {
      id: {
        in: DELETE_IDS,
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
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          sourceTransactions: true,
          destinationTransactions: true,
        },
      },
    },
  });

  console.log("Records to delete:");

  for (const record of records) {
    console.log(
      `ID ${record.id}: "${record.name}" (${record.county.name}) - ` +
        `wards=${record._count.wards}, ` +
        `farms=${record._count.farms}, ` +
        `farmers=${record._count.farmers}`
    );
  }

  console.log("");

  if (records.length !== DELETE_IDS.length) {
    throw new Error(
      `Expected ${DELETE_IDS.length} records, but found ${records.length}. Aborting.`
    );
  }

  for (const record of records) {
    const totalRelations =
      record._count.wards +
      record._count.farms +
      record._count.farmers +
      record._count.businessPartners +
      record._count.sourceTransactions +
      record._count.destinationTransactions;

    if (totalRelations !== 0) {
      throw new Error(
        `Refusing to delete ID ${record.id} because it has related records.`
      );
    }
  }

  console.log("All selected records are empty.");
  console.log("Proceeding with deletion...");
  console.log("");

  await prisma.$transaction(
    DELETE_IDS.map((id) =>
      prisma.subCounty.delete({
        where: { id },
      })
    )
  );

  console.log("Successfully deleted:");

  for (const id of DELETE_IDS) {
    console.log(`- SubCounty ID ${id}`);
  }

  console.log("");
  console.log("==============================================");
  console.log("CLEANUP COMPLETE");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Cleanup failed.");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());