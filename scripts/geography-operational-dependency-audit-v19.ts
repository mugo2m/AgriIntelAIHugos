import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const TARGET_SUBCOUNTY_ID = 757;
const COUNTY_ID = 90;
const OLD_NAME = "Tiaty East";
const PROPOSED_NAME = "Tiaty";

const ROOT = process.cwd();

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  "out",
]);

const EXECUTABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const HISTORICAL_NAME_PATTERNS = [
  /^audit-/i,
  /^audit/i,
  /^geography-forensic-audit/i,
  /^geography-pre-rename-audit/i,
  /^geography-repair-impact/i,
  /^geography-operational-audit/i,
  /^inspect-/i,
];

const OPERATIONAL_PATH_PATTERNS = [
  /(^|[/\\])prisma[/\\]seed\.ts$/i,
  /(^|[/\\])prisma[/\\]seed\./i,
  /(^|[/\\])prisma[/\\]data[/\\]/i,
  /(^|[/\\])scripts[/\\]generate-/i,
  /(^|[/\\])scripts[/\\]import-/i,
  /(^|[/\\])scripts[/\\]seed-/i,
  /(^|[/\\])scripts[/\\]load-/i,
  /(^|[/\\])scripts[/\\]sync-/i,
  /(^|[/\\])scripts[/\\]migrate-/i,
];

const RUNTIME_PATH_PATTERNS = [
  /(^|[/\\])app[/\\]/i,
  /(^|[/\\])components[/\\]/i,
  /(^|[/\\])lib[/\\]/i,
  /(^|[/\\])server[/\\]/i,
  /(^|[/\\])src[/\\]/i,
];

type SourceMatch = {
  file: string;
  line: number;
  text: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function relative(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function shouldSkipDirectory(name: string): boolean {
  return EXCLUDED_DIRS.has(name);
}

function walk(dir: string, output: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return output;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        walk(path.join(dir, entry.name), output);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();

    if (EXECUTABLE_EXTENSIONS.has(ext)) {
      output.push(path.join(dir, entry.name));
    }
  }

  return output;
}

function getMatches(
  files: string[],
  pattern: RegExp,
): SourceMatch[] {
  const matches: SourceMatch[] = [];

  for (const file of files) {
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);

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

function isHistoricalFile(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");

  const basename = path.basename(normalized);

  return HISTORICAL_NAME_PATTERNS.some((pattern) =>
    pattern.test(basename),
  );
}

function isOperationalPath(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");

  return OPERATIONAL_PATH_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
}

function isRuntimePath(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");

  return RUNTIME_PATH_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
}

function printMatches(
  title: string,
  matches: SourceMatch[],
): void {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));

  if (matches.length === 0) {
    console.log("NONE");
    return;
  }

  for (const match of matches) {
    console.log(`${match.file}:${match.line}`);
    console.log(`  ${match.text}`);
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log("GEOGRAPHY OPERATIONAL DEPENDENCY AUDIT V19");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  console.log(`Target SubCounty ID : ${TARGET_SUBCOUNTY_ID}`);
  console.log(`Current name        : ${OLD_NAME}`);
  console.log(`Proposed name       : ${PROPOSED_NAME}`);
  console.log(`Baringo County ID   : ${COUNTY_ID}`);

  const target = await prisma.subCounty.findUnique({
    where: {
      id: TARGET_SUBCOUNTY_ID,
    },
    include: {
      county: true,
      wards: {
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
      },
    },
  });

  if (!target) {
    console.log("");
    console.log("FATAL: SubCounty 757 does not exist.");
    return;
  }

  console.log("");
  console.log("SECTION 1: TARGET DATABASE IDENTITY");
  console.log("------------------------------------");

  console.log(`ID        : ${target.id}`);
  console.log(`Name      : ${target.name}`);
  console.log(`County    : ${target.county?.name}`);
  console.log(`County ID : ${target.countyId}`);
  console.log(`Ward count: ${target.wards.length}`);

  const targetIdentityPass =
    target.id === TARGET_SUBCOUNTY_ID &&
    target.name === OLD_NAME &&
    target.countyId === COUNTY_ID &&
    target.wards.length === 7 &&
    target.wards.every(
      (ward) =>
        ward.countyId === COUNTY_ID &&
        ward.subCountyId === TARGET_SUBCOUNTY_ID,
    );

  console.log(
    `Target database identity: ${
      targetIdentityPass ? "PASS" : "FAIL"
    }`,
  );

  for (const ward of target.wards) {
    console.log(
      `  ${ward.id} | ${ward.name} | county=${ward.countyId} | subCounty=${ward.subCountyId} | constituency=${ward.constituencyId}`,
    );
  }

  console.log("");
  console.log("SECTION 2: SOURCE INVENTORY");
  console.log("---------------------------");

  const executableFiles = walk(ROOT);

  console.log(
    `Executable source files discovered: ${executableFiles.length}`,
  );

  console.log("");
  console.log("SECTION 3: ALL OLD-NAME REFERENCES");
  console.log("----------------------------------");

  const oldNamePattern = /Tiaty\s+East/i;

  const allOldNameMatches = getMatches(
    executableFiles,
    oldNamePattern,
  );

  console.log(
    `Executable references to "${OLD_NAME}": ${allOldNameMatches.length}`,
  );

  console.log("");
  console.log("SECTION 4: CLASSIFICATION OF OLD-NAME REFERENCES");
  console.log("-----------------------------------------------");

  const historicalMatches: SourceMatch[] = [];
  const operationalMatches: SourceMatch[] = [];
  const runtimeMatches: SourceMatch[] = [];
  const otherMatches: SourceMatch[] = [];

  for (const match of allOldNameMatches) {
    if (isHistoricalFile(match.file)) {
      historicalMatches.push(match);
    } else if (isRuntimePath(match.file)) {
      runtimeMatches.push(match);
    } else if (isOperationalPath(match.file)) {
      operationalMatches.push(match);
    } else {
      otherMatches.push(match);
    }
  }

  console.log(
    `Historical audit references : ${historicalMatches.length}`,
  );
  console.log(
    `Runtime application references: ${runtimeMatches.length}`,
  );
  console.log(
    `Operational references       : ${operationalMatches.length}`,
  );
  console.log(
    `Other executable references  : ${otherMatches.length}`,
  );

  printMatches(
    "RUNTIME APPLICATION OLD-NAME REFERENCES",
    runtimeMatches,
  );

  printMatches(
    "OPERATIONAL OLD-NAME REFERENCES",
    operationalMatches,
  );

  printMatches(
    "OTHER EXECUTABLE OLD-NAME REFERENCES",
    otherMatches,
  );

  console.log("");
  console.log("SECTION 5: PRISMA SEED ENTRY POINT");
  console.log("---------------------------------");

  const seedFile = path.join(ROOT, "prisma", "seed.ts");

  if (!fs.existsSync(seedFile)) {
    console.log("prisma/seed.ts: NOT FOUND");
  } else {
    const seedContent = fs.readFileSync(seedFile, "utf8");
    const seedLines = seedContent.split(/\r?\n/);

    console.log("prisma/seed.ts: FOUND");

    const seedOldNameMatches: SourceMatch[] = [];

    for (let i = 0; i < seedLines.length; i++) {
      if (/Tiaty\s+East/i.test(seedLines[i])) {
        seedOldNameMatches.push({
          file: "prisma/seed.ts",
          line: i + 1,
          text: seedLines[i].trim(),
        });
      }
    }

    console.log(
      `Direct "${OLD_NAME}" references in prisma/seed.ts: ${seedOldNameMatches.length}`,
    );

    printMatches(
      "PRISMA SEED OLD-NAME REFERENCES",
      seedOldNameMatches,
    );

    const seedTiatyTerms = seedLines.filter((line) =>
      /\bTiaty\b/i.test(line),
    );

    console.log(
      `Lines containing standalone "Tiaty": ${seedTiatyTerms.length}`,
    );

    for (const line of seedTiatyTerms.slice(0, 30)) {
      console.log(`  ${line.trim()}`);
    }

    if (seedTiatyTerms.length > 30) {
      console.log(
        `  ... ${seedTiatyTerms.length - 30} additional lines`,
      );
    }
  }

  console.log("");
  console.log("SECTION 6: GENERATOR / IMPORTER REVIEW");
  console.log("--------------------------------------");

  const generatorFiles = executableFiles.filter((file) => {
    const normalized = relative(file);

    return (
      /(^|\/)scripts\/(generate|import|seed|load|sync)-/i.test(
        normalized,
      ) ||
      /(^|\/)prisma\/data\//i.test(normalized)
    );
  });

  console.log(
    `Potential generator/importer files: ${generatorFiles.length}`,
  );

  const generatorOldNameMatches = getMatches(
    generatorFiles,
    oldNamePattern,
  );

  console.log(
    `Generator/importer references to "${OLD_NAME}": ${generatorOldNameMatches.length}`,
  );

  printMatches(
    "GENERATOR / IMPORTER OLD-NAME REFERENCES",
    generatorOldNameMatches,
  );

  console.log("");
  console.log("SECTION 7: GENERATOR SUBCOUNTY WARD MAP");
  console.log("---------------------------------------");

  const mapFile = path.join(
    ROOT,
    "scripts",
    "generate-subcounty-ward-map.ts",
  );

  if (!fs.existsSync(mapFile)) {
    console.log(
      "scripts/generate-subcounty-ward-map.ts: NOT FOUND",
    );
  } else {
    console.log(
      "scripts/generate-subcounty-ward-map.ts: FOUND",
    );

    const content = fs.readFileSync(mapFile, "utf8");
    const lines = content.split(/\r?\n/);

    const relevantLines: Array<{
      line: number;
      text: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      if (
        /tiaty/i.test(lines[i]) ||
        /757/.test(lines[i]) ||
        /baringo::tiaty/i.test(lines[i])
      ) {
        relevantLines.push({
          line: i + 1,
          text: lines[i].trim(),
        });
      }
    }

    console.log(
      `Relevant Tiaty/757 lines: ${relevantLines.length}`,
    );

    for (const item of relevantLines) {
      console.log(`${item.line}: ${item.text}`);
    }

    const hasOldMapping = relevantLines.some((item) =>
      /baringo::tiaty\s+east/i.test(item.text),
    );

    const hasExplicitProposedMapping = relevantLines.some(
      (item) =>
        /baringo::tiaty["']?\s*:/i.test(item.text) &&
        /Tiaty/i.test(item.text),
    );

    console.log("");
    console.log(
      `Contains old Baringo Tiaty East mapping: ${
        hasOldMapping ? "YES" : "NO"
      }`,
    );
    console.log(
      `Contains explicit Baringo Tiaty mapping: ${
        hasExplicitProposedMapping ? "YES" : "NO"
      }`,
    );
  }

  console.log("");
  console.log("SECTION 8: HISTORICAL REPAIR SCRIPTS");
  console.log("-----------------------------------");

  const historicalRepairNames = [
    "repair-baringo-tiaty.ts",
    "repair-tiaty-v15-2.ts",
    "fix-tiaty-duplicate-wards.ts",
  ];

  for (const filename of historicalRepairNames) {
    const file = path.join(ROOT, "scripts", filename);

    if (!fs.existsSync(file)) {
      console.log(`${filename}: NOT FOUND`);
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    const mutatingLines: Array<{
      line: number;
      text: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      if (
        /\b(create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/i.test(
          lines[i],
        ) &&
        /prisma\./i.test(lines[i])
      ) {
        mutatingLines.push({
          line: i + 1,
          text: lines[i].trim(),
        });
      }
    }

    console.log("");
    console.log(`${filename}`);
    console.log(`  DB mutation-looking lines: ${mutatingLines.length}`);

    for (const item of mutatingLines.slice(0, 30)) {
      console.log(`  ${item.line}: ${item.text}`);
    }

    if (mutatingLines.length > 30) {
      console.log(
        `  ... ${mutatingLines.length - 30} additional mutation-looking lines`,
      );
    }
  }

  console.log("");
  console.log("SECTION 9: CURRENT RUNTIME NAME LOOKUPS");
  console.log("---------------------------------------");

  const subCountyLookupPattern =
    /subCounty\.(findUnique|findFirst|findMany|update|updateMany|upsert)[\s\S]{0,500}?\bname\b/i;

  const runtimeFiles = executableFiles.filter((file) =>
    isRuntimePath(relative(file)),
  );

  const runtimeSubCountyNameMatches: SourceMatch[] = [];

  for (const file of runtimeFiles) {
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    if (!subCountyLookupPattern.test(content)) {
      continue;
    }

    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      if (
        /subCounty\.(findUnique|findFirst|findMany|update|updateMany|upsert)/i.test(
          lines[i],
        )
      ) {
        const nearby = lines
          .slice(i, Math.min(i + 15, lines.length))
          .join("\n");

        if (/\bname\b/i.test(nearby)) {
          runtimeSubCountyNameMatches.push({
            file: relative(file),
            line: i + 1,
            text: lines[i].trim(),
          });
        }
      }
    }
  }

  console.log(
    `Runtime SubCounty operations potentially involving name: ${runtimeSubCountyNameMatches.length}`,
  );

  printMatches(
    "RUNTIME SUBCOUNTY NAME LOOKUPS",
    runtimeSubCountyNameMatches,
  );

  console.log("");
  console.log("SECTION 10: ID-BASED TARGET CHECK");
  console.log("--------------------------------");

  const id757Pattern = /\b757\b/;

  const id757Matches = getMatches(
    executableFiles,
    id757Pattern,
  );

  const runtimeId757Matches = id757Matches.filter((match) =>
    isRuntimePath(match.file),
  );

  const operationalId757Matches = id757Matches.filter(
    (match) =>
      isOperationalPath(match.file) &&
      !isHistoricalFile(match.file),
  );

  console.log(
    `All executable references to ID 757: ${id757Matches.length}`,
  );

  console.log(
    `Runtime application references to ID 757: ${runtimeId757Matches.length}`,
  );

  console.log(
    `Operational non-historical references to ID 757: ${operationalId757Matches.length}`,
  );

  printMatches(
    "RUNTIME ID 757 REFERENCES",
    runtimeId757Matches,
  );

  printMatches(
    "OPERATIONAL NON-HISTORICAL ID 757 REFERENCES",
    operationalId757Matches,
  );

  console.log("");
  console.log("SECTION 11: OLD NAME + ID 757");
  console.log("-----------------------------");

  const oldNameAndIdPattern =
    /(Tiaty\s+East[^\n]*\b757\b|\b757\b[^\n]*Tiaty\s+East)/i;

  const oldNameAndIdMatches = getMatches(
    executableFiles,
    oldNameAndIdPattern,
  );

  console.log(
    `Executable references combining "${OLD_NAME}" + ID ${TARGET_SUBCOUNTY_ID}: ${oldNameAndIdMatches.length}`,
  );

  printMatches(
    "OLD NAME + ID 757 REFERENCES",
    oldNameAndIdMatches,
  );

  console.log("");
  console.log("SECTION 12: PACKAGE.JSON WORKFLOW");
  console.log("--------------------------------");

  const packageFile = path.join(ROOT, "package.json");

  let packageScripts: Record<string, string> = {};

  if (fs.existsSync(packageFile)) {
    const packageJson = JSON.parse(
      fs.readFileSync(packageFile, "utf8"),
    );

    packageScripts = packageJson.scripts ?? {};
  }

  const workflowEntries = Object.entries(packageScripts).filter(
    ([name, command]) =>
      /seed|import|generate|migrate|geography|location|prisma/i.test(
        `${name} ${command}`,
      ),
  );

  console.log(
    `Relevant package.json commands: ${workflowEntries.length}`,
  );

  for (const [name, command] of workflowEntries) {
    console.log(`  ${name}: ${command}`);
  }

  console.log("");
  console.log("SECTION 13: DATABASE NAME COLLISION");
  console.log("-----------------------------------");

  const oldRows = await prisma.subCounty.findMany({
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

  const proposedRows = await prisma.subCounty.findMany({
    where: {
      name: PROPOSED_NAME,
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

  console.log(
    `Rows named "${OLD_NAME}": ${oldRows.length}`,
  );

  for (const row of oldRows) {
    console.log(
      `  ${row.id} | ${row.name} | county=${row.countyId} ${row.county?.name}`,
    );
  }

  console.log(
    `Rows named "${PROPOSED_NAME}": ${proposedRows.length}`,
  );

  for (const row of proposedRows) {
    console.log(
      `  ${row.id} | ${row.name} | county=${row.countyId} ${row.county?.name}`,
    );
  }

  const collisionPass =
    proposedRows.length === 0 ||
    (proposedRows.length === 1 &&
      proposedRows[0].id === TARGET_SUBCOUNTY_ID);

  console.log(
    `Proposed "${PROPOSED_NAME}" collision check: ${
      collisionPass ? "PASS" : "FAIL"
    }`,
  );

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
    `Relational impact check: ${
      relationalPass ? "PASS" : "FAIL"
    }`,
  );

  console.log("");
  console.log("SECTION 15: FINAL CLASSIFICATION");
  console.log("-------------------------------");

  const apiSafe =
    runtimeMatches.length === 0 &&
    runtimeId757Matches.length === 0;

  const generatorSafe =
    generatorOldNameMatches.length === 0 ||
    generatorOldNameMatches.every(
      (match) =>
        match.file === "scripts/audit-v14-1-post-migration.ts",
    );

  const operationalNonHistoricalMatches =
    operationalMatches.filter(
      (match) =>
        !isHistoricalFile(match.file) &&
        match.file !==
          "scripts/geography-operational-audit-v18.ts" &&
        match.file !==
          "scripts/geography-pre-rename-audit-v17.ts" &&
        match.file !==
          "scripts/geography-repair-impact-v16.ts",
    );

  const trueOperationalOldNameCount =
    operationalNonHistoricalMatches.length;

  const trueOperationalRisk =
    trueOperationalOldNameCount > 0 ||
    runtimeSubCountyNameMatches.length > 0;

  console.log(
    `Target database identity      : ${
      targetIdentityPass ? "PASS" : "FAIL"
    }`,
  );

  console.log(
    `API/runtime old-name safety   : ${
      apiSafe ? "PASS" : "REVIEW"
    }`,
  );

  console.log(
    `Generator/importer old-name   : ${
      generatorSafe ? "PASS" : "REVIEW"
    }`,
  );

  console.log(
    `True operational old-name refs: ${trueOperationalOldNameCount}`,
  );

  console.log(
    `Runtime name lookup review    : ${
      runtimeSubCountyNameMatches.length === 0
        ? "PASS"
        : "REVIEW"
    }`,
  );

  console.log(
    `Name collision                : ${
      collisionPass ? "PASS" : "FAIL"
    }`,
  );

  console.log(
    `Relational impact             : ${
      relationalPass ? "PASS" : "FAIL"
    }`,
  );

  const finalPass =
    targetIdentityPass &&
    apiSafe &&
    generatorSafe &&
    !trueOperationalRisk &&
    collisionPass &&
    relationalPass;

  console.log("");
  console.log(
    `V19 OPERATIONAL DEPENDENCY SAFETY: ${
      finalPass ? "PASS" : "REVIEW REQUIRED"
    }`,
  );

  console.log("");
  if (finalPass) {
    console.log("============================================================");
    console.log("V19 DECISION: READY FOR CONTROLLED RENAME");
    console.log("============================================================");
    console.log("");
    console.log(
      `SubCounty ${TARGET_SUBCOUNTY_ID} can proceed from "${OLD_NAME}" to "${PROPOSED_NAME}"`,
    );
    console.log("");
    console.log("IMPORTANT:");
    console.log(
      "- This audit made NO database changes.",
    );
    console.log(
      "- The rename must preserve ID 757.",
    );
    console.log(
      "- Ward IDs and foreign keys must remain unchanged.",
    );
    console.log(
      "- Historical audit scripts must NOT be executed as repair scripts.",
    );
  } else {
    console.log("============================================================");
    console.log("V19 DECISION: DO NOT RENAME YET");
    console.log("============================================================");
    console.log("");
    console.log(
      "At least one current operational dependency still requires review.",
    );
    console.log(
      "No database changes were made.",
    );
  }

  console.log("");
  console.log("V19 COMPLETE");
  console.log("READ-ONLY: NO DATABASE CHANGES WERE MADE.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V19 AUDIT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });