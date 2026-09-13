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
  console.log("ALL MURANG'A SUBCOUNTIES");
  console.log("========================");

  const records = await prisma.subCounty.findMany({
    where: {
      county: {
        name: {
          equals: "Murang'a",
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          wards: true,
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
    }))
  );

  console.log("");
  console.log(`Total Murang'a SubCounty records: ${records.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());