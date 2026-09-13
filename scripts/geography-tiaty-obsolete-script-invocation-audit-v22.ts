import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const OBSOLETE_SCRIPTS = [
  "scripts/fix-tiaty-duplicate-wards.ts",
  "scripts/repair-baringo-tiaty.ts",
  "scripts/inspect-tiaty-463.ts",
  "scripts/inspect-baringo-tiaty-canonical.ts",
];

const SEARCH_TERMS = [
  "fix-tiaty-duplicate-wards",
  "repair-baringo-tiaty",
  "inspect-tiaty-463",
  "inspect-baringo-tiaty-canonical",
];

const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".md",
  ".ps1",
  ".sh",
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

function classifyFile(file: string): string {
  const normalized = file.replace(/\\/g, "/");

  if (
    normalized.startsWith("app/") ||
    normalized.startsWith("components/") ||
    normalized.startsWith("lib/")
  ) {
    return "RUNTIME";
  }

  if (
    normalized.startsWith(".github/") ||
    normalized.startsWith(".gitlab/") ||
    normalized.startsWith(".circleci/")
  ) {
    return "CI/CD";
  }

  if (
    normalized === "package.json" ||
    normalized.endsWith("/package.json")
  ) {
    return "PACKAGE";
  }

  if (normalized.startsWith("scripts/")) {
    return "SCRIPT";
  }

  return "OTHER";
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("TIATY OBSOLETE SCRIPT INVOCATION AUDIT V22");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  console.log("PURPOSE");
  console.log("------------------------------------------------------------");
  console.log(
    "Determine whether obsolete Tiaty repair/inspection scripts are",
  );
  console.log(
    "still invoked by runtime code, package scripts, CI/CD, or other scripts.",
  );
  console.log("");

  console.log("OBSOLETE SCRIPTS");
  console.log("------------------------------------------------------------");

  for (const script of OBSOLETE_SCRIPTS) {
    const fullPath = path.join(ROOT, script);
    const exists = fs.existsSync(fullPath);

    console.log(
      `${exists ? "EXISTS" : "MISSING"}: ${script}`,
    );
  }

  console.log("");

  const files = walkDirectory(ROOT);

  console.log("REPOSITORY SCAN");
  console.log("------------------------------------------------------------");
  console.log(`Root: ${ROOT}`);
  console.log(`Searchable files: ${files.length}`);
  console.log("");

  const allMatches: Match[] = [];

  for (const file of files) {
    allMatches.push(...searchFile(file));
  }

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

  console.log(`Total references found: ${matches.length}`);
  console.log("");

  if (matches.length === 0) {
    console.log("PASS: No references to obsolete Tiaty scripts found.");
  } else {
    let currentFile = "";

    for (const match of matches) {
      if (match.file !== currentFile) {
        currentFile = match.file;

        console.log("");
        console.log(`FILE: ${match.file}`);
        console.log(
          `CLASSIFICATION: ${classifyFile(match.file)}`,
        );
        console.log("------------------------------------------------------------");
      }

      console.log(
        `Line ${match.line} [${match.term}]`,
      );
      console.log(`  ${match.text}`);
    }
  }

  console.log("");

  console.log("INVOCATION ANALYSIS");
  console.log("------------------------------------------------------------");

  const runtimeMatches = matches.filter(
    (match) => classifyFile(match.file) === "RUNTIME",
  );

  const ciMatches = matches.filter(
    (match) => classifyFile(match.file) === "CI/CD",
  );

  const packageMatches = matches.filter(
    (match) => classifyFile(match.file) === "PACKAGE",
  );

  const scriptMatches = matches.filter(
    (match) => classifyFile(match.file) === "SCRIPT",
  );

  const otherMatches = matches.filter(
    (match) => classifyFile(match.file) === "OTHER",
  );

  console.log(`Runtime references: ${runtimeMatches.length}`);
  console.log(`CI/CD references: ${ciMatches.length}`);
  console.log(`Package references: ${packageMatches.length}`);
  console.log(`Script references: ${scriptMatches.length}`);
  console.log(`Other references: ${otherMatches.length}`);

  console.log("");

  if (runtimeMatches.length === 0) {
    console.log(
      "PASS: No runtime/application invocation references.",
    );
  } else {
    console.log(
      "FAIL: Runtime/application references exist.",
    );
  }

  if (ciMatches.length === 0) {
    console.log(
      "PASS: No CI/CD invocation references.",
    );
  } else {
    console.log(
      "FAIL: CI/CD references exist.",
    );
  }

  if (packageMatches.length === 0) {
    console.log(
      "PASS: No package.json invocation references.",
    );
  } else {
    console.log(
      "FAIL: package.json references exist.",
    );
  }

  console.log("");

  console.log("CURRENT PRODUCTION SAFETY CHECK");
  console.log("------------------------------------------------------------");

  console.log(
    "The following scripts must NOT be treated as production operations:",
  );

  for (const script of OBSOLETE_SCRIPTS) {
    console.log(`  - ${script}`);
  }

  console.log("");

  console.log("Recommended status:");
  console.log("  HISTORICAL / DO NOT RUN");
  console.log("");

  console.log("V22 DECISION");
  console.log("------------------------------------------------------------");

  if (
    runtimeMatches.length === 0 &&
    ciMatches.length === 0 &&
    packageMatches.length === 0
  ) {
    console.log(
      "PASS: No production/runtime invocation path found.",
    );
    console.log(
      "PASS: Obsolete Tiaty repair scripts are isolated from operational execution.",
    );
    console.log(
      "PASS: They can remain as historical evidence without affecting production.",
    );
    console.log("");
    console.log(
      "STATUS: GREEN",
    );
  } else {
    console.log(
      "STATUS: REVIEW REQUIRED",
    );
    console.log("");
    console.log(
      "Do NOT delete or modify the obsolete scripts until the references are reviewed.",
    );
  }

  console.log("");

  console.log("IMPORTANT");
  console.log("------------------------------------------------------------");
  console.log("NO DATABASE MUTATION WAS PERFORMED.");
  console.log("NO WARDS WERE DELETED.");
  console.log("NO SUBCOUNTY WAS CREATED.");
  console.log("NO WARD WAS MOVED.");
  console.log("NO NAME WAS CHANGED.");
  console.log("");

  console.log("============================================================");
  console.log("V22 AUDIT COMPLETE");
  console.log("============================================================");
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("V22 AUDIT ERROR");
  console.error(error);
  process.exit(1);
});