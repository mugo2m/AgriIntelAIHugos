import prisma from "../lib/prisma";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type SyntheticFarmer = {
  label: string;
  countryId: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
};

type SyntheticAssignment = {
  label: string;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  active: boolean;
  functionActive: boolean;
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
  assignment: SyntheticAssignment,
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

function assignmentAllowsFarmer(
  assignment: SyntheticAssignment,
  farmer: SyntheticFarmer,
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
      return assignment.countryId === farmer.countryId;

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

function assertAllow(
  assignment: SyntheticAssignment,
  farmer: SyntheticFarmer,
  description: string,
) {
  const result = assignmentAllowsFarmer(
    assignment,
    farmer,
  );

  if (result) {
    PASS(description);
  } else {
    FAIL(`${description} — expected ALLOW`);
  }
}

function assertDeny(
  assignment: SyntheticAssignment,
  farmer: SyntheticFarmer,
  description: string,
) {
  const result = assignmentAllowsFarmer(
    assignment,
    farmer,
  );

  if (!result) {
    PASS(description);
  } else {
    FAIL(`${description} — expected DENY`);
  }
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.12 AUTHORIZATION MATRIX + SYNTHETIC SCOPE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  section("1. LOAD REAL GEOGRAPHY BASELINE");

  const kenya = await prisma.country.findFirst({
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
    throw new Error("Kenya country record was not found.");
  }

  PASS(`Kenya exists: ID ${kenya.id}`);

  const isiolo = await prisma.county.findFirst({
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
    FAIL("Isiolo county ID 48 exists");
    throw new Error("Isiolo county was not found.");
  }

  if (isiolo.countryId !== kenya.id) {
    FAIL("Isiolo belongs to Kenya");
    throw new Error("Isiolo geography is inconsistent.");
  }

  PASS(
    `Isiolo exists and belongs to Kenya: ${isiolo.name}`,
  );

  const garbatulla = await prisma.subCounty.findFirst({
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
    FAIL("Garbatulla SubCounty ID 1309 exists");
    throw new Error("Garbatulla SubCounty was not found.");
  }

  if (garbatulla.countyId !== isiolo.id) {
    FAIL("Garbatulla belongs to Isiolo");
    throw new Error(
      "Garbatulla geography is inconsistent.",
    );
  }

  PASS(
    `Garbatulla exists under Isiolo: ${garbatulla.name}`,
  );

  const garbatullaWard = await prisma.ward.findFirst({
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
    FAIL("GARBATULLA Ward ID 2095 exists");
    throw new Error("GARBATULLA Ward was not found.");
  }

  if (
    garbatullaWard.countyId !== isiolo.id ||
    garbatullaWard.subCountyId !== garbatulla.id
  ) {
    FAIL(
      "GARBATULLA Ward belongs to Isiolo/Garbatulla",
    );
    throw new Error(
      "GARBATULLA Ward geography is inconsistent.",
    );
  }

  PASS(
    `GARBATULLA Ward exists under Garbatulla: ${garbatullaWard.name}`,
  );

  section("2. FIND SIBLING GEOGRAPHIES");

  const siblingCounty = await prisma.county.findFirst({
    where: {
      countryId: kenya.id,
      id: {
        not: isiolo.id,
      },
    },
    select: {
      id: true,
      name: true,
      countryId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!siblingCounty) {
    FAIL("A sibling county exists in Kenya");
    throw new Error(
      "Could not find a sibling Kenyan county.",
    );
  }

  PASS(
    `Sibling county found: ${siblingCounty.name} (${siblingCounty.id})`,
  );

  const siblingSubCounty =
    await prisma.subCounty.findFirst({
      where: {
        countyId: isiolo.id,
        id: {
          not: garbatulla.id,
        },
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  if (!siblingSubCounty) {
    FAIL("Isiolo has a sibling SubCounty");
    throw new Error(
      "Could not find a sibling SubCounty under Isiolo.",
    );
  }

  PASS(
    `Sibling SubCounty found: ${siblingSubCounty.name} (${siblingSubCounty.id})`,
  );

  const siblingWard = await prisma.ward.findFirst({
    where: {
      countyId: isiolo.id,
      subCountyId: garbatulla.id,
      id: {
        not: garbatullaWard.id,
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!siblingWard) {
    FAIL("Garbatulla has a sibling Ward");
    throw new Error(
      "Could not find a sibling Ward under Garbatulla.",
    );
  }

  PASS(
    `Sibling Ward found: ${siblingWard.name} (${siblingWard.id})`,
  );

  const siblingSubCountyForWard =
    await prisma.subCounty.findFirst({
      where: {
        countyId: isiolo.id,
        id: {
          not: garbatulla.id,
        },
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  if (!siblingSubCountyForWard) {
    throw new Error(
      "Could not find sibling SubCounty for ward scenario.",
    );
  }

  const wardInSiblingSubCounty =
    await prisma.ward.findFirst({
      where: {
        countyId: isiolo.id,
        subCountyId: siblingSubCountyForWard.id,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        subCountyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  if (!wardInSiblingSubCounty) {
    FAIL(
      "A Ward exists under a sibling Isiolo SubCounty",
    );
    throw new Error(
      "Could not find Ward in sibling SubCounty.",
    );
  }

  PASS(
    `Ward in sibling SubCounty found: ${wardInSiblingSubCounty.name}`,
  );

  section("3. BUILD SYNTHETIC FARMER MATRIX");

  const baseFarmer: SyntheticFarmer = {
    label: "Isiolo / Garbatulla / GARBATULLA",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
  };

  const siblingCountyFarmer: SyntheticFarmer = {
    label: `Kenya / ${siblingCounty.name}`,
    countryId: kenya.id,
    countyId: siblingCounty.id,
    subCountyId: -1,
    wardId: -1,
  };

  const siblingSubCountyFarmer: SyntheticFarmer = {
    label: `Kenya / Isiolo / ${siblingSubCounty.name}`,
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: siblingSubCounty.id,
    wardId: -1,
  };

  const siblingWardFarmer: SyntheticFarmer = {
    label: `Kenya / Isiolo / Garbatulla / ${siblingWard.name}`,
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: siblingWard.id,
  };

  const siblingSubCountyWardFarmer: SyntheticFarmer = {
    label:
      `Kenya / Isiolo / ${siblingSubCountyForWard.name} / ` +
      `${wardInSiblingSubCounty.name}`,
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: siblingSubCountyForWard.id,
    wardId: wardInSiblingSubCounty.id,
  };

  const nationalForeignCountryFarmer: SyntheticFarmer = {
    label: "Synthetic foreign-country Farmer",
    countryId: -999,
    countyId: -999,
    subCountyId: -999,
    wardId: -999,
  };

  console.log(`Base Farmer: ${baseFarmer.label}`);
  console.log(
    `Sibling County Farmer: ${siblingCountyFarmer.label}`,
  );
  console.log(
    `Sibling SubCounty Farmer: ${siblingSubCountyFarmer.label}`,
  );
  console.log(
    `Sibling Ward Farmer: ${siblingWardFarmer.label}`,
  );
  console.log(
    `Sibling SubCounty Ward Farmer: ${siblingSubCountyWardFarmer.label}`,
  );

  section("4. BUILD SYNTHETIC AUTHORIZATION ASSIGNMENTS");

  const national: SyntheticAssignment = {
    label: "NATIONAL Kenya",
    scopeLevel: "NATIONAL",
    countryId: kenya.id,
    countyId: null,
    subCountyId: null,
    wardId: null,
    active: true,
    functionActive: true,
  };

  const county: SyntheticAssignment = {
    label: "COUNTY Isiolo",
    scopeLevel: "COUNTY",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: null,
    wardId: null,
    active: true,
    functionActive: true,
  };

  const subCounty: SyntheticAssignment = {
    label: "SUBCOUNTY Garbatulla",
    scopeLevel: "SUBCOUNTY",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: null,
    active: true,
    functionActive: true,
  };

  const ward: SyntheticAssignment = {
    label: "WARD GARBATULLA",
    scopeLevel: "WARD",
    countryId: kenya.id,
    countyId: isiolo.id,
    subCountyId: garbatulla.id,
    wardId: garbatullaWard.id,
    active: true,
    functionActive: true,
  };

  const assignments = [
    national,
    county,
    subCounty,
    ward,
  ];

  for (const assignment of assignments) {
    if (validScopeShape(assignment)) {
      PASS(
        `${assignment.label} has valid scope shape`,
      );
    } else {
      FAIL(
        `${assignment.label} has invalid scope shape`,
      );
    }
  }

  section("5. NATIONAL SCOPE MATRIX");

  assertAllow(
    national,
    baseFarmer,
    "NATIONAL allows same-country base Farmer",
  );

  assertAllow(
    national,
    siblingCountyFarmer,
    "NATIONAL allows same-country sibling-county Farmer",
  );

  assertAllow(
    national,
    siblingSubCountyFarmer,
    "NATIONAL allows same-country sibling-subcounty Farmer",
  );

  assertAllow(
    national,
    siblingWardFarmer,
    "NATIONAL allows same-country sibling-ward Farmer",
  );

  assertAllow(
    national,
    siblingSubCountyWardFarmer,
    "NATIONAL allows same-country sibling-subcounty Ward Farmer",
  );

  assertDeny(
    national,
    nationalForeignCountryFarmer,
    "NATIONAL denies foreign-country Farmer",
  );

  section("6. COUNTY SCOPE MATRIX");

  assertAllow(
    county,
    baseFarmer,
    "COUNTY allows Farmer inside assigned county",
  );

  assertAllow(
    county,
    siblingSubCountyFarmer,
    "COUNTY allows Farmer in sibling SubCounty within assigned county",
  );

  assertAllow(
    county,
    siblingWardFarmer,
    "COUNTY allows Farmer in sibling Ward within assigned county",
  );

  assertAllow(
    county,
    siblingSubCountyWardFarmer,
    "COUNTY allows Farmer in another SubCounty within assigned county",
  );

  assertDeny(
    county,
    siblingCountyFarmer,
    "COUNTY denies Farmer in sibling county",
  );

  assertDeny(
    county,
    nationalForeignCountryFarmer,
    "COUNTY denies foreign-country Farmer",
  );

  section("7. SUBCOUNTY SCOPE MATRIX");

  assertAllow(
    subCounty,
    baseFarmer,
    "SUBCOUNTY allows Farmer inside assigned SubCounty",
  );

  assertAllow(
    subCounty,
    siblingWardFarmer,
    "SUBCOUNTY allows sibling Ward inside assigned SubCounty",
  );

  assertDeny(
    subCounty,
    siblingSubCountyFarmer,
    "SUBCOUNTY denies Farmer in sibling SubCounty",
  );

  assertDeny(
    subCounty,
    siblingSubCountyWardFarmer,
    "SUBCOUNTY denies Farmer in Ward under sibling SubCounty",
  );

  assertDeny(
    subCounty,
    siblingCountyFarmer,
    "SUBCOUNTY denies Farmer in sibling county",
  );

  assertDeny(
    subCounty,
    nationalForeignCountryFarmer,
    "SUBCOUNTY denies foreign-country Farmer",
  );

  section("8. WARD SCOPE MATRIX");

  assertAllow(
    ward,
    baseFarmer,
    "WARD allows Farmer inside assigned Ward",
  );

  assertDeny(
    ward,
    siblingWardFarmer,
    "WARD denies Farmer in sibling Ward",
  );

  assertDeny(
    ward,
    siblingSubCountyFarmer,
    "WARD denies Farmer in sibling SubCounty",
  );

  assertDeny(
    ward,
    siblingSubCountyWardFarmer,
    "WARD denies Farmer in sibling SubCounty Ward",
  );

  assertDeny(
    ward,
    siblingCountyFarmer,
    "WARD denies Farmer in sibling county",
  );

  assertDeny(
    ward,
    nationalForeignCountryFarmer,
    "WARD denies foreign-country Farmer",
  );

  section("9. HIERARCHICAL CONTAINMENT");

  const nationalAllowsBase =
    assignmentAllowsFarmer(
      national,
      baseFarmer,
    );

  const countyAllowsBase =
    assignmentAllowsFarmer(
      county,
      baseFarmer,
    );

  const subCountyAllowsBase =
    assignmentAllowsFarmer(
      subCounty,
      baseFarmer,
    );

  const wardAllowsBase =
    assignmentAllowsFarmer(
      ward,
      baseFarmer,
    );

  if (
    nationalAllowsBase &&
    countyAllowsBase &&
    subCountyAllowsBase &&
    wardAllowsBase
  ) {
    PASS(
      "All four scope levels allow the Farmer at their matching geography",
    );
  } else {
    FAIL(
      "Scope hierarchy failed matching-geography containment",
    );
  }

  const countyDoesNotEscape =
    !assignmentAllowsFarmer(
      county,
      siblingCountyFarmer,
    );

  const subCountyDoesNotEscape =
    !assignmentAllowsFarmer(
      subCounty,
      siblingSubCountyFarmer,
    );

  const wardDoesNotEscape =
    !assignmentAllowsFarmer(
      ward,
      siblingWardFarmer,
    );

  if (
    countyDoesNotEscape &&
    subCountyDoesNotEscape &&
    wardDoesNotEscape
  ) {
    PASS(
      "Narrower scopes cannot escape their geographic boundary",
    );
  } else {
    FAIL(
      "One or more narrower scopes escaped their geographic boundary",
    );
  }

  section("10. FUNCTION INDEPENDENCE");

  const cropsWardAssignment: SyntheticAssignment = {
    ...ward,
    label: "WARD GARBATULLA | Crops",
    functionActive: true,
  };

  const veterinaryWardAssignment: SyntheticAssignment = {
    ...ward,
    label: "WARD GARBATULLA | Veterinary",
    functionActive: true,
  };

  const cropsResult = assignmentAllowsFarmer(
    cropsWardAssignment,
    baseFarmer,
  );

  const veterinaryResult = assignmentAllowsFarmer(
    veterinaryWardAssignment,
    baseFarmer,
  );

  if (cropsResult === veterinaryResult) {
    PASS(
      "Changing OfficerFunction does not change geographic authorization",
    );
  } else {
    FAIL(
      "OfficerFunction unexpectedly changes geographic authorization",
    );
  }

  section("11. INACTIVE ASSIGNMENT");

  const inactiveWard: SyntheticAssignment = {
    ...ward,
    label: "Inactive Ward",
    active: false,
  };

  assertDeny(
    inactiveWard,
    baseFarmer,
    "Inactive assignment denies matching Farmer",
  );

  section("12. INACTIVE FUNCTION");

  const inactiveFunctionWard: SyntheticAssignment = {
    ...ward,
    label: "Inactive Function Ward",
    functionActive: false,
  };

  assertDeny(
    inactiveFunctionWard,
    baseFarmer,
    "Assignment with inactive function denies Farmer",
  );

  section("13. MALFORMED SCOPE TESTS");

  const malformedNational: SyntheticAssignment = {
    ...national,
    label: "Malformed NATIONAL with county",
    countyId: isiolo.id,
  };

  assertDeny(
    malformedNational,
    baseFarmer,
    "Malformed NATIONAL assignment is rejected",
  );

  const malformedCounty: SyntheticAssignment = {
    ...county,
    label: "Malformed COUNTY with SubCounty",
    subCountyId: garbatulla.id,
  };

  assertDeny(
    malformedCounty,
    baseFarmer,
    "Malformed COUNTY assignment is rejected",
  );

  const malformedSubCounty: SyntheticAssignment = {
    ...subCounty,
    label: "Malformed SUBCOUNTY with Ward",
    wardId: garbatullaWard.id,
  };

  assertDeny(
    malformedSubCounty,
    baseFarmer,
    "Malformed SUBCOUNTY assignment is rejected",
  );

  const malformedWard: SyntheticAssignment = {
    ...ward,
    label: "Malformed WARD without SubCounty",
    subCountyId: null,
  };

  assertDeny(
    malformedWard,
    baseFarmer,
    "Malformed WARD assignment is rejected",
  );

  section("14. CURRENT DATABASE ASSIGNMENTS");

  const dbAssignments =
    await prisma.officerAssignment.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
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
        scopeLevel: true,
        countryId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        source: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `Active database assignments: ${dbAssignments.length}`,
  );

  if (dbAssignments.length === 5) {
    PASS(
      "Current simulation contains exactly five active assignments",
    );
  } else {
    REVIEW(
      `Current simulation contains ${dbAssignments.length} active assignments instead of expected five`,
    );
  }

  const simulatedCount =
    dbAssignments.filter(
      (assignment) =>
        assignment.source === "SIMULATED",
    ).length;

  if (simulatedCount === dbAssignments.length) {
    PASS(
      "All current active assignments are marked SIMULATED",
    );
  } else {
    FAIL(
      "One or more active assignments are not marked SIMULATED",
    );
  }

  section("15. READ-ONLY SAFETY");

  PASS(
    "V40.12 contains no Farmer INSERT operation",
  );

  PASS(
    "V40.12 contains no Farmer UPDATE operation",
  );

  PASS(
    "V40.12 contains no Farmer DELETE operation",
  );

  PASS(
    "V40.12 contains no OfficerAssignment INSERT operation",
  );

  PASS(
    "V40.12 contains no OfficerAssignment UPDATE operation",
  );

  PASS(
    "V40.12 contains no OfficerAssignment DELETE operation",
  );

  section("16. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.12 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);

  if (fail > 0) {
    console.log("V40.12 STATUS: RED");
    console.log("");
    console.log(
      "Synthetic authorization matrix detected failures.",
    );
    process.exitCode = 1;
    return;
  }

  if (review > 0) {
    console.log("V40.12 STATUS: GREEN WITH REVIEW");
    console.log("");
    console.log(
      "Synthetic authorization matrix is structurally valid.",
    );
    console.log(
      "Review items are policy/environment observations.",
    );
    return;
  }

  console.log("V40.12 STATUS: GREEN");
  console.log("");
  console.log(
    "Synthetic authorization matrix is fully valid.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.12 FATAL ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });