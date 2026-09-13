import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("V40.2.1 OFFICER GEOGRAPHY HIERARCHY AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log();

  const chains = await prisma.county.findMany({
    include: {
      country: true,
      subCounties: {
        include: {
          wards: {
            orderBy: {
              id: "asc",
            },
            take: 1,
          },
        },
        orderBy: {
          id: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      id: "asc",
    },
    take: 10,
  });

  console.log("------------------------------------------------------------");
  console.log("VALID COUNTY → SUBCOUNTY → WARD CHAINS");
  console.log("------------------------------------------------------------");

  for (const county of chains) {
    const subCounty = county.subCounties[0];
    const ward = subCounty?.wards[0];

    if (!subCounty || !ward) {
      continue;
    }

    console.log();
    console.log(`County    : ${county.id} | ${county.name}`);
    console.log(`Country   : ${county.countryId} | ${county.country.name}`);
    console.log(`SubCounty : ${subCounty.id} | ${subCounty.name}`);
    console.log(`Ward      : ${ward.id} | ${ward.name}`);
    console.log(
      `Hierarchy : ${county.id} → ${subCounty.id} → ${ward.id}`,
    );
  }

  console.log();
  console.log("------------------------------------------------------------");
  console.log("KNOWN KASIPUL HIERARCHY CHECK");
  console.log("------------------------------------------------------------");

  const kasipul = await prisma.subCounty.findUnique({
    where: {
      id: 267,
    },
    include: {
      county: {
        include: {
          country: true,
        },
      },
      wards: {
        where: {
          id: 1063,
        },
        include: {
          county: true,
          subCounty: true,
        },
      },
    },
  });

  if (!kasipul) {
    throw new Error("SubCounty 267 not found.");
  }

  console.log(
    `SubCounty : ${kasipul.id} | ${kasipul.name}`,
  );

  console.log(
    `County    : ${kasipul.county.id} | ${kasipul.county.name}`,
  );

  console.log(
    `Country   : ${kasipul.county.country.id} | ${kasipul.county.country.name}`,
  );

  const kasipulWard = kasipul.wards[0];

  if (!kasipulWard) {
    throw new Error(
      "Ward 1063 was not found under SubCounty 267.",
    );
  }

  console.log(
    `Ward      : ${kasipulWard.id} | ${kasipulWard.name}`,
  );

  console.log(
    `Ward County    : ${kasipulWard.county.id} | ${kasipulWard.county.name}`,
  );

  console.log(
    `Ward SubCounty : ${kasipulWard.subCounty.id} | ${kasipulWard.subCounty.name}`,
  );

  console.log();
  console.log("============================================================");
  console.log("V40.2.1 STATUS: GREEN");
  console.log("============================================================");
  console.log("No data was modified.");
}

main()
  .catch((error) => {
    console.error();
    console.error("============================================================");
    console.error("V40.2.1 STATUS: FAILED");
    console.error("============================================================");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });