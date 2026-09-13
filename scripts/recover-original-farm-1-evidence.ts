import fs from "fs";
import path from "path";

import prisma from "../lib/prisma";

const ROOT = process.cwd();

function walk(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build"
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }

  return results;
}

function safeRead(filePath: string): string {
  try {
    const stat = fs.statSync(filePath);

    if (stat.size > 10 * 1024 * 1024) {
      return "";
    }

    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function printSection(title: string) {
  console.log("");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("FARM 1 ORIGINAL-VALUE RECOVERY INVESTIGATION");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  /*
   * ----------------------------------------------------------
   * 1. CURRENT FARM 1
   * ----------------------------------------------------------
   */

  printSection("1. CURRENT FARM 1");

  const currentFarm = await prisma.farm.findUnique({
    where: {
      id: 1,
    },
  });

  if (!currentFarm) {
    console.log("Farm 1 does not exist.");
    return;
  }

  console.log(JSON.stringify(currentFarm, null, 2));

  /*
   * ----------------------------------------------------------
   * 2. FARMER RELATIONSHIP
   * ----------------------------------------------------------
   */

  printSection("2. FARMER RELATIONSHIP");

  const farmer = await prisma.farmer.findUnique({
    where: {
      id: currentFarm.farmerId,
    },
  });

  console.log(
    JSON.stringify(
      farmer
        ? {
            id: farmer.id,
            userId: farmer.userId,
            phone: farmer.phone,
            countyId: farmer.countyId,
            subCountyId: farmer.subCountyId,
            wardId: farmer.wardId,
            villageId: farmer.villageId,
          }
        : null,
      null,
      2,
    ),
  );

  /*
   * ----------------------------------------------------------
   * 3. ALL FARMS
   * ----------------------------------------------------------
   */

  printSection("3. ALL FARMS IN DATABASE");

  const farms = await prisma.farm.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      farmerId: true,
      farmName: true,
      acreage: true,
      latitude: true,
      longitude: true,
      ownershipType: true,
      createdAt: true,
      updatedAt: true,
      soilTypeId: true,
      weatherStationId: true,
      waterSourceId: true,
      tenantId: true,
      countryId: true,
      countyId: true,
      subCountyId: true,
      villageId: true,
      wardId: true,
    },
  });

  console.log(`Farm count: ${farms.length}`);

  for (const farm of farms) {
    console.log("");
    console.log(`Farm ID: ${farm.id}`);
    console.log(JSON.stringify(farm, null, 2));
  }

  /*
   * ----------------------------------------------------------
   * 4. FARMS FOR FARMER 4
   * ----------------------------------------------------------
   */

  printSection("4. FARMS BELONGING TO FARMER 4");

  const farmer4Farms = await prisma.farm.findMany({
    where: {
      farmerId: 4,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(`Farmer 4 farm count: ${farmer4Farms.length}`);

  for (const farm of farmer4Farms) {
    console.log(JSON.stringify(farm, null, 2));
  }

  /*
   * ----------------------------------------------------------
   * 5. FARM CREATION / UPDATE TIMELINE
   * ----------------------------------------------------------
   */

  printSection("5. FARM 1 TIMELINE");

  console.log("Farm 1 createdAt :", currentFarm.createdAt.toISOString());
  console.log("Farm 1 updatedAt :", currentFarm.updatedAt.toISOString());

  console.log("");
  console.log(
    "If createdAt is much older than the V31 test, Farm 1 existed before V31.",
  );
  console.log(
    "The current updatedAt reflects the later V31 mutation/restoration activity.",
  );

  /*
   * ----------------------------------------------------------
   * 6. SEARCH LOCAL PROJECT FILES
   * ----------------------------------------------------------
   */

  printSection("6. LOCAL PROJECT FILE SEARCH");

  const searchRoots = [
    path.join(ROOT, "scripts"),
    path.join(ROOT, "prisma"),
    path.join(ROOT, "app"),
    path.join(ROOT, "components"),
    path.join(ROOT, "lib"),
    path.join(ROOT, "data"),
    path.join(ROOT, "docs"),
  ];

  const files: string[] = [];

  for (const dir of searchRoots) {
    walk(dir, files);
  }

  const uniqueFiles = [...new Set(files)];

  console.log(`Files scanned: ${uniqueFiles.length}`);

  const searchTerms = [
    "Farm 1",
    "farmId: 1",
    "farmId = 1",
    "farm.id === 1",
    "id: 1",
    "farmerId: 4",
    "V31 E2E Test Farm",
    "beforeFarm",
    "configuredFarm",
    "farmName",
    "acreage",
    "countryId",
    "countyId",
    "subCountyId",
    "wardId",
  ];

  const matches = new Map<string, Set<string>>();

  for (const file of uniqueFiles) {
    const content = safeRead(file);

    if (!content) continue;

    for (const term of searchTerms) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        if (!matches.has(file)) {
          matches.set(file, new Set());
        }

        matches.get(file)!.add(term);
      }
    }
  }

  console.log(`Files containing relevant terms: ${matches.size}`);

  for (const [file, terms] of matches.entries()) {
    console.log("");
    console.log("FILE:", path.relative(ROOT, file));
    console.log("MATCHES:", [...terms].join(", "));
  }

  /*
   * ----------------------------------------------------------
   * 7. SEARCH FOR POSSIBLE FARM NAME VALUES
   * ----------------------------------------------------------
   */

  printSection("7. POSSIBLE ORIGINAL FARM NAME EVIDENCE");

  const nameTerms = [
    "farm",
    "shamba",
    "farm name",
    "farmName",
    "plot",
    "acre",
    "acreage",
  ];

  let nameEvidenceCount = 0;

  for (const file of uniqueFiles) {
    const content = safeRead(file);

    if (!content) continue;

    const lower = content.toLowerCase();

    const found = nameTerms.filter((term) =>
      lower.includes(term.toLowerCase()),
    );

    if (found.length === 0) continue;

    const lines = content.split(/\r?\n/);

    const interestingLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const lowerLine = line.toLowerCase();

      if (
        lowerLine.includes("farmname") ||
        lowerLine.includes("farm name") ||
        lowerLine.includes("farm_name") ||
        lowerLine.includes("acreage") ||
        lowerLine.includes("farmid")
      ) {
        interestingLines.push(
          `${i + 1}: ${line.trim().slice(0, 300)}`,
        );
      }
    }

    if (interestingLines.length > 0) {
      nameEvidenceCount++;

      console.log("");
      console.log("FILE:", path.relative(ROOT, file));

      for (const line of interestingLines.slice(0, 20)) {
        console.log(line);
      }
    }
  }

  console.log("");
  console.log(`Files with farm-related evidence: ${nameEvidenceCount}`);

  /*
   * ----------------------------------------------------------
   * 8. GEOGRAPHY CURRENTLY USED BY FARM 1
   * ----------------------------------------------------------
   */

  printSection("8. FARM 1 CURRENT GEOGRAPHY");

  if (
    currentFarm.countryId !== null &&
    currentFarm.countyId !== null &&
    currentFarm.subCountyId !== null &&
    currentFarm.wardId !== null
  ) {
    const geography = await prisma.ward.findUnique({
      where: {
        id: currentFarm.wardId,
      },
      include: {
        county: true,
        subCounty: true,
        constituency: true,
      },
    });

    if (geography) {
      console.log(
        JSON.stringify(
          {
            countryId: currentFarm.countryId,
            county: {
              id: geography.county.id,
              name: geography.county.name,
              countryId: geography.county.countryId,
            },
            subCounty: {
              id: geography.subCounty.id,
              name: geography.subCounty.name,
              countyId: geography.subCounty.countyId,
            },
            constituency: {
              id: geography.constituency.id,
              name: geography.constituency.name,
              countyId: geography.constituency.countyId,
            },
            ward: {
              id: geography.id,
              name: geography.name,
              countyId: geography.countyId,
              subCountyId: geography.subCountyId,
              constituencyId: geography.constituencyId,
            },
          },
          null,
          2,
        ),
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 9. V31 VALUE CHECK
   * ----------------------------------------------------------
   */

  printSection("9. V31 MUTATION VALUE CHECK");

  const v31Values = {
    farmName: "V31 E2E Test Farm",
    acreage: 1.25,
    countryId: 2,
    countyId: 48,
    subCountyId: 1310,
    wardId: 1024,
    villageId: null,
  };

  for (const [field, expected] of Object.entries(v31Values)) {
    const actual = (currentFarm as any)[field];

    console.log(
      `${field}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(
        expected,
      )} match=${actual === expected}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 10. FINAL SAFETY CONCLUSION
   * ----------------------------------------------------------
   */

  printSection("10. SAFETY CONCLUSION");

  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("");

  console.log(
    "Farm 1 original values must NOT be guessed from the current V31 values.",
  );

  console.log(
    "If this investigation finds historical evidence, we can reconstruct the original Farm 1 state.",
  );

  console.log(
    "If it finds no evidence, the next recovery source must be PostgreSQL backup/history/logging or another external database snapshot.",
  );

  console.log("");
  console.log("DO NOT RUN AN AUTHENTICATED MUTATION TEST YET.");
  console.log("DO NOT UPDATE FARM 1 YET.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("INVESTIGATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });