import "dotenv/config";

import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";
import { auth, db } from "../firebase/admin";

type CheckResult = {
name: string;
status: "PASS" | "FAIL";
detail: string;
};

const results: CheckResult[] = [];

const ROOT = process.cwd();

const AUTH_ACTION_PATH = path.join(
ROOT,
"lib",
"actions",
"auth.action.ts",
);

const FIREBASE_ADMIN_PATH = path.join(
ROOT,
"firebase",
"admin.ts",
);

const GENERATE_ROUTE_PATH = path.join(
ROOT,
"app",
"api",
"vapi",
"generate",
"route.ts",
);

const QUERY_ROUTE_PATH = path.join(
ROOT,
"app",
"api",
"farmer",
"query",
"route.ts",
);

function pass(name: string, detail: string) {
results.push({
name,
status: "PASS",
detail,
});

console.log(`PASS   ${detail}`);
}

function fail(name: string, detail: string) {
results.push({
name,
status: "FAIL",
detail,
});

console.log(`FAIL   ${detail}`);
}

function section(title: string) {
console.log("");
console.log(title);
console.log("-".repeat(68));
}

function readSource(filePath: string): string | null {
try {
return fs.readFileSync(filePath, "utf8");
} catch {
return null;
}
}

async function capturePostgresBaseline() {
return {
users: await prisma.user.count(),
farmers: await prisma.farmer.count(),
farms: await prisma.farm.count(),
officerFunctions: await prisma.officerFunction.count(),
officerAssignments: await prisma.officerAssignment.count(),
};
}

async function main() {
console.log("");
console.log(
"V40.21 AUTHENTICATION SESSION BOUNDARY SECURITY AUDIT",
);
console.log("=".repeat(70));
console.log("READ-ONLY PostgreSQL: NO INSERT / UPDATE / DELETE");
console.log("READ-ONLY Firebase/Firestore audit.");
console.log(
"No Firebase users, Firestore documents, or PostgreSQL records are modified.",
);
console.log("=".repeat(70));

const postgresBaseline = await capturePostgresBaseline();

pass(
"postgres-baseline",
`PostgreSQL baseline captured: Users=${postgresBaseline.users}, Farmers=${postgresBaseline.farmers}, Farms=${postgresBaseline.farms}, OfficerFunctions=${postgresBaseline.officerFunctions}, OfficerAssignments=${postgresBaseline.officerAssignments}.`,
);

// ============================================================
// ENVIRONMENT
// ============================================================

section("ENVIRONMENT");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const firebaseConfig = process.env.FIREBASE_CONFIG;
const databaseUrl = process.env.DATABASE_URL;

if (firebaseConfig) {
pass(
"firebase-config",
"FIREBASE_CONFIG is available.",
);
} else if (
projectId &&
clientEmail &&
privateKey
) {
pass(
"firebase-config",
"FIREBASE_CONFIG is not set; individual Firebase environment variables are available.",
);
} else {
fail(
"firebase-config",
"Firebase Admin configuration is incomplete.",
);
}

if (projectId) {
pass(
"firebase-project-id",
"FIREBASE_PROJECT_ID is available.",
);
} else {
fail(
"firebase-project-id",
"FIREBASE_PROJECT_ID is missing.",
);
}

if (clientEmail) {
pass(
"firebase-client-email",
"FIREBASE_CLIENT_EMAIL is available.",
);
} else {
fail(
"firebase-client-email",
"FIREBASE_CLIENT_EMAIL is missing.",
);
}

if (privateKey) {
pass(
"firebase-private-key",
"FIREBASE_PRIVATE_KEY is available.",
);
} else {
fail(
"firebase-private-key",
"FIREBASE_PRIVATE_KEY is missing.",
);
}

if (databaseUrl) {
pass(
"database-url",
"DATABASE_URL is available.",
);
} else {
fail(
"database-url",
"DATABASE_URL is missing.",
);
}

// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================

section("FIREBASE ADMIN INITIALIZATION");

try {
if (!auth) {
fail(
"firebase-auth-instance",
"Firebase Admin auth instance is unavailable.",
);
} else {
pass(
"firebase-auth-instance",
"Firebase Admin auth instance initialized successfully.",
);
}

if (!db) {
  fail(
    "firebase-db-instance",
    "Firebase Admin Firestore instance is unavailable.",
  );
} else {
  pass(
    "firebase-db-instance",
    "Firebase Admin Firestore instance initialized successfully.",
  );
}

} catch (error) {
fail(
"firebase-admin-init",
`Firebase Admin initialization check failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
);
}

// ============================================================
// SOURCE FILE AVAILABILITY
// ============================================================

section("SOURCE FILE AVAILABILITY");

const adminSource = readSource(FIREBASE_ADMIN_PATH);
const authSource = readSource(AUTH_ACTION_PATH);
const generateSource = readSource(GENERATE_ROUTE_PATH);
const querySource = readSource(QUERY_ROUTE_PATH);

if (adminSource !== null) {
pass(
"admin-source",
"firebase/admin.ts source file is readable.",
);
} else {
fail(
"admin-source",
"firebase/admin.ts source file could not be read.",
);
}

if (authSource !== null) {
pass(
"auth-source",
"lib/actions/auth.action.ts source file is readable.",
);
} else {
fail(
"auth-source",
"lib/actions/auth.action.ts source file could not be read.",
);
}

if (generateSource !== null) {
pass(
"generate-source",
"/api/vapi/generate source file is readable.",
);
} else {
fail(
"generate-source",
"/api/vapi/generate source file could not be read.",
);
}

if (querySource !== null) {
pass(
"query-source",
"/api/farmer/query source file is readable.",
);
} else {
fail(
"query-source",
"/api/farmer/query source file could not be read.",
);
}

// ============================================================
// FIREBASE ADMIN SOURCE SECURITY
// ============================================================

section("FIREBASE ADMIN SOURCE SECURITY");

if (adminSource) {
if (
adminSource.includes(
"initializeApp({",
)
) {
pass(
"admin-initialize-app",
"firebase/admin.ts initializes Firebase Admin with initializeApp.",
);
} else {
fail(
"admin-initialize-app",
"firebase/admin.ts does not visibly initialize Firebase Admin.",
);
}

if (
  adminSource.includes(
    "getApps()",
  )
) {
  pass(
    "admin-existing-app-check",
    "firebase/admin.ts checks existing Firebase Admin apps before initialization.",
  );
} else {
  fail(
    "admin-existing-app-check",
    "firebase/admin.ts does not visibly check existing Firebase Admin apps.",
  );
}

if (
  adminSource.includes(
    "credential: cert(",
  )
) {
  pass(
    "admin-service-account",
    "firebase/admin.ts uses Firebase Admin cert credentials.",
  );
} else {
  fail(
    "admin-service-account",
    "firebase/admin.ts does not visibly use cert credentials.",
  );
}

if (
  adminSource.includes(
    "process.env.FIREBASE_CONFIG",
  )
) {
  pass(
    "admin-firebase-config",
    "firebase/admin.ts supports FIREBASE_CONFIG.",
  );
} else {
  fail(
    "admin-firebase-config",
    "firebase/admin.ts does not reference FIREBASE_CONFIG.",
  );
}

if (
  adminSource.includes(
    "process.env.FIREBASE_PROJECT_ID",
  ) &&
  adminSource.includes(
    "process.env.FIREBASE_CLIENT_EMAIL",
  ) &&
  adminSource.includes(
    "process.env.FIREBASE_PRIVATE_KEY",
  )
) {
  pass(
    "admin-individual-env",
    "firebase/admin.ts supports individual Firebase Admin environment variables.",
  );
} else {
  fail(
    "admin-individual-env",
    "firebase/admin.ts does not contain the expected individual Firebase Admin environment variables.",
  );
}

if (
  adminSource.includes(
    "privateKey.replace(/\\\\n/g, '\\n')",
  ) ||
  adminSource.includes(
    'privateKey.replace(/\\\\n/g, "\\n")',
  )
) {
  pass(
    "admin-private-key-normalization",
    "firebase/admin.ts normalizes escaped private-key newlines.",
  );
} else {
  fail(
    "admin-private-key-normalization",
    "firebase/admin.ts does not visibly normalize escaped private-key newlines.",
  );
}

if (
  adminSource.includes(
    "getAuth()",
  )
) {
  pass(
    "admin-auth-provider",
    "firebase/admin.ts obtains Firebase Admin Auth with getAuth().",
  );
} else {
  fail(
    "admin-auth-provider",
    "firebase/admin.ts does not visibly obtain Firebase Admin Auth.",
  );
}

if (
  adminSource.includes(
    "getFirestore()",
  )
) {
  pass(
    "admin-firestore-provider",
    "firebase/admin.ts obtains Firestore with getFirestore().",
  );
} else {
  fail(
    "admin-firestore-provider",
    "firebase/admin.ts does not visibly obtain Firestore.",
  );
}

}

// ============================================================
// SESSION COOKIE SOURCE SECURITY
// ============================================================

section("SESSION COOKIE SECURITY");

if (authSource) {
if (
authSource.includes(
'cookieStore.get("session")?.value',
)
) {
pass(
"session-cookie-source",
"getCurrentUser reads the authentication session from the server-side session cookie.",
);
} else {
fail(
"session-cookie-source",
"getCurrentUser does not visibly read the expected session cookie.",
);
}

if (
  authSource.includes(
    "auth.verifySessionCookie(",
  )
) {
  pass(
    "session-cookie-verification",
    "getCurrentUser verifies the Firebase session cookie with Firebase Admin.",
  );
} else {
  fail(
    "session-cookie-verification",
    "getCurrentUser does not visibly verify the Firebase session cookie.",
  );
}

if (
  /verifySessionCookie\(\s*sessionCookie\s*,\s*true\s*\)/s.test(
    authSource,
  )
) {
  pass(
    "session-revocation-check",
    "getCurrentUser verifies the session cookie with checkRevoked=true.",
  );
} else {
  fail(
    "session-revocation-check",
    "getCurrentUser does not visibly enable Firebase session revocation checking.",
  );
}

if (
  authSource.includes(
    "cookies()",
  )
) {
  pass(
    "server-cookie-api",
    "getCurrentUser obtains cookies through Next.js server-side cookies().",
  );
} else {
  fail(
    "server-cookie-api",
    "getCurrentUser does not visibly use the Next.js server-side cookies API.",
  );
}

if (
  authSource.includes(
    "httpOnly: true",
  )
) {
  pass(
    "session-http-only",
    "Session cookie is configured as HttpOnly.",
  );
} else {
  fail(
    "session-http-only",
    "Session cookie is not visibly configured as HttpOnly.",
  );
}

if (
  authSource.includes(
    'path: "/"',
  )
) {
  pass(
    "session-cookie-path",
    "Session cookie is scoped to the application path.",
  );
} else {
  fail(
    "session-cookie-path",
    "Session cookie path configuration is not visibly present.",
  );
}

if (
  authSource.includes(
    'sameSite: "lax"',
  )
) {
  pass(
    "session-samesite",
    "Session cookie uses SameSite=Lax.",
  );
} else {
  fail(
    "session-samesite",
    "Session cookie SameSite=Lax configuration is not visibly present.",
  );
}

}

// ============================================================
// GET CURRENT USER IDENTITY PROVENANCE
// ============================================================

section("GET CURRENT USER IDENTITY PROVENANCE");

if (authSource) {
if (
authSource.includes(
"decodedClaims.uid",
)
) {
pass(
"decoded-uid",
"getCurrentUser derives the application lookup UID from verified Firebase decoded claims.",
);
} else {
fail(
"decoded-uid",
"getCurrentUser does not visibly derive the lookup UID from decoded Firebase claims.",
);
}

if (
  /collection\(["']users["']\)\s*\.doc\(decodedClaims\.uid\)/s.test(
    authSource,
  )
) {
  pass(
    "firestore-user-by-verified-uid",
    "getCurrentUser loads the application user from users/{decodedClaims.uid}.",
  );
} else {
  fail(
    "firestore-user-by-verified-uid",
    "getCurrentUser does not visibly load users/{decodedClaims.uid}.",
  );
}

if (
  authSource.includes(
    "if (!userRecord.exists)",
  )
) {
  pass(
    "missing-user-fail-closed",
    "getCurrentUser explicitly rejects a Firebase identity when its application user document does not exist.",
  );
} else {
  fail(
    "missing-user-fail-closed",
    "getCurrentUser does not visibly reject a missing application user document.",
  );
}

if (
  authSource.includes(
    "return null;",
  )
) {
  pass(
    "auth-failure-null",
    "getCurrentUser has a null failure path.",
  );
} else {
  fail(
    "auth-failure-null",
    "getCurrentUser does not visibly fail closed with null.",
  );
}

if (
  /catch\s*\(error\)[\s\S]*?return null;/s.test(
    authSource,
  )
) {
  pass(
    "auth-exception-fail-closed",
    "getCurrentUser catches authentication/database exceptions and fails closed with null.",
  );
} else {
  fail(
    "auth-exception-fail-closed",
    "getCurrentUser does not visibly fail closed on exceptions.",
  );
}

if (
  authSource.includes(
    "return {",
  ) &&
  authSource.includes(
    "id: userRecord.id",
  )
) {
  pass(
    "application-user-return",
    "getCurrentUser returns the verified Firestore application user's document identity.",
  );
} else {
  fail(
    "application-user-return",
    "getCurrentUser does not visibly return the Firestore application user's identity.",
  );
}

}

// ============================================================
// DOWNSTREAM V40.20 INTEGRATION
// ============================================================

section("DOWNSTREAM V40.20 INTEGRATION");

if (generateSource) {
if (
generateSource.includes(
"getCurrentUser",
)
) {
pass(
"generate-get-current-user",
"/api/vapi/generate consumes getCurrentUser for authentication.",
);
} else {
fail(
"generate-get-current-user",
"/api/vapi/generate does not visibly consume getCurrentUser.",
);
}

if (
  generateSource.includes(
    "authenticatedFirebaseUid",
  )
) {
  pass(
    "generate-authenticated-uid",
    "/api/vapi/generate uses a server-derived authenticated Firebase UID.",
  );
} else {
  fail(
    "generate-authenticated-uid",
    "/api/vapi/generate does not visibly use authenticatedFirebaseUid.",
  );
}

}

if (querySource) {
if (
querySource.includes(
"getCurrentUser",
)
) {
pass(
"query-get-current-user",
"/api/farmer/query consumes getCurrentUser for authentication.",
);
} else {
fail(
"query-get-current-user",
"/api/farmer/query does not visibly consume getCurrentUser.",
);
}

if (
  querySource.includes(
    "authenticatedFirebaseUid",
  )
) {
  pass(
    "query-authenticated-uid",
    "/api/farmer/query uses a server-derived authenticated Firebase UID.",
  );
} else {
  fail(
    "query-authenticated-uid",
    "/api/farmer/query does not visibly use authenticatedFirebaseUid.",
  );
}

}

// ============================================================
// FIREBASE READ-ONLY RUNTIME CHECK
// ============================================================

section("FIREBASE READ-ONLY RUNTIME CHECK");

try {
const currentUserUid =
process.env.V40_20_FIREBASE_UID;

if (!currentUserUid) {
  fail(
    "firebase-test-uid",
    "V40_20_FIREBASE_UID is not set; Firebase identity runtime verification cannot run.",
  );
} else {
  try {
    const firebaseUser =
      await auth.getUser(currentUserUid);

    if (firebaseUser.uid === currentUserUid) {
      pass(
        "firebase-user-lookup",
        "Firebase Admin successfully resolved the supplied test Firebase UID.",
      );
    } else {
      fail(
        "firebase-user-lookup",
        "Firebase Admin returned a UID different from the supplied test Firebase UID.",
      );
    }

    const userDoc = await db
      .collection("users")
      .doc(currentUserUid)
      .get();

    if (userDoc.exists) {
      pass(
        "firestore-application-user",
        "Firestore contains the application user document for the verified Firebase UID.",
      );
    } else {
      fail(
        "firestore-application-user",
        "Firestore does not contain the application user document for the verified Firebase UID.",
      );
    }
  } catch (error) {
    fail(
      "firebase-runtime",
      `Firebase read-only runtime verification failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }
}

} catch (error) {
fail(
"firebase-runtime-wrapper",
`Firebase runtime audit failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
);
}

// ============================================================
// POSTGRESQL MUTATION CHECK
// ============================================================

section("POSTGRESQL MUTATION CHECK");

const postgresAfter = await capturePostgresBaseline();

const postgresChecks: Array<
 [string, number, number]
> = [
[
"Users",
postgresBaseline.users,
postgresAfter.users,
],
[
"Farmers",
postgresBaseline.farmers,
postgresAfter.farmers,
],
[
"Farms",
postgresBaseline.farms,
postgresAfter.farms,
],
[
"OfficerFunctions",
postgresBaseline.officerFunctions,
postgresAfter.officerFunctions,
],
[
"OfficerAssignments",
postgresBaseline.officerAssignments,
postgresAfter.officerAssignments,
],
];

for (const [
label,
before,
after,
] of postgresChecks) {
if (before === after) {
pass(
`postgres-${label}`,
`${label} unchanged at ${after}.`,
);
} else {
fail(
`postgres-${label}`,
`${label} changed from ${before} to ${after}.`,
);
}
}

// ============================================================
// SUMMARY
// ============================================================

console.log("");
console.log("=".repeat(70));
console.log("V40.21 AUDIT SUMMARY");
console.log("=".repeat(70));

const passCount = results.filter(
(result) => result.status === "PASS",
).length;

const failCount = results.filter(
(result) => result.status === "FAIL",
).length;

console.log(`PASS    ${passCount}`);
console.log(`FAIL    ${failCount}`);
console.log("REVIEW  0");
console.log("=".repeat(70));

if (failCount === 0) {
console.log("V40.21 STATUS: GREEN");
} else {
console.log("V40.21 STATUS: RED");
}

await prisma.$disconnect();

if (failCount > 0) {
process.exitCode = 1;
}
}

main().catch(async (error) => {
console.error("");
console.error("V40.21 AUDIT FATAL ERROR");
console.error(error);

try {
await prisma.$disconnect();
} catch {
// Ignore disconnect errors during fatal audit handling.
}

process.exitCode = 1;
});




