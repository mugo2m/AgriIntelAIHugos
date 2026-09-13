import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const ROOT = process.cwd();

type Check = {
  name: string;
  passed: boolean;
  detail: string;
};

const checks: Check[] = [];

function addCheck(name: string, passed: boolean, detail: string) {
  checks.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} | ${name} | ${detail}`);
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath: string): string {
  const absolute = path.join(ROOT, relativePath);

  if (!fs.existsSync(absolute)) {
    return "";
  }

  return fs.readFileSync(absolute, "utf8");
}

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findFiles(
  directory: string,
  allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"])
): string[] {
  const results: string[] = [];

  if (!fs.existsSync(directory)) {
    return results;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build"
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, allowedExtensions));
    } else if (allowedExtensions.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

function relative(fullPath: string): string {
  return path.relative(ROOT, fullPath).replace(/\\/g, "/");
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function hasPrismaClientImport(text: string): boolean {
  return (
    text.includes('from "@prisma/client"') ||
    text.includes("from '@prisma/client'")
  );
}

function hasGeneratedPrismaImport(text: string): boolean {
  return (
    text.includes("generated/prisma") ||
    text.includes("generated\\prisma")
  );
}

function hasPrismaUsage(text: string): boolean {
  return (
    text.includes("prisma.") ||
    text.includes("PrismaPg") ||
    text.includes("PrismaClient")
  );
}

function printSection(title: string) {
  console.log("");
  console.log("============================================================");
  console.log(title);
  console.log("============================================================");
}

async function main() {
  printSection("GEOGRAPHY RUNTIME INTEGRATION AUDIT V24");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log(`Project root: ${ROOT}`);

  // --------------------------------------------------------------------------
  // 1. REQUIRED RUNTIME FILES
  // --------------------------------------------------------------------------

  printSection("1. REQUIRED RUNTIME FILES");

  const requiredFiles = [
    "app/api/locations/countries/route.ts",
    "app/api/locations/counties/route.ts",
    "app/api/locations/subcounties/route.ts",
    "app/api/locations/constituencies/route.ts",
    "app/api/locations/wards/route.ts",
    "app/api/farmers/route.ts",
  ];

  for (const file of requiredFiles) {
    addCheck(
      `Runtime file exists: ${file}`,
      fileExists(file),
      fileExists(file) ? "file exists" : "FILE MISSING"
    );
  }

  // --------------------------------------------------------------------------
  // 2. FARMER FORM DISCOVERY
  // --------------------------------------------------------------------------

  printSection("2. FARMER FORM DISCOVERY");

  const componentFiles = findFiles(path.join(ROOT, "components"));

  const farmerFormFiles = componentFiles.filter((file) => {
    const name = path.basename(file).toLowerCase();
    return (
      name.includes("farmerfarmform") ||
      name.includes("farmer-form") ||
      name.includes("farmerform")
    );
  });

  addCheck(
    "Farmer registration form discovered",
    farmerFormFiles.length > 0,
    farmerFormFiles.length > 0
      ? farmerFormFiles.map(relative).join(", ")
      : "NO FARMER FORM FILE DISCOVERED"
  );

  for (const file of farmerFormFiles) {
    console.log(`FORM | ${relative(file)}`);
  }

  // --------------------------------------------------------------------------
  // 3. LOCATION ENDPOINT SOURCE SEMANTICS
  // --------------------------------------------------------------------------

  printSection("3. LOCATION ENDPOINT SOURCE SEMANTICS");

  const countries = readFile("app/api/locations/countries/route.ts");
  const counties = readFile("app/api/locations/counties/route.ts");
  const subcounties = readFile("app/api/locations/subcounties/route.ts");
  const constituencies = readFile(
    "app/api/locations/constituencies/route.ts"
  );
  const wards = readFile("app/api/locations/wards/route.ts");

  addCheck(
    "Countries endpoint reads Country model",
    containsAny(normalizeText(countries), [
      "prisma.country",
      "prisma.country.",
    ]),
    "Expected Prisma Country access"
  );

  addCheck(
    "Counties endpoint filters by countryId",
    containsAny(normalizeText(counties), [
      "where: { countryid",
      "where: { countryid:",
      "countryid:",
      "countryid",
    ]),
    "Expected County filtering through countryId"
  );

  addCheck(
    "SubCounties endpoint filters by countyId",
    containsAny(normalizeText(subcounties), [
      "where: { countyid",
      "where: { countyid:",
      "countyid:",
    ]),
    "Expected SubCounty filtering through countyId"
  );

  addCheck(
    "Constituencies endpoint filters by countyId",
    containsAny(normalizeText(constituencies), [
      "where: { countyid",
      "where: { countyid:",
      "countyid:",
    ]),
    "Expected Constituency filtering through countyId"
  );

  addCheck(
    "Wards endpoint filters by constituencyId",
    containsAny(normalizeText(wards), [
      "where: { constituencyid",
      "where: { constituencyid:",
      "constituencyid:",
    ]),
    "Expected Ward filtering through constituencyId"
  );

  // --------------------------------------------------------------------------
  // 4. JSON RESPONSE SAFETY
  // --------------------------------------------------------------------------

  printSection("4. LOCATION ENDPOINT RESPONSE SAFETY");

  const endpointSources: Array<[string, string]> = [
    ["countries", countries],
    ["counties", counties],
    ["subcounties", subcounties],
    ["constituencies", constituencies],
    ["wards", wards],
  ];

  for (const [name, source] of endpointSources) {
    addCheck(
      `${name} endpoint returns JSON response`,
      source.includes("NextResponse.json") ||
        source.includes("Response.json") ||
        source.includes("return Response.json"),
      "Expected explicit JSON response"
    );

    addCheck(
      `${name} endpoint has error handling`,
      source.includes("catch") ||
        source.includes("try {") ||
        source.includes("try{"),
      "Expected try/catch or equivalent error handling"
    );
  }

  // --------------------------------------------------------------------------
  // 5. GENERATED PRISMA CLIENT USAGE
  // --------------------------------------------------------------------------

  printSection("5. GENERATED PRISMA CLIENT USAGE");

  const runtimePrismaFiles = [
    ...requiredFiles,
    ...farmerFormFiles.map(relative),
  ];

  const uniqueRuntimeFiles = [...new Set(runtimePrismaFiles)];

  for (const file of uniqueRuntimeFiles) {
    const source = readFile(file);

    if (!source) {
      continue;
    }

    if (hasPrismaUsage(source)) {
      const staleImport = hasPrismaClientImport(source);
      const generatedImport = hasGeneratedPrismaImport(source);

      addCheck(
        `Generated Prisma client: ${file}`,
        !staleImport || generatedImport,
        staleImport && !generatedImport
          ? 'STALE @prisma/client IMPORT DETECTED'
          : "No stale Prisma import detected"
      );
    }
  }

  // --------------------------------------------------------------------------
  // 6. RUNTIME API ROUTES REFERENCED BY FARMER FORM
  // --------------------------------------------------------------------------

  printSection("6. FARMER FORM LOCATION API INTEGRATION");

  const farmerFormSource = farmerFormFiles
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  const expectedApiPaths = [
    "/api/locations/countries",
    "/api/locations/counties",
    "/api/locations/subcounties",
    "/api/locations/constituencies",
    "/api/locations/wards",
  ];

  for (const apiPath of expectedApiPaths) {
    addCheck(
      `Farmer form references ${apiPath}`,
      farmerFormSource.includes(apiPath),
      farmerFormSource.includes(apiPath)
        ? "reference found"
        : "REFERENCE NOT FOUND"
    );
  }

  // --------------------------------------------------------------------------
  // 7. CASCADING ID STATE
  // --------------------------------------------------------------------------

  printSection("7. FARMER FORM ID CASCADING");

  const locationIds = [
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  for (const id of locationIds) {
    const found = farmerFormSource.includes(id);

    addCheck(
      `Farmer form uses ${id}`,
      found,
      found ? "field/state reference found" : "FIELD/STATE REFERENCE NOT FOUND"
    );
  }

  // --------------------------------------------------------------------------
  // 8. CASCADE RESET LOGIC
  // --------------------------------------------------------------------------

  printSection("8. CASCADE RESET LOGIC");

  const cascadePairs: Array<[string, string]> = [
    ["countryId", "countyId"],
    ["countyId", "subCountyId"],
    ["countyId", "constituencyId"],
    ["constituencyId", "wardId"],
  ];

  for (const [parent, child] of cascadePairs) {
    const parentIndex = farmerFormSource.indexOf(parent);
    const childIndex = farmerFormSource.indexOf(child);

    addCheck(
      `Cascade relationship ${parent} -> ${child} represented`,
      parentIndex >= 0 && childIndex >= 0,
      parentIndex >= 0 && childIndex >= 0
        ? "both IDs are present"
        : "one or both IDs missing"
    );
  }

  // --------------------------------------------------------------------------
  // 9. FARMER API LOCATION VALIDATION
  // --------------------------------------------------------------------------

  printSection("9. FARMER API LOCATION VALIDATION");

  const farmerRoute = readFile("app/api/farmers/route.ts");
  const farmerNormalized = normalizeText(farmerRoute);

  for (const id of [
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ]) {
    addCheck(
      `Farmer API references ${id}`,
      farmerNormalized.includes(id.toLowerCase()),
      farmerNormalized.includes(id.toLowerCase())
        ? "reference found"
        : "REFERENCE NOT FOUND"
    );
  }

  addCheck(
    "Farmer API validates SubCounty using county relationship",
    farmerNormalized.includes("subcounty") &&
      farmerNormalized.includes("countyid"),
    "SubCounty/county relationship logic detected"
  );

  addCheck(
    "Farmer API validates Ward relationship",
    farmerNormalized.includes("ward") &&
      farmerNormalized.includes("wardid"),
    "Ward validation references detected"
  );

  // --------------------------------------------------------------------------
  // 10. FARMER API JSON RESPONSE
  // --------------------------------------------------------------------------

  printSection("10. FARMER API RESPONSE SAFETY");

  addCheck(
    "Farmer POST/GET route returns JSON",
    farmerRoute.includes("NextResponse.json") ||
      farmerRoute.includes("Response.json"),
    "Expected explicit JSON responses"
  );

  addCheck(
    "Farmer API has error handling",
    farmerRoute.includes("catch") &&
      (farmerRoute.includes("error") || farmerRoute.includes("Error")),
    "Error handling detected"
  );

  // --------------------------------------------------------------------------
  // 11. RUNTIME SOURCE REFERENCE SCAN
  // --------------------------------------------------------------------------

  printSection("11. RUNTIME SOURCE REFERENCE SCAN");

  const runtimeDirectories = [
    path.join(ROOT, "app"),
    path.join(ROOT, "components"),
    path.join(ROOT, "lib"),
  ];

  const runtimeFiles = runtimeDirectories.flatMap((directory) =>
    findFiles(directory)
  );

  const references = [
    "/api/locations/countries",
    "/api/locations/counties",
    "/api/locations/subcounties",
    "/api/locations/constituencies",
    "/api/locations/wards",
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  const referenceCounts = new Map<string, number>();

  for (const reference of references) {
    referenceCounts.set(reference, 0);
  }

  for (const file of runtimeFiles) {
    const source = fs.readFileSync(file, "utf8");

    for (const reference of references) {
      if (source.includes(reference)) {
        referenceCounts.set(
          reference,
          (referenceCounts.get(reference) ?? 0) + 1
        );
      }
    }
  }

  for (const reference of references) {
    const count = referenceCounts.get(reference) ?? 0;

    addCheck(
      `Runtime reference exists: ${reference}`,
      count > 0,
      `${count} runtime file(s)`
    );
  }

  // --------------------------------------------------------------------------
  // 12. STALE TIATY REFERENCES IN RUNTIME
  // --------------------------------------------------------------------------

  printSection("12. STALE TIATY REFERENCES IN RUNTIME");

  const forbiddenRuntimeTerms = [
    "Tiaty East",
    "tiaty east",
    "subCountyId: 463",
    "subcountyid: 463",
    "2629",
    "2630",
    "2631",
    "2632",
  ];

  const staleRuntimeReferences: Array<{
    file: string;
    term: string;
  }> = [];

  for (const file of runtimeFiles) {
    const source = fs.readFileSync(file, "utf8");

    for (const term of forbiddenRuntimeTerms) {
      if (source.includes(term)) {
        staleRuntimeReferences.push({
          file: relative(file),
          term,
        });
      }
    }
  }

  if (staleRuntimeReferences.length === 0) {
    addCheck(
      "No obsolete Tiaty geography references in runtime",
      true,
      "No Tiaty East / SubCounty 463 / historical duplicate Ward IDs found"
    );
  } else {
    for (const item of staleRuntimeReferences) {
      console.log(`STALE | ${item.file} | ${item.term}`);
    }

    addCheck(
      "No obsolete Tiaty geography references in runtime",
      false,
      `${staleRuntimeReferences.length} obsolete runtime reference(s) found`
    );
  }

  // --------------------------------------------------------------------------
  // 13. DATABASE REPRESENTATIVE RELATIONSHIP CHECKS
  // --------------------------------------------------------------------------

  printSection("13. DATABASE RUNTIME RELATIONSHIP CHECKS");

  const targetTiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  addCheck(
    "Tiaty runtime identity remains correct",
    targetTiaty?.id === 757 &&
      targetTiaty.name === "Tiaty" &&
      targetTiaty.countyId === 90,
    targetTiaty
      ? `id=${targetTiaty.id}, name=${targetTiaty.name}, countyId=${targetTiaty.countyId}`
      : "Tiaty ID 757 NOT FOUND"
  );

  const tiatyWards = await prisma.ward.findMany({
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

  addCheck(
    "Tiaty has exactly 7 runtime wards",
    tiatyWards.length === 7,
    `${tiatyWards.length} ward(s)`
  );

  const tiatyWrongCounty = tiatyWards.filter(
    (ward) => ward.countyId !== 90
  );

  addCheck(
    "All Tiaty wards belong to Baringo county",
    tiatyWrongCounty.length === 0,
    tiatyWrongCounty.length === 0
      ? "all 7 wards have countyId=90"
      : `${tiatyWrongCounty.length} ward(s) have incorrect countyId`
  );

  const tiatyWrongSubCounty = tiatyWards.filter(
    (ward) => ward.subCountyId !== 757
  );

  addCheck(
    "All Tiaty wards point to SubCounty 757",
    tiatyWrongSubCounty.length === 0,
    tiatyWrongSubCounty.length === 0
      ? "all wards point to 757"
      : `${tiatyWrongSubCounty.length} ward(s) have incorrect subCountyId`
  );

  // --------------------------------------------------------------------------
  // 14. CROSS-COUNTY NEGATIVE INTEGRITY TEST
  // --------------------------------------------------------------------------

  printSection("14. CROSS-COUNTY NEGATIVE INTEGRITY TEST");

  const crossCountySubCounty = await prisma.subCounty.findFirst({
    where: {
      id: 757,
      countyId: {
        not: 90,
      },
    },
    select: {
      id: true,
      countyId: true,
    },
  });

  addCheck(
    "SubCounty 757 cannot resolve under a different county",
    crossCountySubCounty === null,
    crossCountySubCounty === null
      ? "no cross-county relationship exists"
      : `INVALID: SubCounty 757 also resolves under county ${crossCountySubCounty.countyId}`
  );

  const tiatyWardIds = tiatyWards.map((ward) => ward.id);

  let crossSubCountyWardCount = 0;

  if (tiatyWardIds.length > 0) {
    crossSubCountyWardCount = await prisma.ward.count({
      where: {
        id: {
          in: tiatyWardIds,
        },
        subCountyId: {
          not: 757,
        },
      },
    });
  }

  addCheck(
    "Tiaty ward IDs cannot resolve to another SubCounty",
    crossSubCountyWardCount === 0,
    crossSubCountyWardCount === 0
      ? "all Tiaty ward IDs resolve only to SubCounty 757"
      : `${crossSubCountyWardCount} invalid cross-SubCounty ward relationship(s)`
  );

  // --------------------------------------------------------------------------
  // 15. HISTORICAL IDS STILL ABSENT
  // --------------------------------------------------------------------------

  printSection("15. HISTORICAL ID ABSENCE");

  const historicalSubCounty463 = await prisma.subCounty.findUnique({
    where: {
      id: 463,
    },
    select: {
      id: true,
    },
  });

  addCheck(
    "Historical SubCounty 463 remains absent",
    historicalSubCounty463 === null,
    historicalSubCounty463 === null
      ? "SubCounty 463 not present"
      : "HISTORICAL SUBCOUNTY 463 FOUND"
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
  });

  addCheck(
    "Historical duplicate Ward IDs remain absent",
    historicalWards.length === 0,
    historicalWards.length === 0
      ? "Ward IDs 2629-2632 absent"
      : `FOUND ${historicalWards.length} historical ward record(s)`
  );

  // --------------------------------------------------------------------------
  // 16. NATIONAL CURRENT COUNTS
  // --------------------------------------------------------------------------

  printSection("16. CURRENT NATIONAL COUNTS");

  const countyCount = await prisma.county.count();
  const subCountyCount = await prisma.subCounty.count();
  const wardCount = await prisma.ward.count();

  console.log(`Counties    : ${countyCount}`);
  console.log(`SubCounties : ${subCountyCount}`);
  console.log(`Wards       : ${wardCount}`);

  addCheck(
    "Current database has 47 counties",
    countyCount === 47,
    `${countyCount} counties`
  );

  addCheck(
    "Current database has 301 production-mapped SubCounties",
    subCountyCount === 301,
    `${subCountyCount} SubCounties`
  );

  addCheck(
    "Current database has 1450 authority wards",
    wardCount === 1450,
    `${wardCount} wards`
  );

  // --------------------------------------------------------------------------
  // 17. FARMER FORM POST PAYLOAD
  // --------------------------------------------------------------------------

  printSection("17. FARMER FORM POST PAYLOAD");

  const payloadFields = [
    "userId",
    "firstName",
    "lastName",
    "phoneNumber",
    "farmName",
    "countryId",
    "countyId",
    "subCountyId",
    "constituencyId",
    "wardId",
  ];

  for (const field of payloadFields) {
    addCheck(
      `Farmer form payload includes ${field}`,
      farmerFormSource.includes(field),
      farmerFormSource.includes(field)
        ? "payload/state reference found"
        : "PAYLOAD FIELD NOT FOUND"
    );
  }

  // --------------------------------------------------------------------------
  // 18. FARMER API READ/WRITE RUNTIME SAFETY
  // --------------------------------------------------------------------------

  printSection("18. FARMER API RUNTIME SAFETY");

  addCheck(
    "Farmer API contains POST handler",
    /export\s+async\s+function\s+POST/i.test(farmerRoute),
    "POST handler detected"
  );

  addCheck(
    "Farmer API contains GET handler",
    /export\s+async\s+function\s+GET/i.test(farmerRoute),
    "GET handler detected"
  );

  addCheck(
    "Farmer API references Prisma Farmer model",
    farmerRoute.includes("prisma.farmer"),
    "prisma.farmer usage detected"
  );

  addCheck(
    "Farmer API references Prisma User model",
    farmerRoute.includes("prisma.user"),
    "prisma.user usage detected"
  );

  // --------------------------------------------------------------------------
  // 19. FINAL SUMMARY
  // --------------------------------------------------------------------------

  printSection("V24 SUMMARY");

  const passed = checks.filter((check) => check.passed).length;
  const failed = checks.filter((check) => !check.passed).length;

  console.log(`Checks : ${checks.length}`);
  console.log(`PASS   : ${passed}`);
  console.log(`FAIL   : ${failed}`);

  if (failed === 0) {
    console.log("");
    console.log("============================================================");
    console.log("RUNTIME GEOGRAPHY INTEGRATION IS GREEN");
    console.log("============================================================");
    console.log("");
    console.log("V24 STATUS: PASS");
  } else {
    console.log("");
    console.log("============================================================");
    console.log("RUNTIME GEOGRAPHY INTEGRATION REQUIRES REVIEW");
    console.log("============================================================");
    console.log("");
    console.log("V24 STATUS: REVIEW REQUIRED");
    console.log("");
    console.log("Failed checks:");

    for (const check of checks.filter((item) => !item.passed)) {
      console.log(`- ${check.name}: ${check.detail}`);
    }
  }

  await prisma.$disconnect();

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error("");
  console.error("V24 AUDIT ERROR");
  console.error(error);

  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect failure during fatal error.
  }

  process.exitCode = 1;
});