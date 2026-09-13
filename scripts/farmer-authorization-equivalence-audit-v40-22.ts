import prisma from "@/lib/prisma";

import {
  authorizeFarmerAccess,
  getFarmerAuthorizationContext,
} from "@/lib/authorization/farmer-authorization";

import {
  getFarmerCollectionAuthorization,
  getAuthorizedFarmerWhere,
} from "@/lib/authorization/farmer-collection-authorization";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type ResultStatus = "PASS" | "FAIL" | "REVIEW";

type AssignmentRecord = {
  id: number;
  userId: number;
  active: boolean;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;

  role: {
    name: string;
  };

  function: {
    name: string;
    active: boolean;
  };

  country: {
    id: number;
  } | null;

  county: {
    id: number;
    countryId: number;
  } | null;

  subCounty: {
    id: number;
    countyId: number;
  } | null;

  ward: {
    id: number;
    countyId: number;
    subCountyId: number | null;
  } | null;
};

type FarmerRecord = {
  id: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
  county: {
    countryId: number;
  };
};

type SyntheticFarmer = {
  label: string;
  countyId: number;
  subCountyId: number;
  wardId: number;
  countryId: number;
};

type ExpectedDecision = {
  allowed: boolean;
  invalidAssignment: boolean;
};

let passCount = 0;
let failCount = 0;
let reviewCount = 0;

function section(title: string) {
  console.log("");
  console.log("=".repeat(72));
  console.log(title);
  console.log("=".repeat(72));
}

function P(message: string, detail?: string) {
  passCount++;
  console.log(`PASS: ${message}`);
  if (detail) {
    console.log(`      ${detail}`);
  }
}

function F(message: string, detail?: string) {
  failCount++;
  console.log(`FAIL: ${message}`);
  if (detail) {
    console.log(`      ${detail}`);
  }
}

function R(message: string, detail?: string) {
  reviewCount++;
  console.log(`REVIEW: ${message}`);
  if (detail) {
    console.log(`         ${detail}`);
  }
}

function assertEqual(
  condition: boolean,
  passMessage: string,
  failMessage: string,
  detail?: string,
) {
  if (condition) {
    P(passMessage, detail);
  } else {
    F(failMessage, detail);
  }
}

function isValidScopeShape(
  assignment: AssignmentRecord,
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

function hasValidGeographyChain(
  assignment: AssignmentRecord,
): boolean {
  if (!isValidScopeShape(assignment)) {
    return false;
  }

  const countryId = assignment.countryId;
  const countyId = assignment.countyId;
  const subCountyId = assignment.subCountyId;
  const wardId = assignment.wardId;

  if (countryId === null) {
    return false;
  }

  if (assignment.country?.id !== countryId) {
    return false;
  }

  if (assignment.scopeLevel === "NATIONAL") {
    return true;
  }

  if (
    countyId === null ||
    assignment.county === null ||
    assignment.county.id !== countyId ||
    assignment.county.countryId !== countryId
  ) {
    return false;
  }

  if (assignment.scopeLevel === "COUNTY") {
    return true;
  }

  if (
    subCountyId === null ||
    assignment.subCounty === null ||
    assignment.subCounty.id !== subCountyId ||
    assignment.subCounty.countyId !== countyId
  ) {
    return false;
  }

  if (assignment.scopeLevel === "SUBCOUNTY") {
    return true;
  }

  if (
    wardId === null ||
    assignment.ward === null ||
    assignment.ward.id !== wardId ||
    assignment.ward.countyId !== countyId ||
    assignment.ward.subCountyId !== subCountyId
  ) {
    return false;
  }

  return true;
}

function assignmentMatchesFarmer(
  assignment: AssignmentRecord,
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

  if (!isValidScopeShape(assignment)) {
    return false;
  }

  if (assignment.countryId !== farmer.countryId) {
    return false;
  }

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return true;

    case "COUNTY":
      return assignment.countyId === farmer.countyId;

    case "SUBCOUNTY":
      return (
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId
      );

    case "WARD":
      return (
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId &&
        assignment.wardId === farmer.wardId
      );

    default:
      return false;
  }
}

function expectedIndividualDecision(
  assignments: AssignmentRecord[],
  farmer: FarmerRecord,
): ExpectedDecision {
  const activeAssignments = assignments.filter(
    (assignment) => assignment.active,
  );

  if (activeAssignments.length === 0) {
    return {
      allowed: false,
      invalidAssignment: false,
    };
  }

  for (const assignment of activeAssignments) {
    if (
      assignmentMatchesFarmer(
        assignment,
        {
          countyId: farmer.countyId,
          subCountyId: farmer.subCountyId,
          wardId: farmer.wardId,
          countryId: farmer.county.countryId,
        },
      )
    ) {
      return {
        allowed: true,
        invalidAssignment: false,
      };
    }
  }

  const hasInvalidAssignment =
    activeAssignments.some(
      (assignment) =>
        assignment.function.active &&
        !isValidScopeShape(assignment),
    );

  return {
    allowed: false,
    invalidAssignment: hasInvalidAssignment,
  };
}

function expectedCollectionAssignments(
  assignments: AssignmentRecord[],
): AssignmentRecord[] {
  return assignments.filter(
    (assignment) =>
      assignment.active &&
      assignment.function.active &&
      hasValidGeographyChain(assignment),
  );
}

type SupportedFarmerWhere = {
  OR?: SupportedFarmerWhere[];
  county?: {
    countryId?: number;
    id?: number;
  };
  subCountyId?: number;
  wardId?: number;
};

function evaluateFarmerWhere(
  where: SupportedFarmerWhere,
  farmer: SyntheticFarmer,
): boolean {
  if (where.OR) {
    return where.OR.some((child) =>
      evaluateFarmerWhere(child, farmer),
    );
  }

  if (where.county) {
    if (
      where.county.countryId !== undefined &&
      where.county.countryId !== farmer.countryId
    ) {
      return false;
    }

    if (
      where.county.id !== undefined &&
      where.county.id !== farmer.countyId
    ) {
      return false;
    }
  }

  if (
    where.subCountyId !== undefined &&
    where.subCountyId !== farmer.subCountyId
  ) {
    return false;
  }

  if (
    where.wardId !== undefined &&
    where.wardId !== farmer.wardId
  ) {
    return false;
  }

  return true;
}

function buildExpectedSyntheticPolicy(
  assignments: AssignmentRecord[],
  farmer: SyntheticFarmer,
): boolean {
  return assignments.some((assignment) =>
    assignmentMatchesFarmer(
      assignment,
      {
        countyId: farmer.countyId,
        subCountyId: farmer.subCountyId,
        wardId: farmer.wardId,
        countryId: farmer.countryId,
      },
    ),
  );
}

function buildSyntheticBoundaryFarmers(
  assignments: AssignmentRecord[],
): SyntheticFarmer[] {
  const validAssignments =
    expectedCollectionAssignments(assignments);

  const primary =
    validAssignments[0];

  if (!primary) {
    return [];
  }

  const countryId = primary.countryId ?? -1;
  const countyId = primary.countyId ?? -1;
  const subCountyId = primary.subCountyId ?? -1;
  const wardId = primary.wardId ?? -1;

  const synthetic: SyntheticFarmer[] = [
    {
      label: "ASSIGNED GEOGRAPHY",
      countryId,
      countyId,
      subCountyId,
      wardId,
    },
    {
      label: "SIBLING WARD",
      countryId,
      countyId,
      subCountyId,
      wardId: wardId + 1,
    },
    {
      label: "SIBLING SUBCOUNTY",
      countryId,
      countyId,
      subCountyId: subCountyId + 1,
      wardId,
    },
    {
      label: "SIBLING COUNTY",
      countryId,
      countyId: countyId + 1,
      subCountyId,
      wardId,
    },
    {
      label: "FOREIGN COUNTRY",
      countryId: countryId + 999,
      countyId,
      subCountyId,
      wardId,
    },
  ];

  return synthetic;
}

async function main() {
  console.log("");
  console.log("V40.22 PRODUCTION AUTHORIZATION EQUIVALENCE AUDIT");
  console.log("=".repeat(72));
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log(
    "Purpose: compare the established authorization policy with",
  );
  console.log(
    "production individual and collection authorization helpers.",
  );

  section("1. DATABASE BASELINE");

  const baseline = {
    users: await prisma.user.count(),
    farmers: await prisma.farmer.count(),
    farms: await prisma.farm.count(),
    officerFunctions:
      await prisma.officerFunction.count(),
    officerAssignments:
      await prisma.officerAssignment.count(),
  };

  console.log(
    `Users=${baseline.users} Farmers=${baseline.farmers} ` +
      `Farms=${baseline.farms} ` +
      `OfficerFunctions=${baseline.officerFunctions} ` +
      `OfficerAssignments=${baseline.officerAssignments}`,
  );

  assertEqual(
    baseline.users >= 1,
    "PostgreSQL contains at least one User",
    "PostgreSQL contains no Users",
  );

  section("2. LOAD ACTIVE ASSIGNMENTS");

  const assignments =
    (await prisma.officerAssignment.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        userId: true,
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

        country: {
          select: {
            id: true,
          },
        },

        county: {
          select: {
            id: true,
            countryId: true,
          },
        },

        subCounty: {
          select: {
            id: true,
            countyId: true,
          },
        },

        ward: {
          select: {
            id: true,
            countyId: true,
            subCountyId: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })) as AssignmentRecord[];

  console.log(
    `Active OfficerAssignments loaded: ${assignments.length}`,
  );

  if (assignments.length === 0) {
    R(
      "No active OfficerAssignments exist",
      "Production authorization has no officer scope to compare.",
    );
  } else {
    P(
      "Active OfficerAssignments loaded",
      `${assignments.length} active assignments`,
    );
  }

  for (const assignment of assignments) {
    console.log(
      `Assignment ${assignment.id} | ` +
        `user=${assignment.userId} | ` +
        `${assignment.scopeLevel} | ` +
        `${assignment.role.name} | ` +
        `${assignment.function.name} | ` +
        `functionActive=${assignment.function.active}`,
    );
  }

  section("3. ASSIGNMENT SCOPE-SHAPE CONSISTENCY");

  const invalidScopeAssignments =
    assignments.filter(
      (assignment) =>
        assignment.function.active &&
        !isValidScopeShape(assignment),
    );

  if (invalidScopeAssignments.length === 0) {
    P(
      "All active assignments with active functions have valid scope shapes",
    );
  } else {
    F(
      "Active assignments contain invalid scope shapes",
      invalidScopeAssignments
        .map((assignment) => `assignment=${assignment.id}`)
        .join(", "),
    );
  }

  section("4. ASSIGNMENT GEOGRAPHY-CHAIN CONSISTENCY");

  const invalidGeographyAssignments =
    assignments.filter(
      (assignment) =>
        assignment.function.active &&
        !hasValidGeographyChain(assignment),
    );

  if (invalidGeographyAssignments.length === 0) {
    P(
      "All active assignments with active functions have valid geography chains",
    );
  } else {
    F(
      "Active assignments contain invalid geography chains",
      invalidGeographyAssignments
        .map(
          (assignment) =>
            `assignment=${assignment.id} ` +
            `scope=${assignment.scopeLevel}`,
        )
        .join(" | "),
    );
  }

  section("5. LOAD REAL FARMERS");

  const farmers =
    (await prisma.farmer.findMany({
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
    })) as FarmerRecord[];

  console.log(`Farmers loaded: ${farmers.length}`);

  if (farmers.length === 0) {
    R(
      "No Farmers exist",
      "Individual authorization cannot be exercised against a real Farmer.",
    );
  } else {
    P(
      "Real Farmers loaded",
      `${farmers.length} Farmer records available`,
    );
  }

  section("6. INDIVIDUAL AUTHORIZATION EQUIVALENCE");

  const userIds = Array.from(
    new Set(assignments.map((assignment) => assignment.userId)),
  );

  if (userIds.length === 0) {
    R(
      "No users have active OfficerAssignments",
      "No individual production authorization matrix can be exercised.",
    );
  }

  for (const userId of userIds) {
    const userAssignments = assignments.filter(
      (assignment) => assignment.userId === userId,
    );

    for (const farmer of farmers) {
      const expected =
        expectedIndividualDecision(
          userAssignments,
          farmer,
        );

      const production =
        await authorizeFarmerAccess(
          userId,
          farmer.id,
        );

      const expectedReason =
        expected.invalidAssignment
          ? "INVALID_ASSIGNMENT"
          : expected.allowed
            ? "ALLOWED"
            : userAssignments.length === 0
              ? "NO_ACTIVE_ASSIGNMENT"
              : "NO_MATCHING_SCOPE";

      const equivalent =
        production.allowed === expected.allowed &&
        production.reason === expectedReason;

      if (equivalent) {
        P(
          `Individual authorization equivalent for user ${userId}, Farmer ${farmer.id}`,
          `expected=${expectedReason} production=${production.reason}`,
        );
      } else {
        F(
          `Individual authorization mismatch for user ${userId}, Farmer ${farmer.id}`,
          `expected=${expectedReason} production=${production.reason} ` +
            `productionAllowed=${production.allowed}`,
        );
      }
    }
  }

  section("7. PRODUCTION AUTHORIZATION CONTEXT");

  for (const userId of userIds) {
    const productionContext =
      await getFarmerAuthorizationContext(userId);

    const expectedContext =
      assignments.filter(
        (assignment) =>
          assignment.userId === userId &&
          assignment.active &&
          assignment.function.active &&
          isValidScopeShape(assignment),
      );

    const productionIds =
      productionContext
        .map((assignment) => assignment.id)
        .sort((a, b) => a - b);

    const expectedIds =
      expectedContext
        .map((assignment) => assignment.id)
        .sort((a, b) => a - b);

    const equivalent =
      JSON.stringify(productionIds) ===
      JSON.stringify(expectedIds);

    if (equivalent) {
      P(
        `Authorization context equivalent for user ${userId}`,
        `assignments=${productionIds.join(",") || "none"}`,
      );
    } else {
      F(
        `Authorization context mismatch for user ${userId}`,
        `expected=${expectedIds.join(",") || "none"} ` +
          `production=${productionIds.join(",") || "none"}`,
      );
    }
  }

  section("8. COLLECTION AUTHORIZATION RESULT");

  for (const userId of userIds) {
    const production =
      await getFarmerCollectionAuthorization(userId);

    const expectedAssignments =
      expectedCollectionAssignments(
        assignments.filter(
          (assignment) =>
            assignment.userId === userId,
        ),
      );

    const expectedIds =
      expectedAssignments
        .map((assignment) => assignment.id)
        .sort((a, b) => a - b);

    const expectedScopes = Array.from(
      new Set(
        expectedAssignments.map(
          (assignment) => assignment.scopeLevel,
        ),
      ),
    ).sort();

    const productionIds =
      [...production.assignmentIds].sort(
        (a, b) => a - b,
      );

    const productionScopes =
      [...production.scopes].sort();

    const idsMatch =
      JSON.stringify(productionIds) ===
      JSON.stringify(expectedIds);

    const scopesMatch =
      JSON.stringify(productionScopes) ===
      JSON.stringify(expectedScopes);

    const allowedExpected =
      expectedAssignments.length > 0;

    const allowedMatch =
      production.allowed === allowedExpected;

    if (
      idsMatch &&
      scopesMatch &&
      allowedMatch
    ) {
      P(
        `Collection authorization equivalent for user ${userId}`,
        `allowed=${production.allowed} ` +
          `assignments=${productionIds.join(",") || "none"} ` +
          `scopes=${productionScopes.join(",") || "none"}`,
      );
    } else {
      F(
        `Collection authorization mismatch for user ${userId}`,
        `expectedAllowed=${allowedExpected} ` +
          `productionAllowed=${production.allowed} ` +
          `expectedIds=${expectedIds.join(",") || "none"} ` +
          `productionIds=${productionIds.join(",") || "none"} ` +
          `expectedScopes=${expectedScopes.join(",") || "none"} ` +
          `productionScopes=${productionScopes.join(",") || "none"}`,
      );
    }
  }

  section("9. AUTHORIZED COLLECTION WHERE");

  for (const userId of userIds) {
    const productionWhere =
      await getAuthorizedFarmerWhere(userId);

    const expectedAssignments =
      expectedCollectionAssignments(
        assignments.filter(
          (assignment) =>
            assignment.userId === userId,
        ),
      );

    if (expectedAssignments.length === 0) {
      if (productionWhere === null) {
        P(
          `Collection WHERE correctly returns null for user ${userId}`,
        );
      } else {
        F(
          `Collection WHERE should be null for user ${userId}`,
          "Production returned a non-null authorization predicate.",
        );
      }

      continue;
    }

    if (!productionWhere) {
      F(
        `Collection WHERE missing for authorized user ${userId}`,
        `expected ${expectedAssignments.length} valid assignment(s)`,
      );
      continue;
    }

    const whereJson =
      JSON.stringify(productionWhere);

    console.log(
      `User ${userId} production WHERE: ${whereJson}`,
    );

    if (
      !("OR" in productionWhere) ||
      !Array.isArray(
        (productionWhere as { OR?: unknown }).OR,
      )
    ) {
      F(
        `Collection WHERE shape invalid for user ${userId}`,
        "Expected an OR array containing assignment scopes.",
      );
      continue;
    }

    const productionBranches =
      (productionWhere as {
        OR: SupportedFarmerWhere[];
      }).OR;

    assertEqual(
      productionBranches.length ===
        expectedAssignments.length,
      `Collection WHERE contains one branch per valid assignment for user ${userId}`,
      `Collection WHERE branch count mismatch for user ${userId}`,
      `expected=${expectedAssignments.length} ` +
        `production=${productionBranches.length}`,
    );
  }

  section("10. COLLECTION WHERE SEMANTIC EQUIVALENCE");

  for (const userId of userIds) {
    const productionWhere =
      await getAuthorizedFarmerWhere(userId);

    const expectedAssignments =
      expectedCollectionAssignments(
        assignments.filter(
          (assignment) =>
            assignment.userId === userId,
        ),
      );

    if (
      !productionWhere ||
      expectedAssignments.length === 0
    ) {
      continue;
    }

    const syntheticFarmers =
      buildSyntheticBoundaryFarmers(
        assignments.filter(
          (assignment) =>
            assignment.userId === userId,
        ),
      );

    if (syntheticFarmers.length === 0) {
      R(
        `No valid assignment available for synthetic WHERE test for user ${userId}`,
      );
      continue;
    }

    for (const synthetic of syntheticFarmers) {
      const expected =
        buildExpectedSyntheticPolicy(
          expectedAssignments,
          synthetic,
        );

      const production =
        evaluateFarmerWhere(
          productionWhere as SupportedFarmerWhere,
          synthetic,
        );

      if (expected === production) {
        P(
          `Collection WHERE semantics match policy for user ${userId}: ${synthetic.label}`,
          `expected=${expected} production=${production}`,
        );
      } else {
        F(
          `Collection WHERE semantics differ from policy for user ${userId}: ${synthetic.label}`,
          `expected=${expected} production=${production}`,
        );
      }
    }
  }

  section("11. INDIVIDUAL VS COLLECTION CONSISTENCY");

  for (const userId of userIds) {
    const productionWhere =
      await getAuthorizedFarmerWhere(userId);

    if (!productionWhere) {
      continue;
    }

    for (const farmer of farmers) {
      const individual =
        await authorizeFarmerAccess(
          userId,
          farmer.id,
        );

      const collection =
        evaluateFarmerWhere(
          productionWhere as SupportedFarmerWhere,
          {
            label: `Farmer ${farmer.id}`,
            countryId: farmer.county.countryId,
            countyId: farmer.countyId,
            subCountyId: farmer.subCountyId,
            wardId: farmer.wardId,
          },
        );

      if (individual.allowed === collection) {
        P(
          `Individual/collection consistency for user ${userId}, Farmer ${farmer.id}`,
          `individual=${individual.allowed} collection=${collection}`,
        );
      } else {
        F(
          `Individual/collection inconsistency for user ${userId}, Farmer ${farmer.id}`,
          `individual=${individual.allowed} collection=${collection}`,
        );
      }
    }
  }

  section("12. REAL FARMER AUTHORIZATION MATRIX");

  for (const userId of userIds) {
    for (const farmer of farmers) {
      const result =
        await authorizeFarmerAccess(
          userId,
          farmer.id,
        );

      console.log(
        `User ${userId} | Farmer ${farmer.id} | ` +
          `${farmer.countyId}/${farmer.subCountyId}/${farmer.wardId} | ` +
          `${result.allowed ? "ALLOW" : "DENY"} | ` +
          `${result.reason}`,
      );
    }
  }

  section("13. NONEXISTENT FARMER SAFETY");

  for (const userId of userIds) {
    const nonexistentId =
      farmers.length > 0
        ? Math.max(
            ...farmers.map(
              (farmer) => farmer.id,
            ),
          ) + 999999
        : 999999999;

    const result =
      await authorizeFarmerAccess(
        userId,
        nonexistentId,
      );

    if (
      !result.allowed &&
      result.reason === "NO_FARMER"
    ) {
      P(
        `Nonexistent Farmer correctly denied for user ${userId}`,
        `farmerId=${nonexistentId}`,
      );
    } else {
      F(
        `Nonexistent Farmer authorization incorrect for user ${userId}`,
        `allowed=${result.allowed} reason=${result.reason}`,
      );
    }
  }

  section("14. MULTIPLE ASSIGNMENT UNION PROPERTY");

  for (const userId of userIds) {
    const userAssignments =
      assignments.filter(
        (assignment) =>
          assignment.userId === userId,
      );

    if (userAssignments.length < 2) {
      R(
        `User ${userId} has fewer than two active assignments`,
        "Union behavior cannot be independently demonstrated.",
      );
      continue;
    }

    const validAssignments =
      expectedCollectionAssignments(
        userAssignments,
      );

    if (validAssignments.length < 2) {
      R(
        `User ${userId} has fewer than two valid active assignments`,
        "Multiple-assignment union behavior cannot be fully demonstrated.",
      );
      continue;
    }

    const farmer4 =
      farmers.find(
        (farmer) => farmer.id === 4,
      );

    if (farmer4) {
      const result =
        await authorizeFarmerAccess(
          userId,
          farmer4.id,
        );

      const expected =
        expectedIndividualDecision(
          userAssignments,
          farmer4,
        );

      if (
        result.allowed === expected.allowed
      ) {
        P(
          `Multiple-assignment union remains correct for user ${userId}`,
          `Farmer 4 expected=${expected.allowed} production=${result.allowed}`,
        );
      } else {
        F(
          `Multiple-assignment union mismatch for user ${userId}`,
          `Farmer 4 expected=${expected.allowed} production=${result.allowed}`,
        );
      }
    }
  }

  section("15. PRODUCTION HELPER CONTEXT VS COLLECTION CONTEXT");

  for (const userId of userIds) {
    const individualContext =
      await getFarmerAuthorizationContext(
        userId,
      );

    const collectionResult =
      await getFarmerCollectionAuthorization(
        userId,
      );

    const individualIds =
      individualContext
        .map((assignment) => assignment.id)
        .sort((a, b) => a - b);

    const collectionIds =
      [...collectionResult.assignmentIds]
        .sort((a, b) => a - b);

    const equivalent =
      JSON.stringify(individualIds) ===
      JSON.stringify(collectionIds);

    if (equivalent) {
      P(
        `Individual and collection authorization contexts agree for user ${userId}`,
        `assignments=${individualIds.join(",") || "none"}`,
      );
    } else {
      F(
        `Individual and collection authorization contexts differ for user ${userId}`,
        `individual=${individualIds.join(",") || "none"} ` +
          `collection=${collectionIds.join(",") || "none"}`,
      );
    }
  }

  section("16. SOURCE ARCHITECTURE INVARIANTS");

  const authSource =
    await readSourceIfAvailable(
      "lib/authorization/farmer-authorization.ts",
    );

  const collectionSource =
    await readSourceIfAvailable(
      "lib/authorization/farmer-collection-authorization.ts",
    );

  if (authSource !== null) {
    const normalizedAuthSource =
      authSource.replace(/\s+/g, " ");

    const hasFarmerIdPredicate =
      /\bid\s*:\s*farmerId\b/.test(
        normalizedAuthSource,
      );

    const requiresActiveAssignment =
      /active\s*:\s*true/.test(
        normalizedAuthSource,
      );

    const requiresActiveFunction =
      /function\.active/.test(
        normalizedAuthSource,
      ) ||
      /active\s*:\s*true/.test(
        normalizedAuthSource,
      );

    const validatesScopeConfiguration =
      /isValidScopeConfiguration/.test(
        normalizedAuthSource,
      );

    assertEqual(
      hasFarmerIdPredicate,
      "Individual authorization source references the requested Farmer ID",
      "Individual authorization source does not visibly reference farmerId",
    );

    assertEqual(
      requiresActiveAssignment,
      "Individual authorization requires active assignments",
      "Individual authorization source does not visibly require active assignments",
    );

    assertEqual(
      requiresActiveFunction,
      "Individual authorization requires active OfficerFunctions",
      "Individual authorization source does not visibly require active OfficerFunctions",
    );

    assertEqual(
      validatesScopeConfiguration,
      "Individual authorization validates scope configuration",
      "Individual authorization source does not visibly validate scope configuration",
    );
  } else {
    R(
      "Individual authorization source could not be read",
      "Runtime authorization tests were executed separately; source inspection was unavailable.",
    );
  }

  if (collectionSource !== null) {
    const normalizedCollectionSource =
      collectionSource.replace(/\s+/g, " ");

    const exposesAuthorizedWhere =
      /getAuthorizedFarmerWhere/.test(
        normalizedCollectionSource,
      );

    const validatesGeographyChain =
      /hasValidGeographyChain/.test(
        normalizedCollectionSource,
      );

    const checksFunctionActivity =
      /function\.active/.test(
        normalizedCollectionSource,
      );

    const buildsOrPredicate =
      /\bOR\s*:/.test(
        normalizedCollectionSource,
      ) ||
      /\bOR\s*[,}]/.test(
        normalizedCollectionSource,
      ) ||
      /\.map\s*\([^)]*=>/.test(
        normalizedCollectionSource,
      );

    assertEqual(
      exposesAuthorizedWhere,
      "Collection authorization exposes the constrained Farmer WHERE helper",
      "Collection authorization WHERE helper could not be verified",
    );

    assertEqual(
      validatesGeographyChain,
      "Collection authorization validates geography chains",
      "Collection authorization does not visibly validate geography chains",
    );

    assertEqual(
      checksFunctionActivity,
      "Collection authorization checks OfficerFunction activity",
      "Collection authorization does not visibly check OfficerFunction activity",
    );

    assertEqual(
      buildsOrPredicate,
      "Collection authorization source visibly constructs or returns an OR authorization predicate",
      "Collection authorization OR predicate could not be verified from source",
    );
  } else {
    R(
      "Collection authorization source could not be read",
      "Runtime collection authorization tests were executed separately; source inspection was unavailable.",
    );
  }

  section("17. DATABASE MUTATION SAFETY");

  const after = {
    users: await prisma.user.count(),
    farmers: await prisma.farmer.count(),
    farms: await prisma.farm.count(),
    officerFunctions:
      await prisma.officerFunction.count(),
    officerAssignments:
      await prisma.officerAssignment.count(),
  };

  const unchanged =
    JSON.stringify(baseline) ===
    JSON.stringify(after);

  if (unchanged) {
    P(
      "PostgreSQL baseline is unchanged",
      "No INSERT / UPDATE / DELETE detected by audit counts.",
    );
  } else {
    F(
      "PostgreSQL baseline changed during audit",
      `before=${JSON.stringify(baseline)} ` +
        `after=${JSON.stringify(after)}`,
    );
  }

  section("18. FINAL RESULT");

  console.log("");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`REVIEW: ${reviewCount}`);
  console.log("");

  if (failCount === 0 && reviewCount === 0) {
    console.log("V40.22 STATUS: GREEN");
    console.log(
      "Production individual and collection authorization",
    );
    console.log(
      "are equivalent to the established authorization policy.",
    );
    console.log(
      "No PostgreSQL mutations were performed.",
    );
  } else if (failCount === 0) {
    console.log("V40.22 STATUS: GREEN WITH REVIEW");
    console.log(
      "No authorization equivalence failures were detected,",
    );
    console.log(
      "but one or more evidence areas require review.",
    );
    console.log(
      "No PostgreSQL mutations were performed.",
    );
  } else {
    console.log("V40.22 STATUS: RED");
    console.log(
      "Production authorization differs from the established",
    );
    console.log(
      "authorization policy or an audit invariant failed.",
    );
    console.log(
      "No PostgreSQL mutations were intentionally performed.",
    );
  }

  console.log("");
  console.log("V40.22 COMPLETE");
}

async function readSourceIfAvailable(
  relativePath: string,
): Promise<string | null> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const absolutePath = path.resolve(
      process.cwd(),
      relativePath,
    );

    return await fs.readFile(
      absolutePath,
      "utf8",
    );
  } catch {
    return null;
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.22 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });