import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedOccupations(prisma: PrismaClient) {
  const occupations = [
    "Farmer",
    "Agribusiness",
    "Government Employee",
    "Private Sector Employee",
    "Business Owner",
    "Teacher",
    "Student",
    "Other",
  ];

  for (const name of occupations) {
    await prisma.occupation.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Occupations: ${occupations.length}`);
}