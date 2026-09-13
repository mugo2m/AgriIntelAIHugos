import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedEducationLevels(prisma: PrismaClient) {
  const levels = [
    "No formal education",
    "Primary",
    "Secondary",
    "Certificate",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate",
  ];

  for (const name of levels) {
    await prisma.educationLevel.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Education levels: ${levels.length}`);
}