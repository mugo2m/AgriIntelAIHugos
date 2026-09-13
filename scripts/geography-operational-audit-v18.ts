import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const TARGET_SUBCOUNTY_ID = 757;
const OLD_NAME = "Tiaty East";
const NEW_NAME = "Tiaty";
const BARINGO_COUNTY_ID = 90;

type Match = {
  file: string;
  line: number;
  text: string;
};

const PROJECT_ROOT = process.cwd();

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo",
]);

const EXECUTABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const OPERATIONAL_DIRECTORY_NAMES = new Set([
  "prisma",
  "seed",
  "seeds",
  "seeders",
  "scripts",
  "src",
  "app",
  "pages",
  "lib",
  "server",
  "api",
]);

const OPERATIONAL_FILE_NAMES = new Set([
  "seed.ts",
  "seed.js",
  "seed.mjs",
  "seed.cjs",
]);

function relative(filePath: string): string {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
}

function readText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walkDirectory(dir: string): string[] {
  const results: string[] = [];

  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (
      EXECUTABLE_EXTENSIONS.has(extension) ||
      OPERATIONAL_FILE_NAMES.has(entry.name.toLowerCase())
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function getAllExecutableFiles(): string[] {
  return walkDirectory(PROJECT_ROOT).sort();
}

function findMatches(
  files: string[],
  pattern: RegExp,
): Match[] {
  const matches: Match[] = [];

  for (const file of files) {
    const text = readText(file);

    if (!text) {
      continue;
    }

    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({
          file: relative(file),
          line: i + 1,
          text: lines[i].trim(),
        });
      }

      pattern.lastIndex = 0;
    }
  }

  return matches;
}

function isOperationalPath(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  const parts = normalized.split("/");

  return parts.some((part) =>
    OPERATIONAL_DIRECTORY_NAMES.has(part.toLowerCase()),
  );
}

function isHistoricalAuditScript(file: string): boolean {
  const normalized = file.toLowerCase().replace(/\\/g, "/");

  const name = path.basename(normalized);

  return (
    name.startsWith("audit-") ||
    name.startsWith("geography-forensic-audit") ||
    name.startsWith("geography-repair-impact") ||
    name.startsWith("inspect-baringo-tiaty") ||
    name.startsWith("repair-baringo-tiaty") ||
    name.startsWith("repair-tiaty") ||
    name.includes("forensic") ||
    name.includes("post-deletion") ||
    name.includes("post-migration") ||
    name.includes("reconciliation")
  );
}

function printMatches(title: string, matches: Match[]): void {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));

  if (matches.length === 0) {
    console.log("No matches.");
    return;
  }

  for (const match of matches) {
    console.log(`${match.file}:${match.line}`);
    console.log(`  ${match.text}`);
  }
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("GEOGRAPHY OPERATIONAL AUDIT V18");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");
  console.log(`Target SubCounty ID : ${TARGET_SUBCOUNTY_ID}`);
  console.log(`Current name        : ${OLD_NAME}`);
  console.log(`Proposed name       : ${NEW_NAME}`);
  console.log(`Baringo County ID   : ${BARINGO_COUNTY_ID}`);
  console.log("");

  let overallPass = true;

  // ==========================================================
  // SECTION 1
  // ==========================================================

  console.log("SECTION 1: DATABASE TARGET");
  console.log("--------------------------");

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    include: {
      county: true,
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

  if (!target) {
    console.log("FAIL: SubCounty 757 does not exist.");
    overallPass = false;
  } else {
    console.log(`ID       : ${target.id}`);
    console.log(`Name     : ${target.name}`);
    console.log(`County   : ${target.county.name}`);
    console.log(`County ID: ${target.countyId}`);
    console.log(`Wards    : ${target.wards.length}`);

    const targetPass =
      target.id === TARGET_SUBCOUNTY_ID &&
      target.name === OLD_NAME &&
      target.countyId === BARINGO_COUNTY_ID &&
      target.county.name === "Baringo" &&
      target.wards.length === 7 &&
      target.wards.every(
        (ward) =>
          ward.countyId === BARINGO_COUNTY_ID &&
          ward.subCountyId === TARGET_SUBCOUNTY_ID,
      );

    console.log("");
    console.log(
      `Target database identity: ${targetPass ? "PASS" : "FAIL"}`,
    );

    if (!targetPass) {
      overallPass = false;
    }

    for (const ward of target.wards) {
      console.log(
        `  ${ward.id} | ${ward.name} | county=${ward.countyId} | subCounty=${ward.subCountyId} | constituency=${ward.constituencyId}`,
      );
    }
  }

  // ==========================================================
  // SECTION 2
  // ==========================================================

  console.log("");
  console.log("SECTION 2: EXECUTABLE SOURCE INVENTORY");
  console.log("--------------------------------------");

  const executableFiles = getAllExecutableFiles();

  console.log(
    `Executable source files discovered: ${executableFiles.length}`,
  );

  // ==========================================================
  // SECTION 3
  // ==========================================================

  console.log("");
  console.log("SECTION 3: OLD-NAME REFERENCES");
  console.log("------------------------------");

  const oldNameMatches = findMatches(
    executableFiles,
    /Tiaty\s+East/i,
  );

  console.log(
    `Executable references to "${OLD_NAME}": ${oldNameMatches.length}`,
  );

  // ==========================================================
  // SECTION 4
  // ==========================================================

  console.log("");
  console.log("SECTION 4: OPERATIONAL OLD-NAME REFERENCES");
  console.log("-------------------------------------------");

  const operationalOldNameMatches = oldNameMatches.filter((match) =>
    isOperationalPath(match.file),
  );

  console.log(
    `Operational-path references to "${OLD_NAME}": ${operationalOldNameMatches.length}`,
  );

  printMatches(
    "OPERATIONAL OLD-NAME REFERENCES",
    operationalOldNameMatches,
  );

  // ==========================================================
  // SECTION 5
  // ==========================================================

  console.log("");
  console.log("SECTION 5: HISTORICAL AUDIT REFERENCES");
  console.log("--------------------------------------");

  const historicalOldNameMatches = oldNameMatches.filter((match) =>
    isHistoricalAuditScript(match.file),
  );

  console.log(
    `Historical-audit references to "${OLD_NAME}": ${historicalOldNameMatches.length}`,
  );

  printMatches(
    "HISTORICAL AUDIT REFERENCES",
    historicalOldNameMatches,
  );

  // ==========================================================
  // SECTION 6
  // ==========================================================

  console.log("");
  console.log("SECTION 6: NAME-BASED DATABASE OPERATIONS");
  console.log("-----------------------------------------");

  const nameQueryMatches = findMatches(
    executableFiles,
    /(findFirst|findUnique|findMany|update|upsert|create|delete)\s*\(/i,
  );

  const tiatyNameOperationMatches = nameQueryMatches.filter((match) =>
    /Tiaty\s+East|Tiaty/i.test(match.text),
  );

  console.log(
    `Executable lines combining database operation + Tiaty name: ${tiatyNameOperationMatches.length}`,
  );

  printMatches(
    "DATABASE OPERATION + TIATY NAME REFERENCES",
    tiatyNameOperationMatches,
  );

  // ==========================================================
  // SECTION 7
  // ==========================================================

  console.log("");
  console.log("SECTION 7: NAME-BASED SUBCOUNTY LOOKUPS");
  console.log("---------------------------------------");

  const subCountyLookupMatches = findMatches(
    executableFiles,
    /(subCounty|subcounty|SubCounty)[^;\n]*(name|contains|startsWith|equals|in)/i,
  ).filter((match) => /Tiaty|tiaty/i.test(match.text));

  console.log(
    `Tiaty-related SubCounty name lookup lines: ${subCountyLookupMatches.length}`,
  );

  printMatches(
    "TIATY-RELATED SUBCOUNTY NAME LOOKUPS",
    subCountyLookupMatches,
  );

  // ==========================================================
  // SECTION 8
  // ==========================================================

  console.log("");
  console.log("SECTION 8: HARD-CODED ID 757 REFERENCES");
  console.log("---------------------------------------");

  const id757Matches = findMatches(
    executableFiles,
    /\b757\b/,
  );

  console.log(
    `Executable references containing ID 757: ${id757Matches.length}`,
  );

  printMatches(
    "ID 757 REFERENCES",
    id757Matches,
  );

  // ==========================================================
  // SECTION 9
  // ==========================================================

  console.log("");
  console.log("SECTION 9: OLD NAME + ID 757 REFERENCES");
  console.log("---------------------------------------");

  const oldNameAnd757Matches = findMatches(
    executableFiles,
    /(Tiaty\s+East[^\n]*757|757[^\n]*Tiaty\s+East)/i,
  );

  console.log(
    `Executable references combining 757 + "${OLD_NAME}": ${oldNameAnd757Matches.length}`,
  );

  printMatches(
    "ID 757 + OLD NAME",
    oldNameAnd757Matches,
  );

  // ==========================================================
  // SECTION 10
  // ==========================================================

  console.log("");
  console.log("SECTION 10: GENERATOR / IMPORTER RISK");
  console.log("-------------------------------------");

  const generatorImporterFiles = executableFiles.filter((file) => {
    const normalized = file.toLowerCase().replace(/\\/g, "/");

    return (
      normalized.includes("seed") ||
      normalized.includes("import") ||
      normalized.includes("generate") ||
      normalized.includes("loader") ||
      normalized.includes("load-") ||
      normalized.includes("migration")
    );
  });

  console.log(
    `Potential seed/import/generator files: ${generatorImporterFiles.length}`,
  );

  const generatorOldNameMatches = findMatches(
    generatorImporterFiles,
    /Tiaty\s+East/i,
  );

  console.log(
    `Old-name references in potential seed/import/generator files: ${generatorOldNameMatches.length}`,
  );

  printMatches(
    "SEED / IMPORT / GENERATOR OLD-NAME REFERENCES",
    generatorOldNameMatches,
  );

  // ==========================================================
  // SECTION 11
  // ==========================================================

  console.log("");
  console.log("SECTION 11: CRITICAL GENERATOR CHECK");
  console.log("------------------------------------");

  const criticalGeneratorNames = [
    "scripts/generate-subcounty-ward-map.ts",
    "scripts/repair-baringo-tiaty.ts",
    "scripts/repair-tiaty-v15-2.ts",
  ];

  for (const expectedFile of criticalGeneratorNames) {
    const actual = executableFiles.find(
      (file) => relative(file).toLowerCase() === expectedFile.toLowerCase(),
    );

    console.log("");
    console.log(expectedFile);

    if (!actual) {
      console.log("  File not found.");
      continue;
    }

    const text = readText(actual);
    const lines = text.split(/\r?\n/);

    const relevant = lines
      .map((line, index) => ({
        line: index + 1,
        text: line.trim(),
      }))
      .filter(
        (entry) =>
          /Tiaty\s+East|Tiaty|757|463/i.test(entry.text),
      );

    console.log(
      `  Relevant Tiaty/ID references: ${relevant.length}`,
    );

    for (const entry of relevant) {
      console.log(`  ${entry.line}: ${entry.text}`);
    }
  }

  // ==========================================================
  // SECTION 12
  // ==========================================================

  console.log("");
  console.log("SECTION 12: PACKAGE.JSON COMMANDS");
  console.log("---------------------------------");

  const packageJsonPath = path.join(PROJECT_ROOT, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf8"),
      );

      const scripts =
        packageJson?.scripts &&
        typeof packageJson.scripts === "object"
          ? packageJson.scripts
          : {};

      const scriptEntries = Object.entries(scripts);

      console.log(`package.json scripts: ${scriptEntries.length}`);

      for (const [name, command] of scriptEntries) {
        const commandText = String(command);

        if (
          /seed|import|generate|migration|geography|location|prisma/i.test(
            `${name} ${commandText}`,
          )
        ) {
          console.log(`  ${name}: ${commandText}`);
        }
      }
    } catch (error) {
      console.log("Could not parse package.json.");
      console.log(error);
      overallPass = false;
    }
  } else {
    console.log("package.json not found.");
    overallPass = false;
  }

  // ==========================================================
  // SECTION 13
  // ==========================================================

  console.log("");
  console.log("SECTION 13: DATABASE NAME COLLISION");
  console.log("-----------------------------------");

  const oldNameRows = await prisma.subCounty.findMany({
    where: {
      name: OLD_NAME,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          name: true,
        },
      },
    },
  });

  const newNameRows = await prisma.subCounty.findMany({
    where: {
      name: NEW_NAME,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`Rows named "${OLD_NAME}": ${oldNameRows.length}`);
  console.log(`Rows named "${NEW_NAME}": ${newNameRows.length}`);

  for (const row of oldNameRows) {
    console.log(
      `  OLD | ${row.id} | ${row.name} | county=${row.countyId} ${row.county.name}`,
    );
  }

  for (const row of newNameRows) {
    console.log(
      `  NEW | ${row.id} | ${row.name} | county=${row.countyId} ${row.county.name}`,
    );
  }

  const collisionPass =
    newNameRows.length === 0 ||
    newNameRows.every(
      (row) =>
        row.id === TARGET_SUBCOUNTY_ID &&
        row.countyId === BARINGO_COUNTY_ID,
    );

  console.log(
    `Proposed "${NEW_NAME}" collision check: ${
      collisionPass ? "PASS" : "FAIL"
    }`,
  );

  if (!collisionPass) {
    overallPass = false;
  }

  // ==========================================================
  // SECTION 14
  // ==========================================================

  console.log("");
  console.log("SECTION 14: RELATIONAL IMPACT");
  console.log("-----------------------------");

  const wardRefs = await prisma.ward.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const farmerRefs = await prisma.farmer.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const farmRefs = await prisma.farm.count({
    where: {
      subCountyId: TARGET_SUBCOUNTY_ID,
    },
  });

  const villageRefs = await prisma.village.count({
    where: {
      ward: {
        subCountyId: TARGET_SUBCOUNTY_ID,
      },
    },
  });

  console.log(`Ward.subCountyId refs : ${wardRefs}`);
  console.log(`Farmer.subCountyId refs: ${farmerRefs}`);
  console.log(`Farm.subCountyId refs  : ${farmRefs}`);
  console.log(`Village rows beneath   : ${villageRefs}`);

  const relationalPass =
    wardRefs === 7 &&
    farmerRefs === 0 &&
    farmRefs === 0 &&
    villageRefs === 0;

  console.log(
    `Relational impact check: ${relationalPass ? "PASS" : "FAIL"}`,
  );

  if (!relationalPass) {
    overallPass = false;
  }

  // ==========================================================
  // SECTION 15
  // ==========================================================

  console.log("");
  console.log("SECTION 15: PROPOSED RENAME SEMANTICS");
  console.log("-------------------------------------");

  console.log(`Current : SubCounty ${TARGET_SUBCOUNTY_ID} | ${OLD_NAME}`);
  console.log(`Proposed: SubCounty ${TARGET_SUBCOUNTY_ID} | ${NEW_NAME}`);

  console.log("");
  console.log("The following IDs remain unchanged:");
  console.log(`  County      : ${BARINGO_COUNTY_ID}`);
  console.log(`  SubCounty   : ${TARGET_SUBCOUNTY_ID}`);

  if (target) {
    console.log(
      `  Wards       : ${target.wards.map((ward) => ward.id).join(", ")}`,
    );
    console.log(
      `  Constituency: ${[
        ...new Set(target.wards.map((ward) => ward.constituencyId)),
      ].join(", ")}`,
    );
  }

  // ==========================================================
  // SECTION 16
  // ==========================================================

  console.log("");
  console.log("SECTION 16: V18 FINAL DECISION");
  console.log("------------------------------");

  const apiOldNameMatches = oldNameMatches.filter((match) =>
    /(^|\/)(app|pages|src)\/.*(api|location|farmer)/i.test(match.file),
  );

  const dangerousOperationalMatches =
    operationalOldNameMatches.filter(
      (match) =>
        !isHistoricalAuditScript(match.file) &&
        !match.file.toLowerCase().includes("geography-pre-rename-audit-v17"),
    );

  const dangerousGeneratorMatches =
    generatorOldNameMatches.filter(
      (match) =>
        !isHistoricalAuditScript(match.file) &&
        !match.file.toLowerCase().includes("geography-pre-rename-audit-v17"),
    );

  console.log(
    `API/location old-name references          : ${apiOldNameMatches.length}`,
  );

  console.log(
    `Operational non-historical old-name refs  : ${dangerousOperationalMatches.length}`,
  );

  console.log(
    `Generator/import non-historical refs      : ${dangerousGeneratorMatches.length}`,
  );

  console.log(
    `Name collision                           : ${
      collisionPass ? "PASS" : "FAIL"
    }`,
  );

  console.log(
    `Relational impact                         : ${
      relationalPass ? "PASS" : "FAIL"
    }`,
  );

  const finalOperationalPass =
    target !== null &&
    target.name === OLD_NAME &&
    target.countyId === BARINGO_COUNTY_ID &&
    target.wards.length === 7 &&
    apiOldNameMatches.length === 0 &&
    dangerousOperationalMatches.length === 0 &&
    collisionPass &&
    relationalPass;

  console.log("");
  console.log(
    `V18 OPERATIONAL SAFETY: ${
      finalOperationalPass ? "PASS" : "REVIEW REQUIRED"
    }`,
  );

  if (!finalOperationalPass) {
    overallPass = false;
  }

  if (finalOperationalPass) {
    console.log("");
    console.log("============================================================");
    console.log("V18 DECISION: SAFE TO PROCEED TO CONTROLLED DB RENAME");
    console.log("============================================================");
    console.log("");
    console.log(
      `Approved logical operation: SubCounty ${TARGET_SUBCOUNTY_ID}`,
    );
    console.log(`  ${OLD_NAME} -> ${NEW_NAME}`);
    console.log("");
    console.log("No Ward reassignment is required.");
    console.log("No FK migration is required.");
    console.log("No SubCounty ID change is required.");
    console.log("No County change is required.");
    console.log("");
    console.log("IMPORTANT:");
    console.log(
      "Historical repair scripts must NOT be executed after the rename.",
    );
    console.log(
      "The post-rename national audit must be run immediately.",
    );
  } else {
    console.log("");
    console.log("============================================================");
    console.log("V18 DECISION: DO NOT RENAME YET");
    console.log("============================================================");
    console.log("");
    console.log(
      "At least one operational dependency still requires review.",
    );
  }

  console.log("");
  console.log("V18 COMPLETE");
  console.log("READ-ONLY: NO DATABASE CHANGES WERE MADE.");
  console.log("");

  await prisma.$disconnect();

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error("");
  console.error("V18 AUDIT FAILED WITH ERROR:");
  console.error(error);

  await prisma.$disconnect();

  process.exitCode = 1;
});