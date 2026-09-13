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

async function main() {
  const id = 651;

  const record = await prisma.subCounty.findUnique({
    where: { id },
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

  if (!record) {
    throw new Error(`SubCounty ID ${id} not found.`);
  }

  console.log("");
  console.log("DELETING EMPTY DUPLICATE");
  console.log("========================");
  console.log(`ID: ${record.id}`);
  console.log(`Name: ${record.name}`);
  console.log(`County: ${record.county.name}`);
  console.log(`Wards: ${record._count.wards}`);
  console.log(`Farms: ${record._count.farms}`);
  console.log(`Farmers: ${record._count.farmers}`);
  console.log("");

  if (
    record._count.wards !== 0 ||
    record._count.farms !== 0 ||
    record._count.farmers !== 0 ||
    record._count.businessPartners !== 0 ||
    record._count.sourceTransactions !== 0 ||
    record._count.destinationTransactions !== 0
  ) {
    throw new Error(
      "ABORTED: This record is not empty."
    );
  }

  await prisma.subCounty.delete({
    where: { id },
  });

  console.log(`Successfully deleted ID ${id}: "${record.name}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());