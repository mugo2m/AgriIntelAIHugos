import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const ROOT = process.cwd();

const TARGET_IDS = ["2629", "2630", "2631", "2632", "463"];

const SEARCH_TERMS = [
  "2629",
  "2630",
  "2631",
  "2632",
  "SubCounty 463",
  "subCountyId: 463",
  'subCountyId = 463',
  '"subCountyId": 463',
  "subCountyId=463",
  "subCountyId === 463",
  "subCountyId == 463",
];

const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
]);

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "lib/generated",
]);

type Match = {
  file: string;
  line: number;
  term: string;
  text: string;
};

function shouldExclude(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  if (normalized.startsWith("node_modules/")) return true;
  if (normalized.startsWith(".next/")) return true;
  if (normalized.startsWith(".git/")) return true;
  if (normalized.startsWith("lib/generated/")) return true;

  for (const excluded of EXCLUDED_DIRS) {
    if (
      normalized === excluded ||
      normalized.startsWith(`${excluded}/`)
    ) {
      return true;
    }
  }

  return false;
}

function walkDirectory(directory: string): string[] {
  const results: string[] = [];

  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(ROOT, fullPath);

    if (shouldExclude(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    results.push(fullPath);
  }

  return results;
}

function searchFile(filePath: string): Match[] {
  const matches: Match[] = [];

  let content: string;

  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return matches;
  }

  const lines = content.split(/\r?\n/);
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    for (const term of SEARCH_TERMS) {
      if (line.includes(term)) {
        matches.push({
          file: relativePath,
          line: index + 1,
          term,
          text: line.trim(),
        });
      }
    }
  }

  return matches;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("HISTORICAL GEOGRAPHY ID PROVENANCE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  console.log("TARGET HISTORICAL IDS");
  console.log("------------------------------------------------------------");
  console.log("Ward IDs: 2629, 2630, 2631, 2632");
  console.log("SubCounty ID: 463");
  console.log("");

  // --------------------------------------------------------------------------
  // CURRENT DATABASE CHECK
  // --------------------------------------------------------------------------

  console.log("CURRENT DATABASE STATE");
  console.log("------------------------------------------------------------");

  const wards = await prisma.ward.findMany({
    where: {
      id: {
        in: [2629, 2630, 2631, 2632],
      },
    },
    select: {
      id: true,
      name: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const subCounty463 = await prisma.subCounty.findUnique({
    where: {
      id: 463,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  if (wards.length === 0) {
    console.log("PASS: Ward IDs 2629, 2630, 2631, 2632 do not exist.");
  } else {
    console.log("WARNING: Historical ward IDs currently exist:");

    for (const ward of wards) {
      console.log(
        `ID=${ward.id}, name="${ward.name}", subCountyId=${ward.subCountyId}, constituencyId=${ward.constituencyId}`,
      );
    }
  }

  if (!subCounty463) {
    console.log("PASS: SubCounty ID 463 does not exist.");
  } else {
    console.log(
      `WARNING: SubCounty 463 exists: name="${subCounty463.name}", countyId=${subCounty463.countyId}`,
    );
  }

  console.log("");

  // --------------------------------------------------------------------------
  // CURRENT TIATY CHECK
  // --------------------------------------------------------------------------

  console.log("CURRENT TIATY STATE");
  console.log("------------------------------------------------------------");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  if (!tiaty) {
    console.log("FAIL: SubCounty 757 not found.");
  } else {
    console.log(
      `SubCounty 757: name="${tiaty.name}", countyId=${tiaty.countyId}`,
    );

    const tiatyWards = await prisma.ward.findMany({
      where: {
        subCountyId: 757,
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
        constituencyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`Tiaty wards: ${tiatyWards.length}`);

    for (const ward of tiatyWards) {
      console.log(
        `  ID=${ward.id}, name="${ward.name}", subCountyId=${ward.subCountyId}, constituencyId=${ward.constituencyId}`,
      );
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // REPOSITORY SEARCH
  // --------------------------------------------------------------------------

  console.log("REPOSITORY SEARCH");
  console.log("------------------------------------------------------------");

  console.log(`Root: ${ROOT}`);
  console.log("");

  const files = walkDirectory(ROOT);

  console.log(`Searchable files: ${files.length}`);
  console.log("");

  const allMatches: Match[] = [];

  for (const file of files) {
    const matches = searchFile(file);
    allMatches.push(...matches);
  }

  // Remove duplicate term matches from the same line where one term is
  // effectively contained in another.
  const uniqueMatches = new Map<string, Match>();

  for (const match of allMatches) {
    const key = `${match.file}:${match.line}:${match.term}`;

    if (!uniqueMatches.has(key)) {
      uniqueMatches.set(key, match);
    }
  }

  const matches = [...uniqueMatches.values()].sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file);
    }

    if (a.line !== b.line) {
      return a.line - b.line;
    }

    return a.term.localeCompare(b.term);
  });

  if (matches.length === 0) {
    console.log("No historical references found.");
  } else {
    console.log(`Total matches: ${matches.length}`);
    console.log("");

    let currentFile = "";

    for (const match of matches) {
      if (match.file !== currentFile) {
        currentFile = match.file;

        console.log("");
        console.log(`FILE: ${match.file}`);
        console.log("------------------------------------------------------------");
      }

      console.log(
        `Line ${match.line} [${match.term}]`,
      );

      console.log(`  ${match.text}`);
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // CLASSIFICATION
  // --------------------------------------------------------------------------

  console.log("HISTORICAL REFERENCE CLASSIFICATION");
  console.log("------------------------------------------------------------");

  const historicalFiles = new Set<string>();

  for (const match of matches) {
    historicalFiles.add(match.file);
  }

  const runtimeFiles = [...historicalFiles].filter((file) => {
    return (
      file.startsWith("app/") ||
      file.startsWith("components/") ||
      file.startsWith("lib/") ||
      file.startsWith("middleware")
    );
  });

  const scriptFiles = [...historicalFiles].filter((file) =>
    file.startsWith("scripts/"),
  );

  const prismaFiles = [...historicalFiles].filter((file) =>
    file.startsWith("prisma/"),
  );

  console.log(`Files with references: ${historicalFiles.size}`);
  console.log(`Runtime/application files: ${runtimeFiles.length}`);
  console.log(`Script/audit files: ${scriptFiles.length}`);
  console.log(`Prisma/data files: ${prismaFiles.length}`);

  if (runtimeFiles.length > 0) {
    console.log("");
    console.log("RUNTIME/APPLICATION REFERENCES");
    console.log("These require closer review because they may still be operational.");
    for (const file of runtimeFiles) {
      console.log(`  ${file}`);
    }
  }

  if (scriptFiles.length > 0) {
    console.log("");
    console.log("SCRIPT/AUDIT REFERENCES");
    console.log("These are likely historical, diagnostic, or repair references.");
    for (const file of scriptFiles) {
      console.log(`  ${file}`);
    }
  }

  if (prismaFiles.length > 0) {
    console.log("");
    console.log("PRISMA/DATA REFERENCES");
    for (const file of prismaFiles) {
      console.log(`  ${file}`);
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // FINAL INTERPRETATION
  // --------------------------------------------------------------------------

  console.log("FINAL INTERPRETATION");
  console.log("------------------------------------------------------------");

  if (
    wards.length === 0 &&
    !subCounty463 &&
    tiaty?.id === 757 &&
    tiaty.name === "Tiaty"
  ) {
    console.log(
      "CURRENT DB: CLEAN FOR THE TARGETED HISTORICAL IDS.",
    );
  } else {
    console.log(
      "CURRENT DB: REVIEW REQUIRED.",
    );
  }

  if (runtimeFiles.length === 0) {
    console.log(
      "RUNTIME: No application/runtime references to the historical IDs were found.",
    );
  } else {
    console.log(
      "RUNTIME: Historical ID references still exist in runtime/application files.",
    );
  }

  if (scriptFiles.length > 0) {
    console.log(
      "HISTORY: References exist in scripts/audits and may explain the old IDs.",
    );
  }

  console.log("");
  console.log("IMPORTANT:");
  console.log("No mutation was performed.");
  console.log("Do NOT delete wards.");
  console.log("Do NOT create SubCounty 463.");
  console.log("Do NOT move the four Tiaty wards.");
  console.log("Do NOT rename Tiaty again.");
  console.log("");

  console.log("============================================================");
  console.log("AUDIT COMPLETE");
  console.log("============================================================");
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("AUDIT ERROR");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});