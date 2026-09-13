
// prisma/seed-locations.ts

import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { seedCountries } from "./seeders/locations/countries";
import { seedCounties } from "./seeders/locations/counties";
import { seedSubCounties } from "./seeders/locations/subcounties";

// =======================================================
// DATABASE CONNECTION
// =======================================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Check your .env file."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

// =======================================================
// MAIN
// =======================================================

async function main() {
  console.log("");
  console.log("======================================");
  console.log("🌍 AgriIntel AI Hugos");
  console.log("Location Seeder");
  console.log("======================================");
  console.log("");

  // -----------------------------------------------------
  // COUNTRY
  // -----------------------------------------------------

  console.log("▶ Seeding countries...");

  await seedCountries(prisma);

  console.log("✅ Countries seeded.");
  console.log("");

  // -----------------------------------------------------
  // COUNTY
  // -----------------------------------------------------

  console.log("▶ Seeding counties...");

  await seedCounties(prisma);

  console.log("✅ Counties seeded.");
  console.log("");

  // -----------------------------------------------------
  // SUB-COUNTY
  // -----------------------------------------------------

  console.log("▶ Seeding sub-counties...");

  await seedSubCounties(prisma);

  console.log("✅ Sub-counties seeded.");
  console.log("");

  // -----------------------------------------------------
  // VALIDATION
  // -----------------------------------------------------

  const countryCount =
    await prisma.country.count();

  const countyCount =
    await prisma.county.count();

  const subCountyCount =
    await prisma.subCounty.count();

  console.log("");
  console.log("======================================");
  console.log("📊 LOCATION SUMMARY");
  console.log("======================================");
  console.log(`Countries:    ${countryCount}`);
  console.log(`Counties:     ${countyCount}`);
  console.log(`Sub-counties: ${subCountyCount}`);
  console.log("======================================");
  console.log("");

  if (countryCount === 0) {
    throw new Error(
      "Location validation failed: no countries were seeded."
    );
  }

  if (countyCount === 0) {
    throw new Error(
      "Location validation failed: no counties were seeded."
    );
  }

  if (subCountyCount === 0) {
    throw new Error(
      "Location validation failed: no sub-counties were seeded."
    );
  }

  console.log(
    "✅ Country → County → SubCounty hierarchy is populated."
  );

  console.log("");
}

// =======================================================
// EXECUTE
// =======================================================

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Location seeding failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

