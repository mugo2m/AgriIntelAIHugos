import { prisma } from "../lib/prisma";

async function main() {
  const rows = await prisma.subCounty.findMany({
    where: {
      county: {
        name: {
          contains: "Nairobi",
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      wards: {
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("");
  console.log("==============================================");
  console.log("NAIROBI SUBCOUNTY INSPECTION");
  console.log("==============================================");
  console.log(JSON.stringify(rows, null, 2));
  console.log("==============================================");
  console.log("");

  console.log(`Nairobi SubCounty count: ${rows.length}`);

  for (const row of rows) {
    console.log("");
    console.log(`ID: ${row.id}`);
    console.log(`Name: ${row.name}`);
    console.log(`County ID: ${row.countyId}`);
    console.log(`County: ${row.county.name}`);
    console.log(`Ward count: ${row.wards.length}`);

    for (const ward of row.wards) {
      console.log(`  ${ward.id} | ${ward.name}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("NAIROBI INSPECTION FAILED");
    console.error(error);
    console.error("");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
