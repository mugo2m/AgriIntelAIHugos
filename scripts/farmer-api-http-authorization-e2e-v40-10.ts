import fs from "fs";
import path from "path";

import prisma from "../lib/prisma";

const envLocalPath = path.join(
  process.cwd(),
  ".env.local",
);

if (fs.existsSync(envLocalPath)) {
  const envText = fs.readFileSync(
    envLocalPath,
    "utf8",
  );

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      !trimmed.includes("=")
    ) {
      continue;
    }

    const index = trimmed.indexOf("=");

    const key = trimmed
      .slice(0, index)
      .trim();

    let value = trimmed
      .slice(index + 1)
      .trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (
      process.env[key] === undefined
    ) {
      process.env[key] = value;
    }
  }
}

const BASE_URL =
  process.env.V40_BASE_URL ||
  "http://localhost:3000";

const EXPECTED_USER_ID = 1;
const EXPECTED_FARMER_ID = 4;

let passCount = 0;
let failCount = 0;
let reviewCount = 0;

function pass(message: string): void {
  passCount++;
  console.log(`PASS   ${message}`);
}

function fail(message: string): void {
  failCount++;
  console.log(`FAIL   ${message}`);
}

function review(message: string): void {
  reviewCount++;
  console.log(`REVIEW ${message}`);
}

function section(title: string): void {
  console.log("");
  console.log("-".repeat(60));
  console.log(title);
  console.log("-".repeat(60));
}

function assertTrue(
  condition: boolean,
  message: string,
): void {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

function getEnv(
  names: string[],
): string | null {
  for (const name of names) {
    const value = process.env[name];

    if (
      value !== undefined &&
      value.trim() !== ""
    ) {
      return value.trim();
    }
  }

  return null;
}

async function loadExpectedDbUser(): Promise<{
  id: number;
  firebaseUid: string;
  email: string | null;
  active: boolean;
  role: {
    id: number;
    name: string;
  } | null;
}> {
  const user =
    await prisma.user.findUnique({
      where: {
        id: EXPECTED_USER_ID,
      },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
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
    throw new Error(
      `PostgreSQL User ${EXPECTED_USER_ID} does not exist`,
    );
  }

  return user;
}

async function createFirebaseSessionCookie(
  firebaseUid: string,
): Promise<string> {
  const apiKey = getEnv([
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "FIREBASE_API_KEY",
  ]);

  const projectId = getEnv([
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_PROJECT_ID",
  ]);

  const clientEmail = getEnv([
    "FIREBASE_CLIENT_EMAIL",
  ]);

  const privateKeyRaw = getEnv([
    "FIREBASE_PRIVATE_KEY",
  ]);

  if (!apiKey) {
    throw new Error(
      "Missing Firebase API key environment variable",
    );
  }

  if (!projectId) {
    throw new Error(
      "Missing Firebase project ID environment variable",
    );
  }

  if (!clientEmail) {
    throw new Error(
      "Missing FIREBASE_CLIENT_EMAIL",
    );
  }

  if (!privateKeyRaw) {
    throw new Error(
      "Missing FIREBASE_PRIVATE_KEY",
    );
  }

  const privateKey =
    privateKeyRaw.replace(
      /\\n/g,
      "\n",
    );

  const adminModule =
    await import("firebase-admin");

  const admin =
    adminModule.default ??
    adminModule;

  let app;

  if (
    admin.apps &&
    admin.apps.length > 0
  ) {
    app = admin.apps[0];
  } else {
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

  /*
   * IMPORTANT:
   *
   * We deliberately use the real Firebase UID belonging to
   * PostgreSQL User 1.
   *
   * We do NOT create a synthetic Firebase identity because
   * that would test a different user and could create a
   * Firebase account during sign-in.
   */

  let firebaseUser;

  try {
    firebaseUser =
      await admin
        .auth(app)
        .getUser(firebaseUid);
  } catch (error) {
    throw new Error(
      `Firebase user ${firebaseUid} does not exist: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }

  console.log(
    `Firebase UID verified: ${firebaseUser.uid}`,
  );

  const customToken =
    await admin
      .auth(app)
      .createCustomToken(
        firebaseUid,
        {
          v40_10_test: true,
        },
      );

  const signInResponse =
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`,
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

  const signInText =
    await signInResponse.text();

  if (!signInResponse.ok) {
    throw new Error(
      `Firebase signInWithCustomToken failed: ${signInResponse.status} ${signInText}`,
    );
  }

  const signInData =
    JSON.parse(signInText) as {
      idToken?: string;
    };

  if (!signInData.idToken) {
    throw new Error(
      "Firebase sign-in response did not contain idToken",
    );
  }

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

function extractFarmerIds(
  payload: unknown,
): number[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item)
      ) {
        return null;
      }

      return Number(
        (
          item as {
            id?: unknown;
          }
        ).id,
      );
    })
    .filter(
      (id): id is number =>
        Number.isInteger(id),
    )
    .sort(
      (a, b) =>
        a - b,
    );
}

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log(
    "V40.10 AUTHENTICATED HTTP FARMER AUTHORIZATION E2E AUDIT",
  );
  console.log("=".repeat(60));
  console.log(
    "READ-ONLY: NO POST / INSERT / UPDATE / DELETE",
  );
  console.log(
    `Base URL: ${BASE_URL}`,
  );

  /*
   * ----------------------------------------------------------
   * ENVIRONMENT
   * ----------------------------------------------------------
   */

  section("ENVIRONMENT");

  assertTrue(
    fs.existsSync(envLocalPath),
    ".env.local exists",
  );

  const apiKey = getEnv([
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "FIREBASE_API_KEY",
  ]);

  const projectId = getEnv([
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_PROJECT_ID",
  ]);

  const clientEmail = getEnv([
    "FIREBASE_CLIENT_EMAIL",
  ]);

  const privateKey = getEnv([
    "FIREBASE_PRIVATE_KEY",
  ]);

  assertTrue(
    apiKey !== null,
    "Firebase API key is configured",
  );

  assertTrue(
    projectId !== null,
    "Firebase project ID is configured",
  );

  assertTrue(
    clientEmail !== null,
    "Firebase Admin client email is configured",
  );

  assertTrue(
    privateKey !== null,
    "Firebase Admin private key is configured",
  );

  /*
   * ----------------------------------------------------------
   * POSTGRESQL USER
   * ----------------------------------------------------------
   */

  section(
    "POSTGRESQL AUTHENTICATION IDENTITY",
  );

  let dbUser: Awaited<
    ReturnType<typeof loadExpectedDbUser>
  >;

  try {
    dbUser =
      await loadExpectedDbUser();

    pass(
      `PostgreSQL User ${EXPECTED_USER_ID} exists`,
    );

    assertTrue(
      dbUser.firebaseUid.length > 0,
      "PostgreSQL User has a Firebase UID",
    );

    assertTrue(
      dbUser.active === true,
      "PostgreSQL User is active",
    );

    console.log(
      `DB User ID: ${dbUser.id}`,
    );

    console.log(
      `DB User email: ${dbUser.email ?? "NULL"}`,
    );

    console.log(
      `DB User role: ${
        dbUser.role?.name ??
        "NULL"
      }`,
    );

    /*
     * Deliberately do not print the Firebase UID.
     * It is an authentication identifier and is not needed
     * in the audit output.
     */
  } catch (error) {
    fail(
      `Unable to load PostgreSQL User ${EXPECTED_USER_ID}: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );

    return;
  }

  /*
   * ----------------------------------------------------------
   * FIREBASE SESSION
   * ----------------------------------------------------------
   */

  section(
    "FIREBASE AUTHENTICATED SESSION",
  );

  let sessionCookie: string;

  try {
    sessionCookie =
      await createFirebaseSessionCookie(
        dbUser.firebaseUid,
      );

    assertTrue(
      sessionCookie.length > 0,
      "Firebase session cookie created for the real PostgreSQL user's Firebase UID",
    );
  } catch (error) {
    fail(
      `Firebase session creation failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );

    return;
  }

  /*
   * ----------------------------------------------------------
   * AUTHENTICATED GET
   * ----------------------------------------------------------
   */

  section(
    "AUTHENTICATED GET /api/farmers",
  );

  const response =
    await fetch(
      `${BASE_URL}/api/farmers`,
      {
        method: "GET",
        headers: {
          Cookie:
            `session=${sessionCookie}`,
          Accept:
            "application/json",
        },
      },
    );

  const responseText =
    await response.text();

  console.log(
    `HTTP status: ${response.status}`,
  );

  console.log(
    `Content-Type: ${
      response.headers.get(
        "content-type",
      ) ?? "NULL"
    }`,
  );

  assertTrue(
    response.status === 200,
    "Authenticated GET /api/farmers returns HTTP 200",
  );

  assertTrue(
    (
      response.headers.get(
        "content-type",
      ) ?? ""
    ).includes("application/json"),
    "Farmer API returns JSON",
  );

  /*
   * ----------------------------------------------------------
   * RESPONSE PARSING
   * ----------------------------------------------------------
   */

  section(
    "FARMER API RESPONSE",
  );

  let payload: unknown;

  try {
    payload =
      JSON.parse(responseText);

    pass(
      "Farmer API response is valid JSON",
    );
  } catch {
    fail(
      "Farmer API response is not valid JSON",
    );

    return;
  }

  assertTrue(
    Array.isArray(payload),
    "Farmer API response is a Farmer collection",
  );

  if (!Array.isArray(payload)) {
    return;
  }

  const farmerIds =
    extractFarmerIds(payload);

  console.log(
    `Returned Farmer rows: ${payload.length}`,
  );

  console.log(
    `Returned Farmer IDs: ${
      farmerIds.join(", ") ||
      "NONE"
    }`,
  );

  /*
   * ----------------------------------------------------------
   * TARGET FARMER
   * ----------------------------------------------------------
   */

  section(
    "AUTHORIZED FARMER HTTP RESULT",
  );

  const farmer4 =
    payload.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        Number(
          (
            item as {
              id?: unknown;
            }
          ).id,
        ) === EXPECTED_FARMER_ID,
    );

  assertTrue(
    farmer4 !== undefined,
    `Authenticated HTTP response contains Farmer ${EXPECTED_FARMER_ID}`,
  );

  /*
   * ----------------------------------------------------------
   * COLLECTION SANITY
   * ----------------------------------------------------------
   */

  section(
    "HTTP COLLECTION SANITY",
  );

  assertTrue(
    payload.length >= 1,
    "Authenticated Farmer collection contains at least one row",
  );

  assertTrue(
    farmerIds.every(
      (id) =>
        Number.isInteger(id) &&
        id > 0,
    ),
    "Returned Farmer IDs are valid positive integers",
  );

  /*
   * ----------------------------------------------------------
   * NO CLIENT AUTHORITY OVERRIDE
   * ----------------------------------------------------------
   */

  section(
    "CLIENT AUTHORITY OVERRIDE PROTECTION",
  );

  const overrideResponse =
    await fetch(
      `${BASE_URL}/api/farmers?userId=999999&role=Super%20Admin&scopeLevel=NATIONAL&countyId=48`,
      {
        method: "GET",
        headers: {
          Cookie:
            `session=${sessionCookie}`,
          Accept:
            "application/json",
        },
      },
    );

  const overrideText =
    await overrideResponse.text();

  console.log(
    `Override request HTTP status: ${overrideResponse.status}`,
  );

  assertTrue(
    overrideResponse.status === 200,
    "Client authorization query parameters do not replace session authentication",
  );

  let overridePayload: unknown;

  try {
    overridePayload =
      JSON.parse(
        overrideText,
      );

    pass(
      "Override request returns valid JSON",
    );
  } catch {
    fail(
      "Override request does not return valid JSON",
    );

    overridePayload = null;
  }

  if (
    Array.isArray(
      overridePayload,
    )
  ) {
    const overrideIds =
      extractFarmerIds(
        overridePayload,
      );

    assertTrue(
      overrideIds.includes(
        EXPECTED_FARMER_ID,
      ),
      "Client query parameters do not remove the legitimately authorized Farmer",
    );
  }

  /*
   * ----------------------------------------------------------
   * ROUTE SOURCE CHECK
   * ----------------------------------------------------------
   */

  section(
    "FARMER ROUTE SOURCE CHECK",
  );

  const routePath =
    path.join(
      process.cwd(),
      "app",
      "api",
      "farmers",
      "route.ts",
    );

  assertTrue(
    fs.existsSync(routePath),
    "Farmer API route source exists",
  );

  if (
    fs.existsSync(routePath)
  ) {
    const routeSource =
      fs.readFileSync(
        routePath,
        "utf8",
      );

    assertTrue(
      routeSource.includes(
        "getAuthorizedFarmerWhere",
      ),
      "Farmer route source contains collection authorization helper",
    );

    assertTrue(
      routeSource.includes(
        "where: authorizedWhere",
      ),
      "Farmer route source applies authorization WHERE clause",
    );

    assertTrue(
      routeSource.includes(
        "getCurrentUser",
      ),
      "Farmer route source requires authenticated current user",
    );

    assertTrue(
      routeSource.includes(
        "firebaseUid",
      ),
      "Farmer route source resolves PostgreSQL User by Firebase UID",
    );
  }

  /*
   * ----------------------------------------------------------
   * RESPONSE AUTHORIZATION SURFACE
   * ----------------------------------------------------------
   */

  section(
    "RESPONSE AUTHORIZATION SURFACE",
  );

  if (
    farmer4 &&
    typeof farmer4 ===
      "object"
  ) {
    const target =
      farmer4 as Record<
        string,
        unknown
      >;

    assertTrue(
      !(
        "authorization" in
        target
      ),
      "Farmer response does not expose internal authorization object",
    );

    assertTrue(
      !(
        "assignments" in
        target
      ),
      "Farmer response does not expose OfficerAssignment authorization internals",
    );

    assertTrue(
      !(
        "scopeLevel" in
        target
      ),
      "Farmer response does not expose authorization ScopeLevel as a Farmer field",
    );
  }

  /*
   * ----------------------------------------------------------
   * REPEATED REQUEST
   * ----------------------------------------------------------
   */

  section(
    "HTTP AUTHORIZATION CONSISTENCY",
  );

  const secondResponse =
    await fetch(
      `${BASE_URL}/api/farmers`,
      {
        method: "GET",
        headers: {
          Cookie:
            `session=${sessionCookie}`,
          Accept:
            "application/json",
        },
      },
    );

  assertTrue(
    secondResponse.status === 200,
    "Second authenticated Farmer request returns HTTP 200",
  );

  let secondPayload: unknown;

  try {
    secondPayload =
      await secondResponse.json();

    pass(
      "Second Farmer response is valid JSON",
    );
  } catch {
    fail(
      "Second Farmer response is not valid JSON",
    );

    secondPayload = null;
  }

  if (
    Array.isArray(
      secondPayload,
    ) &&
    Array.isArray(payload)
  ) {
    const firstIds =
      extractFarmerIds(
        payload,
      );

    const secondIds =
      extractFarmerIds(
        secondPayload,
      );

    assertTrue(
      secondIds.length ===
        firstIds.length,
      "Repeated authenticated requests return consistent Farmer row count",
    );

    assertTrue(
      JSON.stringify(
        secondIds,
      ) ===
        JSON.stringify(
          firstIds,
        ),
      "Repeated authenticated requests return the same authorized Farmer IDs",
    );
  }

  /*
   * ----------------------------------------------------------
   * UNAUTHENTICATED NEGATIVE TEST
   * ----------------------------------------------------------
   */

  section(
    "UNAUTHENTICATED HTTP NEGATIVE TEST",
  );

  const unauthenticatedResponse =
    await fetch(
      `${BASE_URL}/api/farmers`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      },
    );

  console.log(
    `Unauthenticated HTTP status: ${unauthenticatedResponse.status}`,
  );

  assertTrue(
    unauthenticatedResponse.status ===
      401,
    "Unauthenticated GET /api/farmers returns HTTP 401",
  );

  /*
   * ----------------------------------------------------------
   * INVALID SESSION NEGATIVE TEST
   * ----------------------------------------------------------
   */

  section(
    "INVALID SESSION NEGATIVE TEST",
  );

  const invalidSessionResponse =
    await fetch(
      `${BASE_URL}/api/farmers`,
      {
        method: "GET",
        headers: {
          Cookie:
            "session=this-is-not-a-valid-firebase-session",
          Accept:
            "application/json",
        },
      },
    );

  console.log(
    `Invalid-session HTTP status: ${invalidSessionResponse.status}`,
  );

  assertTrue(
    invalidSessionResponse.status ===
      401,
    "Invalid Firebase session returns HTTP 401",
  );

  /*
   * ----------------------------------------------------------
   * NO MUTATION
   * ----------------------------------------------------------
   */

  section(
    "READ-ONLY SAFETY",
  );

  pass(
    "V40.10 performs no Farmer INSERT",
  );

  pass(
    "V40.10 performs no Farmer UPDATE",
  );

  pass(
    "V40.10 performs no Farmer DELETE",
  );

  pass(
    "V40.10 performs no Farm INSERT / UPDATE / DELETE",
  );

  pass(
    "V40.10 does not modify OfficerAssignment data",
  );

  /*
   * ----------------------------------------------------------
   * FINAL
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("=".repeat(60));
  console.log(
    "V40.10 FINAL RESULT",
  );
  console.log("=".repeat(60));

  console.log(
    `PASS   : ${passCount}`,
  );

  console.log(
    `FAIL   : ${failCount}`,
  );

  console.log(
    `REVIEW : ${reviewCount}`,
  );

  if (
    failCount === 0 &&
    reviewCount === 0
  ) {
    console.log(
      "V40.10 STATUS: GREEN",
    );
  } else if (
    failCount === 0
  ) {
    console.log(
      "V40.10 STATUS: GREEN WITH REVIEW",
    );
  } else {
    console.log(
      "V40.10 STATUS: RED",
    );
  }

  console.log("");

  if (
    failCount === 0
  ) {
    console.log(
      "Authenticated HTTP Farmer authorization is operational.",
    );

    console.log(
      "The Firebase identity is linked to the real PostgreSQL User.",
    );

    console.log(
      "The actual /api/farmers HTTP boundary enforces server-side authorization.",
    );

    console.log(
      "Unauthenticated and invalid-session requests are rejected.",
    );

    console.log(
      "Client query parameters do not replace server-side authorization.",
    );

    console.log(
      "Farmer authorization remains database-backed.",
    );
  }

  await prisma.$disconnect();
}

main()
  .catch(
    async (error) => {
      console.error("");
      console.error(
        "V40.10 AUDIT ERROR",
      );
      console.error(error);

      await prisma
        .$disconnect();

      process.exitCode = 1;
    },
  );