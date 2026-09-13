import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedCountries(prisma: PrismaClient) {
  console.log("🌍 Seeding countries...");

  const countries = [
    { name: "Kenya", code: "KE" },
    { name: "Uganda", code: "UG" },
    { name: "Tanzania", code: "TZ" },
    { name: "Rwanda", code: "RW" },
    { name: "Burundi", code: "BI" },
    { name: "South Sudan", code: "SS" },
    { name: "Ethiopia", code: "ET" },
    { name: "Somalia", code: "SO" },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: {
        name: country.name,
      },
      update: {
        code: country.code,
      },
      create: {
        name: country.name,
        code: country.code,
      },
    });
  }

  console.log(`✅ ${countries.length} countries seeded`);
}