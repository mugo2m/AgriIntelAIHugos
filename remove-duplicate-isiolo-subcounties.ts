import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\nChecking duplicate Isiolo SubCounty records...\n");

  const duplicates = await prisma.subCounty.findMany({
    where: {
      id: {
        in: [614, 615, 616],
      },
    },
    include: {
      county: true,
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
    duplicates.map((sc) => ({
      id: sc.id,
      name: sc.name,
      countyId: sc.countyId,
      county: sc.county.name,
      wards: sc._count.wards,
      farms: sc._count.farms,
      farmers: sc._count.farmers,
      businessPartners: sc._count.businessPartners,
      sourceTransactions: sc._count.sourceTransactions,
      destinationTransactions: sc._count.destinationTransactions,
    }))
  );

  if (duplicates.length !== 3) {
    throw new Error(
      `Expected exactly 3 duplicate records (614, 615, 616), found ${duplicates.length}. Aborting.`
    );
  }

  const hasReferences = duplicates.some((sc) =>
    Object.values(sc._count).some((count) => count > 0)
  );

  if (hasReferences) {
    throw new Error(
      "One or more duplicate SubCounty records has references. NOTHING will be deleted."
    );
  }

  console.log("\nAll three duplicate records are unused.");
  console.log("Deleting IDs 614, 615 and 616...\n");

  await prisma.subCounty.deleteMany({
    where: {
      id: {
        in: [614, 615, 616],
      },
    },
  });

  console.log("Successfully deleted duplicate SubCounty records.");
  console.log("Deleted: 614, 615, 616");
}

main()
  .catch((error) => {
    console.error("\nCleanup failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });