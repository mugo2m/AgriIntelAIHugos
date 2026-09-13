import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const API_FILE = path.resolve("app/api/farmers/route.ts");

type Check = {
  name: string;
  pass: boolean;
  detail: string;
};

const checks: Check[] = [];

function check(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
  console.log(
    `${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`
  );
}

function section(title: string) {
  console.log("");
  console.log("=".repeat(72));
  console.log(title);
  console.log("=".repeat(72));
}

function hasAny(source: string, patterns: string[]): boolean {
  return patterns.some((p) => source.includes(p));
}

function extractPostMethod(source: string): string {
  const marker = "export async function POST";
  const start = source.indexOf(marker);

  if (start < 0) {
    return "";
  }

  const nextExport = source.indexOf(
    "export async function",
    start + marker.length
  );

  if (nextExport > start) {
    return source.slice(start, nextExport);
  }

  return source.slice(start);
}

function extractTransaction(source: string): string {
  const start = source.indexOf("prisma.$transaction");

  if (start < 0) {
    return "";
  }

  return source.slice(start);
}

function printSnippet(
  title: string,
  source: string,
  patterns: string[],
  radius = 500
) {
  for (const pattern of patterns) {
    const index = source.indexOf(pattern);

    if (index >= 0) {
      const start = Math.max(0, index - radius);
      const end = Math.min(source.length, index + pattern.length + radius);

      console.log("");
      console.log(`--- ${title}: ${pattern} ---`);
      console.log(source.slice(start, end));
      return;
    }
  }

  console.log("");
  console.log(`--- ${title}: NOT FOUND ---`);
}

