import { prisma } from "../lib/prisma";

type AssignmentSeed = {
  userId: number;
  roleName: string;
  functionName: string;
  scopeLevel: "NATIONAL" | "COUNTY" | "SUBCOUNTY" | "WARD";
  countryId?: number;
  countyId?: number;
  subCountyId?: number;
  wardId?: number;
  notes: string;
};

async function getRoleId(name: string): Promise<number> {
  const role = await prisma.role.findFirst({
    where: {
      name,
    },
  });

  if (!role) {
    throw new Error(`Role not found: ${name}`);
  }

  return role.id;
}

async function getFunctionId(name: string): Promise<number> {
  const officerFunction =
    await prisma.officerFunction.findUnique({
      where: {
        name,
      },
    });

  if (!officerFunction) {
    throw new Error(
      `OfficerFunction not found: ${name}`,
    );
  }

  if (!officerFunction.active) {
    throw new Error(
      `OfficerFunction is inactive: ${name}`,
    );
  }

  return officerFunction.id;
}

async function main() {
  console.log("============================================================");
  console.log("V40.2.2 SIMULATED OFFICER SEED");
  console.log("============================================================");
  console.log("SOURCE: SIMULATED");
  console.log();

  // ----------------------------------------------------------
  // 1. VERIFIED TEST USER
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("1. TEST USER");
  console.log("------------------------------------------------------------");

  const user = await prisma.user.findUnique({
    where: {
      id: 1,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new Error(
      "Test User ID 1 does not exist.",
    );
  }

  console.log(
    `PASS | User ${user.id} | ${user.name ?? "Unnamed"} | Current role: ${user.role?.name ?? "Unknown"}`,
  );

  // ----------------------------------------------------------
  // 2. VERIFIED GEOGRAPHY
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("2. VERIFIED GEOGRAPHY");
  console.log("------------------------------------------------------------");

  const country = await prisma.country.findUnique({
    where: {
      id: 2,
    },
  });

  if (!country) {
    throw new Error(
      "Country 2 (Kenya) does not exist.",
    );
  }

  const county = await prisma.county.findUnique({
    where: {
      id: 48,
    },
  });

  if (!county) {
    throw new Error(
      "County 48 (Isiolo) does not exist.",
    );
  }

  const subCounty =
    await prisma.subCounty.findUnique({
      where: {
        id: 1309,
      },
    });

  if (!subCounty) {
    throw new Error(
      "SubCounty 1309 (Garbatulla) does not exist.",
    );
  }

  const ward = await prisma.ward.findUnique({
    where: {
      id: 2095,
    },
  });

  if (!ward) {
    throw new Error(
      "Ward 2095 (GARBATULLA) does not exist.",
    );
  }

  const constituency =
    await prisma.constituency.findUnique({
      where: {
        id: 520,
      },
    });

  if (!constituency) {
    throw new Error(
      "Constituency 520 (Isiolo South) does not exist.",
    );
  }

  // ----------------------------------------------------------
  // 3. HIERARCHY VALIDATION
  // ----------------------------------------------------------

  if (county.countryId !== country.id) {
    throw new Error(
      `County ${county.id} does not belong to Country ${country.id}.`,
    );
  }

  if (subCounty.countyId !== county.id) {
    throw new Error(
      `SubCounty ${subCounty.id} does not belong to County ${county.id}.`,
    );
  }

  if (ward.countyId !== county.id) {
    throw new Error(
      `Ward ${ward.id} does not belong to County ${county.id}.`,
    );
  }

  if (ward.subCountyId !== subCounty.id) {
    throw new Error(
      `Ward ${ward.id} does not belong to SubCounty ${subCounty.id}.`,
    );
  }

  if (ward.constituencyId !== constituency.id) {
    throw new Error(
      `Ward ${ward.id} does not belong to Constituency ${constituency.id}.`,
    );
  }

  if (constituency.countyId !== county.id) {
    throw new Error(
      `Constituency ${constituency.id} does not belong to County ${county.id}.`,
    );
  }

  console.log(
    `PASS | Country ${country.id} | ${country.name}`,
  );

  console.log(
    `PASS | County ${county.id} | ${county.name}`,
  );

  console.log(
    `PASS | SubCounty ${subCounty.id} | ${subCounty.name}`,
  );

  console.log(
    `PASS | Constituency ${constituency.id} | ${constituency.name}`,
  );

  console.log(
    `PASS | Ward ${ward.id} | ${ward.name}`,
  );

  // ----------------------------------------------------------
  // 4. ROLES
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("4. OFFICER ROLES");
  console.log("------------------------------------------------------------");

  const superAdminRoleId =
    await getRoleId("Super Admin");

  const nationalAdminRoleId =
    await getRoleId("National Admin");

  const countyDirectorRoleId =
    await getRoleId("County Director");

  const subCountyOfficerRoleId =
    await getRoleId("Sub County Officer");

  const wardExtensionOfficerRoleId =
    await getRoleId("Ward Extension Officer");

  console.log(
    `PASS | Super Admin | roleId=${superAdminRoleId}`,
  );

  console.log(
    `PASS | National Admin | roleId=${nationalAdminRoleId}`,
  );

  console.log(
    `PASS | County Director | roleId=${countyDirectorRoleId}`,
  );

  console.log(
    `PASS | Sub County Officer | roleId=${subCountyOfficerRoleId}`,
  );

  console.log(
    `PASS | Ward Extension Officer | roleId=${wardExtensionOfficerRoleId}`,
  );

  // ----------------------------------------------------------
  // 5. FUNCTIONS
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("5. OFFICER FUNCTIONS");
  console.log("------------------------------------------------------------");

  const agricultureFunctionId =
    await getFunctionId(
      "Agriculture / General Agriculture",
    );

  const cropsFunctionId =
    await getFunctionId("Crops");

  const agribusinessFunctionId =
    await getFunctionId("Agribusiness");

  const extensionFunctionId =
    await getFunctionId(
      "Agricultural Extension",
    );

  console.log(
    `PASS | Agriculture / General Agriculture | functionId=${agricultureFunctionId}`,
  );

  console.log(
    `PASS | Crops | functionId=${cropsFunctionId}`,
  );

  console.log(
    `PASS | Agribusiness | functionId=${agribusinessFunctionId}`,
  );

  console.log(
    `PASS | Agricultural Extension | functionId=${extensionFunctionId}`,
  );

  // ----------------------------------------------------------
  // 6. ASSIGNMENT DEFINITIONS
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("6. SIMULATED ASSIGNMENT DEFINITIONS");
  console.log("------------------------------------------------------------");

  const assignments: AssignmentSeed[] = [
    {
      userId: user.id,
      roleName: "Super Admin",
      functionName:
        "Agriculture / General Agriculture",
      scopeLevel: "NATIONAL",
      countryId: country.id,
      notes:
        "V40 simulated national authorization assignment.",
    },
    {
      userId: user.id,
      roleName: "National Admin",
      functionName: "Crops",
      scopeLevel: "NATIONAL",
      countryId: country.id,
      notes:
        "V40 simulated national crops assignment.",
    },
    {
      userId: user.id,
      roleName: "County Director",
      functionName: "Agribusiness",
      scopeLevel: "COUNTY",
      countryId: country.id,
      countyId: county.id,
      notes:
        "V40 simulated Isiolo County agribusiness assignment.",
    },
    {
      userId: user.id,
      roleName: "Sub County Officer",
      functionName: "Agricultural Extension",
      scopeLevel: "SUBCOUNTY",
      countryId: country.id,
      countyId: county.id,
      subCountyId: subCounty.id,
      notes:
        "V40 simulated Garbatulla SubCounty extension assignment.",
    },
    {
      userId: user.id,
      roleName: "Ward Extension Officer",
      functionName: "Agricultural Extension",
      scopeLevel: "WARD",
      countryId: country.id,
      countyId: county.id,
      subCountyId: subCounty.id,
      wardId: ward.id,
      notes:
        "V40 simulated GARBATULLA Ward extension assignment.",
    },
  ];

  // ----------------------------------------------------------
  // 7. ROLE/FUNCTION RESOLUTION
  // ----------------------------------------------------------

  const resolvedAssignments = [];

  for (const assignment of assignments) {
    const roleId = await getRoleId(
      assignment.roleName,
    );

    const functionId = await getFunctionId(
      assignment.functionName,
    );

    resolvedAssignments.push({
      ...assignment,
      roleId,
      functionId,
    });
  }

  // ----------------------------------------------------------
  // 8. TRANSACTION
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("8. SEED TRANSACTION");
  console.log("------------------------------------------------------------");

  await prisma.$transaction(async (tx) => {
    for (const assignment of resolvedAssignments) {
      const existing =
        await tx.officerAssignment.findFirst({
          where: {
            userId: assignment.userId,
            roleId: assignment.roleId,
            functionId: assignment.functionId,
            scopeLevel: assignment.scopeLevel,
            countryId:
              assignment.countryId ?? null,
            countyId:
              assignment.countyId ?? null,
            subCountyId:
              assignment.subCountyId ?? null,
            wardId:
              assignment.wardId ?? null,
            source: "SIMULATED",
          },
        });

      if (existing) {
        await tx.officerAssignment.update({
          where: {
            id: existing.id,
          },
          data: {
            active: true,
            notes: assignment.notes,
          },
        });

        console.log(
          `UPDATED | Assignment ${existing.id} | ${assignment.roleName} | ${assignment.scopeLevel}`,
        );
      } else {
        const created =
          await tx.officerAssignment.create({
            data: {
              userId: assignment.userId,
              roleId: assignment.roleId,
              functionId:
                assignment.functionId,

              scopeLevel:
                assignment.scopeLevel,

              countryId:
                assignment.countryId,

              countyId:
                assignment.countyId,

              subCountyId:
                assignment.subCountyId,

              wardId:
                assignment.wardId,

              active: true,

              source: "SIMULATED",

              notes: assignment.notes,
            },
          });

        console.log(
          `CREATED | Assignment ${created.id} | ${assignment.roleName} | ${assignment.scopeLevel}`,
        );
      }
    }
  });

  // ----------------------------------------------------------
  // 9. VERIFY
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("9. POST-SEED VERIFICATION");
  console.log("------------------------------------------------------------");

  const simulatedAssignments =
    await prisma.officerAssignment.findMany({
      where: {
        source: "SIMULATED",
      },
      include: {
        user: true,
        role: true,
        function: true,
        country: true,
        county: true,
        subCounty: true,
        ward: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `SIMULATED ASSIGNMENTS: ${simulatedAssignments.length}`,
  );

  for (const assignment of simulatedAssignments) {
    console.log();
    console.log(
      `Assignment ${assignment.id}`,
    );
    console.log(
      `  User      : ${assignment.userId}`,
    );
    console.log(
      `  Role      : ${assignment.role.name}`,
    );
    console.log(
      `  Function  : ${assignment.function.name}`,
    );
    console.log(
      `  Scope     : ${assignment.scopeLevel}`,
    );
    console.log(
      `  Country   : ${assignment.country?.name ?? "-"}`,
    );
    console.log(
      `  County    : ${assignment.county?.name ?? "-"}`,
    );
    console.log(
      `  SubCounty : ${assignment.subCounty?.name ?? "-"}`,
    );
    console.log(
      `  Ward      : ${assignment.ward?.name ?? "-"}`,
    );
    console.log(
      `  Source    : ${assignment.source}`,
    );
    console.log(
      `  Active    : ${assignment.active}`,
    );
  }

  // ----------------------------------------------------------
  // 10. FINAL VALIDATION
  // ----------------------------------------------------------

  const expectedCount =
    resolvedAssignments.length;

  if (
    simulatedAssignments.length !==
    expectedCount
  ) {
    throw new Error(
      `Expected ${expectedCount} simulated assignments but found ${simulatedAssignments.length}.`,
    );
  }

  const invalidSource =
    simulatedAssignments.filter(
      (assignment) =>
        assignment.source !== "SIMULATED",
    );

  if (invalidSource.length > 0) {
    throw new Error(
      "One or more assignments do not have source=SIMULATED.",
    );
  }

  const inactive =
    simulatedAssignments.filter(
      (assignment) =>
        !assignment.active,
    );

  if (inactive.length > 0) {
    throw new Error(
      "One or more simulated assignments are inactive.",
    );
  }

  console.log();
  console.log("============================================================");
  console.log("V40.2.2 SIMULATED OFFICER SEED COMPLETE");
  console.log("============================================================");
  console.log(
    `Simulated assignments: ${simulatedAssignments.length}`,
  );
  console.log(
    "Verified geography: Kenya → Isiolo → Garbatulla → GARBATULLA",
  );
  console.log("Source: SIMULATED");
  console.log("STATUS: GREEN");
}

main()
  .catch((error) => {
    console.error();
    console.error("============================================================");
    console.error("V40.2.2 SEED FAILED");
    console.error("============================================================");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });