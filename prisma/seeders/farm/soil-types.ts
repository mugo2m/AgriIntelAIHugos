import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedSoilTypes(prisma: PrismaClient) {
  console.log("🌱 Seeding soil types...");

  const soilTypes = [
    {
      name: "Sandy",
      description: "Light-textured soil with high drainage and low water-holding capacity.",
      phMin: 5.5,
      phMax: 7.5,
    },
    {
      name: "Clay",
      description: "Fine-textured soil with high water and nutrient-holding capacity.",
      phMin: 5.5,
      phMax: 8.0,
    },
    {
      name: "Loam",
      description: "Balanced soil containing sand, silt, and clay with good drainage and fertility.",
      phMin: 6.0,
      phMax: 7.5,
    },
    {
      name: "Silty",
      description: "Fine soil with good moisture retention and generally high fertility.",
      phMin: 6.0,
      phMax: 7.5,
    },
    {
      name: "Sandy Loam",
      description: "Light, well-drained soil suitable for many crops.",
      phMin: 5.5,
      phMax: 7.5,
    },
    {
      name: "Clay Loam",
      description: "Moderately heavy soil with good nutrient and moisture retention.",
      phMin: 5.5,
      phMax: 7.5,
    },
    {
      name: "Silty Loam",
      description: "Fertile soil with good moisture retention and workable structure.",
      phMin: 6.0,
      phMax: 7.5,
    },
    {
      name: "Volcanic",
      description: "Volcanic-origin soil generally rich in organic matter and minerals.",
      phMin: 5.0,
      phMax: 7.0,
    },
    {
      name: "Red Soil",
      description: "Iron-rich red soil commonly found in well-drained agricultural areas.",
      phMin: 5.0,
      phMax: 7.0,
    },
    {
      name: "Black Cotton",
      description: "Dark, clay-rich soil with high moisture and nutrient-holding capacity.",
      phMin: 6.0,
      phMax: 8.0,
    },
    {
      name: "Alluvial",
      description: "Soil deposited by rivers and generally suitable for productive agriculture.",
      phMin: 6.0,
      phMax: 8.0,
    },
  ];

  for (const soilType of soilTypes) {
    await prisma.soilType.upsert({
      where: {
        name: soilType.name,
      },
      update: {
        description: soilType.description,
        phMin: soilType.phMin,
        phMax: soilType.phMax,
      },
      create: soilType,
    });
  }

  console.log(`✅ Soil types seeded: ${soilTypes.length}`);
}