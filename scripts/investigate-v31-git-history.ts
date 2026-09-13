import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

function runGit(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error: any) {
    return `GIT COMMAND FAILED\n${error?.stderr?.toString?.() ?? error}`;
  }
}

function showSection(title: string, content: string) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
  console.log(content.trim() || "NO RESULTS");
}

async function main() {
  console.log("============================================================");
  console.log("V31 FARM 1 — GIT HISTORY INVESTIGATION");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("Git history will NOT be modified.");
  console.log("");

  const root = process.cwd();

  console.log(`PROJECT: ${root}`);
  console.log("");

  const gitCheck = runGit(["rev-parse", "--is-inside-work-tree"]);

  if (!gitCheck.includes("true")) {
    console.log("FAIL — This project is not detected as a Git repository.");
    console.log(gitCheck);
    return;
  }

  console.log("PASS — Git repository detected.");

  const targetFiles = [
    "scripts/farmer-registration-e2e-v31.ts",
    "scripts/inspect-farmer-4-farm-1.ts",
    "scripts/investigate-v31-farm-1.ts",
  ];

  showSection(
    "1. V31 FILE HISTORY",
    runGit([
      "log",
      "--all",
      "--date=iso",
      "--pretty=format:%h | %ad | %an | %s",
      "--",
      ...targetFiles,
    ]),
  );

  showSection(
    "2. SEARCH ALL GIT HISTORY FOR V31 FARM VALUES",
    runGit([
      "log",
      "--all",
      "-S V31 E2E Test Farm",
      "--date=iso",
      "--pretty=format:%h | %ad | %an | %s",
      "--",
      "scripts",
    ]),
  );

  showSection(
    "3. SEARCH GIT HISTORY FOR beforeFarm",
    runGit([
      "log",
      "--all",
      "-S beforeFarm",
      "--date=iso",
      "--pretty=format:%h | %ad | %an | %s",
      "--",
      "scripts/farmer-registration-e2e-v31.ts",
    ]),
  );

  showSection(
    "4. SEARCH GIT HISTORY FOR CONFIGURED FARM",
    runGit([
      "log",
      "--all",
      "-S configuredFarm",
      "--date=iso",
      "--pretty=format:%h | %ad | %an | %s",
      "--",
      "scripts/farmer-registration-e2e-v31.ts",
    ]),
  );

  showSection(
    "5. SEARCH GIT HISTORY FOR FARM SNAPSHOT FIELDS",
    runGit([
      "log",
      "--all",
      "-G farmName|acreage|countryId|countyId|subCountyId|wardId|soilTypeId|waterSourceId",
      "--date=iso",
      "--pretty=format:%h | %ad | %an | %s",
      "--",
      "scripts/farmer-registration-e2e-v31.ts",
    ]),
  );

  console.log("");
  console.log("6. CURRENT GIT STATUS");
  console.log("---------------------");
  console.log(runGit(["status", "--short"]));

  console.log("");
  console.log("7. RECENT COMMITS");
  console.log("------------------");
  console.log(
    runGit([
      "log",
      "--all",
      "-20",
      "--date=iso",
      "--pretty=format:%h | %ad | %an | %s",
    ]),
  );

  console.log("");
  console.log("8. LOCAL FILE EXISTENCE");
  console.log("------------------------");

  for (const file of targetFiles) {
    const fullPath = path.join(root, file);

    console.log(
      `${file}: ${fs.existsSync(fullPath) ? "EXISTS" : "NOT FOUND"}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("GIT HISTORY INVESTIGATION COMPLETE");
  console.log("============================================================");
  console.log("");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("NO GIT CHANGES WERE MADE.");
}

main().catch((error) => {
  console.error("");
  console.error("INVESTIGATION FAILED");
  console.error(error);
  process.exitCode = 1;
});