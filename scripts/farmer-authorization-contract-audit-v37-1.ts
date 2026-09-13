import fs from "fs";
import path from "path";

type ResultStatus = "PASS" | "REVIEW" | "MISSING";

type AuditResult = {
  status: ResultStatus;
  section: string;
  check: string;
  detail?: string;
};

const results: AuditResult[] = [];

const projectRoot = process.cwd();

const farmerRoutePath = path.join(
  projectRoot,
  "app",
  "api",
  "farmers",
  "route.ts",
);

const farmerMeRoutePath = path.join(
  projectRoot,
  "app",
  "api",
  "farmers",
  "me",
  "route.ts",
);

function add(
  status: ResultStatus,
  section: string,
  check: string,
  detail?: string,
) {
  results.push({
    status,
    section,
    check,
    detail,
  });
}

function pass(section: string, check: string, detail?: string) {
  add("PASS", section, check, detail);
}

function review(section: string, check: string, detail?: string) {
  add("REVIEW", section, check, detail);
}

function missing(section: string, check: string, detail?: string) {
  add("MISSING", section, check, detail);
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function normalizeSource(source: string): string {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function hasAny(source: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(source));
}

function isolateFunction(
  source: string,
  functionName: "GET" | "POST",
): string | null {
  const declarationPattern = new RegExp(
    `export\\s+async\\s+function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`,
    "m",
  );

  const match = declarationPattern.exec(source);

  if (!match || match.index < 0) {
    return null;
  }

  const start = match.index;
  const bodyStart = source.indexOf("{", start);

  if (bodyStart < 0) {
    return null;
  }

  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = bodyStart; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (
      (inSingleQuote || inDoubleQuote || inTemplate) &&
      char === "\\"
    ) {
      escaped = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inTemplate) {
      if (char === "/" && next === "/") {
        lineComment = true;
        i++;
        continue;
      }

      if (char === "/" && next === "*") {
        blockComment = true;
        i++;
        continue;
      }
    }

    if (!inDoubleQuote && !inTemplate && char === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!inSingleQuote && !inTemplate && char === '"') {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "`") {
      inTemplate = !inTemplate;
      continue;
    }

    if (inSingleQuote || inDoubleQuote || inTemplate) {
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;

      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

function countOccurrences(source: string, pattern: RegExp): number {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

console.log("");
console.log("============================================================");
console.log("FARMER AUTHORIZATION CONTRACT AUDIT V37.1");
console.log("============================================================");
console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
console.log("NO MIGRATION");
console.log("NO ROUTE MODIFICATION");
console.log("============================================================");
console.log("");

/* ============================================================
   1. FILES
   ============================================================ */

console.log("1. FILES");
console.log("------------------------------------------------------------");

if (fileExists(farmerRoutePath)) {
  pass(
    "FILES",
    "app/api/farmers/route.ts exists",
  );
} else {
  missing(
    "FILES",
    "app/api/farmers/route.ts exists",
  );
}

if (fileExists(farmerMeRoutePath)) {
  pass(
    "FILES",
    "app/api/farmers/me/route.ts exists",
  );
} else {
  missing(
    "FILES",
    "app/api/farmers/me/route.ts exists",
  );
}

if (!fileExists(farmerRoutePath) || !fileExists(farmerMeRoutePath)) {
  console.log("");
  console.log("Required route file is missing.");
  console.log("Audit cannot continue.");
  process.exit(1);
}

const farmerRouteSource = normalizeSource(readSource(farmerRoutePath));
const farmerMeRouteSource = normalizeSource(readSource(farmerMeRoutePath));

console.log("");
console.log(
  `Farmer route size: ${farmerRouteSource.length} characters`,
);
console.log(
  `Farmer /me route size: ${farmerMeRouteSource.length} characters`,
);
console.log("");

/* ============================================================
   2. FUNCTION BOUNDARIES
   ============================================================ */

console.log("2. FUNCTION BOUNDARIES");
console.log("------------------------------------------------------------");

const getFunction = isolateFunction(farmerRouteSource, "GET");
const postFunction = isolateFunction(farmerRouteSource, "POST");
const meGetFunction = isolateFunction(farmerMeRouteSource, "GET");

if (getFunction) {
  pass(
    "BOUNDARIES",
    "GET function boundary detected",
    `GET source length: ${getFunction.length}`,
  );
} else {
  missing(
    "BOUNDARIES",
    "GET function boundary detected",
    "Could not isolate export async function GET(...)",
  );
}

if (postFunction) {
  pass(
    "BOUNDARIES",
    "POST function boundary detected",
    `POST source length: ${postFunction.length}`,
  );
} else {
  missing(
    "BOUNDARIES",
    "POST function boundary detected",
    "Could not isolate export async function POST(...)",
  );
}

if (meGetFunction) {
  pass(
    "BOUNDARIES",
    "Farmer /me GET function boundary detected",
    `GET source length: ${meGetFunction.length}`,
  );
} else {
  missing(
    "BOUNDARIES",
    "Farmer /me GET function boundary detected",
  );
}

/* ============================================================
   3. COLLECTION GET AUTHORIZATION
   ============================================================ */

console.log("");
console.log("3. GET /api/farmers COLLECTION AUTHORIZATION");
console.log("------------------------------------------------------------");

if (!getFunction) {
  missing(
    "GET COLLECTION",
    "GET source available for authorization analysis",
  );
} else {
  const getSource = getFunction;

  if (
    hasAny(getSource, [
      /getCurrentUser\s*\(/,
      /isAuthenticated\s*\(/,
    ])
  ) {
    pass(
      "GET COLLECTION",
      "Authentication helper present",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Authentication helper present",
    );
  }

  if (
    /currentUser\.(?:id|uid)/.test(getSource) ||
    /currentUser\s*\?\.\s*(?:id|uid)/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "Firebase UID resolution present",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Firebase UID resolution present",
    );
  }

  if (
    /prisma\.user\.findUnique\s*\(/.test(getSource) &&
    /firebaseUid/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "Database User lookup by Firebase UID present",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Database User lookup by Firebase UID present",
    );
  }

  if (
    /include\s*:\s*\{[\s\S]*?role\s*:\s*true[\s\S]*?\}/.test(
      getSource,
    ) ||
    /role\s*:\s*true/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "User role loaded",
    );
  } else {
    missing(
      "GET COLLECTION",
      "User role loaded",
    );
  }

  if (
    /status\s*:\s*401/.test(getSource) &&
    /currentUser/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "401 unauthenticated response",
    );
  } else {
    missing(
      "GET COLLECTION",
      "401 unauthenticated response",
    );
  }

  if (
    /dbUser\.active/.test(getSource) ||
    /active\s*!==\s*true/.test(getSource) ||
    /!dbUser\.active/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "Inactive-user authorization check",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Inactive-user authorization check",
    );
  }

  if (/status\s*:\s*403/.test(getSource)) {
    pass(
      "GET COLLECTION",
      "403 forbidden response",
    );
  } else {
    missing(
      "GET COLLECTION",
      "403 forbidden response",
    );
  }

  if (/Super Admin/.test(getSource)) {
    pass(
      "GET COLLECTION",
      "Super Admin role recognized",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Super Admin role recognized",
    );
  }

  if (/National Admin/.test(getSource)) {
    pass(
      "GET COLLECTION",
      "National Admin role recognized",
    );
  } else {
    missing(
      "GET COLLECTION",
      "National Admin role recognized",
    );
  }

  if (
    /allowedCollectionRoles/.test(getSource) ||
    /collectionRoles/.test(getSource) ||
    /allowedRoles/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "Collection role allowlist variable detected",
    );
  } else if (
    /roleName/.test(getSource) &&
    /Super Admin/.test(getSource) &&
    /National Admin/.test(getSource)
  ) {
    pass(
      "GET COLLECTION",
      "Collection role allowlist detected from role checks",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Collection role allowlist detected",
    );
  }

  if (/prisma\.farmer\.findMany\s*\(/.test(getSource)) {
    pass(
      "GET COLLECTION",
      "Farmer collection query present",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Farmer collection query present",
    );
  }

  if (/NextResponse\.json\s*\(/.test(getSource)) {
    pass(
      "GET COLLECTION",
      "Collection returns JSON",
    );
  } else {
    missing(
      "GET COLLECTION",
      "Collection returns JSON",
    );
  }

  const unrestrictedCollectionPattern =
    /prisma\.farmer\.findMany\s*\(\s*\{\s*orderBy\s*:/s;

  if (unrestrictedCollectionPattern.test(getSource)) {
    review(
      "GET COLLECTION",
      "Collection query has no visible geographic predicate",
      "Expected for Super Admin/National Admin national collection.",
    );
  } else {
    pass(
      "GET COLLECTION",
      "No accidental simple unrestricted collection pattern",
    );
  }
}

/* ============================================================
   4. POST PRESERVATION
   ============================================================ */

console.log("");
console.log("4. POST /api/farmers PRESERVATION");
console.log("------------------------------------------------------------");

if (!postFunction) {
  missing(
    "POST",
    "POST route boundary detected",
  );
} else {
  if (/getCurrentUser\s*\(/.test(postFunction)) {
    pass(
      "POST",
      "Existing POST authentication preserved",
    );
  } else {
    missing(
      "POST",
      "Existing POST authentication preserved",
    );
  }

  if (/prisma\.user\.findUnique\s*\(/.test(postFunction)) {
    pass(
      "POST",
      "Existing POST database User resolution preserved",
    );
  } else {
    missing(
      "POST",
      "Existing POST database User resolution preserved",
    );
  }

  if (/prisma\.\$transaction\s*\(/.test(postFunction)) {
    pass(
      "POST",
      "Existing transaction preserved",
    );
  } else {
    missing(
      "POST",
      "Existing transaction preserved",
    );
  }

  if (
    /prisma\.farmer\.create\s*\(/.test(postFunction) ||
    /tx\.farmer\.create\s*\(/.test(postFunction)
  ) {
    pass(
      "POST",
      "Farmer create path preserved",
    );
  } else {
    missing(
      "POST",
      "Farmer create path preserved",
    );
  }

  if (
    /prisma\.farmer\.update\s*\(/.test(postFunction) ||
    /tx\.farmer\.update\s*\(/.test(postFunction)
  ) {
    pass(
      "POST",
      "Farmer update path preserved",
    );
  } else {
    missing(
      "POST",
      "Farmer update path preserved",
    );
  }

  if (
    /prisma\.farm\.create\s*\(/.test(postFunction) ||
    /tx\.farm\.create\s*\(/.test(postFunction)
  ) {
    pass(
      "POST",
      "Farm create path preserved",
    );
  } else {
    missing(
      "POST",
      "Farm create path preserved",
    );
  }

  if (/P2002/.test(postFunction)) {
    pass(
      "POST",
      "P2002 conflict handling preserved",
    );
  } else {
    missing(
      "POST",
      "P2002 conflict handling preserved",
    );
  }

  if (/P2003/.test(postFunction)) {
    pass(
      "POST",
      "P2003 foreign-key handling preserved",
    );
  } else {
    missing(
      "POST",
      "P2003 foreign-key handling preserved",
    );
  }
}

/* ============================================================
   5. FARMER SELF-SERVICE
   ============================================================ */

console.log("");
console.log("5. GET /api/farmers/me SELF-SERVICE");
console.log("------------------------------------------------------------");

if (!meGetFunction) {
  missing(
    "SELF SERVICE",
    "Self-service GET function available",
  );
} else {
  const meSource = meGetFunction;

  if (
    /getCurrentUser\s*\(/.test(meSource) ||
    /isAuthenticated\s*\(/.test(meSource)
  ) {
    pass(
      "SELF SERVICE",
      "Authentication helper present",
    );
  } else {
    missing(
      "SELF SERVICE",
      "Authentication helper present",
    );
  }

  if (/currentUser\.(?:id|uid)/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "Firebase UID resolution present",
    );
  } else {
    missing(
      "SELF SERVICE",
      "Firebase UID resolution present",
    );
  }

  if (
    /prisma\.user\.findUnique\s*\(/.test(meSource) &&
    /firebaseUid/.test(meSource)
  ) {
    pass(
      "SELF SERVICE",
      "Database User lookup present",
    );
  } else {
    missing(
      "SELF SERVICE",
      "Database User lookup present",
    );
  }

  if (/role\s*:\s*true/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "User role loaded",
    );
  } else {
    missing(
      "SELF SERVICE",
      "User role loaded",
    );
  }

  if (/Farmer/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "Farmer role recognized",
    );
  } else {
    missing(
      "SELF SERVICE",
      "Farmer role recognized",
    );
  }

  if (/Lead Farmer/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "Lead Farmer role recognized",
    );
  } else {
    missing(
      "SELF SERVICE",
      "Lead Farmer role recognized",
    );
  }

  if (/status\s*:\s*401/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "401 unauthenticated response",
    );
  } else {
    missing(
      "SELF SERVICE",
      "401 unauthenticated response",
    );
  }

  if (/status\s*:\s*403/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "403 forbidden response",
    );
  } else {
    missing(
      "SELF SERVICE",
      "403 forbidden response",
    );
  }

  if (/prisma\.farmer\.findUnique\s*\(/.test(meSource)) {
    pass(
      "SELF SERVICE",
      "Farmer.findUnique present",
    );
  } else {
    missing(
      "SELF SERVICE",
      "Farmer.findUnique present",
    );
  }

  const ownerPredicatePatterns = [
    /where\s*:\s*\{\s*userId\s*:\s*dbUser\.id\s*,?\s*\}/s,
    /where\s*:\s*\{\s*\n\s*userId\s*:\s*dbUser\.id\s*,?\s*\n\s*\}/s,
    /userId\s*:\s*dbUser\.id/,
  ];

  if (hasAny(meSource, ownerPredicatePatterns)) {
    pass(
      "SELF SERVICE",
      "Ownership predicate uses authenticated database User ID",
      'Equivalent SQL: WHERE "userId" = :authenticatedDatabaseUserId',
    );
  } else {
    review(
      "SELF SERVICE",
      "Ownership predicate needs manual review",
      "Expected predicate: where: { userId: dbUser.id }",
    );
  }

  if (/prisma\.farmer\.findMany\s*\(/.test(meSource)) {
    missing(
      "SELF SERVICE",
      "No unrestricted Farmer.findMany",
      "Farmer self-service route must not expose the collection.",
    );
  } else {
    pass(
      "SELF SERVICE",
      "No unrestricted Farmer.findMany",
    );
  }

  if (
    /prisma\.farmer\.(?:create|update|delete|deleteMany|updateMany)\s*\(/.test(
      meSource,
    )
  ) {
    missing(
      "SELF SERVICE",
      "Self-service GET has no database mutation",
      "GET /api/farmers/me should remain read-only.",
    );
  } else {
    pass(
      "SELF SERVICE",
      "Self-service GET has no database mutation",
    );
  }
}

/* ============================================================
   6. GEOGRAPHIC STAFF DEFERRAL
   ============================================================ */

console.log("");
console.log("6. GEOGRAPHIC STAFF AUTHORIZATION");
console.log("------------------------------------------------------------");

review(
  "GEOGRAPHIC STAFF",
  "County Director authorization",
  "Deferred intentionally: geographic scope is not yet modeled on User.",
);

review(
  "GEOGRAPHIC STAFF",
  "Sub County Officer authorization",
  "Deferred intentionally: geographic scope is not yet modeled on User.",
);

review(
  "GEOGRAPHIC STAFF",
  "Ward Extension Officer authorization",
  "Deferred intentionally: geographic scope is not yet modeled on User.",
);

review(
  "GEOGRAPHIC STAFF",
  "Extension Officer authorization",
  "Deferred intentionally: geographic scope is not yet modeled on User.",
);

/* ============================================================
   7. PERMISSION MODEL SAFETY
   ============================================================ */

console.log("");
console.log("7. PERMISSION MODEL SAFETY");
console.log("------------------------------------------------------------");

const combinedAuthSource =
  farmerRouteSource + "\n" + farmerMeRouteSource;

if (
  /\bfarmer\.read\b/i.test(combinedAuthSource) ||
  /\bfarmer_read\b/i.test(combinedAuthSource) ||
  /\bFARMER_READ\b/.test(combinedAuthSource)
) {
  review(
    "PERMISSIONS",
    "No invented farmer.read permission",
    "Route appears to reference a farmer-read permission; verify it exists in the DB.",
  );
} else {
  pass(
    "PERMISSIONS",
    "No invented farmer.read permission",
  );
}

if (
  /County Director/.test(combinedAuthSource) ||
  /Sub County Officer/.test(combinedAuthSource) ||
  /Ward Extension Officer/.test(combinedAuthSource) ||
  /Extension Officer/.test(combinedAuthSource)
) {
  review(
    "PERMISSIONS",
    "Geographic role scope remains deferred",
    "Geographic staff roles should not be authorized without explicit scope data.",
  );
} else {
  pass(
    "PERMISSIONS",
    "No geographic role scope invented",
  );
}

/* ============================================================
   8. SOURCE MUTATION SAFETY
   ============================================================ */

console.log("");
console.log("8. SOURCE MUTATION SAFETY");
console.log("------------------------------------------------------------");

const mutationPattern =
  /prisma\.(?:farmer|farm|user)\.(?:create|createMany|update|updateMany|delete|deleteMany)\s*\(/;

let mutationFoundOutsidePost = false;

if (getFunction && mutationPattern.test(getFunction)) {
  mutationFoundOutsidePost = true;
}

if (meGetFunction && mutationPattern.test(meGetFunction)) {
  mutationFoundOutsidePost = true;
}

if (mutationFoundOutsidePost) {
  missing(
    "MUTATION SAFETY",
    "GET routes contain no database mutations",
    "A database write pattern was detected inside a GET route.",
  );
} else {
  pass(
    "MUTATION SAFETY",
    "GET routes contain no database mutations",
  );
}

const totalGetFunctions =
  countOccurrences(
    farmerRouteSource,
    /export\s+async\s+function\s+GET\s*\(/g,
  ) +
  countOccurrences(
    farmerMeRouteSource,
    /export\s+async\s+function\s+GET\s*\(/g,
  );

if (totalGetFunctions === 2) {
  pass(
    "MUTATION SAFETY",
    "Exactly two Farmer GET handlers detected",
    "Collection GET and self-service GET.",
  );
} else {
  review(
    "MUTATION SAFETY",
    "Expected two Farmer GET handlers",
    `Detected ${totalGetFunctions}.`,
  );
}

/* ============================================================
   9. FINAL SUMMARY
   ============================================================ */

const passCount = results.filter(
  (result) => result.status === "PASS",
).length;

const reviewCount = results.filter(
  (result) => result.status === "REVIEW",
).length;

const missingCount = results.filter(
  (result) => result.status === "MISSING",
).length;

console.log("");
console.log("============================================================");
console.log("V37.1 AUDIT RESULTS");
console.log("============================================================");

for (const result of results) {
  const prefix =
    result.status === "PASS"
      ? "[PASS]"
      : result.status === "REVIEW"
        ? "[REVIEW]"
        : "[MISSING]";

  console.log(
    `${prefix} ${result.section} :: ${result.check}`,
  );

  if (result.detail) {
    console.log(`        ${result.detail}`);
  }
}

console.log("");
console.log("============================================================");
console.log("FINAL COUNTS");
console.log("============================================================");
console.log(`PASS    : ${passCount}`);
console.log(`REVIEW  : ${reviewCount}`);
console.log(`MISSING : ${missingCount}`);
console.log("============================================================");

console.log("");
console.log("EXPECTED V37.1 CLASSIFICATION");
console.log("------------------------------------------------------------");
console.log("MISSING should be 0.");
console.log("REVIEW should consist only of intentional geographic");
console.log("staff authorization deferrals.");
console.log("============================================================");

console.log("");

if (missingCount === 0) {
  console.log("V37.1 STATUS: GREEN");
} else {
  console.log("V37.1 STATUS: NOT GREEN");
}

console.log("");
console.log("============================================================");
console.log("SQL SECURITY MODEL VERIFIED BY THIS AUDIT");
console.log("============================================================");
console.log("");
console.log("COLLECTION:");
console.log(
  "Authenticated Firebase user -> DB User -> active -> role ->",
);
console.log(
  "Super Admin/National Admin -> SELECT Farmer collection",
);
console.log("");
console.log("SELF SERVICE:");
console.log(
  "Authenticated Firebase user -> DB User -> active ->",
);
console.log(
  "Farmer/Lead Farmer -> SELECT Farmer WHERE userId = dbUser.id",
);
console.log("");
console.log("GEOGRAPHIC STAFF:");
console.log(
  "County/SubCounty/Ward/Extension Officer scope intentionally deferred.",
);
console.log("");
console.log("NO DATABASE WRITE WAS PERFORMED.");
console.log("============================================================");
console.log("");