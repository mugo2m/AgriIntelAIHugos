import "dotenv/config";

import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      output[key] = serialize(item);
    }

    return output;
  }

  return value;
}

function searchProjectFiles(root: string): string[] {
  const matches: string[] = [];

  const ignored = new Set([
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    ".venv",
  ]);

  function walk(current: string) {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignored.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const lower = entry.name.toLowerCase();

      const interesting =
        lower.endsWith(".ts") ||
        lower.endsWith(".tsx") ||
        lower.endsWith(".js") ||
        lower.endsWith(".jsx") ||
        lower.endsWith(".json") ||
        lower.endsWith(".md") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".log");

      if (!interesting) {
        continue;
      }

      let content: string;

      try {
        content = fs.readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }

      const contentLower = content.toLowerCase();

      if (
        contentLower.includes("v31 e2e test farm") ||
        contentLower.includes("beforefarm") ||
        contentLower.includes("configuredfarm") ||
        contentLower.includes("farm 1")
      ) {
        matches.push(fullPath);
      }
    }
  }

  walk(root);

  return matches;
}

async function main() {
  console.log("============================================================");
  console.log("INVESTIGATE V31 FARM 1");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  console.log("1. CURRENT FARM 1");
  console.log("------------------");

  const farm = await prisma.farm.findUnique({
    where: { id: 1 },
  });

  if (!farm) {
    console.log("Farm 1: NOT FOUND");
  } else {
    console.log(JSON.stringify(serialize(farm), null, 2));
  }

  console.log("");

  console.log("2. FARM 1 → FARMER RELATIONSHIP");
  console.log("--------------------------------");

  if (farm) {
    const farmer = await prisma.farmer.findUnique({
      where: { id: farm.farmerId },
      select: {
        id: true,
        userId: true,
        phone: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
        villageId: true,
      },
    });

    if (farmer) {
      console.log(JSON.stringify(serialize(farmer), null, 2));

      console.log("");

      if (farmer.id === 4) {
        console.log("PASS — Farm 1 belongs to Farmer 4.");
      } else {
        console.log(
          `INFO — Farm 1 belongs to Farmer ${farmer.id}, not Farmer 4.`,
        );
      }
    } else {
      console.log("Farmer referenced by Farm 1 was not found.");
    }
  }

  console.log("");

  console.log("3. FARM 1 GEOGRAPHY");
  console.log("-------------------");

  if (farm) {
    const [country, county, subCounty, ward, village] =
      await Promise.all([
        farm.countryId
          ? prisma.country.findUnique({
              where: { id: farm.countryId },
              select: { id: true, name: true },
            })
          : null,

        farm.countyId
          ? prisma.county.findUnique({
              where: { id: farm.countyId },
              select: { id: true, name: true },
            })
          : null,

        farm.subCountyId
          ? prisma.subCounty.findUnique({
              where: { id: farm.subCountyId },
              select: { id: true, name: true, countyId: true },
            })
          : null,

        farm.wardId
          ? prisma.ward.findUnique({
              where: { id: farm.wardId },
              select: {
                id: true,
                name: true,
                countyId: true,
                subCountyId: true,
                constituencyId: true,
              },
            })
          : null,

        farm.villageId
          ? prisma.village.findUnique({
              where: { id: farm.villageId },
              select: {
                id: true,
                name: true,
                wardId: true,
              },
            })
          : null,
      ]);

    console.log("Country:");
    console.log(country ?? "NULL");

    console.log("County:");
    console.log(county ?? "NULL");

    console.log("SubCounty:");
    console.log(subCounty ?? "NULL");

    console.log("Ward:");
    console.log(ward ?? "NULL");

    console.log("Village:");
    console.log(village ?? "NULL");
  }

  console.log("");

  console.log("4. CURRENT FARM TIMESTAMPS");
  console.log("--------------------------");

  if (farm) {
    console.log(`Created : ${farm.createdAt.toISOString()}`);
    console.log(`Updated : ${farm.updatedAt.toISOString()}`);
  }

  console.log("");

  console.log("5. PROJECT FILE EVIDENCE SEARCH");
  console.log("-------------------------------");

  const projectRoot = process.cwd();

  console.log(`Project root: ${projectRoot}`);
  console.log("");

  const matches = searchProjectFiles(projectRoot);

  if (matches.length === 0) {
    console.log("No project files containing likely Farm 1/V31 evidence were found.");
  } else {
    console.log(`Found ${matches.length} potentially relevant file(s):`);

    for (const match of matches) {
      console.log(`- ${path.relative(projectRoot, match)}`);
    }
  }

  console.log("");

  console.log("6. V31 TEST VALUE CHECK");
  console.log("-----------------------");

  if (farm) {
    console.log(
      `Farm name is test value: ${
        farm.farmName === "V31 E2E Test Farm" ? "YES" : "NO"
      }`,
    );

    console.log(
      `Acreage is test value: ${
        farm.acreage === 1.25 ? "YES" : "NO"
      }`,
    );

    console.log(
      `Country ID is test value: ${
        farm.countryId === 2 ? "YES" : "NO"
      }`,
    );

    console.log(
      `County ID is V31 test value: ${
        farm.countyId === 48 ? "YES" : "NO"
      }`,
    );

    console.log(
      `SubCounty ID is V31 test value: ${
        farm.subCountyId === 1310 ? "YES" : "NO"
      }`,
    );

    console.log(
      `Ward ID is V31 test value: ${
        farm.wardId === 1024 ? "YES" : "NO"
      }`,
    );
  }

  console.log("");

  console.log("============================================================");
  console.log("INVESTIGATION COMPLETE");
  console.log("============================================================");
  console.log("");
  console.log("NO DATABASE CHANGES WERE MADE.");
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