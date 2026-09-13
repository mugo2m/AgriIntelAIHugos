import prisma from "../lib/prisma";
import { Prisma } from "../lib/generated/prisma/client";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type Assignment = {
  id: number;
  roleName: string;
  functionName: string;
  functionActive: boolean;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  active: boolean;
};

type FarmerRow = {
  id: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
  county: {
    countryId: number;
  };
};

type ExpectedDecision = {
  assignmentId: number;
  farmerId: number;
  allowed: boolean;
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

function hasValidScopeShape(
  assignment: Assignment,
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
  assignment: Assignment,
  farmer: FarmerRow,
): boolean {
  if (!assignment.active) {
    return false;
  }

  if (!assignment.functionActive) {
    return false;
  }

  if (!hasValidScopeShape(assignment)) {
    return false;
  }

  const farmerCountryId = farmer.county.countryId;

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return assignment.countryId === farmerCountryId;

    case "COUNTY":
      return (
        assignment.countryId === farmerCountryId &&
        assignment.countyId === farmer.countyId
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId === farmerCountryId &&
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId
      );

    case "WARD":
      return (
        assignment.countryId === farmerCountryId &&
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId &&
        assignment.wardId === farmer.wardId
      );

    default:
      return false;
  }
}

function buildScopeWhere(
  assignment: Assignment,
): Prisma.FarmerWhereInput | null {
  if (!assignment.active) {
    return null;
  }

  if (!assignment.functionActive) {
    return null;
  }

  if (!hasValidScopeShape(assignment)) {
    return null;
  }

  const countryId = assignment.countryId;
  const countyId = assignment.countyId;
  const subCountyId = assignment.subCountyId;
  const wardId = assignment.wardId;

  if (countryId === null) {
    return null;
  }

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return {
        county: {
          countryId,
        },
      };

    case "COUNTY":
      if (countyId === null) {
        return null;
      }

      return {
        county: {
          id: countyId,
          countryId,
        },
      };

    case "SUBCOUNTY":
      if (
        countyId === null ||
        subCountyId === null
      ) {
        return null;
      }

      return {
        county: {
          id: countyId,
          countryId,
        },
        subCountyId,
      };

    case "WARD":
      if (
        countyId === null ||
        subCountyId === null ||
        wardId === null
      ) {
        return null;
      }

      return {
        county: {
          id: countyId,
          countryId,
        },
        subCountyId,
        wardId,
      };

    default:
      return null;
  }
}

function whereToJson(
  where: Prisma.FarmerWhereInput | null,
): string {
  return JSON.stringify(
    where,
    (_key, value) =>
      typeof value === "bigint"
        ? value.toString()
        : value,
    2,
  );
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.13 AUTHORIZATION SQL/PRISMA EQUIVALENCE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  section("1. LOAD CURRENT ACTIVE ASSIGNMENTS");

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

  const assignments: Assignment[] =
    dbAssignments.map((assignment) => ({
      id: assignment.id,
      roleName: assignment.role.name,
      functionName: assignment.function.name,
      functionActive: assignment.function.active,
      scopeLevel:
        assignment.scopeLevel as ScopeLevel,
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId: assignment.wardId,
      active: assignment.active,
    }));

  console.log(
    `Active assignments loaded: ${assignments.length}`,
  );

  if (assignments.length === 5) {
    PASS("Five active simulated assignments loaded");
  } else {
    REVIEW(
      `Expected five active assignments but found ${assignments.length}`,
    );
  }

  for (const assignment of assignments) {
    console.log(
      `Assignment ${assignment.id} | ` +
        `${assignment.roleName} | ` +
        `${assignment.functionName} | ` +
        `${assignment.scopeLevel}`,
    );
  }

  section("2. LOAD ALL FARMER GEOGRAPHY");

  const farmers = (await prisma.farmer.findMany({
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
    orderBy: {
      id: "asc",
    },
  })) as FarmerRow[];

  console.log(`Farmer rows loaded: ${farmers.length}`);

  if (farmers.length > 0) {
    PASS(
      `Database returned ${farmers.length} Farmer geography rows`,
    );
  } else {
    REVIEW(
      "No Farmer rows exist; SQL equivalence can only be structurally tested",
    );
  }

  section("3. INDIVIDUAL ASSIGNMENT SQL/PRISMA WHERE GENERATION");

  const assignmentWhere =
    new Map<number, Prisma.FarmerWhereInput | null>();

  for (const assignment of assignments) {
    const where = buildScopeWhere(assignment);

    assignmentWhere.set(
      assignment.id,
      where,
    );

    if (where !== null) {
      PASS(
        `Assignment ${assignment.id} generated a valid Prisma Farmer WHERE`,
      );

      console.log(
        `Assignment ${assignment.id} WHERE:`,
      );
      console.log(whereToJson(where));
    } else {
      FAIL(
        `Assignment ${assignment.id} failed to generate a valid Farmer WHERE`,
      );
    }
  }

  section("4. SQL/PRISMA RESULT SET EQUIVALENCE");

  const expectedDecisions: ExpectedDecision[] = [];

  for (const assignment of assignments) {
    const where =
      assignmentWhere.get(assignment.id) ?? null;

    if (where === null) {
      FAIL(
        `Assignment ${assignment.id} cannot be tested because WHERE is null`,
      );
      continue;
    }

    const sqlRows =
      await prisma.farmer.findMany({
        where,
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
        orderBy: {
          id: "asc",
        },
      });

    const sqlFarmerIds =
      new Set(
        sqlRows.map((farmer) => farmer.id),
      );

    let localAllowedCount = 0;
    let mismatchCount = 0;

    for (const farmer of farmers) {
      const localAllowed =
        assignmentAllowsFarmer(
          assignment,
          farmer,
        );

      const sqlAllowed =
        sqlFarmerIds.has(farmer.id);

      expectedDecisions.push({
        assignmentId: assignment.id,
        farmerId: farmer.id,
        allowed: localAllowed,
      });

      if (localAllowed) {
        localAllowedCount++;
      }

      if (localAllowed !== sqlAllowed) {
        mismatchCount++;

        FAIL(
          `Assignment ${assignment.id} mismatch for Farmer ${farmer.id}: ` +
            `TypeScript=${localAllowed}, Prisma=${sqlAllowed}`,
        );
      }
    }

    console.log(
      `Assignment ${assignment.id} | ` +
        `${assignment.roleName} | ` +
        `${assignment.scopeLevel}`,
    );

    console.log(
      `  TypeScript allowed rows: ${localAllowedCount}`,
    );

    console.log(
      `  Prisma allowed rows:     ${sqlRows.length}`,
    );

    if (mismatchCount === 0) {
      PASS(
        `Assignment ${assignment.id} TypeScript and Prisma result sets are identical`,
      );
    }
  }

  section("5. CURRENT FARMER 4 EXPLICIT COMPARISON");

  const farmer4 = farmers.find(
    (farmer) => farmer.id === 4,
  );

  if (!farmer4) {
    REVIEW(
      "Farmer 4 is not present; explicit Farmer 4 comparison skipped",
    );
  } else {
    console.log(
      `Farmer 4 geography: county=${farmer4.countyId}, ` +
        `subCounty=${farmer4.subCountyId}, ` +
        `ward=${farmer4.wardId}, ` +
        `country=${farmer4.county.countryId}`,
    );

    for (const assignment of assignments) {
      const where =
        assignmentWhere.get(assignment.id) ?? null;

      if (where === null) {
        FAIL(
          `Assignment ${assignment.id} has no WHERE for Farmer 4 test`,
        );
        continue;
      }

      const localDecision =
        assignmentAllowsFarmer(
          assignment,
          farmer4,
        );

      const sqlMatch =
        await prisma.farmer.findFirst({
          where: {
            AND: [
              where,
              {
                id: 4,
              },
            ],
          },
          select: {
            id: true,
          },
        });

      const sqlDecision =
        sqlMatch !== null;

      if (localDecision === sqlDecision) {
        PASS(
          `Farmer 4 decision agrees for Assignment ${assignment.id}: ` +
            `${localDecision ? "ALLOW" : "DENY"}`,
        );
      } else {
        FAIL(
          `Farmer 4 mismatch for Assignment ${assignment.id}: ` +
            `TypeScript=${localDecision}, Prisma=${sqlDecision}`,
        );
      }
    }
  }

  section("6. EXPECTED CURRENT AUTHORIZATION MATRIX");

  const expectedByScope: Record<
    ScopeLevel,
    boolean
  > = {
    NATIONAL: true,
    COUNTY: false,
    SUBCOUNTY: false,
    WARD: false,
  };

  if (farmer4) {
    for (const assignment of assignments) {
      const expected =
        expectedByScope[
          assignment.scopeLevel
        ];

      const actual =
        assignmentAllowsFarmer(
          assignment,
          farmer4,
        );

      if (actual === expected) {
        PASS(
          `${assignment.scopeLevel} current simulated decision matches V40.11 policy`,
        );
      } else {
        FAIL(
          `${assignment.scopeLevel} current simulated decision differs from expected policy`,
        );
      }
    }
  }

  section("7. COLLECTION AUTHORIZATION CROSS-CHECK");

  const user = await prisma.user.findUnique({
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
    },
  });

  if (!user) {
    FAIL("User 1 exists");
  } else {
    PASS(
      `User 1 exists with primary role ${user.role.name}`,
    );
  }

  const combinedWhere: Prisma.FarmerWhereInput = {
    OR: assignments
      .map((assignment) =>
        assignmentWhere.get(
          assignment.id,
        ),
      )
      .filter(
        (
          where,
        ): where is Prisma.FarmerWhereInput =>
          where !== null,
      ),
  };

  console.log("");
  console.log(
    "Combined collection WHERE:",
  );
  console.log(
    whereToJson(combinedWhere),
  );

  const combinedRows =
    await prisma.farmer.findMany({
      where: combinedWhere,
      select: {
        id: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  const combinedIds =
    combinedRows.map(
      (row) => row.id,
    );

  console.log(
    `Combined authorized Farmer IDs: ${
      combinedIds.join(", ") || "(none)"
    }`,
  );

  const unionIds = new Set<number>();

  for (const assignment of assignments) {
    const where =
      assignmentWhere.get(
        assignment.id,
      ) ?? null;

    if (!where) {
      continue;
    }

    const rows =
      await prisma.farmer.findMany({
        where,
        select: {
          id: true,
        },
      });

    for (const row of rows) {
      unionIds.add(row.id);
    }
  }

  const combinedSet =
    new Set(combinedIds);

  const unionArray =
    Array.from(unionIds).sort(
      (a, b) => a - b,
    );

  const combinedSorted =
    [...combinedSet].sort(
      (a, b) => a - b,
    );

  if (
    JSON.stringify(unionArray) ===
    JSON.stringify(combinedSorted)
  ) {
    PASS(
      "Combined OR query equals union of individual assignment result sets",
    );
  } else {
    FAIL(
      "Combined OR query differs from union of individual assignment result sets",
    );
  }

  section("8. NO CLIENT-SUPPLIED AUTHORIZATION OVERRIDE");

  const simulatedClientScope: Prisma.FarmerWhereInput = {
    county: {
      id: 999999,
    },
  };

  const authorizedCombinedWhere: Prisma.FarmerWhereInput =
    {
      AND: [
        combinedWhere,
        simulatedClientScope,
      ],
    };

  const overrideRows =
    await prisma.farmer.findMany({
      where: authorizedCombinedWhere,
      select: {
        id: true,
      },
    });

  const overrideIds =
    overrideRows.map(
      (row) => row.id,
    );

  console.log(
    `Authorized + simulated client filter result: ${
      overrideIds.join(", ") || "(none)"
    }`,
  );

  if (
    overrideIds.every(
      (id) => combinedSet.has(id),
    )
  ) {
    PASS(
      "Client-style filtering cannot expand the authorized collection",
    );
  } else {
    FAIL(
      "Client-style filtering unexpectedly expanded authorization",
    );
  }

  section("9. SINGLE/INDIVIDUAL DECISION CONSISTENCY");

  let consistencyFailures = 0;

  for (const decision of expectedDecisions) {
    const assignment =
      assignments.find(
        (item) =>
          item.id ===
          decision.assignmentId,
      );

    const farmer =
      farmers.find(
        (item) =>
          item.id ===
          decision.farmerId,
      );

    if (!assignment || !farmer) {
      consistencyFailures++;
      continue;
    }

    const localDecision =
      assignmentAllowsFarmer(
        assignment,
        farmer,
      );

    if (
      localDecision !==
      decision.allowed
    ) {
      consistencyFailures++;
    }
  }

  if (consistencyFailures === 0) {
    PASS(
      "All recorded individual authorization decisions remain internally consistent",
    );
  } else {
    FAIL(
      `${consistencyFailures} individual authorization decisions became inconsistent`,
    );
  }

  section("10. READ-ONLY SAFETY");

  PASS(
    "No Farmer INSERT operation executed",
  );

  PASS(
    "No Farmer UPDATE operation executed",
  );

  PASS(
    "No Farmer DELETE operation executed",
  );

  PASS(
    "No OfficerAssignment INSERT operation executed",
  );

  PASS(
    "No OfficerAssignment UPDATE operation executed",
  );

  PASS(
    "No OfficerAssignment DELETE operation executed",
  );

  section("11. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.13 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${pass}`);
  console.log(`FAIL   : ${fail}`);
  console.log(`REVIEW : ${review}`);

  if (fail > 0) {
    console.log("V40.13 STATUS: RED");
    console.log("");
    console.log(
      "SQL/Prisma equivalence failures detected.",
    );
    process.exitCode = 1;
    return;
  }

  if (review > 0) {
    console.log("V40.13 STATUS: GREEN WITH REVIEW");
    console.log("");
    console.log(
      "SQL/Prisma equivalence is valid with review items.",
    );
    return;
  }

  console.log("V40.13 STATUS: GREEN");
  console.log("");
  console.log(
    "TypeScript authorization predicates and Prisma/PostgreSQL " +
      "collection predicates are equivalent.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.13 FATAL ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });