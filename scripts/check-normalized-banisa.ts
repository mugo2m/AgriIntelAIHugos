import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+sub\s+county$/i, "")
    .replace(/\s+/g, " ");
}

async function main() {
  const rows = await prisma.subCounty.findMany({
    where: {
      county: {
        name: "Mandera",
      },
    },
    include: {
      county: true,
      wards: true,
    },
    orderBy: { id: "asc" },
  });

  console.log("MANDERA SUBCOUNTIES");
  console.log("===================");

  for (const r of rows) {
    const key = normalize(r.name);

    if (key === "banisa") {
      console.log({
        id: r.id,
        name: r.name,
        normalized: key,
        wards: r.wards.length,
      });
    }
  }

  console.log("===================");
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());