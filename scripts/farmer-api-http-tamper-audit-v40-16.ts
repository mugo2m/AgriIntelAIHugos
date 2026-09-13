import fs from "fs";
import path from "path";

import dotenv from "dotenv";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import prisma from "../lib/prisma";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

type HttpResult = {
  status: number;
  body: unknown;
  farmerIds: number[];
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

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function extractFarmerIds(body: unknown): number[] {
  if (!Array.isArray(body)) {
    return [];
  }

  return body
    .filter(
      (row): row is { id: number } =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as { id?: unknown }).id === "number",
    )
    .map((row) => row.id)
    .sort((a, b) => a - b);
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

async function requestFarmers(
  baseUrl: string,
  sessionCookie?: string,
  query = "",
): Promise<HttpResult> {
  const url =
    `${normalizeBaseUrl(baseUrl)}/api/farmers` +
    (query ? `?${query}` : "");

  const headers: Record<string, string> = {};

  if (sessionCookie) {
    headers.Cookie = `session=${sessionCookie}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "manual",
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return {
    status: response.status,
    body,
    farmerIds: extractFarmerIds(body),
  };
}

async function getFirebaseAdmin() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return getAuth(existingApps[0]);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env.local",
    );
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getAuth(app);
}

async function createRealUserSessionCookie(
  firebaseUid: string,
): Promise<string> {
  const adminAuth = await getFirebaseAdmin();

  await adminAuth.getUser(firebaseUid);

  const customToken = await adminAuth.createCustomToken(firebaseUid);

  const identityToolkitKey =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!identityToolkitKey) {
    throw new Error(
      "Missing FIREBASE_WEB_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY in .env.local",
    );
  }

  const signInResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(
      identityToolkitKey,
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    },
  );

  if (!signInResponse.ok) {
    const text = await signInResponse.text();

    throw new Error(
      `Firebase signInWithCustomToken failed: HTTP ${signInResponse.status} ${text}`,
    );
  }

  const signInJson = (await signInResponse.json()) as {
    idToken?: string;
  };

  if (!signInJson.idToken) {
    throw new Error("Firebase sign-in response did not contain idToken");
  }

  const sessionDurationMs = 5 * 24 * 60 * 60 * 1000;

  return adminAuth.createSessionCookie(signInJson.idToken, {
    expiresIn: sessionDurationMs,
  });
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("V40.16 AUTHENTICATED HTTP AUTHORIZATION TAMPER AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  const baseUrl =
    process.env.V40_16_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  console.log(`HTTP Base URL: ${normalizeBaseUrl(baseUrl)}`);

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
    console.log(`REVIEW ${label}${detail ? `: ${detail}` : ""}`);
  }

  section("1. DATABASE BASELINE");

  const dbUser = await prisma.user.findUnique({
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

  if (!dbUser) {
    F("User 1 exists");
    throw new Error("User 1 does not exist");
  }

  P(
    "User 1 exists",
    `firebaseUid=${dbUser.firebaseUid}, role=${dbUser.role.name}`,
  );

  if (dbUser.active) {
    P("User 1 is active");
  } else {
    F("User 1 is active");
    throw new Error("User 1 is inactive");
  }

  const assignments = await prisma.officerAssignment.findMany({
    where: {
      userId: dbUser.id,
      active: true,
    },
    select: {
      id: true,
      userId: true,
      roleId: true,
      functionId: true,
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
      scopeLevel: true,
      countryId: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      active: true,
      source: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (assignments.length === 5) {
    P("User 1 has exactly five active OfficerAssignments");
  } else {
    F(
      "User 1 has exactly five active OfficerAssignments",
      `found ${assignments.length}`,
    );
  }

  for (const assignment of assignments) {
    console.log(
      `Assignment ${assignment.id} | ${assignment.role.name} | ` +
        `${assignment.function.name} | ${assignment.scopeLevel} | ` +
        `country=${assignment.countryId} county=${assignment.countyId} ` +
        `subCounty=${assignment.subCountyId} ward=${assignment.wardId}`,
    );
  }

  section("2. FARMER BASELINE");

  const farmersBefore = await prisma.farmer.findMany({
    select: {
      id: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const farmerIdsBefore = farmersBefore
    .map((farmer) => farmer.id)
    .sort((a, b) => a - b);

  console.log(`Farmer rows before HTTP tests: ${farmersBefore.length}`);
  console.log(`Farmer IDs: ${farmerIdsBefore.join(", ") || "(none)"}`);

  const farmer4 = await prisma.farmer.findUnique({
    where: {
      id: 4,
    },
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
    F("Farmer 4 exists");
    throw new Error("Farmer 4 does not exist");
  }

  P(
    "Farmer 4 exists",
    `${farmer4.county.name} → ${farmer4.subCounty.name} → ${farmer4.ward.name}`,
  );

  section("3. CREATE AUTHENTICATED SESSION FOR REAL USER 1");

  const sessionCookie = await createRealUserSessionCookie(dbUser.firebaseUid);

  if (sessionCookie) {
    P("Real Firebase session cookie created");
  } else {
    F("Real Firebase session cookie created");
    throw new Error("Session cookie creation failed");
  }

  section("4. BASELINE AUTHENTICATED HTTP REQUEST");

  const baseline = await requestFarmers(baseUrl, sessionCookie);

  console.log(`GET /api/farmers → HTTP ${baseline.status}`);
  console.log(
    `Returned Farmer IDs: ${baseline.farmerIds.join(", ") || "(none)"}`,
  );

  if (baseline.status === 200) {
    P("Authenticated GET /api/farmers returns HTTP 200");
  } else {
    F(
      "Authenticated GET /api/farmers returns HTTP 200",
      `HTTP ${baseline.status}`,
    );
  }

  if (arraysEqual(baseline.farmerIds, farmerIdsBefore)) {
    P(
      "Baseline HTTP Farmer result matches database Farmer baseline",
      `${baseline.farmerIds.length} row(s)`,
    );
  } else {
    F(
      "Baseline HTTP Farmer result matches database Farmer baseline",
      `HTTP=[${baseline.farmerIds.join(",")}] DB=[${farmerIdsBefore.join(",")}]`,
    );
  }

  section("5. CLIENT-SUPPLIED GEOGRAPHIC FILTER TAMPERING");

  const geographicTamperQueries = [
    {
      name: "countyId override",
      query: `countyId=${farmer4.countyId + 1}`,
    },
    {
      name: "subCountyId override",
      query: `subCountyId=${farmer4.subCountyId + 1}`,
    },
    {
      name: "wardId override",
      query: `wardId=${farmer4.wardId + 1}`,
    },
    {
      name: "all geography overrides",
      query:
        `countyId=${farmer4.countyId + 1}` +
        `&subCountyId=${farmer4.subCountyId + 1}` +
        `&wardId=${farmer4.wardId + 1}`,
    },
    {
      name: "foreign-looking geography override",
      query:
        "countryId=999999&countyId=999999&subCountyId=999999&wardId=999999",
    },
  ];

  for (const test of geographicTamperQueries) {
    const result = await requestFarmers(baseUrl, sessionCookie, test.query);

    console.log(
      `${test.name} | HTTP ${result.status} | IDs=${result.farmerIds.join(",")}`,
    );

    if (result.status !== 200) {
      F(
        `${test.name} does not bypass HTTP authorization`,
        `unexpected HTTP ${result.status}`,
      );
      continue;
    }

    if (arraysEqual(result.farmerIds, baseline.farmerIds)) {
      P(`${test.name} cannot expand or replace server authorization`);
    } else {
      F(
        `${test.name} cannot expand or replace server authorization`,
        `baseline=[${baseline.farmerIds.join(",")}] tampered=[${result.farmerIds.join(",")}]`,
      );
    }
  }

  section("6. ROLE / FUNCTION / SCOPE TAMPERING");

  const authorizationParameterTests = [
    {
      name: "roleId override",
      query: "roleId=1",
    },
    {
      name: "role override",
      query: "role=Super%20Admin",
    },
    {
      name: "functionId override",
      query: "functionId=1",
    },
    {
      name: "function override",
      query: "function=Super%20Administrator",
    },
    {
      name: "scopeLevel override",
      query: "scopeLevel=NATIONAL",
    },
    {
      name: "scope override",
      query: "scope=NATIONAL",
    },
    {
      name: "combined authorization override",
      query:
        "roleId=1&role=Super%20Admin&functionId=1&" +
        "function=Agriculture%20%2F%20General%20Agriculture&" +
        "scopeLevel=NATIONAL&scope=NATIONAL",
    },
  ];

  for (const test of authorizationParameterTests) {
    const result = await requestFarmers(baseUrl, sessionCookie, test.query);

    console.log(
      `${test.name} | HTTP ${result.status} | IDs=${result.farmerIds.join(",")}`,
    );

    if (result.status !== 200) {
      F(
        `${test.name} cannot bypass HTTP authorization`,
        `unexpected HTTP ${result.status}`,
      );
      continue;
    }

    if (arraysEqual(result.farmerIds, baseline.farmerIds)) {
      P(`${test.name} cannot replace server-side authorization`);
    } else {
      F(
        `${test.name} cannot replace server-side authorization`,
        `baseline=[${baseline.farmerIds.join(",")}] tampered=[${result.farmerIds.join(",")}]`,
      );
    }
  }

  section("7. CONFLICTING AUTHORIZATION PARAMETERS");

  const conflictingQueries = [
    {
      name: "National role + foreign county",
      query: "roleId=1&countyId=999999",
    },
    {
      name: "County role + national scope",
      query: "roleId=3&scopeLevel=NATIONAL",
    },
    {
      name: "Ward scope + national geography",
      query: "scopeLevel=WARD&countryId=2",
    },
    {
      name: "Super Admin + foreign country",
      query: "role=Super%20Admin&countryId=999999",
    },
    {
      name: "Farmer role + Super Admin function",
      query: "role=Farmer&function=Super%20Administrator",
    },
  ];

  for (const test of conflictingQueries) {
    const result = await requestFarmers(baseUrl, sessionCookie, test.query);

    console.log(
      `${test.name} | HTTP ${result.status} | IDs=${result.farmerIds.join(",")}`,
    );

    if (result.status !== 200) {
      F(
        `${test.name} does not produce an authorization bypass`,
        `unexpected HTTP ${result.status}`,
      );
      continue;
    }

    if (arraysEqual(result.farmerIds, baseline.farmerIds)) {
      P(`${test.name} cannot alter server-side authorization`);
    } else {
      F(
        `${test.name} cannot alter server-side authorization`,
        `baseline=[${baseline.farmerIds.join(",")}] tampered=[${result.farmerIds.join(",")}]`,
      );
    }
  }

  section("8. UNKNOWN / MALFORMED AUTHORIZATION PARAMETERS");

  const malformedQueries = [
    {
      name: "unknown role",
      query: "role=DefinitelyNotARole",
    },
    {
      name: "unknown function",
      query: "function=DefinitelyNotAFunction",
    },
    {
      name: "invalid scope",
      query: "scopeLevel=UNLIMITED",
    },
    {
      name: "negative county",
      query: "countyId=-1",
    },
    {
      name: "negative subcounty",
      query: "subCountyId=-1",
    },
    {
      name: "negative ward",
      query: "wardId=-1",
    },
    {
      name: "non-numeric county",
      query: "countyId=abc",
    },
    {
      name: "non-numeric ward",
      query: "wardId=abc",
    },
    {
      name: "very large geography IDs",
      query:
        "countyId=999999999&subCountyId=999999999&wardId=999999999",
    },
  ];

  for (const test of malformedQueries) {
    const result = await requestFarmers(baseUrl, sessionCookie, test.query);

    console.log(
      `${test.name} | HTTP ${result.status} | IDs=${result.farmerIds.join(",")}`,
    );

    if (result.status === 200) {
      if (arraysEqual(result.farmerIds, baseline.farmerIds)) {
        P(`${test.name} does not change the authorized collection`);
      } else {
        F(
          `${test.name} cannot alter authorization`,
          `baseline=[${baseline.farmerIds.join(",")}] malformed=[${result.farmerIds.join(",")}]`,
        );
      }
    } else if (
      result.status === 400 ||
      result.status === 401 ||
      result.status === 403
    ) {
      P(`${test.name} fails safely`, `HTTP ${result.status}`);
    } else {
      F(
        `${test.name} fails safely`,
        `unexpected HTTP ${result.status}`,
      );
    }
  }

  section("9. CLIENT-SUPPLIED FARMER ID TEST");

  const farmerIdQueries = [
    "farmerId=4",
    "id=4",
    "farmerId=999999",
    "id=999999",
  ];

  for (const query of farmerIdQueries) {
    const result = await requestFarmers(baseUrl, sessionCookie, query);

    console.log(
      `${query} | HTTP ${result.status} | IDs=${result.farmerIds.join(",")}`,
    );

    if (
      result.status === 200 &&
      arraysEqual(result.farmerIds, baseline.farmerIds)
    ) {
      P(`${query} cannot replace collection authorization`);
    } else if (
      result.status === 400 ||
      result.status === 401 ||
      result.status === 403
    ) {
      P(`${query} fails safely`, `HTTP ${result.status}`);
    } else {
      F(
        `${query} cannot replace collection authorization`,
        `HTTP ${result.status}`,
      );
    }
  }

  section("10. REPEATED REQUEST CONSISTENCY");

  const repeatedResults: number[][] = [];

  for (let i = 1; i <= 5; i++) {
    const result = await requestFarmers(baseUrl, sessionCookie);

    console.log(
      `Request ${i} | HTTP ${result.status} | IDs=${result.farmerIds.join(",")}`,
    );

    if (result.status === 200) {
      repeatedResults.push(result.farmerIds);
    } else {
      F(
        `Repeated request ${i} returns HTTP 200`,
        `HTTP ${result.status}`,
      );
    }
  }

  const repeatedConsistent =
    repeatedResults.length === 5 &&
    repeatedResults.every((ids) =>
      arraysEqual(ids, baseline.farmerIds),
    );

  if (repeatedConsistent) {
    P("Five repeated authenticated requests are authorization-consistent");
  } else {
    F("Five repeated authenticated requests are authorization-consistent");
  }

  section("11. UNAUTHENTICATED REQUEST");

  const unauthenticated = await requestFarmers(baseUrl);

  console.log(
    `Unauthenticated GET /api/farmers → HTTP ${unauthenticated.status}`,
  );

  if (unauthenticated.status === 401) {
    P("Unauthenticated request is rejected with HTTP 401");
  } else {
    F(
      "Unauthenticated request is rejected with HTTP 401",
      `HTTP ${unauthenticated.status}`,
    );
  }

  section("12. INVALID SESSION COOKIE");

  const invalidSession = await requestFarmers(
    baseUrl,
    "this-is-not-a-valid-firebase-session-cookie",
  );

  console.log(
    `Invalid session GET /api/farmers → HTTP ${invalidSession.status}`,
  );

  if (invalidSession.status === 401) {
    P("Invalid session is rejected with HTTP 401");
  } else {
    F(
      "Invalid session is rejected with HTTP 401",
      `HTTP ${invalidSession.status}`,
    );
  }

  section("13. ROUTE SOURCE SECURITY CHECK");

  const routePath = path.resolve(
    process.cwd(),
    "app",
    "api",
    "farmers",
    "route.ts",
  );

  if (!fs.existsSync(routePath)) {
    F("Farmer API route source exists");
  } else {
    P("Farmer API route source exists");

    const routeSource = fs.readFileSync(routePath, "utf8");

    const requiredPatterns = [
      "getCurrentUser",
      "getAuthorizedFarmerWhere",
      "firebaseUid",
      "prisma.farmer.findMany",
      "where: authorizedWhere",
    ];

    for (const pattern of requiredPatterns) {
      if (routeSource.includes(pattern)) {
        P(`Route contains server-side authorization component: ${pattern}`);
      } else {
        F(`Route contains server-side authorization component: ${pattern}`);
      }
    }

    const dangerousPatterns = [
      "allowedCollectionRoles",
      "req.query.role",
      'searchParams.get("role")',
      "searchParams.get('role')",
      'searchParams.get("scope")',
      "searchParams.get('scope')",
    ];

    for (const pattern of dangerousPatterns) {
      if (routeSource.includes(pattern)) {
        F(
          "Route does not use client-supplied authorization override",
          `found ${pattern}`,
        );
      }
    }

    if (
      !dangerousPatterns.some((pattern) => routeSource.includes(pattern))
    ) {
      P("No known client-supplied role/scope override pattern found");
    }
  }

  section("14. DATABASE POST-HTTP INTEGRITY CHECK");

  const farmersAfter = await prisma.farmer.findMany({
    select: {
      id: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const assignmentsAfter = await prisma.officerAssignment.findMany({
    where: {
      userId: dbUser.id,
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
    },
    orderBy: {
      id: "asc",
    },
  });

  const afterFarmerIds = farmersAfter
    .map((farmer) => farmer.id)
    .sort((a, b) => a - b);

  if (arraysEqual(afterFarmerIds, farmerIdsBefore)) {
    P(
      "Farmer records are unchanged after HTTP tamper tests",
      `${afterFarmerIds.length} row(s)`,
    );
  } else {
    F(
      "Farmer records are unchanged after HTTP tamper tests",
      `before=[${farmerIdsBefore.join(",")}] after=[${afterFarmerIds.join(",")}]`,
    );
  }

  if (assignmentsAfter.length === assignments.length) {
    P(
      "OfficerAssignment count is unchanged after HTTP tamper tests",
      `${assignmentsAfter.length} row(s)`,
    );
  } else {
    F(
      "OfficerAssignment count is unchanged after HTTP tamper tests",
      `before=${assignments.length} after=${assignmentsAfter.length}`,
    );
  }

  /*
   * IMPORTANT V40.16 FIX:
   *
   * The previous audit compared the original assignments, which contained
   * nested role/function objects, with the post-test assignments, which
   * contained scalar roleId/functionId fields.
   *
   * Those two objects had different shapes even when the database was
   * completely unchanged.
   *
   * Both snapshots are now normalized to the same scalar representation
   * before JSON comparison.
   */

  const assignmentsBeforeComparable = assignments
    .map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      functionId: assignment.functionId,
      scopeLevel: String(assignment.scopeLevel),
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId: assignment.wardId,
      active: assignment.active,
      source: String(assignment.source),
    }))
    .sort((a, b) => a.id - b.id);

  const assignmentsAfterComparable = assignmentsAfter
    .map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      functionId: assignment.functionId,
      scopeLevel: String(assignment.scopeLevel),
      countryId: assignment.countryId,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId: assignment.wardId,
      active: assignment.active,
      source: String(assignment.source),
    }))
    .sort((a, b) => a.id - b.id);

  const assignmentsBeforeJson = JSON.stringify(
    assignmentsBeforeComparable,
  );

  const assignmentsAfterJson = JSON.stringify(
    assignmentsAfterComparable,
  );

  if (assignmentsBeforeJson === assignmentsAfterJson) {
    P("OfficerAssignment records are unchanged after HTTP tamper tests");
  } else {
    F(
      "OfficerAssignment records are unchanged after HTTP tamper tests",
      "normalized before/after authorization snapshots differ",
    );
  }

  section("15. FINAL RESULT");

  console.log("");
  console.log("============================================================");
  console.log("V40.16 FINAL RESULT");
  console.log("============================================================");
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);
  console.log(`REVIEW : ${reviewCount}`);

  if (failCount === 0) {
    console.log("V40.16 STATUS: GREEN");
    console.log("");
    console.log(
      "Authenticated HTTP authorization is tamper-resistant.",
    );
    console.log(
      "Client-supplied geography, role, function, scope, and Farmer identifiers",
    );
    console.log(
      "cannot replace or expand the server-side authorization decision.",
    );
  } else {
    console.log("V40.16 STATUS: RED");
    console.log("");
    console.log(
      "Authenticated HTTP authorization contains one or more failures.",
    );
  }

  if (reviewCount > 0) {
    console.log("");
    console.log(
      "REVIEW items are observations only and do not automatically indicate",
    );
    console.log(
      "an authorization security failure.",
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
    console.error("V40.16 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });