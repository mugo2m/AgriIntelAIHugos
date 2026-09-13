import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const ROOT = process.cwd();

const FORM = path.join(
  ROOT,
  "components",
  "FarmerFarmForm.tsx",
);

const API = path.join(
  ROOT,
  "app",
  "api",
  "farmers",
  "route.ts",
);

const TARGET_SUBCOUNTY_ID = 757;
const TARGET_COUNTY_ID = 90;

const TARGET_WARD_IDS = [
  1837,
  1838,
  1839,
  1840,
  1841,
  2190,
  2193,
];

const HISTORICAL_SUBCOUNTY_ID = 463;

const HISTORICAL_WARD_IDS = [
  2629,
  2630,
  2631,
  2632,
];

type CheckResult = {
  name: string;
  pass: boolean;
  detail: string;
};

const checks: CheckResult[] = [];

function pass(name: string, detail: string) {
  checks.push({
    name,
    pass: true,
    detail,
  });

  console.log(`PASS | ${name} | ${detail}`);
}

function fail(name: string, detail: string) {
  checks.push({
    name,
    pass: false,
    detail,
  });

  console.log(`FAIL | ${name} | ${detail}`);
}

function section(title: string) {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(title);
  console.log(
    "============================================================",
  );
}

function read(file: string): string {
  if (!fs.existsSync(file)) {
    return "";
  }

  return fs.readFileSync(file, "utf8");
}

function normalize(source: string): string {
  return source
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function has(source: string, pattern: string): boolean {
  return normalize(source).includes(
    normalize(pattern),
  );
}

function extractBlock(
  source: string,
  startPattern: RegExp,
  maxLength = 12000,
): string {
  const match = startPattern.exec(source);

  if (!match || match.index < 0) {
    return "";
  }

  return source.slice(
    match.index,
    Math.min(
      source.length,
      match.index + maxLength,
    ),
  );
}

async function main() {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "FARMER REGISTRATION CONTRACT AUDIT V25",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "READ-ONLY: NO INSERT / UPDATE / DELETE",
  );
  console.log(`Project root: ${ROOT}`);
  console.log("");

  // ==========================================================
  // 1. FILE EXISTENCE
  // ==========================================================

  section("1. REQUIRED RUNTIME FILES");

  if (fs.existsSync(FORM)) {
    pass(
      "Farmer form exists",
      "components/FarmerFarmForm.tsx",
    );
  } else {
    fail(
      "Farmer form exists",
      "components/FarmerFarmForm.tsx not found",
    );
  }

  if (fs.existsSync(API)) {
    pass(
      "Farmer API exists",
      "app/api/farmers/route.ts",
    );
  } else {
    fail(
      "Farmer API exists",
      "app/api/farmers/route.ts not found",
    );
  }

  const form = read(FORM);
  const api = read(API);

  // ==========================================================
  // 2. FORM PAYLOAD CONTRACT
  // ==========================================================

  section("2. FARMER FORM PAYLOAD CONTRACT");

  const formPayload = extractBlock(
    form,
    /body\s*:\s*JSON\.stringify\s*\(\s*\{/gi,
    15000,
  );

  if (formPayload) {
    pass(
      "Form JSON payload exists",
      "JSON.stringify({...}) found inside POST /api/farmers",
    );
  } else {
    fail(
      "Form JSON payload exists",
      "Could not locate JSON.stringify payload",
    );
  }

  const requiredFormFields = [
    "firstName",
    "lastName",
    "phoneNumber",
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
    "farmName",
    "acreage",
  ];

  for (const field of requiredFormFields) {
    if (has(formPayload, field)) {
      pass(
        `Form payload contains ${field}`,
        field,
      );
    } else {
      fail(
        `Form payload contains ${field}`,
        `${field} not found in JSON payload`,
      );
    }
  }

  if (
    has(formPayload, "villageId") &&
    has(formPayload, "villageId: null")
  ) {
    pass(
      "Village contract",
      "villageId explicitly sent as null",
    );
  } else {
    fail(
      "Village contract",
      "villageId:null not found in form payload",
    );
  }

  // ==========================================================
  // 3. FORM MUST NOT TRUST CLIENT USER ID
  // ==========================================================

  section(
    "3. CLIENT-SIDE USER IDENTITY CONTRACT",
  );

  const formHasUserId =
    has(formPayload, "userId") ||
    has(formPayload, "firebaseUid");

  if (!formHasUserId) {
    pass(
      "Form does not submit user identity",
      "Browser does not provide userId/firebaseUid",
    );
  } else {
    fail(
      "Form does not submit user identity",
      "Form payload contains user identity; server-side identity should be authoritative",
    );
  }

  // ==========================================================
  // 4. API AUTHENTICATION
  // ==========================================================

  section("4. SERVER-SIDE AUTHENTICATION");

  if (has(api, "getCurrentUser")) {
    pass(
      "API uses getCurrentUser",
      "Server obtains authenticated user",
    );
  } else {
    fail(
      "API uses getCurrentUser",
      "getCurrentUser not found",
    );
  }

  const authBlock = extractBlock(
    api,
    /const\s+currentUser\s*=\s*await\s+getCurrentUser\s*\(\s*\)/gi,
    5000,
  );

  if (authBlock && has(authBlock, "if (!currentUser)")) {
    pass(
      "API rejects unauthenticated requests",
      "currentUser null check found",
    );
  } else {
    fail(
      "API rejects unauthenticated requests",
      "Could not prove currentUser authentication guard",
    );
  }

  if (has(api, "status: 401")) {
    pass(
      "Authentication failure returns 401",
      "HTTP 401 response found",
    );
  } else {
    fail(
      "Authentication failure returns 401",
      "No HTTP 401 response detected",
    );
  }

  // ==========================================================
  // 5. FIREBASE UID RESOLUTION
  // ==========================================================

  section("5. FIREBASE UID → DATABASE USER");

  if (has(api, "firebaseUid")) {
    pass(
      "API resolves Firebase UID",
      "firebaseUid reference found",
    );
  } else {
    fail(
      "API resolves Firebase UID",
      "firebaseUid not found",
    );
  }

  if (
    has(api, "currentUser.id") ||
    has(api, "currentUser.uid")
  ) {
    pass(
      "Firebase identity comes from authenticated user",
      "currentUser.id/currentUser.uid resolution found",
    );
  } else {
    fail(
      "Firebase identity comes from authenticated user",
      "Could not find currentUser identity resolution",
    );
  }

  if (
    has(api, "prisma.user.findUnique") &&
    has(api, "where:") &&
    has(api, "firebaseUid")
  ) {
    pass(
      "Database user lookup by Firebase UID",
      "prisma.user.findUnique({ where: { firebaseUid } }) detected",
    );
  } else {
    fail(
      "Database user lookup by Firebase UID",
      "Could not prove Firebase UID → User lookup",
    );
  }

  if (has(api, "if (!dbUser)")) {
    pass(
      "Database user synchronization guard",
      "Missing database user is rejected",
    );
  } else {
    fail(
      "Database user synchronization guard",
      "Could not find !dbUser guard",
    );
  }

  // ==========================================================
  // 6. FARMER USER FOREIGN KEY
  // ==========================================================

  section("6. USER → FARMER FOREIGN-KEY CONTRACT");

  if (has(api, "dbUser.id")) {
    pass(
      "API resolves database User ID",
      "dbUser.id referenced",
    );
  } else {
    fail(
      "API resolves database User ID",
      "dbUser.id not found",
    );
  }

  const farmerTransactionBlock = extractBlock(
    api,
    /prisma\.\$transaction\s*\(/gi,
    30000,
  );

  if (farmerTransactionBlock) {
    pass(
      "Farmer transaction exists",
      "Prisma transaction block detected",
    );
  } else {
    fail(
      "Farmer transaction exists",
      "Could not locate Prisma transaction",
    );
  }

  if (
    has(farmerTransactionBlock, "userId") &&
    has(farmerTransactionBlock, "dbUser.id")
  ) {
    pass(
      "Farmer uses authenticated database user",
      "userId is linked to dbUser.id inside transaction",
    );
  } else {
    fail(
      "Farmer uses authenticated database user",
      "Could not prove Farmer.userId uses dbUser.id",
    );
  }

  // ==========================================================
  // 7. REQUEST BODY
  // ==========================================================

  section("7. API REQUEST BODY CONTRACT");

  if (has(api, "body = await request.json")) {
    pass(
      "API reads JSON body",
      "request.json() detected",
    );
  } else {
    fail(
      "API reads JSON body",
      "request.json() not detected",
    );
  }

  if (
    has(api, "Invalid JSON request body") &&
    has(api, "status: 400")
  ) {
    pass(
      "Invalid JSON is rejected",
      "Invalid JSON returns HTTP 400",
    );
  } else {
    fail(
      "Invalid JSON is rejected",
      "Could not prove invalid JSON handling",
    );
  }

  // ==========================================================
  // 8. LOCATION IDS
  // ==========================================================

  section("8. LOCATION ID CONTRACT");

  const locationFields = [
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  for (const field of locationFields) {
    if (has(api, field)) {
      pass(
        `API receives ${field}`,
        field,
      );
    } else {
      fail(
        `API receives ${field}`,
        `${field} not found`,
      );
    }
  }

  // ==========================================================
  // 9. COUNTRY VALIDATION
  // ==========================================================

  section("9. COUNTRY VALIDATION");

  if (
    has(api, "prisma.country") &&
    has(api, "countryId")
  ) {
    pass(
      "Country database validation",
      "Country lookup using countryId detected",
    );
  } else {
    fail(
      "Country database validation",
      "Country validation not detected",
    );
  }

  // ==========================================================
  // 10. COUNTY → COUNTRY
  // ==========================================================

  section("10. COUNTY → COUNTRY VALIDATION");

  if (
    has(api, "prisma.county.findFirst") &&
    has(api, "countryId")
  ) {
    pass(
      "County lookup uses countryId",
      "County is queried with countyId + countryId",
    );
  } else {
    fail(
      "County lookup uses countryId",
      "Could not prove county/country relationship validation",
    );
  }

  if (
    has(api, "Selected county does not belong to the selected country")
  ) {
    pass(
      "County/country mismatch rejected",
      "Explicit county-country error found",
    );
  } else {
    fail(
      "County/country mismatch rejected",
      "Explicit county-country rejection not found",
    );
  }

  // ==========================================================
  // 11. SUBCOUNTY → COUNTY
  // ==========================================================

  section("11. SUBCOUNTY → COUNTY VALIDATION");

  if (
    has(api, "prisma.subCounty") &&
    has(api, "countyId") &&
    has(api, "subCountyId")
  ) {
    pass(
      "SubCounty relationship validation",
      "SubCounty lookup references subCountyId + countyId",
    );
  } else {
    fail(
      "SubCounty relationship validation",
      "Could not prove SubCounty/county validation",
    );
  }

  if (
    has(
      api,
      "Selected sub-county does not belong to the selected county",
    ) ||
    has(
      api,
      "Selected subcounty does not belong to the selected county",
    ) ||
    has(api, "subCounty.countyId !== countyId")
  ) {
    pass(
      "SubCounty/county mismatch rejected",
      "Explicit mismatch validation detected",
    );
  } else {
    fail(
      "SubCounty/county mismatch rejected",
      "Could not detect explicit mismatch rejection",
    );
  }

  // ==========================================================
  // 12. CONSTITUENCY → COUNTY
  // ==========================================================

  section("12. CONSTITUENCY → COUNTY VALIDATION");

  if (
    has(api, "prisma.constituency") &&
    has(api, "constituencyId") &&
    has(api, "countyId")
  ) {
    pass(
      "Constituency relationship validation",
      "Constituency lookup uses constituencyId/countyId",
    );
  } else {
    fail(
      "Constituency relationship validation",
      "Could not prove Constituency/county validation",
    );
  }

  // ==========================================================
  // 13. WARD → CONSTITUENCY
  // ==========================================================

  section("13. WARD → CONSTITUENCY VALIDATION");

  if (
    has(api, "prisma.ward") &&
    has(api, "wardId") &&
    has(api, "constituencyId")
  ) {
    pass(
      "Ward relationship validation",
      "Ward lookup references wardId + constituencyId",
    );
  } else {
    fail(
      "Ward relationship validation",
      "Could not prove Ward/Constituency validation",
    );
  }

  if (
    has(api, "ward.constituencyId") ||
    has(api, "constituencyId !==")
  ) {
    pass(
      "Ward/constituency ownership check",
      "Ward constituency ownership validation detected",
    );
  } else {
    fail(
      "Ward/constituency ownership check",
      "Could not detect Ward constituency ownership validation",
    );
  }

  // ==========================================================
  // 14. FARMER SUBCOUNTY OWNERSHIP
  // ==========================================================

  section("14. FARMER SUBCOUNTY OWNERSHIP");

  if (
    has(api, "where:") &&
    has(api, "id: subCountyId") &&
    has(api, "countyId")
  ) {
    pass(
      "SubCounty scoped by County",
      "SubCounty query contains ID + County relationship",
    );
  } else {
    fail(
      "SubCounty scoped by County",
      "Could not prove SubCounty is scoped by County",
    );
  }

  // ==========================================================
  // 15. TARGET TIATY DATABASE TEST
  // ==========================================================

  section("15. TARGET TIATY DATABASE TEST");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  if (
    tiaty &&
    tiaty.id === TARGET_SUBCOUNTY_ID &&
    tiaty.name === "Tiaty" &&
    tiaty.countyId === TARGET_COUNTY_ID
  ) {
    pass(
      "Tiaty identity",
      "757 | Tiaty | county 90",
    );
  } else {
    fail(
      "Tiaty identity",
      tiaty
        ? `${tiaty.id} | ${tiaty.name} | county ${tiaty.countyId}`
        : "Tiaty 757 not found",
    );
  }

  // ==========================================================
  // 16. TIATY WARDS
  // ==========================================================

  section("16. TARGET TIATY WARDS");

  const tiatyWards = await prisma.ward.findMany({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
      constituencyId: true,
      countyId: true,
    },
  });

  if (tiatyWards.length === 7) {
    pass(
      "Tiaty ward count",
      "Exactly 7 wards",
    );
  } else {
    fail(
      "Tiaty ward count",
      `Expected 7, found ${tiatyWards.length}`,
    );
  }

  const tiatyWardIds = tiatyWards.map(
    (ward) => ward.id,
  );

  const missingTiatyWards =
    TARGET_WARD_IDS.filter(
      (id) => !tiatyWardIds.includes(id),
    );

  if (missingTiatyWards.length === 0) {
    pass(
      "Tiaty expected ward IDs",
      TARGET_WARD_IDS.join(", "),
    );
  } else {
    fail(
      "Tiaty expected ward IDs",
      `Missing: ${missingTiatyWards.join(", ")}`,
    );
  }

  const wrongTiatyCounty =
    tiatyWards.filter(
      (ward) =>
        ward.countyId !== TARGET_COUNTY_ID,
    );

  if (wrongTiatyCounty.length === 0) {
    pass(
      "Tiaty wards belong to Baringo",
      "All 7 wards have countyId 90",
    );
  } else {
    fail(
      "Tiaty wards belong to Baringo",
      `${wrongTiatyCounty.length} ward(s) have wrong countyId`,
    );
  }

  const wrongTiatySubCounty =
    tiatyWards.filter(
      (ward) =>
        ward.subCountyId !==
        TARGET_SUBCOUNTY_ID,
    );

  if (wrongTiatySubCounty.length === 0) {
    pass(
      "Tiaty ward foreign keys",
      "All 7 wards have subCountyId 757",
    );
  } else {
    fail(
      "Tiaty ward foreign keys",
      `${wrongTiatySubCounty.length} ward(s) have wrong subCountyId`,
    );
  }

  // ==========================================================
  // 17. CROSS-COUNTY NEGATIVE TEST
  // ==========================================================

  section("17. CROSS-COUNTY NEGATIVE TEST");

  const crossCountySubCounty =
    await prisma.subCounty.findFirst({
      where: {
        id: TARGET_SUBCOUNTY_ID,
        countyId: {
          not: TARGET_COUNTY_ID,
        },
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  if (!crossCountySubCounty) {
    pass(
      "Tiaty cannot belong to another county",
      "No row 757 exists outside county 90",
    );
  } else {
    fail(
      "Tiaty cannot belong to another county",
      `Found county ${crossCountySubCounty.countyId}`,
    );
  }

  // ==========================================================
  // 18. CROSS-SUBCOUNTY WARD NEGATIVE TEST
  // ==========================================================

  section("18. CROSS-SUBCOUNTY WARD NEGATIVE TEST");

  const crossSubCountyWards =
    await prisma.ward.findMany({
      where: {
        id: {
          in: TARGET_WARD_IDS,
        },
        subCountyId: {
          not: TARGET_SUBCOUNTY_ID,
        },
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
      },
    });

  if (crossSubCountyWards.length === 0) {
    pass(
      "Tiaty wards cannot resolve to another SubCounty",
      "All expected Tiaty wards remain under 757",
    );
  } else {
    fail(
      "Tiaty wards cannot resolve to another SubCounty",
      `Wrong SubCounty wards: ${crossSubCountyWards
        .map(
          (ward) =>
            `${ward.id}->${ward.subCountyId}`,
        )
        .join(", ")}`,
    );
  }

  // ==========================================================
  // 19. HISTORICAL IDs
  // ==========================================================

  section("19. HISTORICAL ID SAFETY");

  const historicalSubCounty =
    await prisma.subCounty.findUnique({
      where: {
        id: HISTORICAL_SUBCOUNTY_ID,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!historicalSubCounty) {
    pass(
      "Historical SubCounty 463 absent",
      "No SubCounty ID 463 exists",
    );
  } else {
    fail(
      "Historical SubCounty 463 absent",
      `Found ${historicalSubCounty.name}`,
    );
  }

  const historicalWards =
    await prisma.ward.findMany({
      where: {
        id: {
          in: HISTORICAL_WARD_IDS,
        },
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
      },
    });

  if (historicalWards.length === 0) {
    pass(
      "Historical duplicate Ward IDs absent",
      "2629–2632 are absent",
    );
  } else {
    fail(
      "Historical duplicate Ward IDs absent",
      historicalWards
        .map(
          (ward) =>
            `${ward.id} | ${ward.name} | subCounty ${ward.subCountyId}`,
        )
        .join("; "),
    );
  }

  // ==========================================================
  // 20. FARMER CREATE/UPDATE SEMANTICS
  // ==========================================================

  section("20. FARMER CREATE / UPDATE SEMANTICS");

  if (has(api, "dbUser.farmer")) {
    pass(
      "Existing Farmer detection",
      "API checks dbUser.farmer",
    );
  } else {
    fail(
      "Existing Farmer detection",
      "dbUser.farmer not detected",
    );
  }

  if (has(api, "prisma.farmer.update")) {
    pass(
      "Existing Farmer update path",
      "prisma.farmer.update detected",
    );
  } else {
    fail(
      "Existing Farmer update path",
      "Farmer update path not detected",
    );
  }

  if (has(api, "prisma.farmer.create")) {
    pass(
      "New Farmer create path",
      "prisma.farmer.create detected",
    );
  } else {
    fail(
      "New Farmer create path",
      "Farmer create path not detected",
    );
  }

  // ==========================================================
  // 21. PHONE UNIQUENESS
  // ==========================================================

  section("21. PHONE OWNERSHIP SAFETY");

  if (
    has(api, "prisma.farmer.findUnique") &&
    has(api, "phone")
  ) {
    pass(
      "Existing phone lookup",
      "Farmer phone uniqueness check detected",
    );
  } else {
    fail(
      "Existing phone lookup",
      "Could not prove phone uniqueness check",
    );
  }

  if (
    has(api, "existingFarmer.userId") &&
    has(api, "dbUser.id")
  ) {
    pass(
      "Phone cannot belong to another user",
      "Existing Farmer user ownership comparison detected",
    );
  } else {
    fail(
      "Phone cannot belong to another user",
      "Could not prove phone ownership comparison",
    );
  }

  // ==========================================================
  // 22. FORM/API LOCATION CONTRACT
  // ==========================================================

  section("22. FORM → API LOCATION CONTRACT");

  for (const field of locationFields) {
    const formHas =
      has(formPayload, field);

    const apiHas =
      has(api, field);

    if (formHas && apiHas) {
      pass(
        `Form/API ${field} contract`,
        "Field exists on both sides",
      );
    } else {
      fail(
        `Form/API ${field} contract`,
        `Form=${formHas}, API=${apiHas}`,
      );
    }
  }

  // ==========================================================
  // 23. NATIONAL CURRENT COUNTS
  // ==========================================================

  section("23. CURRENT NATIONAL GEOGRAPHY COUNTS");

  const countyCount =
    await prisma.county.count();

  const subCountyCount =
    await prisma.subCounty.count();

  const wardCount =
    await prisma.ward.count();

  if (countyCount === 47) {
    pass(
      "County count",
      "47",
    );
  } else {
    fail(
      "County count",
      `Expected 47, found ${countyCount}`,
    );
  }

  if (subCountyCount === 301) {
    pass(
      "SubCounty count",
      "301",
    );
  } else {
    fail(
      "SubCounty count",
      `Expected current mapped count 301, found ${subCountyCount}`,
    );
  }

  if (wardCount === 1450) {
    pass(
      "Ward count",
      "1450",
    );
  } else {
    fail(
      "Ward count",
      `Expected 1450, found ${wardCount}`,
    );
  }

  // ==========================================================
  // 24. FINAL INTERPRETATION
  // ==========================================================

  section("24. V25 SUMMARY");

  const total = checks.length;
  const passed = checks.filter(
    (check) => check.pass,
  ).length;
  const failed = checks.filter(
    (check) => !check.pass,
  ).length;

  console.log(`TOTAL CHECKS : ${total}`);
  console.log(`PASS         : ${passed}`);
  console.log(`FAIL         : ${failed}`);
  console.log("");

  if (failed === 0) {
    console.log(
      "============================================================",
    );
    console.log(
      "V25 STATUS: PASS",
    );
    console.log(
      "============================================================",
    );
    console.log("");
    console.log(
      "FARMER REGISTRATION CONTRACT IS GREEN.",
    );
    console.log("");
    console.log(
      "Server-side authentication is authoritative.",
    );
    console.log(
      "Firebase UID resolves to the database User.",
    );
    console.log(
      "Farmer.userId is derived from dbUser.id.",
    );
    console.log(
      "Geography IDs are validated through the hierarchy.",
    );
    console.log(
      "Tiaty 757 and its 7 wards remain intact.",
    );
    console.log(
      "Historical Tiaty IDs remain absent.",
    );
  } else {
    console.log(
      "============================================================",
    );
    console.log(
      "V25 STATUS: REVIEW REQUIRED",
    );
    console.log(
      "============================================================",
    );
    console.log("");
    console.log(
      "One or more Farmer registration contract checks failed.",
    );
    console.log(
      "NO DATABASE MUTATION WAS PERFORMED.",
    );
    console.log("");
    console.log(
      "Review the failed checks before changing code or data.",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY AUDIT COMPLETE.",
  );
  console.log(
    "NO INSERT / UPDATE / DELETE PERFORMED.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V25 AUDIT ERROR:",
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });