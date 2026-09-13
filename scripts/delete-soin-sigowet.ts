import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  const id = 792;

  const record = await prisma.subCounty.findUnique({
    where: { id },
  });

  if (!record) {
    console.log("ID 792 not found. It may already be deleted.");
    return;
  }

  console.log(`Found ID ${id}: "${record.name}"`);
  console.log("Deleting...");

  await prisma.subCounty.delete({
    where: { id },
  });

  console.log(`Successfully deleted ID ${id}: "${record.name}"`);
}

main()
  .catch((error) => {
    console.error("DELETE FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
