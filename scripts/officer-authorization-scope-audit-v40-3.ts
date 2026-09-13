import { prisma } from "../lib/prisma";

type AssignmentCheck = {
  id: number;
  role: string;
  function: string;
  scopeLevel: string;
  source: string;
  active: boolean;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
};

const EXPECTED = {
  userId: 1,

  countryId: 2,
  countyId: 48,
  subCountyId: 1309,
  wardId: 2095,

  roles: [
    "Super Admin",
    "National Admin",
    "County Director",
    "Sub County Officer",
    "Ward Extension Officer",
  ],

  functions: [
    "Agriculture / General Agriculture",
    "Crops",
    "Agribusiness",
    "Agricultural Extension",
  ],
};

let pass = 0;
let fail = 0;
let review = 0;

function PASS(message: string) {
  pass++;
  console.log(`PASS  ${message}`);
}

function FAIL(message: string) {
  fail++;
  console.log(`FAIL  ${message}`);
}

function REVIEW(message: string) {
  review++;
  console.log(`REVIEW ${message}`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    PASS(message);
  } else {
    FAIL(message);
  }
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.3 OFFICER AUTHORIZATION SCOPE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  // ----------------------------------------------------------
  // 1. LOAD SIMULATED ASSIGNMENTS
  // ----------------------------------------------------------

  const assignments = await prisma.officerAssignment.findMany({
    where: {
      userId: EXPECTED.userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          roleId: true,
          active: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
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
          constituencyId: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `User ${EXPECTED.userId} assignments found: ${assignments.length}`,
  );

  // ----------------------------------------------------------
  // 2. USER IDENTITY
  // ----------------------------------------------------------

  const user = await prisma.user.findUnique({
    where: {
      id: EXPECTED.userId,
    },
    include: {
      role: true,
    },
  });

  assert(
    user !== null,
    `User ${EXPECTED.userId} exists`,
  );

  if (!user) {
    throw new Error("Expected simulation user does not exist.");
  }

  console.log("");
  console.log("USER IDENTITY");
  console.log("-------------");
  console.log(`User ID      : ${user.id}`);
  console.log(`User name    : ${user.name ?? "(null)"}`);
  console.log(`Primary role : ${user.role?.name ?? "(none)"}`);
  console.log(`Role ID      : ${user.roleId}`);
  console.log(`Active       : ${user.active}`);
  console.log("");

  assert(
    user.active === true,
    "Simulation user is active",
  );

  // The simulation intentionally leaves the user's primary role unchanged.
  // OfficerAssignment.roleId represents simulated authority.
  if (user.role?.name === "Farmer") {
    PASS(
      "Primary User role remains Farmer; simulated officer authority is represented by OfficerAssignment.roleId",
    );
  } else {
    REVIEW(
      `Primary User role is ${user.role?.name ?? "(none)"}; verify this is intentional for simulation`,
    );
  }

  // ----------------------------------------------------------
  // 3. ASSIGNMENT COUNT
  // ----------------------------------------------------------

  assert(
    assignments.length === 5,
    "Exactly 5 simulated officer assignments exist for User 1",
  );

  // ----------------------------------------------------------
  // 4. EXPECTED ROLE SET
  // ----------------------------------------------------------

  const assignmentRoleNames = assignments.map(
    (assignment) => assignment.role.name,
  );

  for (const expectedRole of EXPECTED.roles) {
    assert(
      assignmentRoleNames.includes(expectedRole),
      `Assignment exists for role: ${expectedRole}`,
    );
  }

  assert(
    new Set(assignmentRoleNames).size === 5,
    "Five assignments represent five distinct authority roles",
  );

  // ----------------------------------------------------------
  // 5. EXPECTED FUNCTION SET
  // ----------------------------------------------------------

  const assignmentFunctionNames = assignments.map(
    (assignment) => assignment.function.name,
  );

  assert(
    assignmentFunctionNames.includes("Agriculture / General Agriculture"),
    "Agriculture / General Agriculture function is represented",
  );

  assert(
    assignmentFunctionNames.includes("Crops"),
    "Crops function is represented",
  );

  assert(
    assignmentFunctionNames.includes("Agribusiness"),
    "Agribusiness function is represented",
  );

  assert(
    assignmentFunctionNames.includes("Agricultural Extension"),
    "Agricultural Extension function is represented",
  );

  // ----------------------------------------------------------
  // 6. GLOBAL ASSIGNMENT ATTRIBUTES
  // ----------------------------------------------------------

  for (const assignment of assignments) {
    assert(
      assignment.userId === EXPECTED.userId,
      `Assignment ${assignment.id} belongs to User ${EXPECTED.userId}`,
    );

    assert(
      assignment.active === true,
      `Assignment ${assignment.id} is active`,
    );

    assert(
      assignment.source === "SIMULATED",
      `Assignment ${assignment.id} source is SIMULATED`,
    );

    assert(
      assignment.function.active === true,
      `Assignment ${assignment.id} uses an active OfficerFunction`,
    );

    assert(
      assignment.role.id > 0,
      `Assignment ${assignment.id} has a valid Role`,
    );

    assert(
      assignment.function.id > 0,
      `Assignment ${assignment.id} has a valid OfficerFunction`,
    );
  }

  // ----------------------------------------------------------
  // 7. LOAD AUTHORITATIVE GEOGRAPHY
  // ----------------------------------------------------------

  const country = await prisma.country.findUnique({
    where: {
      id: EXPECTED.countryId,
    },
  });

  const county = await prisma.county.findUnique({
    where: {
      id: EXPECTED.countyId,
    },
  });

  const subCounty = await prisma.subCounty.findUnique({
    where: {
      id: EXPECTED.subCountyId,
    },
  });

  const ward = await prisma.ward.findUnique({
    where: {
      id: EXPECTED.wardId,
    },
  });

  assert(
    country !== null,
    `Country ${EXPECTED.countryId} exists`,
  );

  assert(
    county !== null,
    `County ${EXPECTED.countyId} exists`,
  );

  assert(
    subCounty !== null,
    `SubCounty ${EXPECTED.subCountyId} exists`,
  );

  assert(
    ward !== null,
    `Ward ${EXPECTED.wardId} exists`,
  );

  if (!country || !county || !subCounty || !ward) {
    throw new Error(
      "Required simulation geography is missing.",
    );
  }

  console.log("");
  console.log("AUTHORITATIVE GEOGRAPHY");
  console.log("----------------------");
  console.log(`Country    : ${country.id} | ${country.name}`);
  console.log(`County     : ${county.id} | ${county.name}`);
  console.log(`SubCounty  : ${subCounty.id} | ${subCounty.name}`);
  console.log(`Ward       : ${ward.id} | ${ward.name}`);
  console.log("");

  // ----------------------------------------------------------
  // 8. GEOGRAPHY CHAIN INTEGRITY
  // ----------------------------------------------------------

  assert(
    county.countryId === EXPECTED.countryId,
    `County ${county.id} belongs to Country ${EXPECTED.countryId}`,
  );

  assert(
    subCounty.countyId === EXPECTED.countyId,
    `SubCounty ${subCounty.id} belongs to County ${EXPECTED.countyId}`,
  );

  assert(
    ward.countyId === EXPECTED.countyId,
    `Ward ${ward.id} belongs to County ${EXPECTED.countyId}`,
  );

  assert(
    ward.subCountyId === EXPECTED.subCountyId,
    `Ward ${ward.id} belongs to SubCounty ${EXPECTED.subCountyId}`,
  );

  // ----------------------------------------------------------
  // 9. FIND ASSIGNMENTS BY SCOPE
  // ----------------------------------------------------------

  const nationalAssignments = assignments.filter(
    (assignment) => assignment.scopeLevel === "NATIONAL",
  );

  const countyAssignments = assignments.filter(
    (assignment) => assignment.scopeLevel === "COUNTY",
  );

  const subCountyAssignments = assignments.filter(
    (assignment) => assignment.scopeLevel === "SUBCOUNTY",
  );

  const wardAssignments = assignments.filter(
    (assignment) => assignment.scopeLevel === "WARD",
  );

  assert(
    nationalAssignments.length === 2,
    "Exactly 2 NATIONAL assignments exist",
  );

  assert(
    countyAssignments.length === 1,
    "Exactly 1 COUNTY assignment exists",
  );

  assert(
    subCountyAssignments.length === 1,
    "Exactly 1 SUBCOUNTY assignment exists",
  );

  assert(
    wardAssignments.length === 1,
    "Exactly 1 WARD assignment exists",
  );

  // ----------------------------------------------------------
  // 10. NATIONAL SCOPE
  // ----------------------------------------------------------

  for (const assignment of nationalAssignments) {
    assert(
      assignment.countryId === EXPECTED.countryId,
      `NATIONAL assignment ${assignment.id} is scoped to Country ${EXPECTED.countryId}`,
    );

    assert(
      assignment.countyId === null,
      `NATIONAL assignment ${assignment.id} has no county restriction`,
    );

    assert(
      assignment.subCountyId === null,
      `NATIONAL assignment ${assignment.id} has no subcounty restriction`,
    );

    assert(
      assignment.wardId === null,
      `NATIONAL assignment ${assignment.id} has no ward restriction`,
    );
  }

  // ----------------------------------------------------------
  // 11. COUNTY SCOPE
  // ----------------------------------------------------------

  for (const assignment of countyAssignments) {
    assert(
      assignment.countryId === EXPECTED.countryId,
      `COUNTY assignment ${assignment.id} is scoped to Country ${EXPECTED.countryId}`,
    );

    assert(
      assignment.countyId === EXPECTED.countyId,
      `COUNTY assignment ${assignment.id} is scoped to County ${EXPECTED.countyId}`,
    );

    assert(
      assignment.subCountyId === null,
      `COUNTY assignment ${assignment.id} has no subcounty restriction`,
    );

    assert(
      assignment.wardId === null,
      `COUNTY assignment ${assignment.id} has no ward restriction`,
    );
  }

  // ----------------------------------------------------------
  // 12. SUBCOUNTY SCOPE
  // ----------------------------------------------------------

  for (const assignment of subCountyAssignments) {
    assert(
      assignment.countryId === EXPECTED.countryId,
      `SUBCOUNTY assignment ${assignment.id} is scoped to Country ${EXPECTED.countryId}`,
    );

    assert(
      assignment.countyId === EXPECTED.countyId,
      `SUBCOUNTY assignment ${assignment.id} is scoped to County ${EXPECTED.countyId}`,
    );

    assert(
      assignment.subCountyId === EXPECTED.subCountyId,
      `SUBCOUNTY assignment ${assignment.id} is scoped to SubCounty ${EXPECTED.subCountyId}`,
    );

    assert(
      assignment.wardId === null,
      `SUBCOUNTY assignment ${assignment.id} has no ward restriction`,
    );
  }

  // ----------------------------------------------------------
  // 13. WARD SCOPE
  // ----------------------------------------------------------

  for (const assignment of wardAssignments) {
    assert(
      assignment.countryId === EXPECTED.countryId,
      `WARD assignment ${assignment.id} is scoped to Country ${EXPECTED.countryId}`,
    );

    assert(
      assignment.countyId === EXPECTED.countyId,
      `WARD assignment ${assignment.id} is scoped to County ${EXPECTED.countyId}`,
    );

    assert(
      assignment.subCountyId === EXPECTED.subCountyId,
      `WARD assignment ${assignment.id} is scoped to SubCounty ${EXPECTED.subCountyId}`,
    );

    assert(
      assignment.wardId === EXPECTED.wardId,
      `WARD assignment ${assignment.id} is scoped to Ward ${EXPECTED.wardId}`,
    );
  }

  // ----------------------------------------------------------
  // 14. ASSIGNMENT → GEOGRAPHY RELATIONAL VALIDATION
  // ----------------------------------------------------------

  for (const assignment of assignments) {
    if (assignment.countryId !== null) {
      assert(
        assignment.country !== null,
        `Assignment ${assignment.id} country relation resolves`,
      );
    }

    if (assignment.countyId !== null) {
      assert(
        assignment.county !== null,
        `Assignment ${assignment.id} county relation resolves`,
      );
    }

    if (assignment.subCountyId !== null) {
      assert(
        assignment.subCounty !== null,
        `Assignment ${assignment.id} subcounty relation resolves`,
      );
    }

    if (assignment.wardId !== null) {
      assert(
        assignment.ward !== null,
        `Assignment ${assignment.id} ward relation resolves`,
      );
    }
  }

  // ----------------------------------------------------------
  // 15. CROSS-LEVEL CONSISTENCY
  // ----------------------------------------------------------

  for (const assignment of assignments) {
    if (assignment.county) {
      assert(
        assignment.county.countryId === assignment.countryId,
        `Assignment ${assignment.id} county-country chain is consistent`,
      );
    }

    if (assignment.subCounty) {
      assert(
        assignment.subCounty.countyId === assignment.countyId,
        `Assignment ${assignment.id} subcounty-county chain is consistent`,
      );
    }

    if (assignment.ward) {
      assert(
        assignment.ward.countyId === assignment.countyId,
        `Assignment ${assignment.id} ward-county chain is consistent`,
      );

      assert(
        assignment.ward.subCountyId === assignment.subCountyId,
        `Assignment ${assignment.id} ward-subcounty chain is consistent`,
      );
    }
  }

  // ----------------------------------------------------------
  // 16. AUTHORIZATION SCOPE DEMONSTRATION
  // ----------------------------------------------------------

  console.log("");
  console.log("AUTHORIZATION SCOPE MODEL");
  console.log("-------------------------");

  console.log(
    "NATIONAL  => Country-wide Farmer access",
  );

  console.log(
    `COUNTY    => County ${EXPECTED.countyId} (${county.name})`,
  );

  console.log(
    `SUBCOUNTY => SubCounty ${EXPECTED.subCountyId} (${subCounty.name})`,
  );

  console.log(
    `WARD      => Ward ${EXPECTED.wardId} (${ward.name})`,
  );

  console.log("");

  // ----------------------------------------------------------
  // 17. FARMER SCOPE TEST RECORD
  // ----------------------------------------------------------

  const farmer = await prisma.farmer.findUnique({
    where: {
      userId: EXPECTED.userId,
    },
    select: {
      id: true,
      userId: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      villageId: true,
    },
  });

  assert(
    farmer !== null,
    `Farmer record exists for User ${EXPECTED.userId}`,
  );

  if (farmer) {
    console.log("FARMER SCOPE TEST RECORD");
    console.log("------------------------");
    console.log(`Farmer ID   : ${farmer.id}`);
    console.log(`User ID     : ${farmer.userId}`);
    console.log(`County ID   : ${farmer.countyId}`);
    console.log(`SubCounty   : ${farmer.subCountyId}`);
    console.log(`Ward ID     : ${farmer.wardId}`);
    console.log(`Village ID  : ${farmer.villageId ?? "null"}`);
    console.log("");

    // The current Farmer record is not necessarily in the simulated
    // Isiolo geography. Therefore this is informational only.
    if (
      farmer.countyId === EXPECTED.countyId &&
      farmer.subCountyId === EXPECTED.subCountyId &&
      farmer.wardId === EXPECTED.wardId
    ) {
      PASS(
        "Current Farmer record is inside the simulated WARD scope",
      );
    } else {
      REVIEW(
        "Current Farmer record is outside the simulated Isiolo/Garbatulla/GARBATULLA scope; this is expected because the simulation assignment is independent of the Farmer test record",
      );
    }
  }

  // ----------------------------------------------------------
  // 18. ASSIGNMENT SUMMARY
  // ----------------------------------------------------------

  console.log("");
  console.log("ASSIGNMENT SUMMARY");
  console.log("------------------");

  const summaryRows: AssignmentCheck[] = assignments.map(
    (assignment) => ({
      id: assignment.id,
      role: assignment.role.name,
      function: assignment.function.name,
      scopeLevel: assignment.scopeLevel,
      source: assignment.source,
      active: assignment.active,
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId: assignment.wardId,
    }),
  );

  for (const row of summaryRows) {
    console.log(
      [
        `Assignment ${row.id}`,
        `Role=${row.role}`,
        `Function=${row.function}`,
        `Scope=${row.scopeLevel}`,
        `Country=${row.countryId ?? "null"}`,
        `County=${row.countyId ?? "null"}`,
        `SubCounty=${row.subCountyId ?? "null"}`,
        `Ward=${row.wardId ?? "null"}`,
        `Source=${row.source}`,
        `Active=${row.active}`,
      ].join(" | "),
    );
  }

  // ----------------------------------------------------------
  // 19. FINAL RESULT
  // ----------------------------------------------------------

  console.log("");
  console.log("============================================================");
  console.log("V40.3 FINAL RESULT");
  console.log("============================================================");

  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);
  console.log("");

  if (fail > 0) {
    console.log("V40.3 STATUS: FAILED");
    console.log("");
    process.exitCode = 1;
    return;
  }

  if (review > 0) {
    console.log("V40.3 STATUS: GREEN WITH REVIEW");
    console.log("");
    return;
  }

  console.log("V40.3 STATUS: GREEN");
  console.log("");
  console.log(
    "Officer authorization scope structure is internally consistent.",
  );
  console.log(
    "Simulation is ready for runtime authorization predicate testing.",
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.3 STATUS: FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });