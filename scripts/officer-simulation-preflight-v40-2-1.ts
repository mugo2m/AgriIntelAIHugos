import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("V40.2.1 OFFICER SIMULATION PREFLIGHT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log();

  // ----------------------------------------------------------
  // 1. REQUIRED ROLES
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("1. REQUIRED ROLES");
  console.log("------------------------------------------------------------");

  const roleNames = [
    "Super Admin",
    "National Admin",
    "County Director",
    "Sub County Officer",
    "Ward Extension Officer",
    "Extension Officer",
  ];

  for (const roleName of roleNames) {
    const role = await prisma.role.findFirst({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error(
        `Required role not found: ${roleName}`,
      );
    }

    console.log(
      `PASS | Role ${role.id} | ${role.name}`,
    );
  }

  // ----------------------------------------------------------
  // 2. REQUIRED FUNCTIONS
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("2. REQUIRED FUNCTIONS");
  console.log("------------------------------------------------------------");

  const functionNames = [
    "Agriculture / General Agriculture",
    "Crops",
    "Agribusiness",
    "Agricultural Extension",
  ];

  for (const functionName of functionNames) {
    const officerFunction =
      await prisma.officerFunction.findUnique({
        where: {
          name: functionName,
        },
      });

    if (!officerFunction) {
      throw new Error(
        `Required OfficerFunction not found: ${functionName}`,
      );
    }

    if (!officerFunction.active) {
      throw new Error(
        `Required OfficerFunction is inactive: ${functionName}`,
      );
    }

    console.log(
      `PASS | Function ${officerFunction.id} | ${officerFunction.name}`,
    );
  }

  // ----------------------------------------------------------
  // 3. NATIONAL SCOPE
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("3. NATIONAL SCOPE");
  console.log("------------------------------------------------------------");

  const kenya = await prisma.country.findFirst({
    where: {
      name: {
        equals: "Kenya",
        mode: "insensitive",
      },
    },
  });

  if (!kenya) {
    throw new Error("Kenya country record not found.");
  }

  console.log(
    `PASS | Country ${kenya.id} | ${kenya.name}`,
  );

  // ----------------------------------------------------------
  // 4. DISCOVER A VALID COUNTY → SUBCOUNTY → WARD CHAIN
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log(
    "4. DISCOVER VALID COUNTY → SUBCOUNTY → WARD HIERARCHY",
  );
  console.log("------------------------------------------------------------");

  const counties = await prisma.county.findMany({
    where: {
      countryId: kenya.id,
    },
    orderBy: {
      id: "asc",
    },
    include: {
      subCounties: {
        orderBy: {
          id: "asc",
        },
        include: {
          wards: {
            orderBy: {
              id: "asc",
            },
          },
        },
      },
    },
  });

  if (counties.length === 0) {
    throw new Error(
      "No Kenyan counties were found.",
    );
  }

  let selectedCounty:
    | (typeof counties)[number]
    | undefined;

  let selectedSubCounty:
    | (typeof counties)[number]["subCounties"][number]
    | undefined;

  let selectedWard:
    | (typeof counties)[number]["subCounties"][number]["wards"][number]
    | undefined;

  for (const county of counties) {
    for (const subCounty of county.subCounties) {
      if (subCounty.wards.length > 0) {
        selectedCounty = county;
        selectedSubCounty = subCounty;
        selectedWard = subCounty.wards[0];
        break;
      }
    }

    if (
      selectedCounty &&
      selectedSubCounty &&
      selectedWard
    ) {
      break;
    }
  }

  if (
    !selectedCounty ||
    !selectedSubCounty ||
    !selectedWard
  ) {
    throw new Error(
      "Could not discover a valid County → SubCounty → Ward chain.",
    );
  }

  console.log(
    `PASS | County ${selectedCounty.id} | ${selectedCounty.name}`,
  );

  console.log(
    `PASS | SubCounty ${selectedSubCounty.id} | ${selectedSubCounty.name} | countyId=${selectedSubCounty.countyId}`,
  );

  console.log(
    `PASS | Ward ${selectedWard.id} | ${selectedWard.name} | countyId=${selectedWard.countyId} | subCountyId=${selectedWard.subCountyId}`,
  );

  // ----------------------------------------------------------
  // 5. VERIFY HIERARCHY
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("5. HIERARCHY CONSISTENCY");
  console.log("------------------------------------------------------------");

  if (
    selectedSubCounty.countyId !==
    selectedCounty.id
  ) {
    throw new Error(
      `SubCounty ${selectedSubCounty.id} does not belong to County ${selectedCounty.id}.`,
    );
  }

  console.log(
    `PASS | SubCounty ${selectedSubCounty.id} belongs to County ${selectedCounty.id}`,
  );

  if (
    selectedWard.countyId !==
    selectedCounty.id
  ) {
    throw new Error(
      `Ward ${selectedWard.id} does not belong to County ${selectedCounty.id}.`,
    );
  }

  console.log(
    `PASS | Ward ${selectedWard.id} belongs to County ${selectedCounty.id}`,
  );

  if (
    selectedWard.subCountyId !==
    selectedSubCounty.id
  ) {
    throw new Error(
      `Ward ${selectedWard.id} does not belong to SubCounty ${selectedSubCounty.id}.`,
    );
  }

  console.log(
    `PASS | Ward ${selectedWard.id} belongs to SubCounty ${selectedSubCounty.id}`,
  );

  // ----------------------------------------------------------
  // 6. CONSTITUENCY CONSISTENCY
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("6. CONSTITUENCY CONSISTENCY");
  console.log("------------------------------------------------------------");

  const constituency = await prisma.constituency.findUnique({
    where: {
      id: selectedWard.constituencyId,
    },
  });

  if (!constituency) {
    throw new Error(
      `Constituency ${selectedWard.constituencyId} was not found.`,
    );
  }

  console.log(
    `PASS | Constituency ${constituency.id} | ${constituency.name} | countyId=${constituency.countyId}`,
  );

  if (
    constituency.countyId !==
    selectedCounty.id
  ) {
    throw new Error(
      `Constituency ${constituency.id} does not belong to County ${selectedCounty.id}.`,
    );
  }

  console.log(
    `PASS | Constituency ${constituency.id} belongs to County ${selectedCounty.id}`,
  );

  // ----------------------------------------------------------
  // 7. EXISTING USERS
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("7. EXISTING USERS");
  console.log("------------------------------------------------------------");

  const userCount = await prisma.user.count();

  console.log(
    `PASS | Existing users: ${userCount}`,
  );

  // ----------------------------------------------------------
  // 8. EXISTING OFFICER ASSIGNMENTS
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("8. EXISTING OFFICER ASSIGNMENTS");
  console.log("------------------------------------------------------------");

  const assignmentCount =
    await prisma.officerAssignment.count();

  console.log(
    `PASS | Existing OfficerAssignments: ${assignmentCount}`,
  );

  // ----------------------------------------------------------
  // 9. FINAL SELECTED TEST DATA
  // ----------------------------------------------------------

  console.log();
  console.log("============================================================");
  console.log("V40.2.1 SELECTED TEST HIERARCHY");
  console.log("============================================================");

  console.log(
    `Country     : ${kenya.id} | ${kenya.name}`,
  );

  console.log(
    `County      : ${selectedCounty.id} | ${selectedCounty.name}`,
  );

  console.log(
    `SubCounty   : ${selectedSubCounty.id} | ${selectedSubCounty.name}`,
  );

  console.log(
    `Constituency: ${constituency.id} | ${constituency.name}`,
  );

  console.log(
    `Ward        : ${selectedWard.id} | ${selectedWard.name}`,
  );

  console.log();
  console.log("============================================================");
  console.log("V40.2.1 PREFLIGHT COMPLETE");
  console.log("============================================================");
  console.log(
    "READ-ONLY: NO INSERT / UPDATE / DELETE WAS PERFORMED.",
  );
  console.log("STATUS: GREEN");
}

main()
  .catch((error) => {
    console.error();
    console.error("============================================================");
    console.error("V40.2.1 PREFLIGHT FAILED");
    console.error("============================================================");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });