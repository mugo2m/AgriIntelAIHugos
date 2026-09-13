// prisma/seeders/farmer/index.ts

import { PrismaClient } from "../../../lib/generated/prisma/client";

import { seedGenders } from "./gender";
import { seedEducationLevels } from "./education-levels";
import { seedOccupations } from "./occupations";
import { seedMaritalStatuses } from "./marital-statuses";
import { seedFarmerTypes } from "./farmer-types";
import { seedFarmingActivities } from "./farming-activities";
import { seedLanguages } from "./languages";
import { seedCommunicationPreferences } from "./communication-preferences";
import { seedDigitalLiteracyLevels } from "./digital-literacy-levels";

export async function seedFarmer(prisma: PrismaClient) {
  console.log("");
  console.log("======================================");
  console.log("👨‍🌾 Seeding Farmer Profile Data");
  console.log("======================================");

  await seedGenders(prisma);
  await seedEducationLevels(prisma);
  await seedOccupations(prisma);
  await seedMaritalStatuses(prisma);
  await seedFarmerTypes(prisma);
  await seedFarmingActivities(prisma);
  await seedLanguages(prisma);
  await seedCommunicationPreferences(prisma);
  await seedDigitalLiteracyLevels(prisma);

  console.log("✅ Farmer profile data seeded.");
}