import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedFarmingActivities(prisma: PrismaClient) {
  const activities = [
    "Crop Farming",
    "Livestock Farming",
    "Poultry Farming",
    "Aquaculture",
    "Horticulture",
    "Mixed Farming",
    "Agroforestry",
    "Other",
  ];

  for (const name of activities) {
    await prisma.farmingActivity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Farming activities: ${activities.length}`);
}