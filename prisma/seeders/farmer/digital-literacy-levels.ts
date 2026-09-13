import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedDigitalLiteracyLevels(
  prisma: PrismaClient,
) {
  const levels = [
    "Low",
    "Basic",
    "Intermediate",
    "Advanced",
  ];

  for (const name of levels) {
    await prisma.digitalLiteracyLevel.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Digital literacy levels: ${levels.length}`);
}