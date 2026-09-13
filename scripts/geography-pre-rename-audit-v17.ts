import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const ROOT = path.resolve(process.cwd());

const TARGET_ID = 757;
const OLD_NAME = "Tiaty East";
const NEW_NAME = "Tiaty";
const COUNTY_ID = 90;

const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

const HISTORICAL_DATA_DIRS = new Set([
  path.join("prisma", "data"),
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".prisma",
]);

type Match = {
  file: string;
  line: number;
  text: string;
};

type FileClassification = {
  file: string;
  matches: number;
  historical: boolean;
  executable: boolean;
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isHistoricalFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  if (normalized.startsWith("prisma/data/")) {
    return true;
  }

  const lower = normalized.toLowerCase();

  if (
    lower.includes("audit-v") &&
    (lower.endsWith(".json") || lower.endsWith(".md"))
  ) {
    return true;
  }

  return false;
}

function shouldSkipDir(name: string): boolean {
  return EXCLUDED_DIRS.has(name);
}

function walkFiles(
  directory: string,
  output: string[] = [],
): string[] {
  if (!fs.existsSync(directory)) {
    return output;
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (shouldSkipDir(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walkFiles(fullPath, output);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (SOURCE_EXTENSIONS.has(extension)) {
      output.push(fullPath);
    }
  }

  return output;
}

function findMatches(
  filePath: string,
  terms: string[],
): Match[] {
  const matches: Match[] = [];

  let content: string;

  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return matches;
  }

  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lower = line.toLowerCase();

    if (terms.some((term) => lower.includes(term.toLowerCase()))) {
      matches.push({
        file: path.relative(ROOT, filePath),
        line: index + 1,
        text: line.trim(),
      });
    }
  });

  return matches;
}

