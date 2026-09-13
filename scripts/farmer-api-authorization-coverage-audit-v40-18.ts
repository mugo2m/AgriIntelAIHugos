import fs from "fs";
import path from "path";

import prisma from "../lib/prisma";

type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RouteFinding = {
  routeFile: string;
  relativePath: string;
  methods: RouteMethod[];
  farmerReference: boolean;
  farmReference: boolean;
  farmerCollectionAuthorization: boolean;
  singleFarmerAuthorization: boolean;
  authentication: boolean;
  prismaFarmerRead: boolean;
  prismaFarmerWrite: boolean;
  prismaFarmRead: boolean;
  prismaFarmWrite: boolean;
  suspiciousClientAuthorization: string[];
};

const METHODS: RouteMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

const FARMER_TERMS = [
  "prisma.farmer",
  "farmer.find",
  "farmer.create",
  "farmer.update",
  "farmer.delete",
  "farmer.deleteMany",
  "farmer.updateMany",
  "/api/farmers",
  "farmerId",
  "farmer.id",
];

const FARM_TERMS = [
  "prisma.farm",
  "farm.find",
  "farm.create",
  "farm.update",
  "farm.delete",
  "farm.deleteMany",
  "farm.updateMany",
  "farmId",
];

const AUTHENTICATION_TERMS = [
  "getCurrentUser",
  "getServerSession",
  "auth(",
  "requireAuth",
  "requireAuthentication",
  "verifySession",
  "verifyIdToken",
  "sessionCookie",
  "firebaseUid",
  "cookies(",
];

const COLLECTION_AUTH_TERMS = [
  "getAuthorizedFarmerWhere",
  "getFarmerCollectionAuthorization",
  "canAccessFarmerCollection",
  "getAuthorizedFarmerWhereOrThrow",
];

const SINGLE_FARMER_AUTH_TERMS = [
  "authorizeFarmerAccess",
  "canAccessFarmer",
];

const SUSPICIOUS_AUTH_TERMS = [
  'searchParams.get("role")',
  "searchParams.get('role')",
  'searchParams.get("scope")',
  "searchParams.get('scope')",
  'searchParams.get("scopeLevel")',
  "searchParams.get('scopeLevel')",
  'searchParams.get("countyId")',
  "searchParams.get('searchParams.get(\"countyId\")')",
  'searchParams.get("subCountyId")',
  "searchParams.get('subCountyId')",
  'searchParams.get("wardId")',
  "searchParams.get('wardId')",
  'searchParams.get("roleId")',
  "searchParams.get('roleId')",
  "allowedCollectionRoles",
  "req.query.role",
  "req.query.scope",
  "req.query.scopeLevel",
];

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

function review(label: string, detail?: string) {
  console.log(`REVIEW ${label}${detail ? `: ${detail}` : ""}`);
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function containsAny(
  source: string,
  terms: string[],
): boolean {
  return terms.some((term) => source.includes(term));
}

function collectTerms(
  source: string,
  terms: string[],
): string[] {
  return terms.filter((term) => source.includes(term));
}

function detectMethods(source: string): RouteMethod[] {
  const found: RouteMethod[] = [];

  for (const method of METHODS) {
    const patterns = [
      new RegExp(
        `export\\s+(?:async\\s+)?function\\s+${method}\\b`,
        "m",
      ),
      new RegExp(
        `export\\s+const\\s+${method}\\s*=`,
        "m",
      ),
    ];

    if (patterns.some((pattern) => pattern.test(source))) {
      found.push(method);
    }
  }

  return found;
}

function classifyFarmerRead(
  source: string,
): boolean {
  return (
    source.includes("prisma.farmer.findMany") ||
    source.includes("prisma.farmer.findFirst") ||
    source.includes("prisma.farmer.findUnique") ||
    source.includes("prisma.farmer.count") ||
    source.includes("prisma.farmer.aggregate") ||
    source.includes("prisma.farmer.groupBy")
  );
}

function classifyFarmerWrite(
  source: string,
): boolean {
  return (
    source.includes("prisma.farmer.create") ||
    source.includes("prisma.farmer.createMany") ||
    source.includes("prisma.farmer.update") ||
    source.includes("prisma.farmer.updateMany") ||
    source.includes("prisma.farmer.delete") ||
    source.includes("prisma.farmer.deleteMany") ||
    source.includes("prisma.farmer.upsert")
  );
}

function classifyFarmRead(
  source: string,
): boolean {
  return (
    source.includes("prisma.farm.findMany") ||
    source.includes("prisma.farm.findFirst") ||
    source.includes("prisma.farm.findUnique") ||
    source.includes("prisma.farm.count") ||
    source.includes("prisma.farm.aggregate") ||
    source.includes("prisma.farm.groupBy")
  );
}

function classifyFarmWrite(
  source: string,
): boolean {
  return (
    source.includes("prisma.farm.create") ||
    source.includes("prisma.farm.createMany") ||
    source.includes("prisma.farm.update") ||
    source.includes("prisma.farm.updateMany") ||
    source.includes("prisma.farm.delete") ||
    source.includes("prisma.farm.deleteMany") ||
    source.includes("prisma.farm.upsert")
  );
}

function scanRouteFile(
  routeFile: string,
  root: string,
): RouteFinding {
  const rawSource = fs.readFileSync(routeFile, "utf8");
  const source = normalize(rawSource);

  const relativePath = path.relative(
    root,
    routeFile,
  );

  const methods = detectMethods(source);

  const farmerReference = containsAny(
    source,
    FARMER_TERMS,
  );

  const farmReference = containsAny(
    source,
    FARM_TERMS,
  );

  const farmerCollectionAuthorization =
    containsAny(
      source,
      COLLECTION_AUTH_TERMS,
    );

  const singleFarmerAuthorization =
    containsAny(
      source,
      SINGLE_FARMER_AUTH_TERMS,
    );

  const authentication = containsAny(
    source,
    AUTHENTICATION_TERMS,
  );

  const prismaFarmerRead =
    classifyFarmerRead(source);

  const prismaFarmerWrite =
    classifyFarmerWrite(source);

  const prismaFarmRead =
    classifyFarmRead(source);

  const prismaFarmWrite =
    classifyFarmWrite(source);

  const suspiciousClientAuthorization =
    collectTerms(
      source,
      SUSPICIOUS_AUTH_TERMS,
    );

  return {
    routeFile,
    relativePath,
    methods,
    farmerReference,
    farmReference,
    farmerCollectionAuthorization,
    singleFarmerAuthorization,
    authentication,
    prismaFarmerRead,
    prismaFarmerWrite,
    prismaFarmRead,
    prismaFarmWrite,
    suspiciousClientAuthorization,
  };
}

function findRouteFiles(
  apiRoot: string,
): string[] {
  if (!fs.existsSync(apiRoot)) {
    return [];
  }

  const results: string[] = [];

  function walk(directory: string) {
    const entries = fs.readdirSync(
      directory,
      { withFileTypes: true },
    );

    for (const entry of entries) {
      const fullPath = path.join(
        directory,
        entry.name,
      );

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name === "route.ts"
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(apiRoot);

  return results.sort();
}

function hasWriteMethod(
  methods: RouteMethod[],
): boolean {
  return methods.some((method) =>
    ["POST", "PUT", "PATCH", "DELETE"].includes(
      method,
    ),
  );
}

function formatBoolean(
  value: boolean,
): string {
  return value ? "YES" : "NO";
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.18 FARMER/FARM API AUTHORIZATION COVERAGE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: SOURCE SCAN + DATABASE BASELINE");
  console.log("");

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
    review(label, detail);
  }

  const projectRoot = process.cwd();
  const apiRoot = path.join(
    projectRoot,
    "app",
    "api",
  );

  console.log(`Project root: ${projectRoot}`);
  console.log(`API root: ${apiRoot}`);

  section("1. DATABASE BASELINE");

  const dbUser = await prisma.user.findUnique({
    where: {
      id: 1,
    },
    select: {
      id: true,
      active: true,
      firebaseUid: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (dbUser) {
    P(
      "Reference User 1 exists",
      `role=${dbUser.role.name}, active=${dbUser.active}`,
    );
  } else {
    F("Reference User 1 exists");
  }

  const farmerCount =
    await prisma.farmer.count();

  const farmCount =
    await prisma.farm.count();

  const assignmentCount =
    await prisma.officerAssignment.count();

  console.log(`Farmers: ${farmerCount}`);
  console.log(`Farms: ${farmCount}`);
  console.log(
    `OfficerAssignments: ${assignmentCount}`,
  );

  if (farmerCount >= 1) {
    P("Farmer table is populated");
  } else {
    R(
      "Farmer table is empty",
      "coverage scan can continue from source analysis",
    );
  }

  if (assignmentCount === 5) {
    P(
      "Expected five simulated OfficerAssignments exist",
    );
  } else {
    R(
      "OfficerAssignment count differs from V40 baseline",
      `found ${assignmentCount}`,
    );
  }

  section("2. API ROUTE DISCOVERY");

  const routeFiles = findRouteFiles(
    apiRoot,
  );

  console.log(
    `Discovered route.ts files: ${routeFiles.length}`,
  );

  if (routeFiles.length > 0) {
    P(
      "Next.js API route tree is discoverable",
      `${routeFiles.length} route(s)`,
    );
  } else {
    F(
      "Next.js API route tree is discoverable",
      "no route.ts files found",
    );
  }

  const findings: RouteFinding[] =
    routeFiles.map((routeFile) =>
      scanRouteFile(
        routeFile,
        projectRoot,
      ),
    );

  section("3. ALL FARMER/FARM-RELATED ROUTES");

  const relevantRoutes =
    findings.filter(
      (finding) =>
        finding.farmerReference ||
        finding.farmReference ||
        finding.relativePath
          .toLowerCase()
          .includes("farmer") ||
        finding.relativePath
          .toLowerCase()
          .includes("farm"),
    );

  if (relevantRoutes.length === 0) {
    R(
      "Farmer/Farm-related API routes discovered",
      "none detected by source scanner",
    );
  } else {
    P(
      "Farmer/Farm-related API routes discovered",
      `${relevantRoutes.length} route(s)`,
    );
  }

  for (const finding of relevantRoutes) {
    console.log("");
    console.log(
      `ROUTE: ${finding.relativePath}`,
    );
    console.log(
      `METHODS: ${
        finding.methods.join(", ") ||
        "(none detected)"
      }`,
    );
    console.log(
      `Farmer reference: ${formatBoolean(
        finding.farmerReference,
      )}`,
    );
    console.log(
      `Farm reference: ${formatBoolean(
        finding.farmReference,
      )}`,
    );
    console.log(
      `Authentication: ${formatBoolean(
        finding.authentication,
      )}`,
    );
    console.log(
      `Collection authorization: ${formatBoolean(
        finding.farmerCollectionAuthorization,
      )}`,
    );
    console.log(
      `Single-Farmer authorization: ${formatBoolean(
        finding.singleFarmerAuthorization,
      )}`,
    );
    console.log(
      `Farmer read: ${formatBoolean(
        finding.prismaFarmerRead,
      )}`,
    );
    console.log(
      `Farmer write: ${formatBoolean(
        finding.prismaFarmerWrite,
      )}`,
    );
    console.log(
      `Farm read: ${formatBoolean(
        finding.prismaFarmRead,
      )}`,
    );
    console.log(
      `Farm write: ${formatBoolean(
        finding.prismaFarmWrite,
      )}`,
    );

    if (
      finding.suspiciousClientAuthorization.length >
      0
    ) {
      console.log(
        `Suspicious authorization parameters: ${finding.suspiciousClientAuthorization.join(
          ", ",
        )}`,
      );
    }
  }

  section("4. /api/farmers ROUTE COVERAGE");

  const farmersRoute = findings.find(
    (finding) =>
      finding.relativePath ===
      path.join(
        "app",
        "api",
        "farmers",
        "route.ts",
      ),
  );

  if (!farmersRoute) {
    F(
      "Primary /api/farmers route exists",
    );
  } else {
    P(
      "Primary /api/farmers route exists",
    );

    if (farmersRoute.authentication) {
      P(
        "/api/farmers performs authentication",
      );
    } else {
      F(
        "/api/farmers performs authentication",
      );
    }

    if (
      farmersRoute.farmerCollectionAuthorization
    ) {
      P(
        "/api/farmers uses collection authorization",
      );
    } else {
      F(
        "/api/farmers uses collection authorization",
      );
    }

    if (
      farmersRoute.prismaFarmerRead
    ) {
      P(
        "/api/farmers reads Farmer through Prisma",
      );
    } else {
      F(
        "/api/farmers reads Farmer through Prisma",
      );
    }

    if (
      farmersRoute.suspiciousClientAuthorization
        .length === 0
    ) {
      P(
        "/api/farmers has no known client authorization override",
      );
    } else {
      F(
        "/api/farmers has no known client authorization override",
        farmersRoute.suspiciousClientAuthorization.join(
          ", ",
        ),
      );
    }
  }

  section("5. WRITE ROUTE COVERAGE");

  const farmerWriteRoutes =
    relevantRoutes.filter(
      (finding) =>
        finding.prismaFarmerWrite ||
        finding.prismaFarmWrite ||
        hasWriteMethod(finding.methods),
    );

  console.log(
    `Potential write routes: ${farmerWriteRoutes.length}`,
  );

  if (farmerWriteRoutes.length === 0) {
    R(
      "Farmer/Farm write routes discovered",
      "none detected",
    );
  } else {
    P(
      "Farmer/Farm write routes discovered",
      `${farmerWriteRoutes.length} route(s)`,
    );
  }

  for (const finding of farmerWriteRoutes) {
    const writesFarmerOrFarm =
      finding.prismaFarmerWrite ||
      finding.prismaFarmWrite;

    if (!writesFarmerOrFarm) {
      continue;
    }

    if (!finding.authentication) {
      F(
        `Write route is authenticated: ${finding.relativePath}`,
      );
    } else {
      P(
        `Write route is authenticated: ${finding.relativePath}`,
      );
    }

    if (
      finding.singleFarmerAuthorization ||
      finding.farmerCollectionAuthorization
    ) {
      P(
        `Write route has recognizable Farmer authorization: ${finding.relativePath}`,
      );
    } else {
      R(
        `Write route requires manual authorization review: ${finding.relativePath}`,
        "no known Farmer authorization helper detected",
      );
    }
  }

  section("6. SINGLE-FARMER ROUTE COVERAGE");

  const singleRecordRoutes =
    relevantRoutes.filter(
      (finding) =>
        finding.singleFarmerAuthorization,
    );

  if (singleRecordRoutes.length > 0) {
    P(
      "Single-Farmer authorization helper is used",
      `${singleRecordRoutes.length} route(s)`,
    );
  } else {
    R(
      "Single-Farmer authorization helper is not detected",
      "manual review required for record-level routes",
    );
  }

  for (const finding of relevantRoutes) {
    if (
      !finding.singleFarmerAuthorization
    ) {
      continue;
    }

    if (finding.authentication) {
      P(
        `Single-Farmer route is authenticated: ${finding.relativePath}`,
      );
    } else {
      F(
        `Single-Farmer route is authenticated: ${finding.relativePath}`,
      );
    }
  }

  section("7. FARM ROUTE COVERAGE");

  const farmRoutes =
    relevantRoutes.filter(
      (finding) => finding.farmReference,
    );

  if (farmRoutes.length > 0) {
    P(
      "Farm-related API routes discovered",
      `${farmRoutes.length} route(s)`,
    );
  } else {
    R(
      "Farm-related API routes discovered",
      "none detected",
    );
  }

  for (const finding of farmRoutes) {
    console.log("");
    console.log(
      `Farm route: ${finding.relativePath}`,
    );

    if (finding.authentication) {
      P(
        `Farm route is authenticated: ${finding.relativePath}`,
      );
    } else {
      F(
        `Farm route is authenticated: ${finding.relativePath}`,
      );
    }

    if (
      finding.prismaFarmWrite ||
      finding.prismaFarmRead
    ) {
      if (
        finding.farmerCollectionAuthorization ||
        finding.singleFarmerAuthorization
      ) {
        P(
          `Farm route has recognizable Farmer authorization: ${finding.relativePath}`,
        );
      } else {
        R(
          `Farm route requires authorization review: ${finding.relativePath}`,
          "Farm access detected without recognizable Farmer authorization helper",
        );
      }
    }
  }

  section("8. CLIENT-SUPPLIED AUTHORIZATION OVERRIDE SCAN");

  let suspiciousRoutes = 0;

  for (const finding of relevantRoutes) {
    if (
      finding.suspiciousClientAuthorization.length ===
      0
    ) {
      continue;
    }

    suspiciousRoutes++;

    F(
      `No suspicious client authorization override: ${finding.relativePath}`,
      finding.suspiciousClientAuthorization.join(
        ", ",
      ),
    );
  }

  if (suspiciousRoutes === 0) {
    P(
      "No suspicious client-supplied authorization override detected in Farmer/Farm routes",
    );
  }

  section("9. FARMER AUTHORIZATION HELPER SOURCE");

  const singleHelperPath = path.join(
    projectRoot,
    "lib",
    "authorization",
    "farmer-authorization.ts",
  );

  const collectionHelperPath =
    path.join(
      projectRoot,
      "lib",
      "authorization",
      "farmer-collection-authorization.ts",
    );

  if (
    fs.existsSync(singleHelperPath)
  ) {
    P(
      "Single-Farmer authorization helper exists",
      "lib/authorization/farmer-authorization.ts",
    );
  } else {
    F(
      "Single-Farmer authorization helper exists",
    );
  }

  if (
    fs.existsSync(collectionHelperPath)
  ) {
    P(
      "Collection authorization helper exists",
      "lib/authorization/farmer-collection-authorization.ts",
    );
  } else {
    F(
      "Collection authorization helper exists",
    );
  }

  section("10. COLLECTION AUTHORIZATION HELPER CONTENT");

  if (
    fs.existsSync(collectionHelperPath)
  ) {
    const source = normalize(
      fs.readFileSync(
        collectionHelperPath,
        "utf8",
      ),
    );

    const requiredCollectionTerms = [
      "getAuthorizedFarmerWhere",
      "Prisma.FarmerWhereInput",
      "officerAssignment.findMany",
      "scopeLevel",
      "countryId",
      "countyId",
      "subCountyId",
      "wardId",
      "hasValidGeographyChain",
    ];

    for (const term of requiredCollectionTerms) {
      if (source.includes(term)) {
        P(
          `Collection helper contains required authorization component: ${term}`,
        );
      } else {
        F(
          `Collection helper contains required authorization component: ${term}`,
        );
      }
    }
  }

  section("11. SINGLE-FARMER AUTHORIZATION HELPER CONTENT");

  if (
    fs.existsSync(singleHelperPath)
  ) {
    const source = normalize(
      fs.readFileSync(
        singleHelperPath,
        "utf8",
      ),
    );

    const requiredSingleTerms = [
      "authorizeFarmerAccess",
      "canAccessFarmer",
      "officerAssignment.findMany",
      "scopeLevel",
      "countryId",
      "countyId",
      "subCountyId",
      "wardId",
      "assignmentMatchesFarmer",
      "isValidScopeConfiguration",
    ];

    for (const term of requiredSingleTerms) {
      if (source.includes(term)) {
        P(
          `Single-Farmer helper contains required component: ${term}`,
        );
      } else {
        F(
          `Single-Farmer helper contains required component: ${term}`,
        );
      }
    }
  }

  section("12. ROUTE COVERAGE MATRIX");

  console.log("");
  console.log(
    "ROUTE | METHODS | AUTH | COLLECTION | SINGLE | F-READ | F-WRITE | FARM-READ | FARM-WRITE",
  );
  console.log(
    "------|---------|------|------------|--------|--------|---------|-----------|----------",
  );

  for (const finding of relevantRoutes) {
    console.log(
      `${finding.relativePath} | ` +
        `${finding.methods.join(",") || "-"} | ` +
        `${formatBoolean(finding.authentication)} | ` +
        `${formatBoolean(
          finding.farmerCollectionAuthorization,
        )} | ` +
        `${formatBoolean(
          finding.singleFarmerAuthorization,
        )} | ` +
        `${formatBoolean(
          finding.prismaFarmerRead,
        )} | ` +
        `${formatBoolean(
          finding.prismaFarmerWrite,
        )} | ` +
        `${formatBoolean(
          finding.prismaFarmRead,
        )} | ` +
        `${formatBoolean(
          finding.prismaFarmWrite,
        )}`,
    );
  }

  section("13. HIGH-RISK COVERAGE CHECK");

  const highRiskRoutes =
    relevantRoutes.filter(
      (finding) =>
        finding.prismaFarmerRead ||
        finding.prismaFarmerWrite ||
        finding.prismaFarmRead ||
        finding.prismaFarmWrite,
    );

  for (const finding of highRiskRoutes) {
    const performsDataAccess =
      finding.prismaFarmerRead ||
      finding.prismaFarmerWrite ||
      finding.prismaFarmRead ||
      finding.prismaFarmWrite;

    if (!performsDataAccess) {
      continue;
    }

    if (!finding.authentication) {
      F(
        `High-risk Farmer/Farm route is authenticated: ${finding.relativePath}`,
      );
      continue;
    }

    P(
      `High-risk Farmer/Farm route is authenticated: ${finding.relativePath}`,
    );

    const hasRecognizedAuthorization =
      finding.farmerCollectionAuthorization ||
      finding.singleFarmerAuthorization;

    if (hasRecognizedAuthorization) {
      P(
        `High-risk route has recognized Farmer authorization: ${finding.relativePath}`,
      );
    } else {
      R(
        `High-risk route lacks recognizable Farmer authorization: ${finding.relativePath}`,
        "inspect whether another authorization mechanism is intentionally used",
      );
    }
  }

  section("14. SPECIAL REVIEW — FARM DATA");

  const directFarmRoutes =
    findings.filter(
      (finding) =>
        finding.prismaFarmRead ||
        finding.prismaFarmWrite,
    );

  if (directFarmRoutes.length === 0) {
    P(
      "No direct Farm Prisma access found outside scanned Farmer/Farm routes",
    );
  } else {
    console.log(
      `Direct Farm Prisma routes: ${directFarmRoutes.length}`,
    );

    for (const finding of directFarmRoutes) {
      console.log(
        `${finding.relativePath} | ` +
          `read=${finding.prismaFarmRead} ` +
          `write=${finding.prismaFarmWrite} ` +
          `auth=${finding.authentication} ` +
          `collection=${finding.farmerCollectionAuthorization} ` +
          `single=${finding.singleFarmerAuthorization}`,
      );
    }
  }

  section("15. DATABASE MUTATION SAFETY");

  const finalFarmerCount =
    await prisma.farmer.count();

  const finalFarmCount =
    await prisma.farm.count();

  const finalAssignmentCount =
    await prisma.officerAssignment.count();

  if (finalFarmerCount === farmerCount) {
    P(
      "Farmer count unchanged",
      `before=${farmerCount} after=${finalFarmerCount}`,
    );
  } else {
    F(
      "Farmer count unchanged",
      `before=${farmerCount} after=${finalFarmerCount}`,
    );
  }

  if (finalFarmCount === farmCount) {
    P(
      "Farm count unchanged",
      `before=${farmCount} after=${finalFarmCount}`,
    );
  } else {
    F(
      "Farm count unchanged",
      `before=${farmCount} after=${finalFarmCount}`,
    );
  }

  if (
    finalAssignmentCount ===
    assignmentCount
  ) {
    P(
      "OfficerAssignment count unchanged",
      `before=${assignmentCount} after=${finalAssignmentCount}`,
    );
  } else {
    F(
      "OfficerAssignment count unchanged",
      `before=${assignmentCount} after=${finalAssignmentCount}`,
    );
  }

  section("16. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.18 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);
  console.log(`REVIEW : ${reviewCount}`);

  if (failCount === 0) {
    if (reviewCount === 0) {
      console.log("V40.18 STATUS: GREEN");
    } else {
      console.log(
        "V40.18 STATUS: GREEN WITH REVIEW",
      );
    }

    console.log("");
    console.log(
      "Farmer/Farm API authorization coverage scan completed.",
    );
  } else {
    console.log("V40.18 STATUS: RED");
    console.log("");
    console.log(
      "One or more Farmer/Farm authorization coverage checks failed.",
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
    console.error("V40.18 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });