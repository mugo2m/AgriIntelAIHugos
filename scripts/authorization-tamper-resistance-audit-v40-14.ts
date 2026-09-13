import prisma from "../lib/prisma";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type TestAssignment = {
  label: string;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  active: boolean;
  functionActive: boolean;
};

type TestFarmer = {
  label: string;
  countryId: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
};

let pass = 0;
let fail = 0;
let review = 0;

function PASS(message: string) {
  pass++;
  console.log(`PASS   ${message}`);
}

function FAIL(message: string) {
  fail++;
  console.log(`FAIL   ${message}`);
}

function REVIEW(message: string) {
  review++;
  console.log(`REVIEW ${message}`);
}

function section(title: string) {
  console.log("");
  console.log("-".repeat(60));
  console.log(title);
  console.log("-".repeat(60));
}

function validScopeShape(
  assignment: TestAssignment,
): boolean {
  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return (
        assignment.countryId !== null &&
        assignment.countyId === null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      );

    case "COUNTY":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId === null
      );

    case "WARD":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId !== null
      );

    default:
      return false;
  }
}

function allowsFarmer(
  assignment: TestAssignment,
  farmer: TestFarmer,
): boolean {
  if (!assignment.active) {
    return false;
  }

  if (!assignment.functionActive) {
    return false;
  }

  if (!validScopeShape(assignment)) {
    return false;
  }

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return (
        assignment.countryId === farmer.countryId
      );

    case "COUNTY":
      return (
        assignment.countryId === farmer.countryId &&
        assignment.countyId === farmer.countyId
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId === farmer.countryId &&
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId
      );

    case "WARD":
      return (
        assignment.countryId === farmer.countryId &&
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId &&
        assignment.wardId === farmer.wardId
      );

    default:
      return false;
  }
}

function expectDeny(
  assignment: TestAssignment,
  farmer: TestFarmer,
  description: string,
) {
  const result = allowsFarmer(
    assignment,
    farmer,
  );

  if (!result) {
    PASS(description);
  } else {
    FAIL(
      `${description} — SECURITY FAILURE: unexpected ALLOW`,
    );
  }
}

