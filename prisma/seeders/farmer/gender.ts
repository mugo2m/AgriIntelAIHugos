import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedGenders(prisma: PrismaClient) {
  const genders = [
    "Male",
    "Female",
    "Other",
    "Prefer not to say",
  ];

  for (const name of genders) {
    await prisma.gender.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Genders: ${genders.length}`);
}