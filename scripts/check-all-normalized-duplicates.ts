import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ids = [376, 687, 392, 698, 411, 780, 446, 743, 515, 779, 518, 601];

async function main() {
  const rows = await prisma.subCounty.findMany({
    where: {
      id: { in: ids },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          sourceTransactions: true,
          destinationTransactions: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      county: r.county.name,
      wards: r._count.wards,
      farms: r._count.farms,
      farmers: r._count.farmers,
      businessPartners: r._count.businessPartners,
      sourceTransactions: r._count.sourceTransactions,
      destinationTransactions: r._count.destinationTransactions,
    }))
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());