async function main() {
  console.log("");
  console.log("FARMER REGISTRATION CONTRACT AUDIT V25.2");
  console.log("------------------------------------------------------------");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log(`API: ${API_FILE}`);

  section("1. SOURCE FILE");

  const apiExists = fs.existsSync(API_FILE);

  check(
    "Farmer API exists",
    apiExists,
    apiExists
      ? API_FILE
      : `Missing: ${API_FILE}`
  );

  if (!apiExists) {
    throw new Error("Farmer API route does not exist.");
  }

  const apiSource = fs.readFileSync(API_FILE, "utf8");
  const postSource = extractPostMethod(apiSource);

  check(
    "POST method exists",
    postSource.length > 0,
    postSource.length > 0
      ? "POST handler detected"
      : "POST handler not detected"
  );

  if (!postSource) {
    throw new Error("POST handler could not be extracted.");
  }

  console.log("");
  console.log(`POST source length: ${postSource.length} characters`);

  section("2. AUTHENTICATION CONTRACT");

  const hasGetCurrentUser = hasAny(postSource, [
    "getCurrentUser(",
    "getCurrentUser ()",
    "getCurrentUser",
  ]);

  check(
    "getCurrentUser detected",
    hasGetCurrentUser,
    hasGetCurrentUser
      ? "Server-side authenticated user is resolved"
      : "Could not detect getCurrentUser"
  );

  const hasCurrentUserGuard = hasAny(postSource, [
    "if (!currentUser)",
    "if (!currentUser)",
    "currentUser === null",
    "currentUser === undefined",
  ]);

  const has401 = postSource.includes("401");

  check(
    "Unauthenticated request rejected",
    hasCurrentUserGuard && has401,
    hasCurrentUserGuard && has401
      ? "Unauthenticated requests are guarded with HTTP 401"
      : "Could not confidently detect authenticated-user rejection"
  );

  section("3. FIREBASE UID → DATABASE USER");

  const hasFirebaseUidExtraction = hasAny(postSource, [
    "firebaseUid",
    "currentUser.id",
    "currentUser.uid",
    "typeof currentUser.id",
    "typeof currentUser.uid",
  ]);

  check(
    "Firebase UID extraction",
    hasFirebaseUidExtraction,
    hasFirebaseUidExtraction
      ? "Firebase UID is derived from authenticated user"
      : "Could not detect Firebase UID extraction"
  );

  const hasUserLookupByFirebaseUid =
    postSource.includes("prisma.user.findUnique") &&
    postSource.includes("firebaseUid");

  check(
    "Database User lookup by firebaseUid",
    hasUserLookupByFirebaseUid,
    hasUserLookupByFirebaseUid
      ? "Authenticated Firebase UID is used to find database User"
      : "Could not detect User lookup by firebaseUid"
  );

  const hasMissingDbUserGuard = hasAny(postSource, [
    "if (!dbUser)",
    "if (!dbUser)",
    "if (dbUser == null)",
    "if (dbUser === null)",
  ]) && postSource.includes("404");

  check(
    "Missing database User guard",
    hasMissingDbUserGuard,
    hasMissingDbUserGuard
      ? "Missing database User is rejected"
      : "Could not detect missing database User guard"
  );

  section("4. REQUEST JSON CONTRACT");

  const hasRequestJson = hasAny(postSource, [
    "request.json()",
    "await request.json()",
  ]);

  check(
    "Request JSON parsing",
    hasRequestJson,
    hasRequestJson
      ? "POST body is parsed as JSON"
      : "Could not detect request.json()"
  );

  section("5. FORM/API LOCATION CONTRACT");

  const requiredLocationIds = [
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  for (const field of requiredLocationIds) {
    check(
      `POST uses ${field}`,
      postSource.includes(field),
      postSource.includes(field)
        ? `${field} detected`
        : `${field} not detected`
    );
  }

  section("6. LOCATION VALIDATION SOURCE");

  printSnippet(
    "Country validation",
    postSource,
    [
      "country =",
      "countryId",
      "country:",
    ]
  );

  const hasCountryLookup = hasAny(postSource, [
    "prisma.country.findUnique",
    "tx.country.findUnique",
    "prisma.country.findFirst",
    "tx.country.findFirst",
  ]);

  check(
    "Country lookup/validation",
    hasCountryLookup,
    hasCountryLookup
      ? "Country is validated against database"
      : "Country database validation not detected"
  );

  const hasCountyLookup = hasAny(postSource, [
    "prisma.county.findUnique",
    "tx.county.findUnique",
    "prisma.county.findFirst",
    "tx.county.findFirst",
  ]);

  const hasCountyCountryRelation = hasAny(postSource, [
    "county.countryId",
    "countryId: county",
    "countyId",
  ]);

  check(
    "County lookup/validation",
    hasCountyLookup,
    hasCountyLookup
      ? "County is validated against database"
      : "County database validation not detected"
  );

  check(
    "County → Country ownership validation",
    hasCountyCountryRelation,
    hasCountyCountryRelation
      ? "County-country relationship is represented in validation/source"
      : "County-country relationship could not be detected"
  );

  const hasSubCountyLookup = hasAny(postSource, [
    "prisma.subCounty.findUnique",
    "tx.subCounty.findUnique",
    "prisma.subCounty.findFirst",
    "tx.subCounty.findFirst",
  ]);

  check(
    "SubCounty lookup/validation",
    hasSubCountyLookup,
    hasSubCountyLookup
      ? "SubCounty is validated against database"
      : "SubCounty database validation not detected"
  );

  const hasSubCountyCountyOwnership = hasAny(postSource, [
    "subCounty.countyId",
    "countyId: subCounty",
    "id: subCountyId,",
    "id: subCountyId",
  ]);

  check(
    "SubCounty → County ownership validation",
    hasSubCountyCountyOwnership,
    hasSubCountyCountyOwnership
      ? "SubCounty is scoped to County"
      : "Could not detect SubCounty → County ownership validation"
  );

  const hasConstituencyLookup = hasAny(postSource, [
    "prisma.constituency.findUnique",
    "tx.constituency.findUnique",
    "prisma.constituency.findFirst",
    "tx.constituency.findFirst",
  ]);

  check(
    "Constituency lookup/validation",
    hasConstituencyLookup,
    hasConstituencyLookup
      ? "Constituency is validated against database"
      : "Constituency database validation not detected"
  );

  const hasConstituencyCountyOwnership = hasAny(postSource, [
    "constituency.countyId",
    "countyId: constituency",
  ]);

  check(
    "Constituency → County ownership validation",
    hasConstituencyCountyOwnership,
    hasConstituencyCountyOwnership
      ? "Constituency is scoped to County"
      : "Could not detect Constituency → County ownership validation"
  );

  const hasWardLookup = hasAny(postSource, [
    "prisma.ward.findUnique",
    "tx.ward.findUnique",
    "prisma.ward.findFirst",
    "tx.ward.findFirst",
  ]);

  check(
    "Ward lookup/validation",
    hasWardLookup,
    hasWardLookup
      ? "Ward is validated against database"
      : "Ward database validation not detected"
  );

  const hasWardConstituencyOwnership = hasAny(postSource, [
    "ward.constituencyId",
    "constituencyId: ward",
    "constituencyId: constituency",
  ]);

  check(
    "Ward → Constituency ownership validation",
    hasWardConstituencyOwnership,
    hasWardConstituencyOwnership
      ? "Ward is linked/scoped to Constituency"
      : "Could not detect Ward → Constituency ownership validation"
  );

  const hasWardCountyOwnership = hasAny(postSource, [
    "ward.countyId",
    "countyId: ward",
  ]);

  check(
    "Ward → County ownership fields",
    hasWardCountyOwnership,
    hasWardCountyOwnership
      ? "Ward county ownership is represented"
      : "Ward county ownership field not detected"
  );

  const hasWardSubCountyOwnership = hasAny(postSource, [
    "ward.subCountyId",
    "subCountyId: ward",
  ]);

  check(
    "Ward → SubCounty ownership fields",
    hasWardSubCountyOwnership,
    hasWardSubCountyOwnership
      ? "Ward SubCounty ownership is represented"
      : "Ward SubCounty ownership field not detected"
  );

  section("7. LOCATION ERROR GUARDS");

  const locationErrorPatterns = [
    "Invalid country",
    "Invalid county",
    "Invalid subCounty",
    "Invalid subcounty",
    "Invalid constituency",
    "Invalid ward",
    "County does not belong",
    "SubCounty does not belong",
    "SubCounty does not belong to county",
    "Constituency does not belong",
    "Ward does not belong",
  ];

  const detectedLocationErrors = locationErrorPatterns.filter((p) =>
    postSource.toLowerCase().includes(p.toLowerCase())
  );

  check(
    "Location validation error guards",
    detectedLocationErrors.length > 0,
    detectedLocationErrors.length > 0
      ? `Detected ${detectedLocationErrors.length} location validation guard(s)`
      : "No explicit location validation error messages detected"
  );

  section("8. PRISMA TRANSACTION");

  const transactionSource = extractTransaction(postSource);

  check(
    "Prisma transaction exists",
    transactionSource.length > 0,
    transactionSource.length > 0
      ? "prisma.$transaction detected"
      : "Prisma transaction not detected"
  );

  if (transactionSource) {
    printSnippet(
      "Transaction",
      transactionSource,
      [
        "prisma.$transaction",
        "tx.farmer.update",
        "tx.farmer.create",
      ],
      900
    );
  }

  section("9. FARMER OWNERSHIP CONTRACT");

  const hasExistingFarmer = hasAny(postSource, [
    "dbUser.farmer",
    "dbUser?.farmer",
    "farmer: true",
  ]);

  check(
    "Existing Farmer selected from authenticated User",
    hasExistingFarmer,
    hasExistingFarmer
      ? "Existing Farmer is resolved through authenticated DB User"
      : "Could not detect authenticated User → Farmer relationship"
  );

  const hasFarmerUpdate = hasAny(postSource, [
    "tx.farmer.update",
    "prisma.farmer.update",
  ]);

  check(
    "Existing Farmer update path",
    hasFarmerUpdate,
    hasFarmerUpdate
      ? "Farmer update path detected"
      : "Farmer update path not detected"
  );

  const hasFarmerCreate = hasAny(postSource, [
    "tx.farmer.create",
    "prisma.farmer.create",
  ]);

  check(
    "New Farmer create path",
    hasFarmerCreate,
    hasFarmerCreate
      ? "Farmer create path detected"
      : "Farmer create path not detected"
  );

  const hasFarmerUserId = hasAny(postSource, [
    "userId: dbUser.id",
    "userId: dbUser?.id",
    "userId: user.id",
  ]);

  check(
    "Farmer.userId ownership",
    hasFarmerUserId,
    hasFarmerUserId
      ? "Farmer is linked to authenticated database User"
      : "Could not detect Farmer.userId ownership"
  );

  section("10. PHONE OWNERSHIP");

  const hasPhone = hasAny(postSource, [
    "phoneNumber",
    "normalizedPhone",
    "phone:",
  ]);

  check(
    "Phone field handled",
    hasPhone,
    hasPhone
      ? "Phone number is handled by API"
      : "Phone number handling not detected"
  );

  const hasPhoneUniqueGuard = hasAny(postSource, [
    "phone already",
    "phone is already",
    "phone uniqueness",
    "findFirst",
    "findUnique",
  ]);

  check(
    "Phone uniqueness/ownership guard",
    hasPhoneUniqueGuard,
    hasPhoneUniqueGuard
      ? "Phone ownership/uniqueness logic detected"
      : "Could not detect phone uniqueness logic"
  );

  section("11. FARM OWNERSHIP CONTRACT");

  const hasFarmUpdate = hasAny(postSource, [
    "tx.farm.update",
    "prisma.farm.update",
  ]);

  check(
    "Existing Farm update path",
    hasFarmUpdate,
    hasFarmUpdate
      ? "Farm update path detected"
      : "Farm update path not detected"
  );

  const hasFarmCreate = hasAny(postSource, [
    "tx.farm.create",
    "prisma.farm.create",
  ]);

  check(
    "New Farm create path",
    hasFarmCreate,
    hasFarmCreate
      ? "Farm create path detected"
      : "Farm create path not detected"
  );

  const hasFarmFarmerId = postSource.includes("farmerId");

  check(
    "Farm → Farmer ownership",
    hasFarmFarmerId,
    hasFarmFarmerId
      ? "Farm is linked to Farmer"
      : "Farm → Farmer ownership not detected"
  );

  section("12. FORM IDENTITY CONTRACT");

  const formFile = path.resolve("components/FarmerFarmForm.tsx");
  const formExists = fs.existsSync(formFile);

  check(
    "Farmer form exists",
    formExists,
    formExists ? formFile : `Missing: ${formFile}`
  );

  if (formExists) {
    const formSource = fs.readFileSync(formFile, "utf8");

    const hasFormJson = formSource.includes("JSON.stringify");

    check(
      "Farmer form JSON payload",
      hasFormJson,
      hasFormJson
        ? "Form submits JSON"
        : "JSON.stringify not detected"
    );

    for (const field of [
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
    ]) {
      check(
        `Form sends ${field}`,
        formSource.includes(field),
        formSource.includes(field)
          ? `${field} detected`
          : `${field} not detected`
      );
    }

    check(
      "Form does not submit trusted user identity",
      !hasAny(formSource, [
        "firebaseUid:",
        "userId:",
        "uid:",
      ]),
      !hasAny(formSource, [
        "firebaseUid:",
        "userId:",
        "uid:",
      ])
        ? "Client does not submit user identity; server resolves authenticated identity"
        : "Form appears to submit identity fields"
    );
  }

  section("13. TIA TY DATABASE INTEGRITY");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      wards: {
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
      },
    },
  });

  check(
    "Tiaty identity",
    !!tiaty &&
      tiaty.id === 757 &&
      tiaty.name === "Tiaty" &&
      tiaty.countyId === 90 &&
      tiaty.county.id === 90,
    tiaty
      ? `ID ${tiaty.id}, ${tiaty.name}, county ${tiaty.countyId} (${tiaty.county.name})`
      : "Tiaty 757 not found"
  );

  check(
    "Tiaty exactly 7 wards",
    !!tiaty && tiaty.wards.length === 7,
    tiaty
      ? `Tiaty has ${tiaty.wards.length} wards`
      : "Tiaty not found"
  );

  const tiatyWardOwnership =
    !!tiaty &&
    tiaty.wards.every(
      (ward) =>
        ward.subCountyId === 757 &&
        ward.countyId === 90
    );

  check(
    "Tiaty ward ownership",
    tiatyWardOwnership,
    tiatyWardOwnership
      ? "All Tiaty wards belong to SubCounty 757 and County 90"
      : "One or more Tiaty wards has incorrect ownership"
  );

  if (tiaty) {
    console.log("");
    console.log("Tiaty wards:");

    for (const ward of tiaty.wards) {
      console.log(
        `  ${ward.id} | ${ward.name} | county=${ward.countyId} | subCounty=${ward.subCountyId} | constituency=${ward.constituencyId}`
      );
    }
  }

  section("14. HISTORICAL ID SAFETY");

  const historicalSubCounty = await prisma.subCounty.findUnique({
    where: {
      id: 463,
    },
    select: {
      id: true,
      name: true,
    },
  });

  check(
    "Historical SubCounty 463 absent",
    historicalSubCounty === null,
    historicalSubCounty === null
      ? "SubCounty 463 does not exist"
      : `Unexpected SubCounty 463 exists: ${historicalSubCounty.name}`
  );

  const historicalWardIds = [2629, 2630, 2631, 2632];

  const historicalWards = await prisma.ward.findMany({
    where: {
      id: {
        in: historicalWardIds,
      },
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  check(
    "Historical Ward IDs 2629–2632 absent",
    historicalWards.length === 0,
    historicalWards.length === 0
      ? "All historical duplicate Ward IDs are absent"
      : `Unexpected historical wards found: ${historicalWards
          .map((w) => `${w.id}:${w.name}`)
          .join(", ")}`
  );

  section("15. NATIONAL GEOGRAPHY COUNTS");

  const countyCount = await prisma.county.count();
  const subCountyCount = await prisma.subCounty.count();
  const wardCount = await prisma.ward.count();

  console.log(`Counties    : ${countyCount}`);
  console.log(`SubCounties : ${subCountyCount}`);
  console.log(`Wards       : ${wardCount}`);

  check(
    "National County count",
    countyCount === 47,
    countyCount === 47
      ? "47 Counties"
      : `Expected 47, found ${countyCount}`
  );

  check(
    "National SubCounty count",
    subCountyCount === 301,
    subCountyCount === 301
      ? "301 SubCounties"
      : `Expected 301, found ${subCountyCount}`
  );

  check(
    "National Ward count",
    wardCount === 1450,
    wardCount === 1450
      ? "1450 Wards"
      : `Expected 1450, found ${wardCount}`
  );

  section("16. FINAL V25.2 SUMMARY");

  const passCount = checks.filter((c) => c.pass).length;
  const failCount = checks.filter((c) => !c.pass).length;

  console.log(`Checks : ${checks.length}`);
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);

  if (failCount === 0) {
    console.log("");
    console.log("STATUS: PASS");
    console.log("FARMER REGISTRATION CONTRACT IS GREEN");
  } else {
    console.log("");
    console.log("STATUS: REVIEW REQUIRED");
    console.log("One or more audit checks require source inspection.");
  }

  console.log("");
  console.log("IMPORTANT:");
  console.log("This audit is READ-ONLY.");
  console.log("No INSERT, UPDATE, or DELETE was performed.");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("AUDIT ERROR");
  console.error(error);

  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect failure after the primary error.
  }

  process.exit(1);
});
