import prisma from "../lib/prisma";

const ids = [979, 980, 981];

async function main() {
  const before = await prisma.subCounty.count({
    where: { id: { in: ids } },
  });

  console.log(`Records found: ${before}`);

  if (before !== 3) {
    throw new Error(`Safety check failed: expected 3, found ${before}.`);
  }

  const referenced = await prisma.subCounty.findMany({
    where: {
      id: { in: ids },
      OR: [
        { wards: { some: {} } },
        { farmers: { some: {} } },
        { farms: { some: {} } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (referenced.length > 0) {
    console.table(referenced);
    throw new Error("Safety check failed. Nothing was deleted.");
  }

  const result = await prisma.subCounty.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Deleted records: ${result.count}`);

  if (result.count !== 3) {
    throw new Error(`Delete count mismatch: ${result.count} of 3.`);
  }

  console.log("SUCCESS: Isiolo duplicate SubCounty records deleted.");
}

main()
  .catch((error) => {
    console.error("CLEANUP FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });