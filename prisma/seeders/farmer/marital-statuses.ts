import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedMaritalStatuses(prisma: PrismaClient) {
  const statuses = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
  ];

  for (const name of statuses) {
    await prisma.maritalStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Marital statuses: ${statuses.length}`);
}