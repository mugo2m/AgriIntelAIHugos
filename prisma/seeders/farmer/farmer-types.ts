import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedFarmerTypes(prisma: PrismaClient) {
  const farmerTypes = [
    "Smallholder Farmer",
    "Commercial Farmer",
    "Subsistence Farmer",
    "Cooperative Farmer",
    "Contract Farmer",
    "Youth Farmer",
    "Women Farmer",
    "Other",
  ];

  for (const name of farmerTypes) {
    await prisma.farmerType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Farmer types: ${farmerTypes.length}`);
}