// prisma/seeders/locations/index.ts

import { PrismaClient } from "../../../lib/generated/prisma/client";

import { seedCountries } from "./countries";
import { seedCounties } from "./counties";
import { seedSubCounties } from "./subcounties";
import { seedWards } from "./wards";

export async function seedLocations(prisma: PrismaClient) {
  console.log("");
  console.log("======================================");
  console.log("📍 Seeding Administrative Units");
  console.log("======================================");

  await seedCountries(prisma);
  await seedCounties(prisma);
  await seedSubCounties(prisma);
  await seedWards(prisma);

  console.log("✅ Administrative units seeded.");
}