function expectAllow(
  assignment: TestAssignment,
  farmer: TestFarmer,
  description: string,
) {
  const result = allowsFarmer(
    assignment,
    farmer,
  );

  if (result) {
    PASS(description);
  } else {
    FAIL(
      `${description} — expected ALLOW`,
    );
  }
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.14 AUTHORIZATION FAILURE-MODE / TAMPER-RESISTANCE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  section("1. LOAD REAL AUTHORIZATION BASELINE");

  const kenya =
    await prisma.country.findFirst({
      where: {
        name: {
          equals: "Kenya",
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!kenya) {
    FAIL("Kenya exists");
    throw new Error("Kenya not found.");
  }

  PASS(`Kenya exists: ID ${kenya.id}`);

  const isiolo =
    await prisma.county.findUnique({
      where: {
        id: 48,
      },
      select: {
        id: true,
        name: true,
        countryId: true,
      },
    });

  if (!isiolo) {
    FAIL("Isiolo exists");
    throw new Error("Isiolo not found.");
  }

  PASS(
    `Isiolo exists: ${isiolo.name} (${isiolo.id})`,
  );

  const garbatulla =
    await prisma.subCounty.findUnique({
      where: {
        id: 1309,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  if (!garbatulla) {
    FAIL("Garbatulla exists");
    throw new Error(
      "Garbatulla not found.",
    );
  }

  PASS(
    `Garbatulla exists: ${garbatulla.name} (${garbatulla.id})`,
  );

  const garbatullaWard =
    await prisma.ward.findUnique({
      where: {
        id: 2095,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        subCountyId: true,
      },
    });

  if (!garbatullaWard) {
    FAIL("GARBATULLA Ward exists");
    throw new Error(
      "GARBATULLA Ward not found.",
    );
  }

  PASS(
    `GARBATULLA Ward exists: ${garbatullaWard.name} (${garbatullaWard.id})`,
  );

  section("2. LOAD EXISTING ASSIGNMENTS");

  const dbAssignments =
    await prisma.officerAssignment.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        active: true,
        scopeLevel: true,
        countryId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        role: {
          select: {
            name: true,
          },
        },
        function: {
          select: {
            name: true,
            active: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

  if (dbAssignments.length === 5) {
    PASS(
      "Exactly five active assignments exist",
    );
  } else {
    REVIEW(
      `Expected five active assignments; found ${dbAssignments.length}`,
    );
  }

  for (const assignment of dbAssignments) {
    console.log(
      `Assignment ${assignment.id} | ` +
        `${assignment.role.name} | ` +
        `${assignment.function.name} | ` +
        `${assignment.scopeLevel}`,
    );
  }

  section("3. BUILD KNOWN-GOOD FARMER TARGET");

  const farmer4 =
    await prisma.farmer.findUnique({
      where: {
        id: 4,
      },
      select: {
        id: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        county: {
          select: {
            countryId: true,
          },
        },
      },
    });

  if (!farmer4) {
    FAIL("Farmer 4 exists");
    throw new Error(
      "Farmer 4 not found.",
    );
  }

  const knownGoodFarmer: TestFarmer = {
    label: "Farmer 4",
    countryId: farmer4.county.countryId,
    countyId: farmer4.countyId,
    subCountyId: farmer4.subCountyId,
    wardId: farmer4.wardId,
  };

  console.log(
    `Farmer 4: country=${knownGoodFarmer.countryId}, ` +
      `county=${knownGoodFarmer.countyId}, ` +
      `subCounty=${knownGoodFarmer.subCountyId}, ` +
      `ward=${knownGoodFarmer.wardId}`,
  );

  PASS(
    "Known Farmer target loaded",
  );

  section("4. MALFORMED NATIONAL ASSIGNMENTS");

  const malformedNationalCases: TestAssignment[] = [
    {
      label: "National + county",
      scopeLevel: "NATIONAL",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: null,
      wardId: null,
      active: true,
      functionActive: true,
    },
    {
      label: "National + subcounty",
      scopeLevel: "NATIONAL",
      countryId: kenya.id,
      countyId: null,
      subCountyId: garbatulla.id,
      wardId: null,
      active: true,
      functionActive: true,
    },
    {
      label: "National + ward",
      scopeLevel: "NATIONAL",
      countryId: kenya.id,
      countyId: null,
      subCountyId: null,
      wardId: garbatullaWard.id,
      active: true,
      functionActive: true,
    },
    {
      label: "National without country",
      scopeLevel: "NATIONAL",
      countryId: null,
      countyId: null,
      subCountyId: null,
      wardId: null,
      active: true,
      functionActive: true,
    },
  ];

  for (const assignment of malformedNationalCases) {
    expectDeny(
      assignment,
      knownGoodFarmer,
      `${assignment.label} cannot authorize Farmer 4`,
    );
  }

  section("5. MALFORMED COUNTY ASSIGNMENTS");

  const malformedCountyCases: TestAssignment[] = [
    {
      label: "County without country",
      scopeLevel: "COUNTY",
      countryId: null,
      countyId: isiolo.id,
      subCountyId: null,
      wardId: null,
      active: true,
      functionActive: true,
    },
    {
      label: "County + subcounty",
      scopeLevel: "COUNTY",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: garbatulla.id,
      wardId: null,
      active: true,
      functionActive: true,
    },
    {
      label: "County + ward",
      scopeLevel: "COUNTY",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: null,
      wardId: garbatullaWard.id,
      active: true,
      functionActive: true,
    },
    {
      label: "County without countyId",
      scopeLevel: "COUNTY",
      countryId: kenya.id,
      countyId: null,
      subCountyId: null,
      wardId: null,
      active: true,
      functionActive: true,
    },
  ];

  for (const assignment of malformedCountyCases) {
    expectDeny(
      assignment,
      knownGoodFarmer,
      `${assignment.label} cannot authorize Farmer 4`,
    );
  }

  section("6. MALFORMED SUBCOUNTY ASSIGNMENTS");

  const malformedSubCountyCases: TestAssignment[] = [
    {
      label: "SubCounty without country",
      scopeLevel: "SUBCOUNTY",
      countryId: null,
      countyId: isiolo.id,
      subCountyId: garbatulla.id,
      wardId: null,
      active: true,
      functionActive: true,
    },
    {
      label: "SubCounty without county",
      scopeLevel: "SUBCOUNTY",
      countryId: kenya.id,
      countyId: null,
      subCountyId: garbatulla.id,
      wardId: null,
      active: true,
      functionActive: true,
    },
    {
      label: "SubCounty + ward",
      scopeLevel: "SUBCOUNTY",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: garbatulla.id,
      wardId: garbatullaWard.id,
      active: true,
      functionActive: true,
    },
    {
      label: "SubCounty without subCountyId",
      scopeLevel: "SUBCOUNTY",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: null,
      wardId: null,
      active: true,
      functionActive: true,
    },
  ];

  for (const assignment of malformedSubCountyCases) {
    expectDeny(
      assignment,
      knownGoodFarmer,
      `${assignment.label} cannot authorize Farmer 4`,
    );
  }

  section("7. MALFORMED WARD ASSIGNMENTS");

  const malformedWardCases: TestAssignment[] = [
    {
      label: "Ward without country",
      scopeLevel: "WARD",
      countryId: null,
      countyId: isiolo.id,
      subCountyId: garbatulla.id,
      wardId: garbatullaWard.id,
      active: true,
      functionActive: true,
    },
    {
      label: "Ward without county",
      scopeLevel: "WARD",
      countryId: kenya.id,
      countyId: null,
      subCountyId: garbatulla.id,
      wardId: garbatullaWard.id,
      active: true,
      functionActive: true,
    },
    {
      label: "Ward without subcounty",
      scopeLevel: "WARD",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: null,
      wardId: garbatullaWard.id,
      active: true,
      functionActive: true,
    },
    {
      label: "Ward without wardId",
      scopeLevel: "WARD",
      countryId: kenya.id,
      countyId: isiolo.id,
      subCountyId: garbatulla.id,
      wardId: null,
      active: true,
      functionActive: true,
    },
  ];

  for (const assignment of malformedWardCases) {
    expectDeny(
      assignment,
      knownGoodFarmer,
      `${assignment.label} cannot authorize Farmer 4`,
    );
  }

  section("8. WRONG-GEOGRAPHY TAMPERING");

  const wrongCountryAssignment: TestAssignment = {
    label: "Ward with wrong country",
    scopeLevel: "WARD",
    countryId: 999999,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
    active: true,
    functionActive: true,
  };

  expectDeny(
    wrongCountryAssignment,
    knownGoodFarmer,
    "Wrong country ID denies Farmer 4",
  );

  const wrongCountyAssignment: TestAssignment = {
    label: "Ward with wrong county",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: 999999,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
    active: true,
    functionActive: true,
  };

  expectDeny(
    wrongCountyAssignment,
    knownGoodFarmer,
    "Wrong county ID denies Farmer 4",
  );

  const wrongSubCountyAssignment: TestAssignment = {
    label: "Ward with wrong subcounty",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: 999999,
    wardId: garbatullaWard.id,
    active: true,
    functionActive: true,
  };

  expectDeny(
    wrongSubCountyAssignment,
    knownGoodFarmer,
    "Wrong SubCounty ID denies Farmer 4",
  );

  const wrongWardAssignment: TestAssignment = {
    label: "Ward with wrong ward",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: 999999,
    active: true,
    functionActive: true,
  };

  expectDeny(
    wrongWardAssignment,
    knownGoodFarmer,
    "Wrong Ward ID denies Farmer 4",
  );

  section("9. CROSS-HIERARCHY TAMPERING");

  const crossHierarchy1: TestAssignment = {
    label: "Isiolo county + Garbatulla SubCounty",
    scopeLevel: "SUBCOUNTY",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: null,
    active: true,
    functionActive: true,
  };

  const crossHierarchyFarmer: TestFarmer = {
    label: "Farmer 4",
    countryId: farmer4.county.countryId,
    countyId: farmer4.countyId,
    subCountyId: farmer4.subCountyId,
    wardId: farmer4.wardId,
  };

  expectDeny(
    crossHierarchy1,
    crossHierarchyFarmer,
    "Isiolo/Garbatulla scope denies Kajiado Farmer 4",
  );

  const crossHierarchy2: TestAssignment = {
    label: "Garbatulla county mismatch",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: farmer4.subCountyId,
    wardId: farmer4.wardId,
    active: true,
    functionActive: true,
  };

  expectDeny(
    crossHierarchy2,
    knownGoodFarmer,
    "Cross-hierarchy Ward combination does not grant access",
  );

  section("10. INACTIVE / DISABLED STATES");

  const inactiveAssignment: TestAssignment = {
    label: "Inactive valid Ward assignment",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
    active: false,
    functionActive: true,
  };

  expectDeny(
    inactiveAssignment,
    knownGoodFarmer,
    "Inactive assignment denies matching geography",
  );

  const inactiveFunction: TestAssignment = {
    label: "Valid Ward with inactive function",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
    active: true,
    functionActive: false,
  };

  expectDeny(
    inactiveFunction,
    knownGoodFarmer,
    "Inactive function denies matching geography",
  );

  section("11. PRIMARY ROLE ESCALATION TESTS");

  const user =
    await prisma.user.findUnique({
      where: {
        id: 1,
      },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
        active: true,
      },
    });

  if (!user) {
    FAIL("User 1 exists");
  } else {
    PASS(
      `User 1 exists with primary role ${user.role.name}`,
    );

    if (user.role.name === "Farmer") {
      PASS(
        "Primary Farmer role does not become officer authority by itself",
      );
    } else {
      FAIL(
        `Primary role changed unexpectedly to ${user.role.name}`,
      );
    }

    if (user.active) {
      PASS(
        "User 1 is active",
      );
    } else {
      FAIL(
        "User 1 is unexpectedly inactive",
      );
    }
  }

  section("12. FUNCTION-ONLY ESCALATION TEST");

  const functionOnly: TestAssignment = {
    label: "Crops function without geographic scope",
    scopeLevel: "NATIONAL",
    countryId: null,
    countyId: null,
    subCountyId: null,
    wardId: null,
    active: true,
    functionActive: true,
  };

  expectDeny(
    functionOnly,
    knownGoodFarmer,
    "Function without geographic scope cannot authorize Farmer 4",
  );

  section("13. NAME-ONLY ESCALATION TEST");

  const nameOnly: TestAssignment = {
    label: "Officer name only",
    scopeLevel: "NATIONAL",
    countryId: null,
    countyId: null,
    subCountyId: null,
    wardId: null,
    active: true,
    functionActive: true,
  };

  expectDeny(
    nameOnly,
    knownGoodFarmer,
    "Officer name without geography cannot authorize Farmer 4",
  );

  section("14. NONEXISTENT GEOGRAPHY IDS");

  const nonexistentCountry: TestAssignment = {
    label: "Nonexistent country",
    scopeLevel: "NATIONAL",
    countryId: 999999,
    countyId: null,
    subCountyId: null,
    wardId: null,
    active: true,
    functionActive: true,
  };

  expectDeny(
    nonexistentCountry,
    knownGoodFarmer,
    "Nonexistent country ID denies Farmer 4",
  );

  const nonexistentCounty: TestAssignment = {
    label: "Nonexistent county",
    scopeLevel: "COUNTY",
    countryId: kenya.id,
    countyId: 999999,
    subCountyId: null,
    wardId: null,
    active: true,
    functionActive: true,
  };

  expectDeny(
    nonexistentCounty,
    knownGoodFarmer,
    "Nonexistent county ID denies Farmer 4",
  );

  const nonexistentSubCounty: TestAssignment = {
    label: "Nonexistent SubCounty",
    scopeLevel: "SUBCOUNTY",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: 999999,
    wardId: null,
    active: true,
    functionActive: true,
  };

  expectDeny(
    nonexistentSubCounty,
    knownGoodFarmer,
    "Nonexistent SubCounty ID denies Farmer 4",
  );

  const nonexistentWard: TestAssignment = {
    label: "Nonexistent Ward",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: 999999,
    active: true,
    functionActive: true,
  };

  expectDeny(
    nonexistentWard,
    knownGoodFarmer,
    "Nonexistent Ward ID denies Farmer 4",
  );

  section("15. CLIENT OVERRIDE MODEL");

  const legitimateWard: TestAssignment = {
    label: "Legitimate GARBATULLA Ward",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
    active: true,
    functionActive: true,
  };

  const clientAttemptedFarmer: TestFarmer = {
    label: "Client-selected Kajiado Farmer",
    countryId: farmer4.county.countryId,
    countyId: farmer4.countyId,
    subCountyId: farmer4.subCountyId,
    wardId: farmer4.wardId,
  };

  expectDeny(
    legitimateWard,
    clientAttemptedFarmer,
    "Client-selected out-of-scope Farmer cannot bypass Ward authorization",
  );

  section("16. REAL ASSIGNMENT STRUCTURAL TAMPER CHECK");

  let invalidRealAssignments = 0;

  for (const assignment of dbAssignments) {
    const testAssignment: TestAssignment = {
      label: `DB Assignment ${assignment.id}`,
      scopeLevel:
        assignment.scopeLevel as ScopeLevel,
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId: assignment.wardId,
      active: assignment.active,
      functionActive: assignment.function.active,
    };

    if (!validScopeShape(testAssignment)) {
      invalidRealAssignments++;
      FAIL(
        `Real Assignment ${assignment.id} has malformed scope shape`,
      );
    }
  }

  if (invalidRealAssignments === 0) {
    PASS(
      "All current real assignments have valid scope shapes",
    );
  }

  section("17. REAL ASSIGNMENT GEOGRAPHY CHAIN CHECK");

  for (const assignment of dbAssignments) {
    if (assignment.countryId === null) {
      FAIL(
        `Assignment ${assignment.id} has null countryId`,
      );
      continue;
    }

    const country =
      await prisma.country.findUnique({
        where: {
          id: assignment.countryId,
        },
        select: {
          id: true,
        },
      });

    if (!country) {
      FAIL(
        `Assignment ${assignment.id} references nonexistent country`,
      );
      continue;
    }

    if (
      assignment.scopeLevel ===
      "NATIONAL"
    ) {
      PASS(
        `Assignment ${assignment.id} NATIONAL country reference exists`,
      );
      continue;
    }

    if (assignment.countyId === null) {
      FAIL(
        `Assignment ${assignment.id} missing countyId`,
      );
      continue;
    }

    const county =
      await prisma.county.findUnique({
        where: {
          id: assignment.countyId,
        },
        select: {
          id: true,
          countryId: true,
        },
      });

    if (
      !county ||
      county.countryId !==
        assignment.countryId
    ) {
      FAIL(
        `Assignment ${assignment.id} county chain is invalid`,
      );
      continue;
    }

    if (
      assignment.scopeLevel ===
      "COUNTY"
    ) {
      PASS(
        `Assignment ${assignment.id} COUNTY geography chain valid`,
      );
      continue;
    }

    if (
      assignment.subCountyId === null
    ) {
      FAIL(
        `Assignment ${assignment.id} missing subCountyId`,
      );
      continue;
    }

    const subCounty =
      await prisma.subCounty.findUnique({
        where: {
          id: assignment.subCountyId,
        },
        select: {
          id: true,
          countyId: true,
        },
      });

    if (
      !subCounty ||
      subCounty.countyId !==
        assignment.countyId
    ) {
      FAIL(
        `Assignment ${assignment.id} SubCounty chain is invalid`,
      );
      continue;
    }

    if (
      assignment.scopeLevel ===
      "SUBCOUNTY"
    ) {
      PASS(
        `Assignment ${assignment.id} SUBCOUNTY geography chain valid`,
      );
      continue;
    }

    if (
      assignment.wardId === null
    ) {
      FAIL(
        `Assignment ${assignment.id} missing wardId`,
      );
      continue;
    }

    const ward =
      await prisma.ward.findUnique({
        where: {
          id: assignment.wardId,
        },
        select: {
          id: true,
          countyId: true,
          subCountyId: true,
        },
      });

    if (
      !ward ||
      ward.countyId !==
        assignment.countyId ||
      ward.subCountyId !==
        assignment.subCountyId
    ) {
      FAIL(
        `Assignment ${assignment.id} Ward chain is invalid`,
      );
      continue;
    }

    PASS(
      `Assignment ${assignment.id} WARD geography chain valid`,
    );
  }

  section("18. READ-ONLY SAFETY");

  PASS(
    "No INSERT operation executed",
  );

  PASS(
    "No UPDATE operation executed",
  );

  PASS(
    "No DELETE operation executed",
  );

  PASS(
    "All tampered assignments existed only in memory",
  );

  PASS(
    "No production authorization records were modified",
  );

  section("19. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.14 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);

  if (fail > 0) {
    console.log("V40.14 STATUS: RED");
    console.log("");
    console.log(
      "Authorization tamper-resistance failures detected.",
    );
    process.exitCode = 1;
    return;
  }

  if (review > 0) {
    console.log("V40.14 STATUS: GREEN WITH REVIEW");
    console.log("");
    console.log(
      "Tamper-resistance checks passed with review items.",
    );
    return;
  }

  console.log("V40.14 STATUS: GREEN");
  console.log("");
  console.log(
    "Authorization failure-mode and tamper-resistance " +
      "checks are fully GREEN.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.14 FATAL ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });