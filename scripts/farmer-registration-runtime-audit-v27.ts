import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

let pass = 0;
let fail = 0;
let warn = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    pass++;
    console.log(
      `PASS  ${label}${detail ? ` — ${detail}` : ""}`,
    );
  } else {
    fail++;
    console.log(
      `FAIL  ${label}${detail ? ` — ${detail}` : ""}`,
    );
  }
}

function warning(label: string, detail = "") {
  warn++;
  console.log(
    `WARN  ${label}${detail ? ` — ${detail}` : ""}`,
  );
}

function readFile(relativePath: string): string {
  const filePath = path.resolve(
    process.cwd(),
    relativePath,
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Required file does not exist: ${relativePath}`,
    );
  }

  return fs.readFileSync(filePath, "utf8");
}

async function getJson(
  url: string,
): Promise<{
  status: number;
  data: any;
  text: string;
}> {
  const response = await fetch(url);

  const text = await response.text();

  let data: any = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  return {
    status: response.status,
    data,
    text,
  };
}

function containsAll(
  source: string,
  values: string[],
): boolean {
  return values.every((value) =>
    source.includes(value),
  );
}

function containsAny(
  source: string,
  values: string[],
): boolean {
  return values.some((value) =>
    source.includes(value),
  );
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("FARMER REGISTRATION RUNTIME CONTRACT AUDIT V27");
  console.log("============================================================");
  console.log(`BASE URL: ${BASE_URL}`);
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  /*
   * ==========================================================
   * FILES
   * ==========================================================
   */

  const farmerApiPath =
    "app/api/farmers/route.ts";

  const farmerFormPath =
    "components/FarmerFarmForm.tsx";

  const wardsApiPath =
    "app/api/locations/wards/route.ts";

  const farmerApi = readFile(farmerApiPath);
  const farmerForm = readFile(farmerFormPath);
  const wardsApi = readFile(wardsApiPath);

  check(
    "Farmer API route exists",
    farmerApi.length > 0,
    farmerApiPath,
  );

  check(
    "Farmer registration form exists",
    farmerForm.length > 0,
    farmerFormPath,
  );

  check(
    "Wards API route exists",
    wardsApi.length > 0,
    wardsApiPath,
  );

  /*
   * ==========================================================
   * 1. FORM LOCATION FIELDS
   * ==========================================================
   */

  console.log("");
  console.log("FORM LOCATION CONTRACT");
  console.log("");

  const expectedLocationFields = [
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  for (const field of expectedLocationFields) {
    check(
      `Form contains ${field}`,
      farmerForm.includes(field),
    );
  }

  /*
   * ==========================================================
   * 2. FORM LOCATION API CALLS
   * ==========================================================
   */

  check(
    "Form calls countries endpoint",
    farmerForm.includes(
      "/api/locations/countries",
    ),
  );

  check(
    "Form calls counties endpoint",
    farmerForm.includes(
      "/api/locations/counties",
    ),
  );

  check(
    "Form calls subcounties endpoint",
    farmerForm.includes(
      "/api/locations/subcounties",
    ),
  );

  check(
    "Form calls constituencies endpoint",
    farmerForm.includes(
      "/api/locations/constituencies",
    ),
  );

  check(
    "Form calls wards endpoint",
    farmerForm.includes(
      "/api/locations/wards",
    ),
  );

  /*
   * ==========================================================
   * 3. FORM MUST NOT TRUST CLIENT IDENTITY
   * ==========================================================
   *
   * The current architecture deliberately resolves the
   * authenticated user on the server.
   *
   * Therefore userId must not be required in the form POST
   * payload.
   */

  const formHasUserIdPayload =
    /userId\s*[:=]/.test(farmerForm);

  const formHasFirebaseUidPayload =
    /firebaseUid\s*[:=]/.test(farmerForm);

  check(
    "Form does not construct userId payload",
    !formHasUserIdPayload,
    formHasUserIdPayload
      ? "userId found in form source"
      : "no userId payload construction detected",
  );

  check(
    "Form does not construct firebaseUid payload",
    !formHasFirebaseUidPayload,
    formHasFirebaseUidPayload
      ? "firebaseUid found in form source"
      : "no firebaseUid payload construction detected",
  );

  /*
   * ==========================================================
   * 4. FORM POST TARGET
   * ==========================================================
   */

  check(
    "Form submits to /api/farmers",
    farmerForm.includes(
      '"/api/farmers"',
    ) ||
      farmerForm.includes(
        "'/api/farmers'",
      ),
  );

  /*
   * ==========================================================
   * 5. SERVER-SIDE AUTHENTICATION
   * ==========================================================
   */

  console.log("");
  console.log("SERVER-SIDE AUTHENTICATION CONTRACT");
  console.log("");

  check(
    "Farmer API uses getCurrentUser",
    farmerApi.includes(
      "getCurrentUser",
    ),
  );

  check(
    "Farmer API resolves authenticated Firebase identity",
    containsAny(farmerApi, [
      "currentUser.id",
      "currentUser.uid",
    ]),
  );

  check(
    "Farmer API uses Firebase UID lookup",
    farmerApi.includes(
      "firebaseUid",
    ),
  );

  check(
    "Farmer API looks up User by firebaseUid",
    farmerApi.includes(
      "user.findUnique",
    ) &&
      farmerApi.includes(
        "firebaseUid",
      ),
  );

  /*
   * ==========================================================
   * 6. AUTH FAILURE CONTRACT
   * ==========================================================
   */

  check(
    "Farmer API contains 401 response",
    farmerApi.includes(
      "status: 401",
    ),
  );

  check(
    "Farmer API checks missing authentication",
    containsAny(farmerApi, [
      "!currentUser",
      "if (!currentUser)",
      "currentUser === null",
    ]),
  );

  /*
   * ==========================================================
   * 7. COUNTY VALIDATION
   * ==========================================================
   */

  console.log("");
  console.log("GEOGRAPHY OWNERSHIP CONTRACT");
  console.log("");

  check(
    "Farmer API validates county",
    farmerApi.includes(
      "prisma.county",
    ) ||
      farmerApi.includes(
        "tx.county",
      ),
  );

  check(
    "Farmer API uses countyId",
    farmerApi.includes(
      "countyId",
    ),
  );

  /*
   * ==========================================================
   * 8. SUBCOUNTY → COUNTY VALIDATION
   * ==========================================================
   */

  const hasSubCountyFind =
    farmerApi.includes(
      "prisma.subCounty.findFirst",
    ) ||
    farmerApi.includes(
      "tx.subCounty.findFirst",
    );

  const hasSubCountyCountyPair =
    farmerApi.includes(
      "id: subCountyId",
    ) &&
    farmerApi.includes(
      "countyId",
    );

  check(
    "Farmer API queries SubCounty",
    hasSubCountyFind,
  );

  check(
    "Farmer API validates SubCounty against County",
    hasSubCountyCountyPair,
    "SubCounty query contains id + countyId relationship",
  );

  /*
   * ==========================================================
   * 9. CONSTITUENCY → COUNTY VALIDATION
   * ==========================================================
   */

  const hasConstituencyFind =
    farmerApi.includes(
      "prisma.constituency.findFirst",
    ) ||
    farmerApi.includes(
      "tx.constituency.findFirst",
    );

  check(
    "Farmer API queries Constituency",
    hasConstituencyFind,
  );

  const constituencyBlockStart =
    farmerApi.indexOf(
      "constituency =",
    );

  const constituencyBlock =
    constituencyBlockStart >= 0
      ? farmerApi.slice(
          constituencyBlockStart,
          constituencyBlockStart + 1200,
        )
      : "";

  check(
    "Constituency validation uses constituencyId",
    constituencyBlock.includes(
      "id: constituencyId",
    ),
  );

  check(
    "Constituency validation uses countyId",
    constituencyBlock.includes(
      "countyId",
    ),
  );

  /*
   * ==========================================================
   * 10. WARD → COUNTY + SUBCOUNTY + CONSTITUENCY
   * ==========================================================
   */

  const wardBlockStart =
    farmerApi.indexOf(
      "const ward =",
    );

  const wardBlock =
    wardBlockStart >= 0
      ? farmerApi.slice(
          wardBlockStart,
          wardBlockStart + 1800,
        )
      : "";

  check(
    "Farmer API queries Ward",
    wardBlock.includes(
      "ward",
    ) &&
      containsAny(wardBlock, [
        "findFirst",
        "findUnique",
      ]),
  );

  check(
    "Ward validation uses wardId",
    wardBlock.includes(
      "id: wardId",
    ),
  );

  check(
    "Ward validation uses countyId",
    wardBlock.includes(
      "countyId",
    ),
  );

  check(
    "Ward validation uses subCountyId",
    wardBlock.includes(
      "subCountyId",
    ),
  );

  check(
    "Ward validation uses constituencyId",
    wardBlock.includes(
      "constituencyId",
    ),
  );

  /*
   * ==========================================================
   * 11. VILLAGE → WARD VALIDATION
   * ==========================================================
   */

  const hasVillageValidation =
    farmerApi.includes(
      "prisma.village.findFirst",
    ) ||
    farmerApi.includes(
      "tx.village.findFirst",
    );

  if (hasVillageValidation) {
    check(
      "Farmer API validates Village",
      true,
    );

    check(
      "Village validation uses villageId",
      farmerApi.includes(
        "id: villageId",
      ),
    );

    check(
      "Village validation uses wardId",
      farmerApi.includes(
        "wardId",
      ),
    );
  } else {
    warning(
      "Village validation block not detected",
      "No village validation source block found",
    );
  }

  /*
   * ==========================================================
   * 12. TRANSACTION CONTRACT
   * ==========================================================
   */

  check(
    "Farmer API uses Prisma transaction",
    farmerApi.includes(
      "$transaction",
    ),
  );

  check(
    "Farmer API updates existing Farmer",
    farmerApi.includes(
      "farmer.update",
    ),
  );

  check(
    "Farmer API creates new Farmer",
    farmerApi.includes(
      "farmer.create",
    ),
  );

  check(
    "Farmer API creates or updates Farm",
    farmerApi.includes(
      "farm",
    ) &&
      containsAny(farmerApi, [
        "farm.update",
        "farm.create",
      ]),
  );

  /*
   * ==========================================================
   * 13. FARMER LOCATION DATA
   * ==========================================================
   */

  const farmerLocationFields = [
    "countyId",
    "subCountyId",
    "wardId",
  ];

  for (const field of farmerLocationFields) {
    check(
      `Farmer persistence contains ${field}`,
      farmerApi.includes(field),
    );
  }

  /*
   * ==========================================================
   * 14. WARDS API CONTRACT
   * ==========================================================
   */

  check(
    "Wards API requires countyId",
    wardsApi.includes(
      "countyId",
    ),
  );

  check(
    "Wards API requires subCountyId",
    wardsApi.includes(
      "subCountyId",
    ),
  );

  check(
    "Wards API requires constituencyId",
    wardsApi.includes(
      "constituencyId",
    ),
  );

  check(
    "Wards API filters by countyId",
    wardsApi.includes(
      "countyId,",
    ),
  );

  check(
    "Wards API filters by subCountyId",
    wardsApi.includes(
      "subCountyId,",
    ),
  );

  check(
    "Wards API filters by constituencyId",
    wardsApi.includes(
      "constituencyId,",
    ),
  );

  /*
   * ==========================================================
   * 15. RUNTIME COHERENT GEOGRAPHY CHAIN
   * ==========================================================
   */

  console.log("");
  console.log("RUNTIME FARMER REGISTRATION GEOGRAPHY");
  console.log("");

  const { prisma } = await import("../lib/prisma");

  const sourceWard = await prisma.ward.findFirst({
    where: {
      countyId: 48,
      constituencyId: 255,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
    },
  });

  check(
    "Runtime canonical Ward exists",
    !!sourceWard,
    sourceWard
      ? `${sourceWard.id} ${sourceWard.name}`
      : "missing",
  );

  if (!sourceWard) {
    console.log("");
    console.log(
      "Cannot continue runtime geography tests.",
    );

    await prisma.$disconnect();

    console.log("");
    console.log("============================================================");
    console.log("V27 RESULT");
    console.log("============================================================");
    console.log(`PASS: ${pass}`);
    console.log(`FAIL: ${fail}`);
    console.log(`WARN: ${warn}`);
    console.log(`TOTAL: ${pass + fail}`);
    console.log("");

    process.exit(1);
  }

  const countyId = sourceWard.countyId;
  const subCountyId = sourceWard.subCountyId;
  const constituencyId =
    sourceWard.constituencyId;
  const wardId = sourceWard.id;

  const county = await prisma.county.findUnique({
    where: {
      id: countyId,
    },
    select: {
      id: true,
      name: true,
      countryId: true,
    },
  });

  const subCounty =
    await prisma.subCounty.findUnique({
      where: {
        id: subCountyId,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  const constituency =
    await prisma.constituency.findUnique({
      where: {
        id: constituencyId,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  console.log("");
  console.log("CANONICAL RUNTIME CHAIN");
  console.log(
    `Country      : ${county?.countryId}`,
  );
  console.log(
    `County       : ${county?.id} ${county?.name}`,
  );
  console.log(
    `SubCounty    : ${subCounty?.id} ${subCounty?.name}`,
  );
  console.log(
    `Constituency : ${constituency?.id} ${constituency?.name}`,
  );
  console.log(
    `Ward         : ${sourceWard.id} ${sourceWard.name}`,
  );
  console.log("");

  check(
    "Runtime County exists",
    !!county,
  );

  check(
    "Runtime SubCounty exists",
    !!subCounty,
  );

  check(
    "Runtime SubCounty belongs to County",
    subCounty?.countyId === countyId,
    `countyId=${subCounty?.countyId}`,
  );

  check(
    "Runtime Constituency exists",
    !!constituency,
  );

  check(
    "Runtime Constituency belongs to County",
    constituency?.countyId === countyId,
    `countyId=${constituency?.countyId}`,
  );

  check(
    "Runtime Ward belongs to County",
    sourceWard.countyId === countyId,
  );

  check(
    "Runtime Ward belongs to SubCounty",
    sourceWard.subCountyId === subCountyId,
  );

  check(
    "Runtime Ward belongs to Constituency",
    sourceWard.constituencyId === constituencyId,
  );

  /*
   * ==========================================================
   * 16. RUNTIME LOCATION API CHAIN
   * ==========================================================
   */

  const countries =
    await getJson(
      `${BASE_URL}/api/locations/countries`,
    );

  check(
    "Runtime Countries endpoint returns 200",
    countries.status === 200,
    `HTTP ${countries.status}`,
  );

  check(
    "Runtime Countries endpoint returns array",
    Array.isArray(countries.data),
  );

  const counties =
    await getJson(
      `${BASE_URL}/api/locations/counties?countryId=${county?.countryId}`,
    );

  check(
    "Runtime Counties endpoint returns 200",
    counties.status === 200,
    `HTTP ${counties.status}`,
  );

  check(
    "Runtime Counties contains canonical County",
    Array.isArray(counties.data) &&
      counties.data.some(
        (item: any) =>
          item.id === countyId,
      ),
  );

  const subCounties =
    await getJson(
      `${BASE_URL}/api/locations/subcounties?countyId=${countyId}`,
    );

  check(
    "Runtime SubCounties endpoint returns 200",
    subCounties.status === 200,
    `HTTP ${subCounties.status}`,
  );

  check(
    "Runtime SubCounties contains canonical SubCounty",
    Array.isArray(subCounties.data) &&
      subCounties.data.some(
        (item: any) =>
          item.id === subCountyId,
      ),
  );

  const constituencies =
    await getJson(
      `${BASE_URL}/api/locations/constituencies?countyId=${countyId}`,
    );

  check(
    "Runtime Constituencies endpoint returns 200",
    constituencies.status === 200,
    `HTTP ${constituencies.status}`,
  );

  check(
    "Runtime Constituencies contains canonical Constituency",
    Array.isArray(constituencies.data) &&
      constituencies.data.some(
        (item: any) =>
          item.id === constituencyId,
      ),
  );

  const wards =
    await getJson(
      `${BASE_URL}/api/locations/wards` +
        `?countyId=${countyId}` +
        `&subCountyId=${subCountyId}` +
        `&constituencyId=${constituencyId}`,
    );

  check(
    "Runtime Wards endpoint returns 200",
    wards.status === 200,
    `HTTP ${wards.status}`,
  );

  check(
    "Runtime Wards endpoint returns array",
    Array.isArray(wards.data),
  );

  check(
    "Runtime Wards contains canonical Ward",
    Array.isArray(wards.data) &&
      wards.data.some(
        (item: any) =>
          item.id === wardId,
      ),
  );

  check(
    "Runtime Wards respect County",
    Array.isArray(wards.data) &&
      wards.data.every(
        (item: any) =>
          item.countyId === countyId,
      ),
  );

  check(
    "Runtime Wards respect SubCounty",
    Array.isArray(wards.data) &&
      wards.data.every(
        (item: any) =>
          item.subCountyId === subCountyId,
      ),
  );

  check(
    "Runtime Wards respect Constituency",
    Array.isArray(wards.data) &&
      wards.data.every(
        (item: any) =>
          item.constituencyId ===
          constituencyId,
      ),
  );

  /*
   * ==========================================================
   * 17. RUNTIME FARMER API AUTHORIZATION
   * ==========================================================
   *
   * No authentication token is deliberately supplied.
   *
   * This MUST return 401.
   *
   * We do NOT attempt an authenticated Farmer POST because
   * doing so could mutate production/development data.
   */

  const unauthenticatedResponse =
    await fetch(
      `${BASE_URL}/api/farmers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "V27",
          lastName: "AUDIT",
          phoneNumber: "0000000000",
          countryId: county?.countryId,
          countyId,
          subCountyId,
          constituencyId,
          wardId,
          villageId: null,
          farmName: "V27 READ ONLY AUDIT",
          acreage: 1,
        }),
      },
    );

  const unauthenticatedBody =
    await unauthenticatedResponse.text();

  check(
    "Unauthenticated Farmer POST returns 401",
    unauthenticatedResponse.status === 401,
    `HTTP ${unauthenticatedResponse.status}`,
  );

  check(
    "Unauthenticated Farmer POST does not return success",
    unauthenticatedResponse.status !== 200 &&
      unauthenticatedResponse.status !== 201,
    `HTTP ${unauthenticatedResponse.status}`,
  );

  /*
   * ==========================================================
   * 18. TIATY PRODUCTION GUARD
   * ==========================================================
   */

  const tiaty =
    await prisma.subCounty.findUnique({
      where: {
        id: 757,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  check(
    "Tiaty 757 exists",
    !!tiaty,
    tiaty
      ? `${tiaty.id} ${tiaty.name}`
      : "missing",
  );

  check(
    "Tiaty 757 has canonical name",
    tiaty?.name === "Tiaty",
    `name=${tiaty?.name}`,
  );

  check(
    "Tiaty 757 belongs to Baringo 90",
    tiaty?.countyId === 90,
    `countyId=${tiaty?.countyId}`,
  );

  const tiatyWards =
    await prisma.ward.findMany({
      where: {
        subCountyId: 757,
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        subCountyId: true,
        constituencyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  check(
    "Tiaty has exactly 7 wards",
    tiatyWards.length === 7,
    `${tiatyWards.length} wards`,
  );

  const expectedTiatyWardIds = [
    1837,
    1838,
    1839,
    1840,
    1841,
    2190,
    2193,
  ];

  check(
    "Tiaty contains all 7 canonical Ward IDs",
    expectedTiatyWardIds.every(
      (id) =>
        tiatyWards.some(
          (ward) =>
            ward.id === id,
        ),
    ),
    `actual=${tiatyWards
      .map((ward) => ward.id)
      .join(",")}`,
  );

  /*
   * ==========================================================
   * 19. IMPORTANT LIMITATION
   * ==========================================================
   *
   * We intentionally do not perform an authenticated Farmer
   * registration because that would require a real authenticated
   * session and could create/update persistent Farmer/Farm data.
   */

  warning(
    "Authenticated Farmer creation/update not executed",
    "V27 is strictly read-only",
  );

  /*
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  console.log("");
  console.log("============================================================");
  console.log("FARMER REGISTRATION RUNTIME CONTRACT AUDIT V27 RESULT");
  console.log("============================================================");
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`WARN: ${warn}`);
  console.log(`TOTAL CHECKS: ${pass + fail}`);
  console.log("");

  if (fail === 0) {
    console.log("STATUS: GREEN");
    console.log(
      "Farmer registration contract and runtime geography integration are operational.",
    );
  } else {
    console.log("STATUS: REVIEW REQUIRED");
    console.log(
      "One or more Farmer registration checks failed.",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY GUARANTEE: No Farmer or Farm record was created, updated, or deleted by this audit.",
  );
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("============================================================");
  console.error("V27 AUDIT ERROR");
  console.error("============================================================");
  console.error(error);

  try {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  } catch {}

  process.exit(1);
});