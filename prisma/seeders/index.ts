import { PrismaClient } from "../../lib/generated/prisma/client";

import { seedSystem } from "./system";
import { seedLocations } from "./locations";
import { seedFarmer } from "./farmer";
import { seedSoilTypes } from "./farm/soil-types";

export async function seedDatabase(prisma: PrismaClient) {
  console.log("");
  console.log("=======================================");
  console.log("🌱 Starting AgriIntel AI Hugos Seeder");
  console.log("=======================================");
  console.log("");

  // System
  await seedSystem(prisma);

  // Administrative locations
  await seedLocations(prisma);

  // Farmer profile reference data
  await seedFarmer(prisma);

  // Farm reference data
  await seedSoilTypes(prisma);

  console.log("");
  console.log("=======================================");
  console.log("✅ Database successfully seeded");
  console.log("=======================================");
}