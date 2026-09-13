import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  const rows = await prisma.subCounty.findMany({
    where: {
      county: {
        name: "Mandera",
      },
      name: {
        contains: "Banisa",
        mode: "insensitive",
      },
    },
    include: {
      county: true,
      wards: true,
      farms: true,
      farmers: true,
      businessPartners: true,
    },
    orderBy: { id: "asc" },
  });

  console.table(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      countyId: r.countyId,
      county: r.county.name,
      wards: r.wards.length,
      farms: r.farms.length,
      farmers: r.farmers.length,
      businessPartners: r.businessPartners.length,
    }))
  );

  console.log(`Records found: ${rows.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());