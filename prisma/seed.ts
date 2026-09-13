// prisma/seed.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedDatabase } from "./seeders";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Please check your .env file.",
  );
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
  console.log("🌱 Starting AgriIntel AI Hugos Seeder");
  console.log("=======================================");
  console.log("");

  await seedDatabase(prisma);

  console.log("");
  console.log("=======================================");
  console.log("✅ Database seeding completed");
  console.log("=======================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Database seeding failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });