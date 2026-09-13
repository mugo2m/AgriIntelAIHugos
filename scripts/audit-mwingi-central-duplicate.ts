import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  console.log("============================================================");
  console.log("MWINGI CENTRAL DUPLICATE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");

  const ids = [345, 1016];

  for (const id of ids) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`SUBCOUNTY ${id}`);
    console.log(`------------------------------------------------------------`);

    const subCounty = await prisma.subCounty.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        countyId: true,

        wards: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true,
            constituencyId: true,
          },
          orderBy: {
            id: "asc",
          },
        },

        farmers: {
          select: { id: true },
        },

        farms: {
          select: { id: true },
        },

        businessPartners: {
          select: { id: true },
        },
      },
    });

    if (!subCounty) {
      console.log("Record: NOT FOUND");
      continue;
    }

    console.log("ID:", subCounty.id);
    console.log("Name:", subCounty.name);
    console.log("County ID:", subCounty.countyId);

    console.log("\nWards:", subCounty.wards.length);

    for (const ward of subCounty.wards) {
      console.log(
        `  ${ward.id} | ${ward.name} | code: ${ward.code} | countyId: ${ward.countyId} | constituencyId: ${ward.constituencyId}`
      );
    }

    console.log("\nFarmers:", subCounty.farmers.length);
    console.log("Farms:", subCounty.farms.length);
    console.log("Business Partners:", subCounty.businessPartners.length);

    const sourceTransactions =
      await prisma.commodityTransaction.count({
        where: {
          sourceSubCountyId: id,
        },
      });

    const destinationTransactions =
      await prisma.commodityTransaction.count({
        where: {
          destinationSubCountyId: id,
        },
      });

    console.log("Commodity source references:", sourceTransactions);
    console.log(
      "Commodity destination references:",
      destinationTransactions
    );
  }

  console.log("\n============================================================");
  console.log("AUDIT COMPLETED");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });