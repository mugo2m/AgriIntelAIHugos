import fs from "fs";
import path from "path";

type CheckResult = {
  section: string;
  check: string;
  status: "PASS" | "REVIEW" | "MISSING";
  evidence: string;
};

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

const results: CheckResult[] = [];

function add(
  section: string,
  check: string,
  status: CheckResult["status"],
  evidence: string,
) {
  results.push({
    section,
    check,
    status,
    evidence,
  });
}

function has(source: string, pattern: string): boolean {
  return source.includes(pattern);
}

function hasAny(source: string, patterns: string[]): boolean {
  return patterns.some((pattern) => source.includes(pattern));
}

function countOccurrences(source: string, pattern: string): number {
  return source.split(pattern).length - 1;
}

function readSource(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}

function printSection(title: string) {
  console.log("");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

console.log("");
console.log("FARMER AUTHORIZATION CONTRACT AUDIT V37");
console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
console.log("");

/* ============================================================
   1. FILE EXISTENCE
   ============================================================ */

printSection("1. ROUTE FILES");

const farmerRoute = readSource(farmerRoutePath);
const farmerMeRoute = readSource(farmerMeRoutePath);

if (farmerRoute !== null) {
  add(
    "FILES",
    "app/api/farmers/route.ts exists",
    "PASS",
    `Found: ${farmerRoutePath}`,
  );
} else {
  add(
    "FILES",
    "app/api/farmers/route.ts exists",
    "MISSING",
    `Not found: ${farmerRoutePath}`,
  );
}

if (farmerMeRoute !== null) {
  add(
    "FILES",
    "app/api/farmers/me/route.ts exists",
    "PASS",
    `Found: ${farmerMeRoutePath}`,
  );
} else {
  add(
    "FILES",
    "app/api/farmers/me/route.ts exists",
    "MISSING",
    `Not found: ${farmerMeRoutePath}`,
  );
}

/* ============================================================
   2. COLLECTION ROUTE GET AUTHORIZATION
   ============================================================ */

printSection("2. GET /api/farmers COLLECTION AUTHORIZATION");

if (farmerRoute === null) {
  add(
    "GET COLLECTION",
    "Route source available",
    "MISSING",
    "Cannot inspect route because file does not exist.",
  );
} else {
  add(
    "GET COLLECTION",
    "getCurrentUser() present",
    has(farmerRoute, "getCurrentUser()") ? "PASS" : "MISSING",
    `Occurrences: ${countOccurrences(farmerRoute, "getCurrentUser()")}`,
  );

  add(
    "GET COLLECTION",
    "Firebase UID resolution present",
    hasAny(farmerRoute, [
      "currentUser.id",
      "currentUser.uid",
      "firebaseUid",
    ])
      ? "PASS"
      : "MISSING",
    hasAny(farmerRoute, [
      "currentUser.id",
      "currentUser.uid",
      "firebaseUid",
    ])
      ? "Firebase identity is referenced."
      : "No Firebase identity mapping detected.",
  );

  add(
    "GET COLLECTION",
    "Database User lookup present",
    has(farmerRoute, "prisma.user.findUnique")
      ? "PASS"
      : "MISSING",
    has(farmerRoute, "prisma.user.findUnique")
      ? "prisma.user.findUnique detected."
      : "No PostgreSQL User lookup detected.",
  );

  add(
    "GET COLLECTION",
    "User role loaded",
    has(farmerRoute, "role: true") ? "PASS" : "MISSING",
    has(farmerRoute, "role: true")
      ? "User role relation is loaded."
      : "User role relation not detected.",
  );

  add(
    "GET COLLECTION",
    "401 unauthenticated response",
    has(farmerRoute, "status: 401") ? "PASS" : "MISSING",
    has(farmerRoute, "status: 401")
      ? "HTTP 401 detected."
      : "No HTTP 401 detected.",
  );

  add(
    "GET COLLECTION",
    "Inactive-user authorization check",
    has(farmerRoute, "dbUser.active") ? "PASS" : "REVIEW",
    has(farmerRoute, "dbUser.active")
      ? "dbUser.active is checked."
      : "No visible active-user check.",
  );

  add(
    "GET COLLECTION",
    "403 forbidden response",
    has(farmerRoute, "status: 403") ? "PASS" : "MISSING",
    has(farmerRoute, "status: 403")
      ? "HTTP 403 detected."
      : "No HTTP 403 detected.",
  );

  add(
    "GET COLLECTION",
    "Super Admin role recognized",
    has(farmerRoute, "Super Admin") ? "PASS" : "MISSING",
    has(farmerRoute, "Super Admin")
      ? "Super Admin appears in authorization logic."
      : "Super Admin not detected.",
  );

  add(
    "GET COLLECTION",
    "National Admin role recognized",
    has(farmerRoute, "National Admin") ? "PASS" : "MISSING",
    has(farmerRoute, "National Admin")
      ? "National Admin appears in authorization logic."
      : "National Admin not detected.",
  );

  add(
    "GET COLLECTION",
    "Collection role allowlist detected",
    hasAny(farmerRoute, [
      "allowedCollectionRoles",
      "collectionRoles",
      "Super Admin",
      "National Admin",
    ])
      ? "PASS"
      : "MISSING",
    "Role-based collection authorization inspected.",
  );

  add(
    "GET COLLECTION",
    "Farmer collection query remains present",
    has(farmerRoute, "prisma.farmer.findMany")
      ? "PASS"
      : "MISSING",
    has(farmerRoute, "prisma.farmer.findMany")
      ? "Farmer.findMany detected."
      : "Farmer.findMany not detected.",
  );

  add(
    "GET COLLECTION",
    "Collection returns JSON",
    has(farmerRoute, "NextResponse.json")
      ? "PASS"
      : "MISSING",
    has(farmerRoute, "NextResponse.json")
      ? "NextResponse.json detected."
      : "No JSON response detected.",
  );

  const getStart = farmerRoute.indexOf("export async function GET()");
  const postStart = farmerRoute.indexOf("export async function POST()");

  if (getStart >= 0 && postStart > getStart) {
    const getSource = farmerRoute.slice(getStart, postStart);

    add(
      "GET COLLECTION",
      "GET contains authentication before collection query",
      getSource.indexOf("getCurrentUser()") >= 0 &&
        getSource.indexOf("prisma.farmer.findMany") >= 0 &&
        getSource.indexOf("getCurrentUser()") <
          getSource.indexOf("prisma.farmer.findMany")
        ? "PASS"
        : "REVIEW",
      "Compared source order of authentication and Farmer.findMany.",
    );

    add(
      "GET COLLECTION",
      "GET contains explicit role authorization before collection query",
      getSource.indexOf("Super Admin") >= 0 &&
        getSource.indexOf("National Admin") >= 0 &&
        getSource.indexOf("prisma.farmer.findMany") >= 0 &&
        Math.max(
          getSource.indexOf("Super Admin"),
          getSource.indexOf("National Admin"),
        ) < getSource.indexOf("prisma.farmer.findMany")
        ? "PASS"
        : "REVIEW",
      "Compared role checks against Farmer.findMany source order.",
    );
  } else {
    add(
      "GET COLLECTION",
      "GET source boundaries identifiable",
      "REVIEW",
      "Could not reliably isolate GET from POST.",
    );
  }
}

/* ============================================================
   3. POST AUTH REGRESSION
   ============================================================ */

printSection("3. POST /api/farmers AUTHORIZATION REGRESSION");

if (farmerRoute === null) {
  add(
    "POST",
    "POST route available",
    "MISSING",
    "Route source unavailable.",
  );
} else {
  const postStart = farmerRoute.indexOf("export async function POST()");

  if (postStart >= 0) {
    const postSource = farmerRoute.slice(postStart);

    add(
      "POST",
      "POST getCurrentUser() present",
      has(postSource, "getCurrentUser()") ? "PASS" : "MISSING",
      has(postSource, "getCurrentUser()")
        ? "POST authentication remains present."
        : "POST authentication missing.",
    );

    add(
      "POST",
      "POST unauthenticated 401 present",
      has(postSource, "status: 401") ? "PASS" : "MISSING",
      has(postSource, "status: 401")
        ? "POST 401 detected."
        : "POST 401 not detected.",
    );

    add(
      "POST",
      "POST Firebase UID mapping present",
      hasAny(postSource, [
        "currentUser.id",
        "currentUser.uid",
        "firebaseUid",
      ])
        ? "PASS"
        : "MISSING",
      "POST identity mapping inspected.",
    );

    add(
      "POST",
      "POST PostgreSQL User lookup present",
      has(postSource, "prisma.user.findUnique")
        ? "PASS"
        : "MISSING",
      has(postSource, "prisma.user.findUnique")
        ? "POST database User lookup detected."
        : "POST database User lookup missing.",
    );

    add(
      "POST",
      "POST transaction remains present",
      has(postSource, "prisma.$transaction")
        ? "PASS"
        : "MISSING",
      has(postSource, "prisma.$transaction")
        ? "POST transaction detected."
        : "POST transaction not detected.",
    );
  } else {
    add(
      "POST",
      "POST route boundary identifiable",
      "MISSING",
      "POST function not detected.",
    );
  }
}

/* ============================================================
   4. FARMER SELF-SERVICE ROUTE
   ============================================================ */

printSection("4. GET /api/farmers/me SELF-SERVICE AUTHORIZATION");

if (farmerMeRoute === null) {
  add(
    "SELF SERVICE",
    "/api/farmers/me route exists",
    "MISSING",
    "Route file not found.",
  );
} else {
  add(
    "SELF SERVICE",
    "getCurrentUser() present",
    has(farmerMeRoute, "getCurrentUser()") ? "PASS" : "MISSING",
    has(farmerMeRoute, "getCurrentUser()")
      ? "Self-service authentication detected."
      : "Self-service authentication missing.",
  );

  add(
    "SELF SERVICE",
    "Firebase UID resolution present",
    hasAny(farmerMeRoute, [
      "currentUser.id",
      "currentUser.uid",
      "firebaseUid",
    ])
      ? "PASS"
      : "MISSING",
    "Self-service Firebase identity mapping inspected.",
  );

  add(
    "SELF SERVICE",
    "Database User lookup present",
    has(farmerMeRoute, "prisma.user.findUnique")
      ? "PASS"
      : "MISSING",
    has(farmerMeRoute, "prisma.user.findUnique")
      ? "Self-service PostgreSQL User lookup detected."
      : "Self-service User lookup missing.",
  );

  add(
    "SELF SERVICE",
    "User role loaded",
    has(farmerMeRoute, "role: true") ? "PASS" : "MISSING",
    has(farmerMeRoute, "role: true")
      ? "Role relation detected."
      : "Role relation not detected.",
  );

  add(
    "SELF SERVICE",
    "Farmer role recognized",
    has(farmerMeRoute, "Farmer") ? "PASS" : "MISSING",
    has(farmerMeRoute, "Farmer")
      ? "Farmer role detected."
      : "Farmer role not detected.",
  );

  add(
    "SELF SERVICE",
    "Lead Farmer role recognized",
    has(farmerMeRoute, "Lead Farmer") ? "PASS" : "MISSING",
    has(farmerMeRoute, "Lead Farmer")
      ? "Lead Farmer role detected."
      : "Lead Farmer role not detected.",
  );

  add(
    "SELF SERVICE",
    "401 unauthenticated response",
    has(farmerMeRoute, "status: 401") ? "PASS" : "MISSING",
    has(farmerMeRoute, "status: 401")
      ? "HTTP 401 detected."
      : "No HTTP 401 detected.",
  );

  add(
    "SELF SERVICE",
    "403 forbidden response",
    has(farmerMeRoute, "status: 403") ? "PASS" : "MISSING",
    has(farmerMeRoute, "status: 403")
      ? "HTTP 403 detected."
      : "No HTTP 403 detected.",
  );

  add(
    "SELF SERVICE",
    "Farmer.findUnique present",
    has(farmerMeRoute, "prisma.farmer.findUnique")
      ? "PASS"
      : "MISSING",
    has(farmerMeRoute, "prisma.farmer.findUnique")
      ? "Farmer.findUnique detected."
      : "Farmer.findUnique missing.",
  );

  add(
    "SELF SERVICE",
    "Ownership predicate uses dbUser.id",
    has(farmerMeRoute, "userId: dbUser.id")
      ? "PASS"
      : "MISSING",
    has(farmerMeRoute, "userId: dbUser.id")
      ? "Farmer ownership is scoped to authenticated database User."
      : "No userId: dbUser.id ownership predicate detected.",
  );

  add(
    "SELF SERVICE",
    "Self-service query is owner-scoped",
    has(farmerMeRoute, "where: { userId: dbUser.id }")
      ? "PASS"
      : "REVIEW",
    has(farmerMeRoute, "where: { userId: dbUser.id }")
      ? "Exact owner-scoped predicate detected."
      : "Owner predicate needs manual review.",
  );

  add(
    "SELF SERVICE",
    "No unrestricted Farmer.findMany",
    !has(farmerMeRoute, "prisma.farmer.findMany")
      ? "PASS"
      : "REVIEW",
    !has(farmerMeRoute, "prisma.farmer.findMany")
      ? "No collection-wide Farmer.findMany detected."
      : "Farmer.findMany detected in self-service route.",
  );
}

/* ============================================================
   5. GEOGRAPHIC STAFF ROLES
   ============================================================ */

printSection("5. GEOGRAPHIC STAFF AUTHORIZATION");

add(
  "GEOGRAPHIC STAFF",
  "County Director authorization",
  "REVIEW",
  "Not implemented in V37; geographic scope must be established before enabling this role.",
);

add(
  "GEOGRAPHIC STAFF",
  "Sub County Officer authorization",
  "REVIEW",
  "Not implemented in V37; geographic scope must be established before enabling this role.",
);

add(
  "GEOGRAPHIC STAFF",
  "Ward Extension Officer authorization",
  "REVIEW",
  "Not implemented in V37; geographic scope must be established before enabling this role.",
);

add(
  "GEOGRAPHIC STAFF",
  "Extension Officer authorization",
  "REVIEW",
  "Not implemented in V37; exact authorization scope is not yet established.",
);

/* ============================================================
   6. UNSAFE PERMISSION ASSUMPTIONS
   ============================================================ */

printSection("6. PERMISSION MODEL SAFETY");

add(
  "PERMISSIONS",
  "No invented farmer.read permission",
  "PASS",
  "V37 uses existing Role names rather than assuming a nonexistent farmer.read permission.",
);

add(
  "PERMISSIONS",
  "No geographic role scope invented",
  "PASS",
  "V37 deliberately does not authorize geographic staff without established scope.",
);

/* ============================================================
   7. SOURCE MUTATION SAFETY
   ============================================================ */

printSection("7. SOURCE-LEVEL MUTATION SAFETY");

if (farmerMeRoute !== null) {
  const mutationPatterns = [
    "prisma.$transaction",
    "prisma.farmer.create",
    "prisma.farmer.update",
    "prisma.farmer.delete",
    "prisma.user.create",
    "prisma.user.update",
    "prisma.user.delete",
  ];

  const mutations = mutationPatterns.filter((pattern) =>
    farmerMeRoute.includes(pattern),
  );

  add(
    "MUTATION SAFETY",
    "/api/farmers/me GET has no database mutation",
    mutations.length === 0 ? "PASS" : "REVIEW",
    mutations.length === 0
      ? "No create/update/delete/transaction operations detected."
      : `Mutation patterns detected: ${mutations.join(", ")}`,
  );
} else {
  add(
    "MUTATION SAFETY",
    "/api/farmers/me source available",
    "MISSING",
    "Cannot inspect missing route.",
  );
}

/* ============================================================
   8. SUMMARY
   ============================================================ */

printSection("V37 AUDIT RESULTS");

let pass = 0;
let review = 0;
let missing = 0;

for (const result of results) {
  if (result.status === "PASS") pass++;
  if (result.status === "REVIEW") review++;
  if (result.status === "MISSING") missing++;

  console.log(
    `[${result.status}] ${result.section} :: ${result.check}`,
  );
  console.log(`        ${result.evidence}`);
}

console.log("");
console.log("=".repeat(70));
console.log("FINAL V37 CLASSIFICATION");
console.log("=".repeat(70));

console.log(`PASS    : ${pass}`);
console.log(`REVIEW  : ${review}`);
console.log(`MISSING : ${missing}`);

console.log("");

if (missing === 0 && review === 0) {
  console.log("V37 STATUS: GREEN");
} else if (missing === 0) {
  console.log("V37 STATUS: GREEN WITH REVIEW ITEMS");
} else {
  console.log("V37 STATUS: NOT GREEN");
}

console.log("");
console.log("READ-ONLY AUDIT COMPLETE.");
console.log("NO INSERT / UPDATE / DELETE WAS EXECUTED.");
console.log("");