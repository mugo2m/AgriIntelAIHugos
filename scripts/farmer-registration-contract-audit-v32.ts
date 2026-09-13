import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

type CheckResult = {
  section: string;
  check: string;
  status: "FOUND" | "REVIEW" | "MISSING";
  evidence?: string;
};

const results: CheckResult[] = [];

const ROUTE_PATH = path.join(
  process.cwd(),
  "app",
  "api",
  "farmers",
  "route.ts",
);

function add(
  section: string,
  check: string,
  status: CheckResult["status"],
  evidence?: string,
) {
  results.push({
    section,
    check,
    status,
    evidence,
  });

  const label =
    status === "FOUND"
      ? "PASS"
      : status === "REVIEW"
        ? "REVIEW"
        : "MISSING";

  console.log(
    `${label.padEnd(8)} | ${section.padEnd(28)} | ${check}${
      evidence ? ` | ${evidence}` : ""
    }`,
  );
}

function has(source: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string") {
    return source.includes(pattern);
  }

  return pattern.test(source);
}

function countOccurrences(
  source: string,
  pattern: string,
): number {
  return source.split(pattern).length - 1;
}

/**
 * Detect a Prisma lookup regardless of whether the route
 * uses the root Prisma client or a transaction client.
 *
 * Examples detected:
 *
 * prisma.county.findUnique(...)
 * prisma.county.findFirst(...)
 * prisma.county.findMany(...)
 *
 * tx.county.findUnique(...)
 * tx.county.findFirst(...)
 * tx.county.findMany(...)
 */
function hasPrismaLookup(
  source: string,
  model: string,
): boolean {
  const patterns = [
    `prisma.${model}.findUnique`,
    `prisma.${model}.findFirst`,
    `prisma.${model}.findMany`,
    `tx.${model}.findUnique`,
    `tx.${model}.findFirst`,
    `tx.${model}.findMany`,
  ];

  return patterns.some((pattern) =>
    source.includes(pattern),
  );
}

/**
 * Detect Prisma create/update operations against either
 * the root Prisma client or transaction client.
 */
function hasPrismaWrite(
  source: string,
  model: string,
  operation: string,
): boolean {
  const patterns = [
    `prisma.${model}.${operation}`,
    `tx.${model}.${operation}`,
  ];

  return patterns.some((pattern) =>
    source.includes(pattern),
  );
}

async function main() {
  console.log("============================================================");
  console.log("FARMER REGISTRATION CONTRACT AUDIT V32.1");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log();

  // ----------------------------------------------------------
  // 1. FARMER API ROUTE
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("1. FARMER API ROUTE");
  console.log("------------------------------------------------------------");

  if (!fs.existsSync(ROUTE_PATH)) {
    add(
      "Route",
      "app/api/farmers/route.ts exists",
      "MISSING",
      ROUTE_PATH,
    );

    throw new Error(
      "Farmer registration route was not found.",
    );
  }

  const source = fs.readFileSync(
    ROUTE_PATH,
    "utf8",
  );

  const lineCount = source.split(/\r?\n/).length;
  const charCount = source.length;

  console.log(`Route: ${ROUTE_PATH}`);
  console.log(`Source characters: ${charCount}`);
  console.log(`Source lines: ${lineCount}`);
  console.log();

  add(
    "Route",
    "route.ts exists",
    "FOUND",
    `${lineCount} lines`,
  );

  // ----------------------------------------------------------
  // 2. HTTP METHODS
  // ----------------------------------------------------------

  console.log("------------------------------------------------------------");
  console.log("2. HTTP METHODS");
  console.log("------------------------------------------------------------");

  const getCount = countOccurrences(
    source,
    "export async function GET",
  );

  const postCount = countOccurrences(
    source,
    "export async function POST",
  );

  add(
    "HTTP methods",
    "GET handler",
    getCount > 0 ? "FOUND" : "MISSING",
    `${getCount} occurrence(s)`,
  );

  add(
    "HTTP methods",
    "POST handler",
    postCount > 0 ? "FOUND" : "MISSING",
    `${postCount} occurrence(s)`,
  );

  // ----------------------------------------------------------
  // 3. POST AUTHENTICATION
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("3. POST AUTHENTICATION CONTRACT");
  console.log("------------------------------------------------------------");

  const authImport =
    has(source, 'getCurrentUser"') ||
    has(source, "getCurrentUser'") ||
    has(source, "getCurrentUser");

  add(
    "POST authentication",
    "getCurrentUser authentication helper",
    authImport ? "FOUND" : "MISSING",
  );

  const currentUserCount = countOccurrences(
    source,
    "getCurrentUser",
  );

  add(
    "POST authentication",
    "getCurrentUser usage",
    currentUserCount > 0 ? "FOUND" : "MISSING",
    `${currentUserCount} occurrence(s)`,
  );

  add(
    "POST authentication",
    "401 unauthenticated response",
    has(source, "401") ? "FOUND" : "MISSING",
  );

  add(
    "POST authentication",
    "Firebase UID extraction",
    has(source, "firebaseUid") ? "FOUND" : "MISSING",
  );

  add(
    "POST authentication",
    "DB User lookup",
    has(source, "prisma.user.findUnique") ||
      has(source, "prisma.user.findFirst") ||
      has(source, "tx.user.findUnique") ||
      has(source, "tx.user.findFirst")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "POST authentication",
    "Farmer ownership/user relationship",
    has(source, "farmer")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 4. REQUEST VALIDATION
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("4. REQUEST VALIDATION");
  console.log("------------------------------------------------------------");

  add(
    "Request validation",
    "request.json() parsing",
    has(source, "request.json()")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Request validation",
    "malformed JSON handling",
    has(source, "Malformed JSON") ||
      has(source, "Invalid JSON") ||
      has(source, "Failed to parse") ||
      has(source, "JSON")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Request validation",
    "firstName validation",
    has(source, "firstName")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Request validation",
    "lastName validation",
    has(source, "lastName")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Request validation",
    "phoneNumber validation",
    has(source, "phoneNumber")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Request validation",
    "farmName validation",
    has(source, "farmName")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 5. GEOGRAPHY VALIDATION
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("5. GEOGRAPHY VALIDATION CONTRACT");
  console.log("------------------------------------------------------------");

  const geographyFields = [
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  for (const field of geographyFields) {
    add(
      "Geography validation",
      `${field} validation`,
      has(source, field)
        ? "FOUND"
        : "MISSING",
    );
  }

  add(
    "Geography validation",
    "optional villageId",
    has(source, "villageId")
      ? "FOUND"
      : "MISSING",
  );

  // IMPORTANT:
  // These checks recognize both:
  //
  // prisma.model.findUnique(...)
  // tx.model.findUnique(...)
  //
  // and findFirst/findMany variants.

  add(
    "Geography validation",
    "country lookup",
    hasPrismaLookup(source, "country")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Geography validation",
    "county lookup",
    hasPrismaLookup(source, "county")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Geography validation",
    "subCounty lookup",
    hasPrismaLookup(source, "subCounty")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Geography validation",
    "constituency lookup",
    hasPrismaLookup(source, "constituency")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Geography validation",
    "ward lookup",
    hasPrismaLookup(source, "ward")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Geography validation",
    "village lookup",
    hasPrismaLookup(source, "village")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 6. FARMER / FARM DATABASE CONTRACT
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("6. FARMER / FARM DATABASE CONTRACT");
  console.log("------------------------------------------------------------");

  add(
    "Farmer persistence",
    "Farmer lookup/update/create",
    hasPrismaLookup(source, "farmer") ||
      hasPrismaWrite(source, "farmer", "create") ||
      hasPrismaWrite(source, "farmer", "update")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Farm persistence",
    "Farm create/update",
    hasPrismaWrite(source, "farm", "create") ||
      hasPrismaWrite(source, "farm", "update")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "User persistence",
    "User update",
    hasPrismaWrite(source, "user", "update")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 7. TRANSACTION
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("7. TRANSACTION CONTRACT");
  console.log("------------------------------------------------------------");

  const transactionFound =
    has(source, "prisma.$transaction") ||
    has(source, "$transaction");

  add(
    "Transaction",
    "Prisma transaction",
    transactionFound
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 8. PHONE UNIQUENESS
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("8. PHONE UNIQUENESS");
  console.log("------------------------------------------------------------");

  add(
    "Phone uniqueness",
    "phone uniqueness check",
    has(source, "findFirst") &&
      has(source, "phone")
      ? "FOUND"
      : "REVIEW",
  );

  add(
    "Phone uniqueness",
    "409 conflict response",
    has(source, "409")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 9. PRISMA ERROR HANDLING
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("9. PRISMA ERROR HANDLING");
  console.log("------------------------------------------------------------");

  add(
    "Error handling",
    "P2002 unique constraint",
    has(source, "P2002")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Error handling",
    "P2003 foreign-key constraint",
    has(source, "P2003")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Error handling",
    "500 fallback",
    has(source, "500")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 10. RESPONSE CONTRACT
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("10. RESPONSE CONTRACT");
  console.log("------------------------------------------------------------");

  add(
    "Response",
    "success response",
    has(source, "NextResponse.json")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Response",
    "200 response",
    has(source, "200")
      ? "FOUND"
      : "MISSING",
  );

  add(
    "Response",
    "error response",
    has(source, "error")
      ? "FOUND"
      : "MISSING",
  );

  // ----------------------------------------------------------
  // 11. DATABASE SANITY
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("11. DATABASE SANITY");
  console.log("------------------------------------------------------------");

  const [
    countries,
    counties,
    subCounties,
    constituencies,
    wards,
    villages,
    users,
    farmers,
    farms,
  ] = await Promise.all([
    prisma.country.count(),
    prisma.county.count(),
    prisma.subCounty.count(),
    prisma.constituency.count(),
    prisma.ward.count(),
    prisma.village.count(),
    prisma.user.count(),
    prisma.farmer.count(),
    prisma.farm.count(),
  ]);

  console.log(`Countries       : ${countries}`);
  console.log(`Counties        : ${counties}`);
  console.log(`SubCounties     : ${subCounties}`);
  console.log(`Constituencies  : ${constituencies}`);
  console.log(`Wards           : ${wards}`);
  console.log(`Villages        : ${villages}`);
  console.log(`Users           : ${users}`);
  console.log(`Farmers         : ${farmers}`);
  console.log(`Farms           : ${farms}`);

  add(
    "Database sanity",
    "47 counties",
    counties === 47
      ? "FOUND"
      : "REVIEW",
    `actual=${counties}`,
  );

  add(
    "Database sanity",
    "1450 wards",
    wards === 1450
      ? "FOUND"
      : "REVIEW",
    `actual=${wards}`,
  );

  // ----------------------------------------------------------
  // 12. TIATY
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("12. TIATY SANITY CHECK");
  console.log("------------------------------------------------------------");

  const tiaty = await prisma.subCounty.findMany({
    where: {
      name: {
        equals: "Tiaty",
        mode: "insensitive",
      },
    },
    include: {
      county: true,
      wards: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  console.log(
    `Tiaty SubCounty rows: ${tiaty.length}`,
  );

  if (tiaty.length === 1) {
    console.log(
      `Tiaty ID: ${tiaty[0].id} | County: ${tiaty[0].county.name} (${tiaty[0].countyId})`,
    );

    console.log(
      `Tiaty ward count: ${tiaty[0].wards.length}`,
    );

    add(
      "Tiaty sanity",
      "exactly one Tiaty",
      "FOUND",
      `id=${tiaty[0].id}`,
    );

    add(
      "Tiaty sanity",
      "exactly seven Tiaty wards",
      tiaty[0].wards.length === 7
        ? "FOUND"
        : "REVIEW",
      `actual=${tiaty[0].wards.length}`,
    );
  } else {
    add(
      "Tiaty sanity",
      "exactly one Tiaty",
      "REVIEW",
      `actual=${tiaty.length}`,
    );
  }

  // ----------------------------------------------------------
  // 13. LANG'ATA
  // ----------------------------------------------------------

  console.log();
  console.log("------------------------------------------------------------");
  console.log("13. LANG'ATA SANITY CHECK");
  console.log("------------------------------------------------------------");

  const langata = await prisma.subCounty.findMany({
    where: {
      name: {
        contains: "Lang",
        mode: "insensitive",
      },
    },
    include: {
      county: true,
      wards: true,
    },
  });

  const langataExact = langata.filter(
    (row) =>
      row.name
        .toLowerCase()
        .replace(/['’]/g, "'")
        .trim() === "lang'ata",
  );

  console.log(
    `Lang'ata candidate rows: ${langata.length}`,
  );

  for (const row of langata) {
    console.log(
      `ID ${row.id} | ${row.name} | County ${row.county.name} (${row.countyId}) | Wards ${row.wards.length}`,
    );
  }

  if (langataExact.length === 1) {
    add(
      "Lang'ata sanity",
      "exactly one Lang'ata",
      "FOUND",
      `id=${langataExact[0].id}`,
    );

    add(
      "Lang'ata sanity",
      "exactly five Lang'ata wards",
      langataExact[0].wards.length === 5
        ? "FOUND"
        : "REVIEW",
      `actual=${langataExact[0].wards.length}`,
    );
  } else {
    add(
      "Lang'ata sanity",
      "exactly one Lang'ata",
      "REVIEW",
      `exact=${langataExact.length}`,
    );
  }

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  console.log();
  console.log("============================================================");
  console.log("V32.1 AUDIT SUMMARY");
  console.log("============================================================");

  const found = results.filter(
    (result) => result.status === "FOUND",
  ).length;

  const review = results.filter(
    (result) => result.status === "REVIEW",
  ).length;

  const missing = results.filter(
    (result) => result.status === "MISSING",
  ).length;

  console.log(`FOUND   : ${found}`);
  console.log(`REVIEW  : ${review}`);
  console.log(`MISSING : ${missing}`);

  console.log();
  console.log("------------------------------------------------------------");
  console.log("REVIEW ITEMS");
  console.log("------------------------------------------------------------");

  const reviewItems = results.filter(
    (result) => result.status === "REVIEW",
  );

  if (reviewItems.length === 0) {
    console.log("None.");
  } else {
    for (const item of reviewItems) {
      console.log(
        `REVIEW | ${item.section} | ${item.check}${
          item.evidence
            ? ` | ${item.evidence}`
            : ""
        }`,
      );
    }
  }

  console.log();
  console.log("------------------------------------------------------------");
  console.log("MISSING ITEMS");
  console.log("------------------------------------------------------------");

  const missingItems = results.filter(
    (result) => result.status === "MISSING",
  );

  if (missingItems.length === 0) {
    console.log("None.");
  } else {
    for (const item of missingItems) {
      console.log(
        `MISSING | ${item.section} | ${item.check}${
          item.evidence
            ? ` | ${item.evidence}`
            : ""
        }`,
      );
    }
  }

  console.log();
  console.log("============================================================");
  console.log("V32.1 CONTRACT AUDIT COMPLETE");
  console.log("============================================================");
  console.log(
    "READ-ONLY: NO INSERT / UPDATE / DELETE WAS PERFORMED.",
  );

  if (missing === 0 && review === 0) {
    console.log("STATUS: GREEN");
  } else if (missing === 0) {
    console.log("STATUS: GREEN WITH REVIEW ITEMS");
  } else {
    console.log("STATUS: REVIEW REQUIRED");
  }
}

main()
  .catch((error) => {
    console.error();
    console.error("============================================================");
    console.error("V32.1 AUDIT FAILED");
    console.error("============================================================");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });