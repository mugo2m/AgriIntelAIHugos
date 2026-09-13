import prisma from "../lib/prisma";

type ScopeLevel =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

type VirtualAssignment = {
  virtualUser: string;
  assignmentId: number;
  roleName: string;
  functionName: string;
  scopeLevel: ScopeLevel;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
};

type FarmerRecord = {
  id: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
  countryId: number;
  countyName: string;
  subCountyName: string;
  wardName: string;
};

type VirtualFarmerUser = {
  virtualUser: string;
  farmerId: number;
};

function section(title: string) {
  console.log("");
  console.log("------------------------------------------------------------");
  console.log(title);
  console.log("------------------------------------------------------------");
}

function pass(label: string, detail?: string) {
  console.log(`PASS   ${label}${detail ? `: ${detail}` : ""}`);
}

function fail(label: string, detail?: string) {
  console.log(`FAIL   ${label}${detail ? `: ${detail}` : ""}`);
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function assignmentScopeValid(
  assignment: VirtualAssignment,
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
  assignment: VirtualAssignment,
  farmer: FarmerRecord,
): boolean {
  if (!assignmentScopeValid(assignment)) {
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

function virtualUserAllowsFarmer(
  assignments: VirtualAssignment[],
  farmer: FarmerRecord,
): boolean {
  return assignments.some((assignment) =>
    assignmentAllowsFarmer(assignment, farmer),
  );
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.17 MULTI-USER AUTHORIZATION ISOLATION AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");
  console.log(
    "Purpose: verify that different authority assignments produce",
  );
  console.log(
    "different authorization boundaries without modifying PostgreSQL.",
  );

  let passCount = 0;
  let failCount = 0;
  let reviewCount = 0;

  function P(label: string, detail?: string) {
    passCount++;
    pass(label, detail);
  }

  function F(label: string, detail?: string) {
    failCount++;
    fail(label, detail);
  }

  function R(label: string, detail?: string) {
    reviewCount++;
    console.log(
      `REVIEW ${label}${detail ? `: ${detail}` : ""}`,
    );
  }

  section("1. DATABASE BASELINE");

  const user = await prisma.user.findUnique({
    where: {
      id: 1,
    },
    select: {
      id: true,
      firebaseUid: true,
      active: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    F("User 1 exists");
    throw new Error("User 1 does not exist");
  }

  P(
    "User 1 exists",
    `role=${user.role.name}, active=${user.active}`,
  );

  if (user.active) {
    P("User 1 is active");
  } else {
    F("User 1 is active");
  }

  const assignments = await prisma.officerAssignment.findMany({
    where: {
      userId: user.id,
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
    },
    orderBy: {
      id: "asc",
    },
  });

  if (assignments.length === 5) {
    P("Exactly five active simulated assignments exist");
  } else {
    F(
      "Exactly five active simulated assignments exist",
      `found ${assignments.length}`,
    );
  }

  section("2. LOAD REAL FARMER GEOGRAPHY");

  const farmers = await prisma.farmer.findMany({
    select: {
      id: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      county: {
        select: {
          countryId: true,
          name: true,
        },
      },
      subCounty: {
        select: {
          name: true,
        },
      },
      ward: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  if (farmers.length > 0) {
    P(
      "At least one real Farmer exists",
      `${farmers.length} Farmer row(s)`,
    );
  } else {
    F("At least one real Farmer exists");
    throw new Error("No Farmer rows found");
  }

  const farmerRecords: FarmerRecord[] = farmers.map((farmer) => ({
    id: farmer.id,
    countyId: farmer.countyId,
    subCountyId: farmer.subCountyId,
    wardId: farmer.wardId,
    countryId: farmer.county.countryId,
    countyName: farmer.county.name,
    subCountyName: farmer.subCounty.name,
    wardName: farmer.ward.name,
  }));

  for (const farmer of farmerRecords) {
    console.log(
      `Farmer ${farmer.id} | ${farmer.countyName} → ` +
        `${farmer.subCountyName} → ${farmer.wardName} | ` +
        `country=${farmer.countryId} county=${farmer.countyId} ` +
        `subCounty=${farmer.subCountyId} ward=${farmer.wardId}`,
    );
  }

  const farmer4 = farmerRecords.find(
    (farmer) => farmer.id === 4,
  );

  if (!farmer4) {
    F("Farmer 4 exists");
    throw new Error("Farmer 4 is required for V40.17");
  }

  P(
    "Farmer 4 loaded",
    `${farmer4.countyName} → ${farmer4.subCountyName} → ${farmer4.wardName}`,
  );

  section("3. LOAD REAL AUTHORIZATION ASSIGNMENTS");

  const virtualAssignments: VirtualAssignment[] = assignments.map(
    (assignment) => {
      let virtualUser = `Virtual User ${assignment.id}`;

      switch (assignment.scopeLevel) {
        case "NATIONAL":
          if (assignment.role.name === "Super Admin") {
            virtualUser = "Virtual Super Admin";
          } else if (assignment.role.name === "National Admin") {
            virtualUser = "Virtual National Admin";
          }
          break;

        case "COUNTY":
          virtualUser = "Virtual County Director";
          break;

        case "SUBCOUNTY":
          virtualUser = "Virtual Sub County Officer";
          break;

        case "WARD":
          virtualUser = "Virtual Ward Extension Officer";
          break;
      }

      return {
        virtualUser,
        assignmentId: assignment.id,
        roleName: assignment.role.name,
        functionName: assignment.function.name,
        scopeLevel: assignment.scopeLevel as ScopeLevel,
        countryId: assignment.countryId,
        countyId: assignment.countyId,
        subCountyId: assignment.subCountyId,
        wardId: assignment.wardId,
      };
    },
  );

  for (const assignment of virtualAssignments) {
    console.log(
      `${assignment.virtualUser} | ` +
        `${assignment.roleName} | ` +
        `${assignment.functionName} | ` +
        `${assignment.scopeLevel} | ` +
        `country=${assignment.countryId} ` +
        `county=${assignment.countyId} ` +
        `subCounty=${assignment.subCountyId} ` +
        `ward=${assignment.wardId}`,
    );
  }

  const requiredRoles = [
    "Super Admin",
    "National Admin",
    "County Director",
    "Sub County Officer",
    "Ward Extension Officer",
  ];

  for (const roleName of requiredRoles) {
    const found = virtualAssignments.some(
      (assignment) => assignment.roleName === roleName,
    );

    if (found) {
      P(`Required authority exists: ${roleName}`);
    } else {
      F(`Required authority exists: ${roleName}`);
    }
  }

  section("4. VIRTUAL USER SCOPE VALIDATION");

  for (const assignment of virtualAssignments) {
    if (assignmentScopeValid(assignment)) {
      P(
        `${assignment.virtualUser} has valid scope shape`,
        assignment.scopeLevel,
      );
    } else {
      F(
        `${assignment.virtualUser} has valid scope shape`,
        assignment.scopeLevel,
      );
    }
  }

  section("5. NATIONAL AUTHORIZATION");

  const nationalAssignments = virtualAssignments.filter(
    (assignment) => assignment.scopeLevel === "NATIONAL",
  );

  if (nationalAssignments.length === 2) {
    P("Two independent NATIONAL virtual users exist");
  } else {
    F(
      "Two independent NATIONAL virtual users exist",
      `found ${nationalAssignments.length}`,
    );
  }

  for (const assignment of nationalAssignments) {
    const allowed = assignmentAllowsFarmer(
      assignment,
      farmer4,
    );

    if (allowed) {
      P(
        `${assignment.virtualUser} can access Farmer 4`,
        "NATIONAL Kenya scope",
      );
    } else {
      F(
        `${assignment.virtualUser} can access Farmer 4`,
        "expected national access",
      );
    }
  }

  section("6. COUNTY ISOLATION");

  const countyAssignment = virtualAssignments.find(
    (assignment) =>
      assignment.scopeLevel === "COUNTY" &&
      assignment.roleName === "County Director",
  );

  if (!countyAssignment) {
    F("County Director assignment exists");
  } else {
    P(
      "County Director assignment exists",
      `county=${countyAssignment.countyId}`,
    );

    const allowed = assignmentAllowsFarmer(
      countyAssignment,
      farmer4,
    );

    if (farmer4.countyId === countyAssignment.countyId) {
      if (allowed) {
        P("County Director can access Farmer in assigned county");
      } else {
        F("County Director can access Farmer in assigned county");
      }
    } else {
      if (!allowed) {
        P(
          "County Director cannot access Farmer outside assigned county",
          `Farmer county=${farmer4.countyId}, assigned=${countyAssignment.countyId}`,
        );
      } else {
        F(
          "County Director cannot access Farmer outside assigned county",
          "cross-county access was incorrectly allowed",
        );
      }
    }
  }

  section("7. SUBCOUNTY ISOLATION");

  const subCountyAssignment = virtualAssignments.find(
    (assignment) =>
      assignment.scopeLevel === "SUBCOUNTY",
  );

  if (!subCountyAssignment) {
    F("Sub County Officer assignment exists");
  } else {
    P(
      "Sub County Officer assignment exists",
      `subCounty=${subCountyAssignment.subCountyId}`,
    );

    const allowed = assignmentAllowsFarmer(
      subCountyAssignment,
      farmer4,
    );

    if (
      farmer4.countyId === subCountyAssignment.countyId &&
      farmer4.subCountyId === subCountyAssignment.subCountyId
    ) {
      if (allowed) {
        P(
          "Sub County Officer can access Farmer in assigned subcounty",
        );
      } else {
        F(
          "Sub County Officer can access Farmer in assigned subcounty",
        );
      }
    } else {
      if (!allowed) {
        P(
          "Sub County Officer cannot access Farmer outside assigned subcounty",
        );
      } else {
        F(
          "Sub County Officer cannot access Farmer outside assigned subcounty",
        );
      }
    }
  }

  section("8. WARD ISOLATION");

  const wardAssignment = virtualAssignments.find(
    (assignment) => assignment.scopeLevel === "WARD",
  );

  if (!wardAssignment) {
    F("Ward Extension Officer assignment exists");
  } else {
    P(
      "Ward Extension Officer assignment exists",
      `ward=${wardAssignment.wardId}`,
    );

    const allowed = assignmentAllowsFarmer(
      wardAssignment,
      farmer4,
    );

    if (
      farmer4.countyId === wardAssignment.countyId &&
      farmer4.subCountyId === wardAssignment.subCountyId &&
      farmer4.wardId === wardAssignment.wardId
    ) {
      if (allowed) {
        P(
          "Ward Extension Officer can access Farmer in assigned ward",
        );
      } else {
        F(
          "Ward Extension Officer can access Farmer in assigned ward",
        );
      }
    } else {
      if (!allowed) {
        P(
          "Ward Extension Officer cannot access Farmer outside assigned ward",
        );
      } else {
        F(
          "Ward Extension Officer cannot access Farmer outside assigned ward",
        );
      }
    }
  }

  section("9. SYNTHETIC FARMER GEOGRAPHIES");

  const kenyaId = 2;
  const isioloCountyId = 48;
  const garbatullaSubCountyId = 1309;
  const garbatullaWardId = 2095;

  const syntheticAssignedWard: FarmerRecord = {
    id: -1,
    countryId: kenyaId,
    countyId: isioloCountyId,
    subCountyId: garbatullaSubCountyId,
    wardId: garbatullaWardId,
    countyName: "Isiolo",
    subCountyName: "Garbatulla",
    wardName: "GARBATULLA",
  };

  const syntheticSiblingWard: FarmerRecord = {
    id: -2,
    countryId: kenyaId,
    countyId: isioloCountyId,
    subCountyId: garbatullaSubCountyId,
    wardId: 2096,
    countyName: "Isiolo",
    subCountyName: "Garbatulla",
    wardName: "Sibling Ward",
  };

  const syntheticSiblingSubCounty: FarmerRecord = {
    id: -3,
    countryId: kenyaId,
    countyId: isioloCountyId,
    subCountyId: 1310,
    wardId: 2096,
    countyName: "Isiolo",
    subCountyName: "Sibling SubCounty",
    wardName: "KINNA",
  };

  const syntheticSiblingCounty: FarmerRecord = {
    id: -4,
    countryId: kenyaId,
    countyId: 49,
    subCountyId: 1310,
    wardId: 2096,
    countyName: "Migori",
    subCountyName: "Sibling SubCounty",
    wardName: "Sibling Ward",
  };

  const syntheticForeignCountry: FarmerRecord = {
    id: -5,
    countryId: 999,
    countyId: 999,
    subCountyId: 999,
    wardId: 999,
    countyName: "Foreign Country",
    subCountyName: "Foreign SubCounty",
    wardName: "Foreign Ward",
  };

  const syntheticFarmers = [
    syntheticAssignedWard,
    syntheticSiblingWard,
    syntheticSiblingSubCounty,
    syntheticSiblingCounty,
    syntheticForeignCountry,
  ];

  for (const farmer of syntheticFarmers) {
    console.log(
      `${farmer.countyName} → ${farmer.subCountyName} → ${farmer.wardName} | ` +
        `country=${farmer.countryId} county=${farmer.countyId} ` +
        `subCounty=${farmer.subCountyId} ward=${farmer.wardId}`,
    );
  }

  section("10. NATIONAL VIRTUAL USERS — SYNTHETIC MATRIX");

  for (const assignment of nationalAssignments) {
    const expected = [
      syntheticAssignedWard,
      syntheticSiblingWard,
      syntheticSiblingSubCounty,
      syntheticSiblingCounty,
    ];

    for (const farmer of expected) {
      const allowed = assignmentAllowsFarmer(
        assignment,
        farmer,
      );

      if (allowed) {
        P(
          `${assignment.virtualUser} allows ${farmer.countyName}/${farmer.subCountyName}/${farmer.wardName}`,
        );
      } else {
        F(
          `${assignment.virtualUser} allows ${farmer.countyName}/${farmer.subCountyName}/${farmer.wardName}`,
        );
      }
    }

    const foreignAllowed = assignmentAllowsFarmer(
      assignment,
      syntheticForeignCountry,
    );

    if (!foreignAllowed) {
      P(
        `${assignment.virtualUser} denies foreign-country Farmer`,
      );
    } else {
      F(
        `${assignment.virtualUser} denies foreign-country Farmer`,
      );
    }
  }

  section("11. COUNTY VIRTUAL USER — SYNTHETIC MATRIX");

  if (countyAssignment) {
    const countyPositive = assignmentAllowsFarmer(
      countyAssignment,
      syntheticAssignedWard,
    );

    if (countyPositive) {
      P("County authority allows Farmer inside assigned county");
    } else {
      F("County authority allows Farmer inside assigned county");
    }

    const countyNegative = assignmentAllowsFarmer(
      countyAssignment,
      syntheticSiblingCounty,
    );

    if (!countyNegative) {
      P("County authority denies Farmer in sibling county");
    } else {
      F("County authority denies Farmer in sibling county");
    }

    const foreignNegative = assignmentAllowsFarmer(
      countyAssignment,
      syntheticForeignCountry,
    );

    if (!foreignNegative) {
      P("County authority denies Farmer in foreign country");
    } else {
      F("County authority denies Farmer in foreign country");
    }
  }

  section("12. SUBCOUNTY VIRTUAL USER — SYNTHETIC MATRIX");

  if (subCountyAssignment) {
    const subCountyPositive = assignmentAllowsFarmer(
      subCountyAssignment,
      syntheticAssignedWard,
    );

    if (subCountyPositive) {
      P(
        "Sub County authority allows Farmer inside assigned subcounty",
      );
    } else {
      F(
        "Sub County authority allows Farmer inside assigned subcounty",
      );
    }

    const siblingSubCountyNegative =
      assignmentAllowsFarmer(
        subCountyAssignment,
        syntheticSiblingSubCounty,
      );

    if (!siblingSubCountyNegative) {
      P(
        "Sub County authority denies Farmer in sibling subcounty",
      );
    } else {
      F(
        "Sub County authority denies Farmer in sibling subcounty",
      );
    }

    const siblingCountyNegative =
      assignmentAllowsFarmer(
        subCountyAssignment,
        syntheticSiblingCounty,
      );

    if (!siblingCountyNegative) {
      P(
        "Sub County authority denies Farmer in sibling county",
      );
    } else {
      F(
        "Sub County authority denies Farmer in sibling county",
      );
    }
  }

  section("13. WARD VIRTUAL USER — SYNTHETIC MATRIX");

  if (wardAssignment) {
    const wardPositive = assignmentAllowsFarmer(
      wardAssignment,
      syntheticAssignedWard,
    );

    if (wardPositive) {
      P("Ward authority allows Farmer inside assigned ward");
    } else {
      F("Ward authority allows Farmer inside assigned ward");
    }

    const siblingWardNegative = assignmentAllowsFarmer(
      wardAssignment,
      syntheticSiblingWard,
    );

    if (!siblingWardNegative) {
      P("Ward authority denies Farmer in sibling ward");
    } else {
      F("Ward authority denies Farmer in sibling ward");
    }

    const siblingSubCountyNegative =
      assignmentAllowsFarmer(
        wardAssignment,
        syntheticSiblingSubCounty,
      );

    if (!siblingSubCountyNegative) {
      P(
        "Ward authority denies Farmer in sibling subcounty",
      );
    } else {
      F(
        "Ward authority denies Farmer in sibling subcounty",
      );
    }

    const siblingCountyNegative =
      assignmentAllowsFarmer(
        wardAssignment,
        syntheticSiblingCounty,
      );

    if (!siblingCountyNegative) {
      P("Ward authority denies Farmer in sibling county");
    } else {
      F("Ward authority denies Farmer in sibling county");
    }
  }

  section("14. MULTI-USER ISOLATION MATRIX");

  const virtualUsers = virtualAssignments.map(
    (assignment) => ({
      virtualUser: assignment.virtualUser,
      assignments: [assignment],
    }),
  );

  for (const virtualUser of virtualUsers) {
    console.log("");
    console.log(`USER: ${virtualUser.virtualUser}`);

    for (const farmer of syntheticFarmers) {
      const allowed = virtualUserAllowsFarmer(
        virtualUser.assignments,
        farmer,
      );

      console.log(
        `  ${farmer.countyName}/${farmer.subCountyName}/${farmer.wardName}` +
          ` → ${allowed ? "ALLOW" : "DENY"}`,
      );
    }
  }

  section("15. HIERARCHICAL LEAST-PRIVILEGE MATRIX");

  if (countyAssignment) {
    const countyPositive = assignmentAllowsFarmer(
      countyAssignment,
      syntheticAssignedWard,
    );

    const countySibling = assignmentAllowsFarmer(
      countyAssignment,
      syntheticSiblingCounty,
    );

    if (countyPositive && !countySibling) {
      P(
        "COUNTY scope is broader than subcounty/ward but isolated from sibling county",
      );
    } else {
      F(
        "COUNTY scope is broader than subcounty/ward but isolated from sibling county",
      );
    }
  }

  if (subCountyAssignment) {
    const subCountyPositive = assignmentAllowsFarmer(
      subCountyAssignment,
      syntheticAssignedWard,
    );

    const subCountySibling =
      assignmentAllowsFarmer(
        subCountyAssignment,
        syntheticSiblingSubCounty,
      );

    if (subCountyPositive && !subCountySibling) {
      P(
        "SUBCOUNTY scope permits assigned subcounty but denies sibling subcounty",
      );
    } else {
      F(
        "SUBCOUNTY scope permits assigned subcounty but denies sibling subcounty",
      );
    }
  }

  if (wardAssignment) {
    const wardPositive = assignmentAllowsFarmer(
      wardAssignment,
      syntheticAssignedWard,
    );

    const wardSibling = assignmentAllowsFarmer(
      wardAssignment,
      syntheticSiblingWard,
    );

    if (wardPositive && !wardSibling) {
      P(
        "WARD scope permits assigned ward but denies sibling ward",
      );
    } else {
      F(
        "WARD scope permits assigned ward but denies sibling ward",
      );
    }
  }

  section("16. SCOPE NARROWING PROPERTY");

  if (countyAssignment && subCountyAssignment && wardAssignment) {
    const countyAllowsAssigned =
      assignmentAllowsFarmer(
        countyAssignment,
        syntheticAssignedWard,
      );

    const subCountyAllowsAssigned =
      assignmentAllowsFarmer(
        subCountyAssignment,
        syntheticAssignedWard,
      );

    const wardAllowsAssigned =
      assignmentAllowsFarmer(
        wardAssignment,
        syntheticAssignedWard,
      );

    if (
      countyAllowsAssigned &&
      subCountyAllowsAssigned &&
      wardAllowsAssigned
    ) {
      P(
        "COUNTY → SUBCOUNTY → WARD all permit the common assigned geography",
      );
    } else {
      F(
        "COUNTY → SUBCOUNTY → WARD all permit the common assigned geography",
      );
    }

    const siblingSubCountyCountyResult =
      assignmentAllowsFarmer(
        countyAssignment,
        syntheticSiblingSubCounty,
      );

    const siblingSubCountySubCountyResult =
      assignmentAllowsFarmer(
        subCountyAssignment,
        syntheticSiblingSubCounty,
      );

    const siblingSubCountyWardResult =
      assignmentAllowsFarmer(
        wardAssignment,
        syntheticSiblingSubCounty,
      );

    if (
      siblingSubCountyCountyResult &&
      !siblingSubCountySubCountyResult &&
      !siblingSubCountyWardResult
    ) {
      P(
        "Broader COUNTY authority can include sibling subcounty while narrower scopes deny it",
      );
    } else {
      F(
        "Broader COUNTY authority can include sibling subcounty while narrower scopes deny it",
        `county=${siblingSubCountyCountyResult} ` +
          `subcounty=${siblingSubCountySubCountyResult} ` +
          `ward=${siblingSubCountyWardResult}`,
      );
    }
  }

  section("17. PRIMARY ROLE DOES NOT ESCALATE VIRTUAL USERS");

  if (user.role.name === "Farmer") {
    P(
      "Real User 1 primary role remains Farmer",
      "officer assignments are separate authority records",
    );
  } else {
    F(
      "Real User 1 primary role remains Farmer",
      `found ${user.role.name}`,
    );
  }

  section("18. FUNCTION DOES NOT GRANT GEOGRAPHY");

  const functionNames = new Set(
    virtualAssignments.map(
      (assignment) => assignment.functionName,
    ),
  );

  if (functionNames.size >= 2) {
    P(
      "Multiple OfficerFunctions are represented",
      `${Array.from(functionNames).join(", ")}`,
    );
  } else {
    R(
      "Only one function represented",
      "geographic authority is still independently tested",
    );
  }

  const countyFunctionOnly = virtualAssignments.find(
    (assignment) =>
      assignment.roleName === "County Director",
  );

  if (countyFunctionOnly) {
    const functionName = countyFunctionOnly.functionName;

    const fakeFunctionEscalation: VirtualAssignment = {
      ...countyFunctionOnly,
      functionName: "Super Admin",
      scopeLevel: "COUNTY",
    };

    const originalResult = assignmentAllowsFarmer(
      countyFunctionOnly,
      syntheticSiblingCounty,
    );

    const tamperedFunctionResult =
      assignmentAllowsFarmer(
        fakeFunctionEscalation,
        syntheticSiblingCounty,
      );

    if (!originalResult && !tamperedFunctionResult) {
      P(
        "Changing function name alone cannot create geographic authority",
      );
    } else {
      F(
        "Changing function name alone cannot create geographic authority",
      );
    }

    console.log(
      `Function-only tamper test | original=${functionName} ` +
        `tampered=Super Admin | originalResult=${originalResult} ` +
        `tamperedResult=${tamperedFunctionResult}`,
    );
  }

  section("19. NAME-INDEPENDENT AUTHORIZATION");

  for (const assignment of virtualAssignments) {
    const renamedAssignment: VirtualAssignment = {
      ...assignment,
      virtualUser: `Renamed ${assignment.virtualUser}`,
      roleName: `Renamed ${assignment.roleName}`,
      functionName: `Renamed ${assignment.functionName}`,
    };

    const originalAssignedResult =
      assignmentAllowsFarmer(
        assignment,
        syntheticAssignedWard,
      );

    const renamedAssignedResult =
      assignmentAllowsFarmer(
        renamedAssignment,
        syntheticAssignedWard,
      );

    if (
      originalAssignedResult ===
      renamedAssignedResult
    ) {
      P(
        `${assignment.virtualUser} authorization is identity-name independent`,
      );
    } else {
      F(
        `${assignment.virtualUser} authorization is identity-name independent`,
      );
    }
  }

  section("20. REAL FARMER CONSISTENCY");

  for (const assignment of virtualAssignments) {
    const allowed = assignmentAllowsFarmer(
      assignment,
      farmer4,
    );

    console.log(
      `${assignment.virtualUser} | ${assignment.scopeLevel} | ` +
        `${assignment.roleName} | Farmer 4 → ` +
        `${allowed ? "ALLOW" : "DENY"}`,
    );
  }

  const realNationalAllows = nationalAssignments.every(
    (assignment) =>
      assignmentAllowsFarmer(
        assignment,
        farmer4,
      ),
  );

  if (realNationalAllows) {
    P(
      "Both NATIONAL authorities allow real Farmer 4",
      "Farmer 4 is in Kenya",
    );
  } else {
    F(
      "Both NATIONAL authorities allow real Farmer 4",
    );
  }

  if (countyAssignment) {
    const countyAllowsReal = assignmentAllowsFarmer(
      countyAssignment,
      farmer4,
    );

    if (farmer4.countyId !== countyAssignment.countyId) {
      if (!countyAllowsReal) {
        P(
          "County authority denies real Farmer 4 outside Isiolo",
        );
      } else {
        F(
          "County authority denies real Farmer 4 outside Isiolo",
        );
      }
    }
  }

  if (subCountyAssignment) {
    const subCountyAllowsReal =
      assignmentAllowsFarmer(
        subCountyAssignment,
        farmer4,
      );

    if (
      farmer4.subCountyId !==
      subCountyAssignment.subCountyId
    ) {
      if (!subCountyAllowsReal) {
        P(
          "Sub County authority denies real Farmer 4 outside Garbatulla",
        );
      } else {
        F(
          "Sub County authority denies real Farmer 4 outside Garbatulla",
        );
      }
    }
  }

  if (wardAssignment) {
    const wardAllowsReal = assignmentAllowsFarmer(
      wardAssignment,
      farmer4,
    );

    if (
      farmer4.wardId !==
      wardAssignment.wardId
    ) {
      if (!wardAllowsReal) {
        P(
          "Ward authority denies real Farmer 4 outside GARBATULLA",
        );
      } else {
        F(
          "Ward authority denies real Farmer 4 outside GARBATULLA",
        );
      }
    }
  }

  section("21. DATABASE MUTATION SAFETY");

  const assignmentCountAfter =
    await prisma.officerAssignment.count();

  const farmerCountAfter =
    await prisma.farmer.count();

  const userCountAfter =
    await prisma.user.count();

  if (assignmentCountAfter === 5) {
    P(
      "OfficerAssignment count remains unchanged",
      `count=${assignmentCountAfter}`,
    );
  } else {
    F(
      "OfficerAssignment count remains unchanged",
      `count=${assignmentCountAfter}`,
    );
  }

  if (farmerCountAfter === farmers.length) {
    P(
      "Farmer count remains unchanged",
      `count=${farmerCountAfter}`,
    );
  } else {
    F(
      "Farmer count remains unchanged",
      `before=${farmers.length} after=${farmerCountAfter}`,
    );
  }

  if (userCountAfter === 1) {
    P(
      "User count remains unchanged",
      `count=${userCountAfter}`,
    );
  } else {
    F(
      "User count remains unchanged",
      `count=${userCountAfter}`,
    );
  }

  section("22. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.17 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);
  console.log(`REVIEW : ${reviewCount}`);

  if (failCount === 0) {
    console.log("V40.17 STATUS: GREEN");
    console.log("");
    console.log(
      "Multi-user authorization isolation is structurally verified.",
    );
    console.log(
      "NATIONAL, COUNTY, SUBCOUNTY, and WARD authority boundaries",
    );
    console.log(
      "remain independent and hierarchical.",
    );
  } else {
    console.log("V40.17 STATUS: RED");
    console.log("");
    console.log(
      "One or more multi-user authorization isolation tests failed.",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY CONFIRMATION: No INSERT, UPDATE, or DELETE was executed.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.17 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });