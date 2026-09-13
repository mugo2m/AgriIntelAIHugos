import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("");
  console.log("MURANG'A UNMATCHED SUBCOUNTIES");
  console.log("================================");

  const names = [
    "Gatanga",
    "Kandara",
    "Kangema",
    "Kigumo",
    "Kiharu",
    "Mathioya",
    "Murang'a South",
  ];

  const records = await prisma.subCounty.findMany({
    where: {
      county: {
        name: {
          equals: "Murang'a",
          mode: "insensitive",
        },
      },
      OR: names.map((name) => ({
        name: {
          contains: name,
          mode: "insensitive" as const,
        },
      })),
    },
    select: {
      id: true,
      name: true,
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
    records.map((r) => ({
      id: r.id,
      name: r.name,
      wards: r._count.wards,
      farms: r._count.farms,
      farmers: r._count.farmers,
      businessPartners: r._count.businessPartners,
      sourceTransactions: r._count.sourceTransactions,
      destinationTransactions:
        r._count.destinationTransactions,
    }))
  );

  console.log("");
  console.log(`Records found: ${records.length}`);
  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());