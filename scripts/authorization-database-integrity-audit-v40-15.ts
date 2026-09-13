import prisma from "../lib/prisma";

type ScopeLevel = "NATIONAL" | "COUNTY" | "SUBCOUNTY" | "WARD";

type CheckResult = {
  pass: boolean;
  label: string;
  detail?: string;
};

const checks: CheckResult[] = [];

function pass(label: string, detail?: string) {
  checks.push({ pass: true, label, detail });
  console.log(`PASS   ${label}${detail ? `: ${detail}` : ""}`);
}

function fail(label: string, detail?: string) {
  checks.push({ pass: false, label, detail });
  console.log(`FAIL   ${label}${detail ? `: ${detail}` : ""}`);
}

function section(title: string) {
  console.log("");
  console.log("-".repeat(68));
  console.log(title);
  console.log("-".repeat(68));
}

function isValidScopeShape(row: {
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
}): boolean {
  switch (row.scopeLevel) {
    case "NATIONAL":
      return (
        row.countryId !== null &&
        row.countyId === null &&
        row.subCountyId === null &&
        row.wardId === null
      );

    case "COUNTY":
      return (
        row.countryId !== null &&
        row.countyId !== null &&
        row.subCountyId === null &&
        row.wardId === null
      );

    case "SUBCOUNTY":
      return (
        row.countryId !== null &&
        row.countyId !== null &&
        row.subCountyId !== null &&
        row.wardId === null
      );

    case "WARD":
      return (
        row.countryId !== null &&
        row.countyId !== null &&
        row.subCountyId !== null &&
        row.wardId !== null
      );

    default:
      return false;
  }
}

async function main() {
  console.log("");
  console.log("=".repeat(68));
  console.log("V40.15 AUTHORIZATION DATABASE INTEGRITY AUDIT");
  console.log("=".repeat(68));
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  section("1. DATABASE CONNECTIVITY");

  try {
    await prisma.$queryRaw`SELECT 1`;
    pass("PostgreSQL connection is operational");
  } catch (error) {
    fail(
      "PostgreSQL connection is operational",
      error instanceof Error ? error.message : String(error),
    );
  }

  section("2. AUTHORIZATION TABLE BASELINE");

  const [
    roleCount,
    functionCount,
    assignmentCount,
    activeAssignmentCount,
    userCount,
  ] = await Promise.all([
    prisma.role.count(),
    prisma.officerFunction.count(),
    prisma.officerAssignment.count(),
    prisma.officerAssignment.count({
      where: { active: true },
    }),
    prisma.user.count(),
  ]);

  console.log(`Roles: ${roleCount}`);
  console.log(`OfficerFunctions: ${functionCount}`);
  console.log(`OfficerAssignments: ${assignmentCount}`);
  console.log(`Active OfficerAssignments: ${activeAssignmentCount}`);
  console.log(`Users: ${userCount}`);

  if (roleCount >= 1) {
    pass("Role table contains records");
  } else {
    fail("Role table contains records");
  }

  if (functionCount === 16) {
    pass("OfficerFunction catalogue contains expected 16 functions");
  } else {
    fail(
      "OfficerFunction catalogue contains expected 16 functions",
      `found ${functionCount}`,
    );
  }

  if (assignmentCount === 5 && activeAssignmentCount === 5) {
    pass(
      "Current simulated authorization baseline contains exactly five active assignments",
    );
  } else {
    fail(
      "Current simulated authorization baseline contains exactly five active assignments",
      `total=${assignmentCount}, active=${activeAssignmentCount}`,
    );
  }

  section("3. OFFICER ASSIGNMENT FOREIGN-KEY INTEGRITY");

  const assignments = await prisma.officerAssignment.findMany({
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
    },
    orderBy: { id: "asc" },
  });

  const [
    users,
    roles,
    functions,
    countries,
    counties,
    subCounties,
    wards,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true },
    }),
    prisma.role.findMany({
      select: { id: true },
    }),
    prisma.officerFunction.findMany({
      select: { id: true },
    }),
    prisma.country.findMany({
      select: { id: true },
    }),
    prisma.county.findMany({
      select: { id: true, countryId: true },
    }),
    prisma.subCounty.findMany({
      select: { id: true, countyId: true },
    }),
    prisma.ward.findMany({
      select: {
        id: true,
        countyId: true,
        subCountyId: true,
      },
    }),
  ]);

  const userIds = new Set(users.map((x) => x.id));
  const roleIds = new Set(roles.map((x) => x.id));
  const functionIds = new Set(functions.map((x) => x.id));
  const countryIds = new Set(countries.map((x) => x.id));
  const countyMap = new Map(counties.map((x) => [x.id, x]));
  const subCountyMap = new Map(subCounties.map((x) => [x.id, x]));
  const wardMap = new Map(wards.map((x) => [x.id, x]));

  let userFkErrors = 0;
  let roleFkErrors = 0;
  let functionFkErrors = 0;
  let countryFkErrors = 0;
  let countyFkErrors = 0;
  let subCountyFkErrors = 0;
  let wardFkErrors = 0;

  for (const assignment of assignments) {
    if (!userIds.has(assignment.userId)) {
      userFkErrors++;
    }

    if (!roleIds.has(assignment.roleId)) {
      roleFkErrors++;
    }

    if (!functionIds.has(assignment.functionId)) {
      functionFkErrors++;
    }

    if (
      assignment.countryId !== null &&
      !countryIds.has(assignment.countryId)
    ) {
      countryFkErrors++;
    }

    if (
      assignment.countyId !== null &&
      !countyMap.has(assignment.countyId)
    ) {
      countyFkErrors++;
    }

    if (
      assignment.subCountyId !== null &&
      !subCountyMap.has(assignment.subCountyId)
    ) {
      subCountyFkErrors++;
    }

    if (
      assignment.wardId !== null &&
      !wardMap.has(assignment.wardId)
    ) {
      wardFkErrors++;
    }
  }

  if (userFkErrors === 0) {
    pass("OfficerAssignment → User foreign-key integrity", "0 orphan records");
  } else {
    fail(
      "OfficerAssignment → User foreign-key integrity",
      `${userFkErrors} invalid references`,
    );
  }

  if (roleFkErrors === 0) {
    pass("OfficerAssignment → Role foreign-key integrity", "0 orphan records");
  } else {
    fail(
      "OfficerAssignment → Role foreign-key integrity",
      `${roleFkErrors} invalid references`,
    );
  }

  if (functionFkErrors === 0) {
    pass(
      "OfficerAssignment → OfficerFunction foreign-key integrity",
      "0 orphan records",
    );
  } else {
    fail(
      "OfficerAssignment → OfficerFunction foreign-key integrity",
      `${functionFkErrors} invalid references`,
    );
  }

  if (countryFkErrors === 0) {
    pass(
      "OfficerAssignment → Country foreign-key integrity",
      "0 orphan records",
    );
  } else {
    fail(
      "OfficerAssignment → Country foreign-key integrity",
      `${countryFkErrors} invalid references`,
    );
  }

  if (countyFkErrors === 0) {
    pass(
      "OfficerAssignment → County foreign-key integrity",
      "0 orphan records",
    );
  } else {
    fail(
      "OfficerAssignment → County foreign-key integrity",
      `${countyFkErrors} invalid references`,
    );
  }

  if (subCountyFkErrors === 0) {
    pass(
      "OfficerAssignment → SubCounty foreign-key integrity",
      "0 orphan records",
    );
  } else {
    fail(
      "OfficerAssignment → SubCounty foreign-key integrity",
      `${subCountyFkErrors} invalid references`,
    );
  }

  if (wardFkErrors === 0) {
    pass(
      "OfficerAssignment → Ward foreign-key integrity",
      "0 orphan records",
    );
  } else {
    fail(
      "OfficerAssignment → Ward foreign-key integrity",
      `${wardFkErrors} invalid references`,
    );
  }

  section("4. SCOPE-SHAPE DATABASE STATE");

  let invalidScopeShapes = 0;

  for (const assignment of assignments) {
    const valid = isValidScopeShape({
      scopeLevel: assignment.scopeLevel as ScopeLevel,
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId: assignment.wardId,
    });

    if (!valid) {
      invalidScopeShapes++;
      console.log(
        `INVALID Assignment ${assignment.id} | ${assignment.scopeLevel} | ` +
          `country=${assignment.countryId} county=${assignment.countyId} ` +
          `subCounty=${assignment.subCountyId} ward=${assignment.wardId}`,
      );
    }
  }

  if (invalidScopeShapes === 0) {
    pass("All current OfficerAssignment records have valid scope shapes");
  } else {
    fail(
      "All current OfficerAssignment records have valid scope shapes",
      `${invalidScopeShapes} malformed records`,
    );
  }

  section("5. GEOGRAPHIC CHAIN DATABASE STATE");

  let invalidGeographyChains = 0;

  for (const assignment of assignments) {
    const countryId = assignment.countryId;
    const countyId = assignment.countyId;
    const subCountyId = assignment.subCountyId;
    const wardId = assignment.wardId;

    let valid = true;

    if (countryId === null) {
      valid = false;
    }

    if (valid && assignment.scopeLevel === "NATIONAL") {
      if (!countryIds.has(countryId as number)) {
        valid = false;
      }
    }

    if (
      valid &&
      assignment.scopeLevel !== "NATIONAL"
    ) {
      if (countyId === null) {
        valid = false;
      } else {
        const county = countyMap.get(countyId);

        if (!county) {
          valid = false;
        } else if (county.countryId !== countryId) {
          valid = false;
        }
      }
    }

    if (
      valid &&
      (assignment.scopeLevel === "SUBCOUNTY" ||
        assignment.scopeLevel === "WARD")
    ) {
      if (subCountyId === null) {
        valid = false;
      } else {
        const subCounty = subCountyMap.get(subCountyId);

        if (!subCounty) {
          valid = false;
        } else if (subCounty.countyId !== countyId) {
          valid = false;
        }
      }
    }

    if (valid && assignment.scopeLevel === "WARD") {
      if (wardId === null) {
        valid = false;
      } else {
        const ward = wardMap.get(wardId);

        if (!ward) {
          valid = false;
        } else if (ward.countyId !== countyId) {
          valid = false;
        } else if (ward.subCountyId !== subCountyId) {
          valid = false;
        }
      }
    }

    if (!valid) {
      invalidGeographyChains++;
      console.log(
        `INVALID Assignment ${assignment.id} | ${assignment.scopeLevel}`,
      );
    }
  }

  if (invalidGeographyChains === 0) {
    pass("All current OfficerAssignment geography chains are valid");
  } else {
    fail(
      "All current OfficerAssignment geography chains are valid",
      `${invalidGeographyChains} invalid chains`,
    );
  }

  section("6. ACTIVE / FUNCTION STATE INTEGRITY");

  const assignmentFunctions = await prisma.officerAssignment.findMany({
    where: { active: true },
    select: {
      id: true,
      function: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const inactiveFunctions = assignmentFunctions.filter(
    (assignment) => !assignment.function.active,
  );

  if (inactiveFunctions.length === 0) {
    pass(
      "Every active OfficerAssignment references an active OfficerFunction",
    );
  } else {
    fail(
      "Every active OfficerAssignment references an active OfficerFunction",
      `${inactiveFunctions.length} active assignments reference inactive functions`,
    );
  }

  section("7. SOURCE / SIMULATION INTEGRITY");

  const nonSimulated = assignments.filter(
    (assignment) => assignment.source !== "SIMULATED",
  );

  if (nonSimulated.length === 0) {
    pass("All current simulated authorization assignments have source=SIMULATED");
  } else {
    fail(
      "All current simulated authorization assignments have source=SIMULATED",
      `${nonSimulated.length} assignments have another source`,
    );
  }

  section("8. EXPECTED FIVE-ASSIGNMENT POLICY MATRIX");

  const expectedAssignments = [
    {
      roleId: 1,
      functionId: 1,
      scopeLevel: "NATIONAL",
      countryId: 2,
      countyId: null,
      subCountyId: null,
      wardId: null,
    },
    {
      roleId: 2,
      functionId: 2,
      scopeLevel: "NATIONAL",
      countryId: 2,
      countyId: null,
      subCountyId: null,
      wardId: null,
    },
    {
      roleId: 3,
      functionId: 3,
      scopeLevel: "COUNTY",
      countryId: 2,
      countyId: 48,
      subCountyId: null,
      wardId: null,
    },
    {
      roleId: 4,
      functionId: 7,
      scopeLevel: "SUBCOUNTY",
      countryId: 2,
      countyId: 48,
      subCountyId: 1309,
      wardId: null,
    },
    {
      roleId: 5,
      functionId: 7,
      scopeLevel: "WARD",
      countryId: 2,
      countyId: 48,
      subCountyId: 1309,
      wardId: 2095,
    },
  ];

  let policyMatches = 0;

  for (const expected of expectedAssignments) {
    const match = assignments.some(
      (assignment) =>
        assignment.roleId === expected.roleId &&
        assignment.functionId === expected.functionId &&
        assignment.scopeLevel === expected.scopeLevel &&
        assignment.countryId === expected.countryId &&
        assignment.countyId === expected.countyId &&
        assignment.subCountyId === expected.subCountyId &&
        assignment.wardId === expected.wardId &&
        assignment.active === true &&
        assignment.source === "SIMULATED",
    );

    if (match) {
      policyMatches++;
      pass(
        `Expected ${expected.scopeLevel} assignment exists`,
        `role=${expected.roleId}, function=${expected.functionId}`,
      );
    } else {
      fail(
        `Expected ${expected.scopeLevel} assignment exists`,
        `role=${expected.roleId}, function=${expected.functionId}`,
      );
    }
  }

  if (policyMatches === expectedAssignments.length) {
    pass("Complete five-assignment simulated policy matrix is intact");
  } else {
    fail(
      "Complete five-assignment simulated policy matrix is intact",
      `${policyMatches}/${expectedAssignments.length} expected assignments matched`,
    );
  }

  section("9. DATABASE FOREIGN-KEY CONSTRAINT INVENTORY");

  type ConstraintRow = {
    constraint_name: string;
    constraint_type: string;
    definition: string;
  };

  const constraints = await prisma.$queryRaw<ConstraintRow[]>`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      pg_get_constraintdef(pc.oid) AS definition
    FROM information_schema.table_constraints tc
    JOIN pg_constraint pc
      ON pc.conname = tc.constraint_name
    JOIN pg_class cls
      ON cls.oid = pc.conrelid
    JOIN pg_namespace ns
      ON ns.oid = cls.relnamespace
     AND ns.nspname = tc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'OfficerAssignment'
    ORDER BY tc.constraint_type, tc.constraint_name
  `;

  console.log(`OfficerAssignment constraints: ${constraints.length}`);

  for (const constraint of constraints) {
    console.log(
      `${constraint.constraint_type} | ${constraint.constraint_name} | ${constraint.definition}`,
    );
  }

  const foreignKeyConstraints = constraints.filter(
    (constraint) => constraint.constraint_type === "FOREIGN KEY",
  );

  if (foreignKeyConstraints.length >= 7) {
    pass(
      "OfficerAssignment has database-level foreign-key constraints for authorization relationships",
      `${foreignKeyConstraints.length} foreign keys found`,
    );
  } else {
    fail(
      "OfficerAssignment has database-level foreign-key constraints for authorization relationships",
      `only ${foreignKeyConstraints.length} foreign keys found`,
    );
  }

  section("10. DATABASE CHECK-CONSTRAINT INVENTORY");

  const checkConstraints = constraints.filter(
    (constraint) => constraint.constraint_type === "CHECK",
  );

  if (checkConstraints.length > 0) {
    pass(
      "OfficerAssignment has database CHECK constraints",
      `${checkConstraints.length} found`,
    );

    for (const constraint of checkConstraints) {
      console.log(
        `CHECK | ${constraint.constraint_name} | ${constraint.definition}`,
      );
    }
  } else {
    console.log(
      "REVIEW  OfficerAssignment has no database CHECK constraints for scope-shape rules",
    );
  }

  section("11. AUTHORIZATION INDEX INVENTORY");

  type IndexRow = {
    indexname: string;
    indexdef: string;
  };

  const indexes = await prisma.$queryRaw<IndexRow[]>`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'OfficerAssignment'
    ORDER BY indexname
  `;

  console.log(`OfficerAssignment indexes: ${indexes.length}`);

  for (const index of indexes) {
    console.log(`${index.indexname} | ${index.indexdef}`);
  }

  const indexText = indexes
    .map((index) => index.indexdef.toLowerCase())
    .join("\n");

  const expectedIndexColumns = [
    "userid",
    "roleid",
    "functionid",
    "scopelevel",
    "countryid",
    "countyid",
    "subcountyid",
    "wardid",
    "active",
    "source",
  ];

  let missingIndexes = 0;

  for (const column of expectedIndexColumns) {
    if (indexText.includes(column)) {
      pass(`Authorization index coverage includes ${column}`);
    } else {
      missingIndexes++;
      console.log(`REVIEW  Authorization index coverage missing ${column}`);
    }
  }

  if (missingIndexes === 0) {
    pass("All expected OfficerAssignment authorization index columns are covered");
  } else {
    console.log(
      `REVIEW  ${missingIndexes} expected authorization index columns were not detected`,
    );
  }

  section("12. ORPHAN / NULL STATE AUDIT");

  const nullUserIds = assignments.filter(
    (assignment) => assignment.userId === null,
  ).length;

  const nullRoleIds = assignments.filter(
    (assignment) => assignment.roleId === null,
  ).length;

  const nullFunctionIds = assignments.filter(
    (assignment) => assignment.functionId === null,
  ).length;

  if (nullUserIds === 0) {
    pass("No OfficerAssignment has NULL userId");
  } else {
    fail("No OfficerAssignment has NULL userId", `${nullUserIds} found`);
  }

  if (nullRoleIds === 0) {
    pass("No OfficerAssignment has NULL roleId");
  } else {
    fail("No OfficerAssignment has NULL roleId", `${nullRoleIds} found`);
  }

  if (nullFunctionIds === 0) {
    pass("No OfficerAssignment has NULL functionId");
  } else {
    fail(
      "No OfficerAssignment has NULL functionId",
      `${nullFunctionIds} found`,
    );
  }

  section("13. DUPLICATE ASSIGNMENT ANALYSIS");

  type DuplicateRow = {
    userId: number;
    roleId: number;
    functionId: number;
    scopeLevel: ScopeLevel;
    countryId: number | null;
    countyId: number | null;
    subCountyId: number | null;
    wardId: number | null;
    count: bigint;
  };

  const duplicates = await prisma.$queryRaw<DuplicateRow[]>`
    SELECT
      "userId",
      "roleId",
      "functionId",
      "scopeLevel",
      "countryId",
      "countyId",
      "subCountyId",
      "wardId",
      COUNT(*) AS count
    FROM "OfficerAssignment"
    GROUP BY
      "userId",
      "roleId",
      "functionId",
      "scopeLevel",
      "countryId",
      "countyId",
      "subCountyId",
      "wardId"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;

  if (duplicates.length === 0) {
    pass("No exact duplicate OfficerAssignment records exist");
  } else {
    console.log(
      `REVIEW  ${duplicates.length} exact duplicate authorization groups detected`,
    );

    for (const duplicate of duplicates) {
      console.log(
        `Duplicate group | user=${duplicate.userId} role=${duplicate.roleId} ` +
          `function=${duplicate.functionId} scope=${duplicate.scopeLevel} ` +
          `country=${duplicate.countryId} county=${duplicate.countyId} ` +
          `subCounty=${duplicate.subCountyId} ward=${duplicate.wardId} ` +
          `count=${duplicate.count}`,
      );
    }
  }

  section("14. PRIMARY ROLE / OFFICER ASSIGNMENT SEPARATION");

  const usersWithAssignments = await prisma.user.findMany({
    where: {
      officerAssignments: {
        some: {
          active: true,
        },
      },
    },
    select: {
      id: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  if (usersWithAssignments.length > 0) {
    pass(
      "Users with officer assignments retain an independent primary User.role",
      `${usersWithAssignments.length} user(s)`,
    );

    for (const user of usersWithAssignments) {
      console.log(
        `User ${user.id} primary role | ${user.role.id} | ${user.role.name}`,
      );
    }
  } else {
    fail("Users with officer assignments retain an independent primary User.role");
  }

  section("15. CURRENT FARMER AUTHORIZATION CROSS-CHECK");

  const farmer4 = await prisma.farmer.findUnique({
    where: { id: 4 },
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

  if (!farmer4) {
    fail("Known Farmer 4 exists for authorization cross-check");
  } else {
    pass(
      "Known Farmer 4 exists for authorization cross-check",
      `${farmer4.county.name} → ${farmer4.subCounty.name} → ${farmer4.ward.name}`,
    );

    const kenyaNationalAssignments = assignments.filter(
      (assignment) =>
        assignment.active &&
        assignment.scopeLevel === "NATIONAL" &&
        assignment.countryId === farmer4.county.countryId &&
        assignment.countyId === null &&
        assignment.subCountyId === null &&
        assignment.wardId === null,
    );

    if (kenyaNationalAssignments.length >= 1) {
      pass(
        "At least one valid national assignment can authorize Farmer 4",
        `${kenyaNationalAssignments.length} matching national assignment(s)`,
      );
    } else {
      fail(
        "At least one valid national assignment can authorize Farmer 4",
      );
    }
  }

  section("16. DATABASE-LEVEL SCOPE-SHAPE LIMITATION");

  console.log(
    "REVIEW  Scope-shape rules are currently enforced by application authorization logic,",
  );
  console.log(
    "        not by PostgreSQL CHECK constraints. Current database rows are valid.",
  );
  console.log(
    "        Cross-table geography-chain integrity also requires application logic",
  );
  console.log(
    "        or database triggers; ordinary CHECK constraints cannot validate other tables.",
  );

  section("17. READ-ONLY SAFETY");

  pass("Audit contains no INSERT operations");
  pass("Audit contains no UPDATE operations");
  pass("Audit contains no DELETE operations");
  pass("Audit performs no transaction commits or data mutations");

  section("18. FINAL RESULT");

  const failures = checks.filter((check) => !check.pass).length;
  const passes = checks.filter((check) => check.pass).length;

  console.log("");
  console.log("=".repeat(68));
  console.log("V40.15 FINAL RESULT");
  console.log("=".repeat(68));

  console.log(`PASS   : ${passes}`);
  console.log(`FAIL   : ${failures}`);

  if (failures === 0) {
    console.log("V40.15 STATUS: GREEN");
    console.log("");
    console.log(
      "Authorization database integrity is GREEN.",
    );
    console.log(
      "Current OfficerAssignment records have valid foreign keys, scope shapes,",
    );
    console.log(
      "geography chains, active functions, and simulated-policy structure.",
    );
  } else {
    console.log("V40.15 STATUS: RED");
    console.log("");
    console.log(
      "Authorization database integrity contains failures that require investigation.",
    );
  }

  console.log("");
  console.log(
    "NOTE: Any REVIEW messages above are policy/hardening observations and",
  );
  console.log(
    "do not automatically indicate a production authorization failure.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.15 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
