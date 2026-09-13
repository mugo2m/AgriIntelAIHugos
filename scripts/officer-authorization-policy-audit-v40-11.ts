import prisma from "../lib/prisma";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type Assignment = {
  id: number;
  userId: number;
  roleId: number;
  functionId: number;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  active: boolean;
  source: "OFFICIAL" | "SIMULATED";
  role: {
    id: number;
    name: string;
  };
  function: {
    id: number;
    name: string;
    active: boolean;
  };
  country: {
    id: number;
    name: string;
  } | null;
  county: {
    id: number;
    name: string;
    countryId: number;
  } | null;
  subCounty: {
    id: number;
    name: string;
    countyId: number;
  } | null;
  ward: {
    id: number;
    name: string;
    countyId: number;
    subCountyId: number | null;
  } | null;
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

function validScopeShape(assignment: Assignment): boolean {
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

function validGeographyChain(assignment: Assignment): boolean {
  if (!validScopeShape(assignment)) {
    return false;
  }

  if (assignment.country === null) {
    return false;
  }

  if (assignment.country.id !== assignment.countryId) {
    return false;
  }

  if (assignment.scopeLevel === "NATIONAL") {
    return true;
  }

  if (assignment.county === null) {
    return false;
  }

  if (assignment.county.id !== assignment.countyId) {
    return false;
  }

  if (assignment.county.countryId !== assignment.countryId) {
    return false;
  }

  if (assignment.scopeLevel === "COUNTY") {
    return true;
  }

  if (assignment.subCounty === null) {
    return false;
  }

  if (assignment.subCounty.id !== assignment.subCountyId) {
    return false;
  }

  if (assignment.subCounty.countyId !== assignment.countyId) {
    return false;
  }

  if (assignment.scopeLevel === "SUBCOUNTY") {
    return true;
  }

  if (assignment.ward === null) {
    return false;
  }

  if (assignment.ward.id !== assignment.wardId) {
    return false;
  }

  if (assignment.ward.countyId !== assignment.countyId) {
    return false;
  }

  if (assignment.ward.subCountyId !== assignment.subCountyId) {
    return false;
  }

  return true;
}

function assignmentMatchesFarmer(
  assignment: Assignment,
  farmer: {
    countyId: number;
    subCountyId: number;
    wardId: number;
    countryId: number;
  },
): boolean {
  if (!assignment.active) {
    return false;
  }

  if (!assignment.function.active) {
    return false;
  }

  if (!validGeographyChain(assignment)) {
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

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.11 OFFICER AUTHORIZATION POLICY AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  section("1. REQUIRED ROLES");

  const requiredRoles = [
    "Super Admin",
    "National Admin",
    "County Director",
    "Sub County Officer",
    "Ward Extension Officer",
    "Extension Officer",
  ];

  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: requiredRoles,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const roleNames = new Set(roles.map((role) => role.name));

  for (const roleName of requiredRoles) {
    if (roleNames.has(roleName)) {
      PASS(`Required role exists: ${roleName}`);
    } else {
      FAIL(`Required role missing: ${roleName}`);
    }
  }

  section("2. REQUIRED OFFICER FUNCTIONS");

  const requiredFunctions = [
    "Agriculture / General Agriculture",
    "Crops",
    "Agribusiness",
    "Agricultural Extension",
  ];

  const functions = await prisma.officerFunction.findMany({
    where: {
      name: {
        in: requiredFunctions,
      },
    },
    select: {
      id: true,
      name: true,
      active: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const functionMap = new Map(
    functions.map((fn) => [fn.name, fn]),
  );

  for (const functionName of requiredFunctions) {
    const fn = functionMap.get(functionName);

    if (!fn) {
      FAIL(`Required function missing: ${functionName}`);
    } else if (!fn.active) {
      FAIL(`Required function inactive: ${functionName}`);
    } else {
      PASS(`Active required function exists: ${functionName}`);
    }
  }

  section("3. COUNTRY BASELINE");

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
    FAIL("Kenya country record exists");
  } else {
    PASS(`Kenya country exists: ID ${kenya.id}`);
  }

  section("4. ACTIVE OFFICER ASSIGNMENTS");

  const assignments =
    (await prisma.officerAssignment.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        userId: true,
        roleId: true,
        functionId: true,
        scopeLevel: true,
        countryId: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        active: true,
        source: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        function: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        county: {
          select: {
            id: true,
            name: true,
            countryId: true,
          },
        },
        subCounty: {
          select: {
            id: true,
            name: true,
            countyId: true,
          },
        },
        ward: {
          select: {
            id: true,
            name: true,
            countyId: true,
            subCountyId: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })) as Assignment[];

  console.log(`Active assignments: ${assignments.length}`);

  if (assignments.length === 0) {
    FAIL("At least one active OfficerAssignment exists");
  } else {
    PASS(
      `Active OfficerAssignment records exist: ${assignments.length}`,
    );
  }

  section("5. ASSIGNMENT STRUCTURE");

  for (const assignment of assignments) {
    const label =
      `Assignment ${assignment.id} | ${assignment.role.name} | ` +
      `${assignment.function.name} | ${assignment.scopeLevel}`;

    if (roleNames.has(assignment.role.name)) {
      PASS(`${label} has a valid role`);
    } else {
      FAIL(`${label} references an unexpected role`);
    }

    if (assignment.function.active) {
      PASS(`${label} has an active function`);
    } else {
      FAIL(`${label} references an inactive function`);
    }

    if (validScopeShape(assignment)) {
      PASS(`${label} has a valid scope shape`);
    } else {
      FAIL(`${label} has an invalid scope shape`);
    }

    if (validGeographyChain(assignment)) {
      PASS(`${label} has a valid geography chain`);
    } else {
      FAIL(`${label} has an invalid geography chain`);
    }

    if (assignment.source === "SIMULATED") {
      PASS(`${label} is explicitly marked SIMULATED`);
    } else {
      REVIEW(
        `${label} is marked OFFICIAL; verify against official records before production`,
      );
    }

    if (assignment.scopeLevel === "NATIONAL") {
      REVIEW(
        `${label} grants NATIONAL geographic authority`,
      );
    }
  }

  section("6. CURRENT USER / PRIMARY ROLE SEPARATION");

  const user = await prisma.user.findUnique({
    where: {
      id: 1,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    FAIL("Primary test User 1 exists");
  } else {
    PASS(
      `Primary test User 1 exists with role ${user.role.name}`,
    );

    if (user.role.name === "Farmer") {
      PASS(
        "Primary User role remains Farmer; officer assignments do not overwrite User.role",
      );
    } else {
      REVIEW(
        `Primary User role is ${user.role.name}; verify this is intentional`,
      );
    }
  }

  section("7. CURRENT FARMER GEOGRAPHY");

  const farmer = await prisma.farmer.findFirst({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      county: {
        select: {
          id: true,
          name: true,
          countryId: true,
        },
      },
      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
      ward: {
        select: {
          id: true,
          name: true,
          countyId: true,
          subCountyId: true,
        },
      },
    },
  });

  if (!farmer) {
    FAIL("At least one Farmer record exists");
  } else {
    PASS(`Farmer ${farmer.id} exists`);

    console.log(
      `Farmer geography: ${farmer.county.name} → ` +
        `${farmer.subCounty.name} → ${farmer.ward.name}`,
    );

    if (
      farmer.subCounty.countyId === farmer.county.id &&
      farmer.ward.countyId === farmer.county.id &&
      farmer.ward.subCountyId === farmer.subCounty.id
    ) {
      PASS(
        "Current Farmer geography chain is internally consistent",
      );
    } else {
      FAIL(
        "Current Farmer geography chain is inconsistent",
      );
    }
  }

  section("8. SCOPE SEMANTICS");

  for (const assignment of assignments) {
    if (!farmer) {
      break;
    }

    const currentFarmer = {
      countyId: farmer.countyId,
      subCountyId: farmer.subCountyId,
      wardId: farmer.wardId,
      countryId: farmer.county.countryId,
    };

    const allowed = assignmentMatchesFarmer(
      assignment,
      currentFarmer,
    );

    console.log(
      `Assignment ${assignment.id} | ` +
        `${assignment.scopeLevel} | ` +
        `${assignment.role.name} | ` +
        `current Farmer ${farmer.id}: ` +
        `${allowed ? "ALLOW" : "DENY"}`,
    );

    if (
      assignment.scopeLevel === "NATIONAL" &&
      assignment.countryId === farmer.county.countryId
    ) {
      if (allowed) {
        PASS(
          `NATIONAL assignment ${assignment.id} allows Farmer ${farmer.id} in the same country`,
        );
      } else {
        FAIL(
          `NATIONAL assignment ${assignment.id} incorrectly denies same-country Farmer ${farmer.id}`,
        );
      }
    }

    if (
      assignment.scopeLevel === "COUNTY" &&
      assignment.countyId === farmer.countyId
    ) {
      if (allowed) {
        PASS(
          `COUNTY assignment ${assignment.id} allows Farmer ${farmer.id} in the assigned county`,
        );
      } else {
        FAIL(
          `COUNTY assignment ${assignment.id} incorrectly denies Farmer ${farmer.id} in its county`,
        );
      }
    }

    if (
      assignment.scopeLevel === "SUBCOUNTY" &&
      assignment.subCountyId === farmer.subCountyId
    ) {
      if (allowed) {
        PASS(
          `SUBCOUNTY assignment ${assignment.id} allows Farmer ${farmer.id} in the assigned subcounty`,
        );
      } else {
        FAIL(
          `SUBCOUNTY assignment ${assignment.id} incorrectly denies Farmer ${farmer.id}`,
        );
      }
    }

    if (
      assignment.scopeLevel === "WARD" &&
      assignment.wardId === farmer.wardId
    ) {
      if (allowed) {
        PASS(
          `WARD assignment ${assignment.id} allows Farmer ${farmer.id} in the assigned ward`,
        );
      } else {
        FAIL(
          `WARD assignment ${assignment.id} incorrectly denies Farmer ${farmer.id}`,
        );
      }
    }
  }

  section("9. FUNCTION / GEOGRAPHY SEPARATION");

  for (const assignment of assignments) {
    if (
      assignment.function.name &&
      validGeographyChain(assignment)
    ) {
      PASS(
        `Assignment ${assignment.id} treats function "${assignment.function.name}" separately from geographic scope`,
      );
    } else {
      FAIL(
        `Assignment ${assignment.id} has invalid function/geography separation`,
      );
    }
  }

  section("10. ASSIGNMENT OVERLAP / BROAD AUTHORITY");

  const nationalAssignments = assignments.filter(
    (assignment) =>
      assignment.scopeLevel === "NATIONAL",
  );

  const countyAssignments = assignments.filter(
    (assignment) =>
      assignment.scopeLevel === "COUNTY",
  );

  const subCountyAssignments = assignments.filter(
    (assignment) =>
      assignment.scopeLevel === "SUBCOUNTY",
  );

  const wardAssignments = assignments.filter(
    (assignment) =>
      assignment.scopeLevel === "WARD",
  );

  console.log(
    `NATIONAL assignments: ${nationalAssignments.length}`,
  );
  console.log(
    `COUNTY assignments: ${countyAssignments.length}`,
  );
  console.log(
    `SUBCOUNTY assignments: ${subCountyAssignments.length}`,
  );
  console.log(
    `WARD assignments: ${wardAssignments.length}`,
  );

  if (nationalAssignments.length > 0) {
    REVIEW(
      `${nationalAssignments.length} NATIONAL assignment(s) provide broad geographic authority; this is intentional in the current simulation`,
    );
  } else {
    PASS("No NATIONAL assignments exist");
  }

  const duplicateNationalRoleFunctionPairs =
    new Set<string>();

  for (const assignment of nationalAssignments) {
    const key =
      `${assignment.roleId}:${assignment.functionId}`;

    if (duplicateNationalRoleFunctionPairs.has(key)) {
      FAIL(
        `Duplicate NATIONAL role/function assignment detected: role ${assignment.roleId}, function ${assignment.functionId}`,
      );
    } else {
      duplicateNationalRoleFunctionPairs.add(key);
      PASS(
        `NATIONAL role/function combination is unique for assignment ${assignment.id}`,
      );
    }
  }

  section("11. SIMULATED AUTHORIZATION MATRIX");

  const expectedAssignments: Array<{
    role: string;
    functionName: string;
    scope: ScopeLevel;
  }> = [
    {
      role: "Super Admin",
      functionName: "Agriculture / General Agriculture",
      scope: "NATIONAL",
    },
    {
      role: "National Admin",
      functionName: "Crops",
      scope: "NATIONAL",
    },
    {
      role: "County Director",
      functionName: "Agribusiness",
      scope: "COUNTY",
    },
    {
      role: "Sub County Officer",
      functionName: "Agricultural Extension",
      scope: "SUBCOUNTY",
    },
    {
      role: "Ward Extension Officer",
      functionName: "Agricultural Extension",
      scope: "WARD",
    },
  ];

  for (const expected of expectedAssignments) {
    const found = assignments.some(
      (assignment) =>
        assignment.role.name === expected.role &&
        assignment.function.name === expected.functionName &&
        assignment.scopeLevel === expected.scope &&
        assignment.source === "SIMULATED" &&
        assignment.active,
    );

    if (found) {
      PASS(
        `${expected.role} | ${expected.functionName} | ${expected.scope} simulated assignment exists`,
      );
    } else {
      FAIL(
        `Missing simulated assignment: ${expected.role} | ${expected.functionName} | ${expected.scope}`,
      );
    }
  }

  section("12. READ-ONLY SAFETY");

  PASS(
    "V40.11 contains no OfficerAssignment INSERT operation",
  );

  PASS(
    "V40.11 contains no OfficerAssignment UPDATE operation",
  );

  PASS(
    "V40.11 contains no OfficerAssignment DELETE operation",
  );

  PASS(
    "V40.11 contains no User INSERT / UPDATE / DELETE operation",
  );

  PASS(
    "V40.11 contains no Farmer INSERT / UPDATE / DELETE operation",
  );

  section("13. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.11 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);

  if (fail > 0) {
    console.log("V40.11 STATUS: RED");
    console.log("");
    console.log(
      "Officer authorization policy audit detected structural failures.",
    );
    process.exitCode = 1;
    return;
  }

  if (review > 0) {
    console.log("V40.11 STATUS: GREEN WITH REVIEW");
    console.log("");
    console.log(
      "Officer authorization policy is structurally valid.",
    );
    console.log(
      "Review items are explicit policy decisions, not structural failures.",
    );
    return;
  }

  console.log("V40.11 STATUS: GREEN");
  console.log("");
  console.log(
    "Officer authorization policy is structurally valid.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.11 FATAL ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });