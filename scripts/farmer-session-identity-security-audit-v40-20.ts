import "dotenv/config";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

type AuditStatus = "PASS" | "FAIL" | "REVIEW";

type AuditResult = {
  status: AuditStatus;
  message: string;
};

type PostgreSQLBaseline = {
  users: number;
  farmers: number;
  farms: number;
  officerFunctions: number;
  officerAssignments: number;
};

type FirebaseAdminModule = typeof import("firebase-admin");

const BASE_URL =
  process.env.V40_20_BASE_URL ||
  "http://localhost:3000";

const TEST_FIREBASE_UID =
  process.env.V40_20_FIREBASE_UID?.trim() || "";

const FORGED_FIREBASE_UID =
  process.env.V40_20_FORGED_FIREBASE_UID?.trim() ||
  "attacker-controlled-user";

const GENERATED_SESSION_IDS = new Set<string>();

const results: AuditResult[] = [];

function record(
  status: AuditStatus,
  message: string,
): void {
  results.push({
    status,
    message,
  });

  const label = status.padEnd(6, " ");

  console.log(
    `${label} ${message}`,
  );
}

function pass(message: string): void {
  record("PASS", message);
}

function fail(message: string): void {
  record("FAIL", message);
}

function review(message: string): void {
  record("REVIEW", message);
}

function getEnv(
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = process.env[name];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return undefined;
}

function printSection(
  title: string,
): void {
  console.log("");
  console.log(title);
  console.log(
    "--------------------------------------------------------------------",
  );
}

function resolveProjectPath(
  relativePath: string,
): string {
  return path.resolve(
    process.cwd(),
    relativePath,
  );
}

function readSourceFile(
  relativePath: string,
): {
  absolutePath: string;
  source: string | null;
} {
  const absolutePath =
    resolveProjectPath(relativePath);

  try {
    return {
      absolutePath,
      source: fs.readFileSync(
        absolutePath,
        "utf8",
      ),
    };
  } catch {
    return {
      absolutePath,
      source: null,
    };
  }
}

// ============================================================
// FIREBASE ADMIN
// ============================================================

async function getFirebaseAdmin(): Promise<{
  admin: FirebaseAdminModule;
  app: any;
}> {
  const admin =
    await import("firebase-admin");

  const projectId =
    getEnv(
      "FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    );

  const clientEmail =
    getEnv(
      "FIREBASE_CLIENT_EMAIL",
    );

  const privateKeyRaw =
    getEnv(
      "FIREBASE_PRIVATE_KEY",
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKeyRaw
  ) {
    throw new Error(
      "Firebase Admin configuration is incomplete.",
    );
  }

  const privateKey =
    privateKeyRaw.replace(
      /\\n/g,
      "\n",
    );

  let app =
    admin.apps[0];

  if (!app) {
    app =
      admin.initializeApp({
        credential:
          admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        projectId,
      });
  }

  return {
    admin,
    app,
  };
}

// ============================================================
// FIREBASE AUTHENTICATED SESSION COOKIE
// ============================================================

async function createFirebaseSessionCookie(
  firebaseUid: string,
): Promise<string> {
  const {
    admin,
    app,
  } =
    await getFirebaseAdmin();

  const apiKey =
    getEnv(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "FIREBASE_API_KEY",
    );

  if (!apiKey) {
    throw new Error(
      "Firebase Web API key is missing.",
    );
  }

  // Verify that the requested test UID is a real Firebase user.
  await admin
    .auth(app)
    .getUser(firebaseUid);

  // Create a real Firebase custom token.
  const customToken =
    await admin
      .auth(app)
      .createCustomToken(
        firebaseUid,
        {
          v40_20_test: true,
        },
      );

  // Exchange custom token for a Firebase ID token.
  const identityToolkitUrl =
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(
      apiKey,
    )}`;

  const signInResponse =
    await fetch(
      identityToolkitUrl,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    );

  if (!signInResponse.ok) {
    const errorText =
      await signInResponse.text();

    throw new Error(
      `Firebase custom-token exchange failed (${signInResponse.status}): ${errorText}`,
    );
  }

  const signInData =
    (await signInResponse.json()) as {
      idToken?: string;
    };

  if (
    !signInData.idToken
  ) {
    throw new Error(
      "Firebase custom-token exchange did not return an idToken.",
    );
  }

  // Create the actual Firebase session cookie
  // consumed by the application's getCurrentUser().
  const sessionCookie =
    await admin
      .auth(app)
      .createSessionCookie(
        signInData.idToken,
        {
          expiresIn:
            60 * 60 * 1000,
        },
      );

  return sessionCookie;
}

// ============================================================
// POSTGRESQL BASELINE
// ============================================================

async function getPostgreSQLBaseline(): Promise<PostgreSQLBaseline> {
  const [
    users,
    farmers,
    farms,
    officerFunctions,
    officerAssignments,
  ] =
    await Promise.all([
      prisma.user.count(),
      prisma.farmer.count(),
      prisma.farm.count(),
      prisma.officerFunction.count(),
      prisma.officerAssignment.count(),
    ]);

  return {
    users,
    farmers,
    farms,
    officerFunctions,
    officerAssignments,
  };
}

function compareCount(
  label: string,
  before: number,
  after: number,
): void {
  if (before === after) {
    pass(
      `${label} unchanged at ${after}.`,
    );
  } else {
    fail(
      `${label} changed from ${before} to ${after}.`,
    );
  }
}

// ============================================================
// CLEANUP
// ============================================================

async function cleanupTemporarySessions(): Promise<void> {
  if (
    GENERATED_SESSION_IDS.size === 0
  ) {
    return;
  }

  console.log("");
  console.log(
    `CLEANUP: ${GENERATED_SESSION_IDS.size} temporary Firestore session(s)...`,
  );

  try {
    const { admin } =
      await getFirebaseAdmin();

    const firestore =
      admin.firestore();

    for (
      const sessionId of GENERATED_SESSION_IDS
    ) {
      try {
        const sessionRef =
          firestore
            .collection(
              "farmer_sessions",
            )
            .doc(sessionId);

        // Delete any query documents first.
        const queriesSnapshot =
          await sessionRef
            .collection("queries")
            .get();

        if (
          !queriesSnapshot.empty
        ) {
          const batch =
            firestore.batch();

          for (
            const queryDoc of queriesSnapshot.docs
          ) {
            batch.delete(
              queryDoc.ref,
            );
          }

          await batch.commit();
        }

        await sessionRef.delete();

        pass(
          `Cleaned temporary Firestore session: ${sessionId}`,
        );
      } catch (error) {
        fail(
          `Failed to clean temporary Firestore session ${sessionId}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }
    }
  } catch (error) {
    fail(
      `Firestore cleanup initialization failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  } finally {
    GENERATED_SESSION_IDS.clear();
  }
}

// ============================================================
// ENVIRONMENT
// ============================================================

async function testEnvironment(): Promise<void> {
  printSection("ENVIRONMENT");

  // FIREBASE_CONFIG is optional because the established
  // application configuration uses individual Firebase
  // environment variables.
  //
  // V40.20 treats either configuration strategy as valid.
  if (
    process.env.FIREBASE_CONFIG
  ) {
    pass(
      "FIREBASE_CONFIG is available.",
    );
  } else {
    const projectId =
      getEnv(
        "FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      );

    const clientEmail =
      getEnv(
        "FIREBASE_CLIENT_EMAIL",
      );

    const privateKey =
      getEnv(
        "FIREBASE_PRIVATE_KEY",
      );

    const apiKey =
      getEnv(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "FIREBASE_API_KEY",
      );

    if (
      projectId &&
      clientEmail &&
      privateKey &&
      apiKey
    ) {
      pass(
        "FIREBASE_CONFIG not set; individual Firebase environment variables are valid and available.",
      );
    } else {
      fail(
        "Firebase configuration is incomplete: neither FIREBASE_CONFIG nor the required individual Firebase variables are fully available.",
      );
    }
  }

  const firebaseProjectId =
    getEnv(
      "FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    );

  const firebaseClientEmail =
    getEnv(
      "FIREBASE_CLIENT_EMAIL",
    );

  const firebasePrivateKey =
    getEnv(
      "FIREBASE_PRIVATE_KEY",
    );

  const firebaseApiKey =
    getEnv(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "FIREBASE_API_KEY",
    );

  if (
    firebaseProjectId &&
    firebaseClientEmail &&
    firebasePrivateKey &&
    firebaseApiKey
  ) {
    pass(
      "Firebase Admin configuration is available.",
    );
  } else {
    fail(
      "Firebase Admin configuration is incomplete.",
    );
  }

  if (
    getEnv("DATABASE_URL")
  ) {
    pass(
      "DATABASE_URL is available.",
    );
  } else {
    fail(
      "DATABASE_URL is not available.",
    );
  }

  if (
    TEST_FIREBASE_UID
  ) {
    pass(
      "V40_20_FIREBASE_UID is available.",
    );
  } else {
    fail(
      "V40_20_FIREBASE_UID is not set.",
    );
  }

  try {
    await getFirebaseAdmin();

    pass(
      "Firebase Admin module initialized successfully.",
    );
  } catch (error) {
    fail(
      `Firebase Admin module initialization failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }
}

// ============================================================
// SOURCE SECURITY
// ============================================================

async function testSourceSecurity(): Promise<void> {
  printSection("SOURCE SECURITY");

  const generate =
    readSourceFile(
      "app/api/vapi/generate/route.ts",
    );

  const query =
    readSourceFile(
      "app/api/farmer/query/route.ts",
    );

  // ----------------------------------------------------------
  // Source availability
  // ----------------------------------------------------------

  if (generate.source) {
    pass(
      "/api/vapi/generate source file is readable.",
    );
  } else {
    fail(
      `/api/vapi/generate source file could not be read: ${generate.absolutePath}`,
    );
  }

  if (query.source) {
    pass(
      "/api/farmer/query source file is readable.",
    );
  } else {
    fail(
      `/api/farmer/query source file could not be read: ${query.absolutePath}`,
    );
  }

  if (
    !generate.source ||
    !query.source
  ) {
    return;
  }

  // ----------------------------------------------------------
  // /api/vapi/generate identity checks
  // ----------------------------------------------------------

  if (
    generate.source.includes(
      "getCurrentUser",
    )
  ) {
    pass(
      "/api/vapi/generate uses getCurrentUser.",
    );
  } else {
    fail(
      "/api/vapi/generate does not use getCurrentUser.",
    );
  }

  const generateDerivesAuthenticatedUid =
    /authenticatedFirebaseUid\s*=\s*await\s+getAuthenticatedFirebaseUid/.test(
      generate.source,
    ) &&
    /typeof\s+currentUser\.id\s*===\s*"string"/.test(
      generate.source,
    );

  if (
    generateDerivesAuthenticatedUid
  ) {
    pass(
      "/api/vapi/generate derives authenticated Firebase UID server-side.",
    );
  } else {
    fail(
      "/api/vapi/generate does not clearly derive Firebase UID server-side.",
    );
  }

  if (
    generate.source.includes(
      "farmer_sessions",
    )
  ) {
    pass(
      "/api/vapi/generate writes/uses farmer_sessions.",
    );
  } else {
    fail(
      "/api/vapi/generate does not visibly use farmer_sessions.",
    );
  }

  const storesAuthenticatedUid =
    /userId\s*:\s*authenticatedFirebaseUid/.test(
      generate.source,
    );

  if (
    storesAuthenticatedUid
  ) {
    pass(
      "/api/vapi/generate stores authenticated Firebase UID as Firestore session userId.",
    );
  } else {
    fail(
      "/api/vapi/generate does not clearly store authenticated Firebase UID as Firestore session userId.",
    );
  }

  // ----------------------------------------------------------
  // userid static-analysis classification
  // ----------------------------------------------------------
  //
  // The production route deliberately accepts legacy/client
  // userid input for compatibility.
  //
  // The security question is NOT:
  //
  //   "Does the source contain the string userid?"
  //
  // The security question is:
  //
  //   "Can client userid influence authenticated identity or
  //    Firestore ownership?"
  //
  // V40.20 therefore verifies all of the following:
  //
  //   1. userid is destructured as a throwaway variable.
  //   2. The variable is explicitly voided.
  //   3. farmerSession.userId uses authenticatedFirebaseUid.
  //   4. The route does not assign _clientSuppliedUserId to
  //      farmerSession.userId.
  //
  // Behavioral E2E later proves this against a real request.
  //

  const safelyDiscardsClientUserid =
    /userid\s*:\s*_clientSuppliedUserId/.test(
      generate.source,
    ) &&
    /void\s+_clientSuppliedUserId\s*;/.test(
      generate.source,
    );

  const clientUseridCannotOwnSession =
    /userId\s*:\s*authenticatedFirebaseUid/.test(
      generate.source,
    ) &&
    !/userId\s*:\s*_clientSuppliedUserId/.test(
      generate.source,
    );

  if (
    safelyDiscardsClientUserid &&
    clientUseridCannotOwnSession
  ) {
    pass(
      "/api/vapi/generate contains a client userid reference only for backward-compatible input; it is explicitly discarded and cannot determine session ownership.",
    );
  } else {
    fail(
      "/api/vapi/generate contains a client userid path that is not sufficiently isolated from authenticated session ownership.",
    );
  }

  // ----------------------------------------------------------
  // Missing authenticated identity
  // ----------------------------------------------------------

  const generateRejectsMissingIdentity =
    /if\s*\(\s*!authenticatedFirebaseUid\s*\)/.test(
      generate.source,
    ) &&
    /status:\s*401/.test(
      generate.source,
    );

  if (
    generateRejectsMissingIdentity
  ) {
    pass(
      "/api/vapi/generate rejects missing authenticated Firebase identity.",
    );
  } else {
    fail(
      "/api/vapi/generate does not clearly reject missing authenticated Firebase identity with 401.",
    );
  }

  // ----------------------------------------------------------
  // /api/farmer/query identity checks
  // ----------------------------------------------------------

  if (
    query.source.includes(
      "getCurrentUser",
    )
  ) {
    pass(
      "/api/farmer/query uses getCurrentUser.",
    );
  } else {
    fail(
      "/api/farmer/query does not use getCurrentUser.",
    );
  }

  const queryDerivesAuthenticatedUid =
    /authenticatedFirebaseUid/.test(
      query.source,
    ) &&
    /currentUser\.id/.test(
      query.source,
    );

  if (
    queryDerivesAuthenticatedUid
  ) {
    pass(
      "/api/farmer/query derives authenticated Firebase UID server-side.",
    );
  } else {
    fail(
      "/api/farmer/query does not clearly derive Firebase UID server-side.",
    );
  }

  if (
    query.source.includes(
      "farmer_sessions",
    )
  ) {
    pass(
      "/api/farmer/query reads farmer_sessions.",
    );
  } else {
    fail(
      "/api/farmer/query does not visibly read farmer_sessions.",
    );
  }

  const hasOwnershipMismatchRejection =
    /403/.test(
      query.source,
    ) &&
    /ownership|owner|userId/i.test(
      query.source,
    );

  if (
    hasOwnershipMismatchRejection
  ) {
    pass(
      "/api/farmer/query contains ownership-mismatch rejection.",
    );
  } else {
    fail(
      "/api/farmer/query does not clearly contain an ownership-mismatch rejection.",
    );
  }

  const comparesStoredOwner =
    /sessionOwnerId/.test(
      query.source,
    ) &&
    /authenticatedFirebaseUid/.test(
      query.source,
    );

  if (
    comparesStoredOwner
  ) {
    pass(
      "/api/farmer/query compares stored session ownership against authenticated Firebase identity.",
    );
  } else {
    fail(
      "/api/farmer/query does not clearly compare stored ownership against authenticated Firebase identity.",
    );
  }

  const destructuresRequestUserId =
    /const\s*\{[\s\S]*userId[\s\S]*\}\s*=\s*body/.test(
      query.source,
    );

  if (
    !destructuresRequestUserId
  ) {
    pass(
      "/api/farmer/query does not trust request userId destructuring.",
    );
  } else {
    fail(
      "/api/farmer/query visibly destructures request userId; authorization must remain server-derived.",
    );
  }

  const visiblyPersistsClientUserId =
    /userId\s*:\s*userId/.test(
      query.source,
    ) ||
    /userId\s*:\s*body\.userId/.test(
      query.source,
    );

  if (
    !visiblyPersistsClientUserId
  ) {
    pass(
      "/api/farmer/query does not visibly persist client-supplied userId.",
    );
  } else {
    fail(
      "/api/farmer/query visibly persists client-supplied userId.",
    );
  }
}

// ============================================================
// HTTP HELPERS
// ============================================================

async function postJson(
  url: string,
  body: unknown,
  cookie?: string,
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type":
      "application/json",
  };

  if (cookie) {
    headers.Cookie =
      `session=${cookie}`;
  }

  return fetch(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
  );
}

async function postWithoutBody(
  url: string,
  cookie?: string,
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type":
      "application/json",
  };

  if (cookie) {
    headers.Cookie =
      `session=${cookie}`;
  }

  return fetch(
    url,
    {
      method: "POST",
      headers,
    },
  );
}

async function safeReadJson(
  response: Response,
): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ============================================================
// UNAUTHENTICATED GENERATE
// ============================================================

async function testUnauthenticatedGenerate(): Promise<void> {
  printSection(
    "UNAUTHENTICATED /api/vapi/generate",
  );

  const response =
    await postJson(
      `${BASE_URL}/api/vapi/generate`,
      {
        breed: "Sasso",
        stage: "starter",
        quantityKg: 10,
        country: "kenya",
        userid:
          FORGED_FIREBASE_UID,
      },
    );

  if (
    response.status === 401
  ) {
    pass(
      "Unauthenticated /api/vapi/generate request returned 401.",
    );
  } else {
    const body =
      await safeReadJson(
        response,
      );

    fail(
      `Unauthenticated /api/vapi/generate returned ${response.status}; expected 401. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }
}

// ============================================================
// UNAUTHENTICATED QUERY
// ============================================================

async function testUnauthenticatedQuery(): Promise<void> {
  printSection(
    "UNAUTHENTICATED /api/farmer/query",
  );

  const response =
    await postJson(
      `${BASE_URL}/api/farmer/query`,
      {
        question:
          "What is the correct feeding approach for this test?",
        sessionId:
          "nonexistent-v40-20-session",
        userId:
          FORGED_FIREBASE_UID,
      },
    );

  if (
    response.status === 401
  ) {
    pass(
      "Unauthenticated /api/farmer/query request returned 401.",
    );
  } else {
    const body =
      await safeReadJson(
        response,
      );

    fail(
      `Unauthenticated /api/farmer/query returned ${response.status}; expected 401. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }
}

// ============================================================
// INVALID SESSION GENERATE
// ============================================================

async function testInvalidSessionGenerate(): Promise<void> {
  printSection(
    "INVALID SESSION /api/vapi/generate",
  );

  const response =
    await postJson(
      `${BASE_URL}/api/vapi/generate`,
      {
        breed: "Sasso",
        stage: "starter",
        quantityKg: 10,
        country: "kenya",
        userid:
          FORGED_FIREBASE_UID,
      },
      "invalid-v40-20-session-cookie",
    );

  if (
    response.status === 401
  ) {
    pass(
      "Invalid Firebase session cookie on /api/vapi/generate returned 401.",
    );
  } else {
    const body =
      await safeReadJson(
        response,
      );

    fail(
      `Invalid Firebase session cookie on /api/vapi/generate returned ${response.status}; expected 401. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }
}

// ============================================================
// INVALID SESSION QUERY
// ============================================================

async function testInvalidSessionQuery(): Promise<void> {
  printSection(
    "INVALID SESSION /api/farmer/query",
  );

  const response =
    await postJson(
      `${BASE_URL}/api/farmer/query`,
      {
        question:
          "What is the correct feeding approach for this test?",
        sessionId:
          "nonexistent-v40-20-session",
        userId:
          FORGED_FIREBASE_UID,
      },
      "invalid-v40-20-session-cookie",
    );

  if (
    response.status === 401
  ) {
    pass(
      "Invalid Firebase session cookie on /api/farmer/query returned 401.",
    );
  } else {
    const body =
      await safeReadJson(
        response,
      );

    fail(
      `Invalid Firebase session cookie on /api/farmer/query returned ${response.status}; expected 401. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }
}

// ============================================================
// FIRESTORE TEMPORARY SESSION
// ============================================================

async function createTemporaryFirestoreSession(
  ownerUid: string,
): Promise<string> {
  const {
    admin,
  } =
    await getFirebaseAdmin();

  const firestore =
    admin.firestore();

  const sessionRef =
    firestore
      .collection(
        "farmer_sessions",
      )
      .doc();

  const sessionId =
    sessionRef.id;

  await sessionRef.set({
    id: sessionId,

    userId: ownerUid,

    language: "en",

    farmerName:
      "V40.20 Security Test",

    breed: "Sasso",

    stage: "starter",

    quantityKg: 10,

    includeCoccidiostat:
      false,

    ingredientPrices: {},

    availableIngredients: [],

    county: "Test",

    subCounty: "Test",

    ward: "Test",

    village: "Test",

    country: "kenya",

    numberOfBirds: 10,

    salePricePerBird: 0,

    pricePerEgg: 0,

    feedName:
      "V40.20 Security Test Feed",

    recipeName:
      "V40.20 Security Test Recipe",

    feedResult: {
      ingredients: [],
      totalCost: 0,
      nutritionalSummary: {
        protein: 0,
        calcium: 0,
        energy: 0,
      },
      mixingInstructions: [],
      warnings: [],
    },

    structuredList: [],

    metadata: {
      createdAt:
        new Date().toISOString(),

      source:
        "V40.20-security-audit",

      version:
        "V40.20",
    },
  });

  GENERATED_SESSION_IDS.add(
    sessionId,
  );

  return sessionId;
}

// ============================================================
// SESSION ID EXTRACTION
// ============================================================

function extractSessionId(
  responseBody: any,
): string | null {
  if (
    responseBody &&
    typeof responseBody.sessionId ===
      "string" &&
    responseBody.sessionId.trim()
  ) {
    return responseBody.sessionId.trim();
  }

  if (
    responseBody &&
    responseBody.data &&
    typeof responseBody.data.sessionId ===
      "string" &&
    responseBody.data.sessionId.trim()
  ) {
    return responseBody.data.sessionId.trim();
  }

  return null;
}

// ============================================================
// AUTHENTICATED FIREBASE E2E
// ============================================================

async function testAuthenticatedE2E(): Promise<void> {
  printSection(
    "AUTHENTICATED FIREBASE E2E",
  );

  if (!TEST_FIREBASE_UID) {
    fail(
      "Authenticated E2E cannot run because V40_20_FIREBASE_UID is missing.",
    );

    return;
  }

  let sessionCookie: string;

  try {
    sessionCookie =
      await createFirebaseSessionCookie(
        TEST_FIREBASE_UID,
      );

    pass(
      "Created a real Firebase session cookie for the supplied test Firebase UID.",
    );
  } catch (error) {
    fail(
      `Could not create Firebase session cookie: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );

    return;
  }

  // ========================================================
  // Generate with valid formulation data AND forged userid.
  // ========================================================

  const generatePayload = {
    breed: "Sasso",
    stage: "starter",
    quantityKg: 10,
    country: "kenya",

    // DELIBERATELY FORGED.
    //
    // The production route must ignore this value for
    // authentication and Firestore ownership.
    userid:
      FORGED_FIREBASE_UID,

    farmerName:
      "V40.20 Security Test",

    includeCoccidiostat:
      false,

    ingredientPrices: {},

    availableIngredients: [],

    numberOfBirds: 10,

    salePricePerBird: 0,

    pricePerEgg: 0,
  };

  const generateResponse =
    await postJson(
      `${BASE_URL}/api/vapi/generate`,
      generatePayload,
      sessionCookie,
    );

  const generateBody =
    await safeReadJson(
      generateResponse,
    );

  if (
    generateResponse.status >= 200 &&
    generateResponse.status < 300
  ) {
    pass(
      `Authenticated /api/vapi/generate returned ${generateResponse.status}.`,
    );
  } else {
    fail(
      `Authenticated /api/vapi/generate returned ${generateResponse.status}; expected a successful response. Response: ${JSON.stringify(
        generateBody,
      )}`,
    );

    return;
  }

  const generatedSessionId =
    extractSessionId(
      generateBody,
    );

  if (
    generatedSessionId
  ) {
    GENERATED_SESSION_IDS.add(
      generatedSessionId,
    );

    pass(
      `Authenticated generate returned session identifier: ${generatedSessionId}`,
    );
  } else {
    fail(
      "Authenticated generate succeeded but no session identifier was found in the response.",
    );

    return;
  }

  // ========================================================
  // Independently verify Firestore ownership.
  // ========================================================

  try {
    const {
      admin,
    } =
      await getFirebaseAdmin();

    const firestore =
      admin.firestore();

    const sessionSnapshot =
      await firestore
        .collection(
          "farmer_sessions",
        )
        .doc(generatedSessionId)
        .get();

    if (
      !sessionSnapshot.exists
    ) {
      fail(
        `Generated Firestore session ${generatedSessionId} does not exist.`,
      );
    } else {
      const sessionData =
        sessionSnapshot.data();

      const storedOwner =
        sessionData?.userId;

      if (
        storedOwner ===
        TEST_FIREBASE_UID
      ) {
        pass(
          "Generated Firestore session owner matches the authenticated Firebase UID.",
        );
      } else {
        fail(
          `Generated Firestore session owner mismatch. Expected ${TEST_FIREBASE_UID}; received ${String(
            storedOwner,
          )}.`,
        );
      }

      if (
        storedOwner !==
        FORGED_FIREBASE_UID
      ) {
        pass(
          "Forged client userid was not used as the Firestore session owner.",
        );
      } else {
        fail(
          "SECURITY FAILURE: forged client userid became the Firestore session owner.",
        );
      }
    }
  } catch (error) {
    fail(
      `Could not independently verify generated Firestore session ownership: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }

  // ========================================================
  // Query owned session.
  // ========================================================
  //
  // Again deliberately include forged userId in the body.
  // /api/farmer/query must ignore it and derive identity from
  // getCurrentUser().
  //

  const ownedQueryResponse =
    await postJson(
      `${BASE_URL}/api/farmer/query`,
      {
        question:
          "What is the correct feeding approach for this test?",

        sessionId:
          generatedSessionId,

        userId:
          FORGED_FIREBASE_UID,

        sessionData: {
          v40_20_test: true,
        },
      },
      sessionCookie,
    );

  if (
    ownedQueryResponse.status >=
      200 &&
    ownedQueryResponse.status < 300
  ) {
    pass(
      "Authenticated /api/farmer/query accepted the session owned by the authenticated Firebase UID.",
    );
  } else {
    const body =
      await safeReadJson(
        ownedQueryResponse,
      );

    fail(
      `Authenticated /api/farmer/query returned ${ownedQueryResponse.status} for the authenticated owner's session; expected 2xx. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }

  // ========================================================
  // Create a temporary session owned by a forged UID.
  // ========================================================

  const forgedSessionId =
    await createTemporaryFirestoreSession(
      FORGED_FIREBASE_UID,
    );

  const forgedOwnerQueryResponse =
    await postJson(
      `${BASE_URL}/api/farmer/query`,
      {
        question:
          "Attempt to access another farmer session.",

        sessionId:
          forgedSessionId,

        // Also forge request userId.
        userId:
          FORGED_FIREBASE_UID,

        sessionData: {
          v40_20_test: true,
        },
      },
      sessionCookie,
    );

  if (
    forgedOwnerQueryResponse.status ===
    403
  ) {
    pass(
      "Forged/mismatched Firestore session ownership was rejected with 403.",
    );
  } else {
    const body =
      await safeReadJson(
        forgedOwnerQueryResponse,
      );

    fail(
      `Forged/mismatched Firestore session ownership returned ${forgedOwnerQueryResponse.status}; expected 403. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }

  // ========================================================
  // Nonexistent session.
  // ========================================================

  const nonexistentSessionId =
    `v40-20-nonexistent-${Date.now()}`;

  const nonexistentQueryResponse =
    await postJson(
      `${BASE_URL}/api/farmer/query`,
      {
        question:
          "Query a nonexistent session.",

        sessionId:
          nonexistentSessionId,

        userId:
          FORGED_FIREBASE_UID,
      },
      sessionCookie,
    );

  if (
    nonexistentQueryResponse.status ===
    404
  ) {
    pass(
      "Authenticated query against a nonexistent farmer session returned 404.",
    );
  } else {
    const body =
      await safeReadJson(
        nonexistentQueryResponse,
      );

    fail(
      `Authenticated query against nonexistent session returned ${nonexistentQueryResponse.status}; expected 404. Response: ${JSON.stringify(
        body,
      )}`,
    );
  }
}

// ============================================================
// SUMMARY
// ============================================================

function printSummary(): void {
  const passCount =
    results.filter(
      (result) =>
        result.status === "PASS",
    ).length;

  const failCount =
    results.filter(
      (result) =>
        result.status === "FAIL",
    ).length;

  const reviewCount =
    results.filter(
      (result) =>
        result.status === "REVIEW",
    ).length;

  console.log("");
  console.log(
    "======================================================================",
  );
  console.log(
    "V40.20 AUDIT SUMMARY",
  );
  console.log(
    "======================================================================",
  );

  console.log(
    `PASS    ${passCount}`,
  );

  console.log(
    `FAIL    ${failCount}`,
  );

  console.log(
    `REVIEW  ${reviewCount}`,
  );

  console.log(
    "======================================================================",
  );

  if (failCount > 0) {
    console.log(
      "V40.20 STATUS: RED",
    );
  } else if (
    reviewCount > 0
  ) {
    console.log(
      "V40.20 STATUS: AMBER",
    );
  } else {
    console.log(
      "V40.20 STATUS: GREEN",
    );
  }

  console.log(
    "======================================================================",
  );
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log("");
  console.log(
    "V40.20 FARMER SESSION IDENTITY SECURITY AUDIT",
  );
  console.log(
    "======================================================================",
  );
  console.log(
    `Base URL: ${BASE_URL}`,
  );
  console.log(
    "READ-ONLY PostgreSQL: NO INSERT / UPDATE / DELETE",
  );
  console.log(
    "Firestore test sessions are temporary and cleaned up.",
  );
  console.log(
    "======================================================================",
  );

  let baseline: PostgreSQLBaseline | null =
    null;

  try {
    baseline =
      await getPostgreSQLBaseline();

    pass(
      `PostgreSQL baseline captured: Users=${baseline.users}, Farmers=${baseline.farmers}, Farms=${baseline.farms}, OfficerFunctions=${baseline.officerFunctions}, OfficerAssignments=${baseline.officerAssignments}.`,
    );

    await testEnvironment();

    await testSourceSecurity();

    await testUnauthenticatedGenerate();

    await testUnauthenticatedQuery();

    await testInvalidSessionGenerate();

    await testInvalidSessionQuery();

    await testAuthenticatedE2E();

    // ========================================================
    // PostgreSQL mutation check
    // ========================================================

    printSection(
      "POSTGRESQL MUTATION CHECK",
    );

    const after =
      await getPostgreSQLBaseline();

    compareCount(
      "Users",
      baseline.users,
      after.users,
    );

    compareCount(
      "Farmers",
      baseline.farmers,
      after.farmers,
    );

    compareCount(
      "Farms",
      baseline.farms,
      after.farms,
    );

    compareCount(
      "OfficerFunctions",
      baseline.officerFunctions,
      after.officerFunctions,
    );

    compareCount(
      "OfficerAssignments",
      baseline.officerAssignments,
      after.officerAssignments,
    );
  } catch (error) {
    fail(
      `Unexpected V40.20 audit error: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  } finally {
    await cleanupTemporarySessions();

    printSummary();

    await prisma.$disconnect();
  }
}

main().catch(
  (error) => {
    console.error(
      "Fatal V40.20 audit failure:",
      error,
    );

    process.exitCode = 1;
  },
);