function printMatches(
  title: string,
  matches: Match[],
): void {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));

  if (matches.length === 0) {
    console.log("No matches.");
    return;
  }

  for (const match of matches) {
    console.log(
      `${match.file}:${match.line}`,
    );
    console.log(`  ${match.text}`);
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log("GEOGRAPHY PRE-RENAME APPLICATION AUDIT V17");
  console.log("Tiaty East -> Tiaty");
  console.log("=".repeat(60));
  console.log("");
  console.log("READ-ONLY: NO DATABASE CHANGES WILL BE MADE.");
  console.log("");

  console.log("TARGET");
  console.log("------");
  console.log(`SubCounty ID       : ${TARGET_ID}`);
  console.log(`Current name       : ${OLD_NAME}`);
  console.log(`Proposed name      : ${NEW_NAME}`);
  console.log(`County ID          : ${COUNTY_ID}`);
  console.log("");

  // ============================================================
  // SECTION 1
  // ============================================================

  console.log("SECTION 1: DATABASE TARGET VERIFICATION");
  console.log("---------------------------------------");

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_ID,
    },
    include: {
      county: true,
      wards: {
        orderBy: {
          id: "asc",
        },
        include: {
          constituency: true,
        },
      },
    },
  });

  if (!target) {
    throw new Error(
      `SAFETY STOP: SubCounty ${TARGET_ID} does not exist.`,
    );
  }

  console.log(
    JSON.stringify(
      {
        id: target.id,
        name: target.name,
        countyId: target.countyId,
        county: target.county?.name,
        wardCount: target.wards.length,
        wards: target.wards.map((ward) => ({
          id: ward.id,
          name: ward.name,
          countyId: ward.countyId,
          subCountyId: ward.subCountyId,
          constituencyId: ward.constituencyId,
          constituency: ward.constituency?.name,
        })),
      },
      null,
      2,
    ),
  );

  const targetIdentityPass =
    target.id === TARGET_ID &&
    target.name === OLD_NAME &&
    target.countyId === COUNTY_ID &&
    target.county?.name === "Baringo";

  console.log("");
  console.log(
    `Target identity: ${targetIdentityPass ? "PASS" : "FAIL"}`,
  );

  if (!targetIdentityPass) {
    throw new Error(
      "SAFETY STOP: Target identity does not match expected V17 values.",
    );
  }

  // ============================================================
  // SECTION 2
  // ============================================================

  console.log("");
  console.log("SECTION 2: SEARCH CURRENT EXECUTABLE SOURCE");
  console.log("--------------------------------------------");

  const files = walkFiles(ROOT);

  console.log(`Executable source files scanned: ${files.length}`);

  const oldNameMatches: Match[] = [];
  const newNameMatches: Match[] = [];
  const targetIdMatches: Match[] = [];

  for (const file of files) {
    oldNameMatches.push(
      ...findMatches(file, [
        `"${OLD_NAME.toLowerCase()}"`,
        `'${OLD_NAME.toLowerCase()}'`,
        OLD_NAME.toLowerCase(),
      ]),
    );

    newNameMatches.push(
      ...findMatches(file, [
        `"${NEW_NAME.toLowerCase()}"`,
        `'${NEW_NAME.toLowerCase()}'`,
        NEW_NAME.toLowerCase(),
      ]),
    );

    targetIdMatches.push(
      ...findMatches(file, [
        `id: ${TARGET_ID}`,
        `id=${TARGET_ID}`,
        `${TARGET_ID}`,
      ]),
    );
  }

  const dedupe = (matches: Match[]): Match[] => {
    const seen = new Set<string>();
    const result: Match[] = [];

    for (const match of matches) {
      const key =
        `${match.file}:${match.line}:${match.text}`;

      if (!seen.has(key)) {
        seen.add(key);
        result.push(match);
      }
    }

    return result;
  };

  const uniqueOldNameMatches = dedupe(oldNameMatches);
  const uniqueNewNameMatches = dedupe(newNameMatches);
  const uniqueTargetIdMatches = dedupe(targetIdMatches);

  console.log(
    `Executable matches for "${OLD_NAME}": ${uniqueOldNameMatches.length}`,
  );

  console.log(
    `Executable matches for standalone "${NEW_NAME}": ${uniqueNewNameMatches.length}`,
  );

  console.log(
    `Executable source matches involving ID ${TARGET_ID}: ${uniqueTargetIdMatches.length}`,
  );

  // ============================================================
  // SECTION 3
  // ============================================================

  printMatches(
    `SECTION 3: EXECUTABLE REFERENCES TO "${OLD_NAME}"`,
    uniqueOldNameMatches,
  );

  // ============================================================
  // SECTION 4
  // ============================================================

  printMatches(
    `SECTION 4: EXECUTABLE REFERENCES TO "${NEW_NAME}"`,
    uniqueNewNameMatches,
  );

  // ============================================================
  // SECTION 5
  // ============================================================

  console.log("");
  console.log("SECTION 5: CURRENT LOCATION / FARMER API CHECK");
  console.log("-----------------------------------------------");

  const apiDirectories = [
    path.join(ROOT, "app", "api"),
    path.join(ROOT, "pages", "api"),
  ];

  const apiFiles: string[] = [];

  for (const directory of apiDirectories) {
    if (fs.existsSync(directory)) {
      walkFiles(directory, apiFiles);
    }
  }

  const apiOldNameMatches: Match[] = [];

  for (const file of apiFiles) {
    apiOldNameMatches.push(
      ...findMatches(file, [
        OLD_NAME.toLowerCase(),
      ]),
    );
  }

  const uniqueApiOldNameMatches = dedupe(apiOldNameMatches);

  console.log(`API source files scanned: ${apiFiles.length}`);
  console.log(
    `API references to "${OLD_NAME}": ${uniqueApiOldNameMatches.length}`,
  );

  printMatches(
    "API REFERENCES TO TIATY EAST",
    uniqueApiOldNameMatches,
  );

  // ============================================================
  // SECTION 6
  // ============================================================

  console.log("");
  console.log("SECTION 6: CURRENT SEED / IMPORT / MIGRATION CHECK");
  console.log("--------------------------------------------------");

  const candidateDirectories = [
    path.join(ROOT, "prisma"),
    path.join(ROOT, "scripts"),
    path.join(ROOT, "db"),
    path.join(ROOT, "seed"),
    path.join(ROOT, "seeds"),
    path.join(ROOT, "migrations"),
  ];

  const candidateFiles: string[] = [];

  for (const directory of candidateDirectories) {
    if (fs.existsSync(directory)) {
      walkFiles(directory, candidateFiles);
    }
  }

  const seedOldNameMatches: Match[] = [];

  for (const file of candidateFiles) {
    seedOldNameMatches.push(
      ...findMatches(file, [
        OLD_NAME.toLowerCase(),
      ]),
    );
  }

  const uniqueSeedMatches = dedupe(seedOldNameMatches);

  console.log(
    `Seed/import/migration source files scanned: ${candidateFiles.length}`,
  );

  console.log(
    `References to "${OLD_NAME}": ${uniqueSeedMatches.length}`,
  );

  printMatches(
    "SEED / IMPORT / MIGRATION REFERENCES TO TIATY EAST",
    uniqueSeedMatches,
  );

  // ============================================================
  // SECTION 7
  // ============================================================

  console.log("");
  console.log("SECTION 7: CURRENT GEOGRAPHY AUDIT LOGIC");
  console.log("-----------------------------------------");

  const geographyScriptsDirectory =
    path.join(ROOT, "scripts");

  const geographyFiles = fs.existsSync(
    geographyScriptsDirectory,
  )
    ? fs.readdirSync(geographyScriptsDirectory)
        .filter((name) =>
          name.toLowerCase().includes("geograph"),
        )
        .filter((name) =>
          SOURCE_EXTENSIONS.has(
            path.extname(name).toLowerCase(),
          ),
        )
        .map((name) =>
          path.join(geographyScriptsDirectory, name),
        )
    : [];

  console.log(
    `Geography-related executable scripts found: ${geographyFiles.length}`,
  );

  const geographyOldNameMatches: Match[] = [];

  for (const file of geographyFiles) {
    geographyOldNameMatches.push(
      ...findMatches(file, [
        OLD_NAME.toLowerCase(),
      ]),
    );
  }

  const uniqueGeographyOldNameMatches =
    dedupe(geographyOldNameMatches);

  printMatches(
    "GEOGRAPHY SCRIPT REFERENCES TO TIATY EAST",
    uniqueGeographyOldNameMatches,
  );

  // ============================================================
  // SECTION 8
  // ============================================================

  console.log("");
  console.log("SECTION 8: SPECIFIC HIGH-RISK SCRIPT CHECK");
  console.log("------------------------------------------");

  const highRiskScripts = [
    "scripts/repair-baringo-tiaty.ts",
    "scripts/generate-subcounty-ward-map.ts",
    "scripts/final-geography-audit.ts",
    "scripts/geography-forensic-audit-v15.ts",
    "scripts/geography-repair-impact-v16.ts",
    "scripts/audit-subcounty-consolidation-v13.ts",
    "scripts/audit-v13-3-final-reconciliation.ts",
    "scripts/audit-v14-1-post-migration.ts",
    "scripts/audit-v15-1-post-deletion.ts",
    "scripts/inspect-baringo-tiaty-canonical.ts",
  ];

  for (const relative of highRiskScripts) {
    const fullPath = path.join(ROOT, relative);

    console.log("");
    console.log(relative);

    if (!fs.existsSync(fullPath)) {
      console.log("  FILE: NOT FOUND");
      continue;
    }

    const matches = findMatches(fullPath, [
      OLD_NAME.toLowerCase(),
    ]);

    console.log(`  "${OLD_NAME}" matches: ${matches.length}`);

    for (const match of matches) {
      console.log(`  ${match.line}: ${match.text}`);
    }
  }

  // ============================================================
  // SECTION 9
  // ============================================================

  console.log("");
  console.log("SECTION 9: CURRENT CODE CLASSIFICATION");
  console.log("--------------------------------------");

  const classifications = new Map<string, FileClassification>();

  for (const match of uniqueOldNameMatches) {
    const relative = match.file.replace(/\\/g, "/");

    const historical =
      relative.startsWith("prisma/data/");

    const executable =
      SOURCE_EXTENSIONS.has(
        path.extname(relative).toLowerCase(),
      );

    const existing = classifications.get(relative);

    if (existing) {
      existing.matches += 1;
    } else {
      classifications.set(relative, {
        file: relative,
        matches: 1,
        historical,
        executable,
      });
    }
  }

  const currentExecutableFiles = [
    ...classifications.values(),
  ]
    .filter((item) => item.executable)
    .sort((a, b) =>
      a.file.localeCompare(b.file),
    );

  console.log(
    `Executable files containing "${OLD_NAME}": ${currentExecutableFiles.length}`,
  );

  for (const item of currentExecutableFiles) {
    console.log(
      `${item.file} | matches: ${item.matches}`,
    );
  }

  // ============================================================
  // SECTION 10
  // ============================================================

  console.log("");
  console.log("SECTION 10: CURRENT CODE RISK CLASSIFICATION");
  console.log("--------------------------------------------");

  const highRiskPatterns = [
    "findunique",
    "findfirst",
    "findmany",
    "where",
    "update",
    "upsert",
    "create",
    "delete",
    "mapping",
    "alias",
    "canonical",
    "expected",
    "safety",
    "check",
  ];

  const suspiciousMatches: Match[] = [];

  for (const match of uniqueOldNameMatches) {
    const lower = match.text.toLowerCase();

    if (
      highRiskPatterns.some((pattern) =>
        lower.includes(pattern),
      )
    ) {
      suspiciousMatches.push(match);
    }
  }

  printMatches(
    "POTENTIALLY HIGH-RISK CURRENT CODE REFERENCES",
    suspiciousMatches,
  );

  // ============================================================
  // SECTION 11
  // ============================================================

  console.log("");
  console.log("SECTION 11: DATABASE NAME-BASED QUERIES");
  console.log("---------------------------------------");

  const databaseNameQueries = [
    "Tiaty East",
    "Tiaty",
  ];

  console.log(
    "This section checks the database for rows whose names could",
  );
  console.log(
    "create ambiguity after the proposed rename.",
  );
  console.log("");

  for (const name of databaseNameQueries) {
    const rows = await prisma.subCounty.findMany({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      include: {
        county: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`Name "${name}" rows: ${rows.length}`);

    for (const row of rows) {
      console.log(
        `  ID ${row.id} | ${row.name} | County ${row.countyId} ${row.county?.name}`,
      );
    }
  }

  // ============================================================
  // SECTION 12
  // ============================================================

  console.log("");
  console.log("SECTION 12: PROPOSED POST-RENAME IDENTITY");
  console.log("-----------------------------------------");

  console.log(
    "Current:",
  );
  console.log(
    `  SubCounty ${TARGET_ID} | ${target.name} | County ${target.county?.name}`,
  );

  console.log(
    "Proposed:",
  );
  console.log(
    `  SubCounty ${TARGET_ID} | ${NEW_NAME} | County ${target.county?.name}`,
  );

  console.log("");
  console.log("IDs remain unchanged:");
  console.log(`  SubCounty ID      : ${TARGET_ID}`);
  console.log(`  County ID         : ${COUNTY_ID}`);
  console.log(
    `  Ward IDs          : ${target.wards.map((w) => w.id).join(", ")}`,
  );
  console.log(
    `  Constituency IDs  : ${[
      ...new Set(
        target.wards.map((w) => w.constituencyId),
      ),
    ].join(", ")}`,
  );

  // ============================================================
  // SECTION 13
  // ============================================================

  console.log("");
  console.log("SECTION 13: V17 SAFETY DECISION");
  console.log("-------------------------------");

  const hasApiRisk =
    uniqueApiOldNameMatches.length > 0;

  const hasSeedRisk =
    uniqueSeedMatches.length > 0;

  const hasCurrentExecutableRisk =
    currentExecutableFiles.length > 0;

  const hasSuspiciousRisk =
    suspiciousMatches.length > 0;

  console.log(
    `Database target valid                 : ${targetIdentityPass ? "PASS" : "FAIL"}`,
  );

  console.log(
    `API hard-coded old-name risk         : ${hasApiRisk ? "REVIEW" : "PASS"}`,
  );

  console.log(
    `Seed/import old-name risk            : ${hasSeedRisk ? "REVIEW" : "PASS"}`,
  );

  console.log(
    `Executable old-name references       : ${hasCurrentExecutableRisk ? "YES" : "NONE"}`,
  );

  console.log(
    `Potentially high-risk code references: ${hasSuspiciousRisk ? "YES" : "NONE"}`,
  );

  console.log("");

  if (
    targetIdentityPass &&
    !hasApiRisk &&
    !hasCurrentExecutableRisk &&
    !hasSuspiciousRisk
  ) {
    console.log(
      "V17 APPLICATION SAFETY: PASS",
    );

    console.log("");
    console.log(
      "No current executable application dependency on",
    );
    console.log(
      `"${OLD_NAME}" was detected.`,
    );

    console.log("");
    console.log(
      "The database rename may proceed to a controlled",
    );
    console.log(
      "single-row UPDATE, subject to final human approval.",
    );
  } else {
    console.log(
      "V17 APPLICATION SAFETY: REVIEW REQUIRED",
    );

    console.log("");
    console.log(
      "Do NOT perform the database rename yet.",
    );

    if (hasApiRisk) {
      console.log(
        `Reason: API source contains "${OLD_NAME}".`,
      );
    }

    if (hasCurrentExecutableRisk) {
      console.log(
        `Reason: executable source contains "${OLD_NAME}".`,
      );
    }

    if (hasSuspiciousRisk) {
      console.log(
        "Reason: potentially high-risk executable references were found.",
      );
    }

    if (hasSeedRisk) {
      console.log(
        "Reason: seed/import/migration source contains the old name.",
      );
    }
  }

  // ============================================================
  // SECTION 14
  // ============================================================

  console.log("");
  console.log("SECTION 14: WHAT V17 DID NOT DO");
  console.log("-------------------------------");

  console.log("NO INSERT");
  console.log("NO UPDATE");
  console.log("NO DELETE");
  console.log("NO SCHEMA CHANGE");
  console.log("NO MIGRATION");
  console.log("NO WARD CHANGE");
  console.log("NO FK CHANGE");

  console.log("");
  console.log("=".repeat(60));
  console.log("V17 COMPLETE");
  console.log("READ-ONLY: NO DATABASE CHANGES WERE MADE.");
  console.log("=".repeat(60));
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("V17 FAILED");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});