import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type MappingWard = {
  id: number;
  name: string;
  code: string | null;
  sourceGid?: number;
  sourceUid?: string;
};

type MappingSubCounty = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  wards: MappingWard[];
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("");
  console.log("=======================================");
  console.log("DIAGNOSING LOCATION DATABASE GAPS");
  console.log("=======================================");

  const mapPath = path.resolve(
    process.cwd(),
    "prisma/data/subcounty-ward-map.json"
  );

  const mappings =
    JSON.parse(
      fs.readFileSync(mapPath, "utf8")
    ) as MappingSubCounty[];

  const dbSubCounties =
    await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
        county: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  const dbConstituencies =
    await prisma.constituency.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  const dbWards =
    await prisma.ward.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
        constituencyId: true,
        subCountyId: true,
      },
    });

  // ---------------------------------------------------
  // 1. SUBCOUNTY MAPPING COVERAGE
  // ---------------------------------------------------

  console.log("");
  console.log("=======================================");
  console.log("SUBCOUNTY COVERAGE");
  console.log("=======================================");

  const dbSubCountyIds = new Set(
    dbSubCounties.map((x) => x.id)
  );

  const missingSubCounties =
    mappings.filter(
      (mapping) =>
        !dbSubCountyIds.has(
          mapping.subCountyId
        )
    );

  console.log(
    `Mapping SubCounties: ${mappings.length}`
  );

  console.log(
    `Database SubCounties: ${dbSubCounties.length}`
  );

  console.log(
    `Missing mapped SubCounties: ${missingSubCounties.length}`
  );

  if (missingSubCounties.length > 0) {
    console.table(
      missingSubCounties.map((x) => ({
        id: x.subCountyId,
        name: x.subCountyName,
        countyId: x.countyId,
        county: x.countyName,
        wards: x.wards.length,
      }))
    );
  }

  // ---------------------------------------------------
  // 2. IDENTIFY SUBCOUNTIES WITH WARDS IN MAPPING
  // ---------------------------------------------------

  console.log("");
  console.log("=======================================");
  console.log("MAPPED SUBCOUNTY WARD COUNTS");
  console.log("=======================================");

  const mappedWardCounts =
    new Map<number, number>();

  for (const mapping of mappings) {
    mappedWardCounts.set(
      mapping.subCountyId,
      mapping.wards.length
    );
  }

  const dbWardCounts =
    new Map<number, number>();

  for (const ward of dbWards) {
    if (ward.subCountyId !== null) {
      dbWardCounts.set(
        ward.subCountyId,
        (dbWardCounts.get(
          ward.subCountyId
        ) ?? 0) + 1
      );
    }
  }

  const wardCountDifferences =
    mappings
      .map((mapping) => ({
        id: mapping.subCountyId,
        subCounty: mapping.subCountyName,
        county: mapping.countyName,
        mappedWards: mapping.wards.length,
        databaseWards:
          dbWardCounts.get(
            mapping.subCountyId
          ) ?? 0,
      }))
      .filter(
        (x) =>
          x.mappedWards !==
          x.databaseWards
      );

  console.log(
    `SubCounties with ward-count differences: ${wardCountDifferences.length}`
  );

  console.table(
    wardCountDifferences
  );

  // ---------------------------------------------------
  // 3. DUPLICATE / NORMALIZED CONSTITUENCIES
  // ---------------------------------------------------

  console.log("");
  console.log("=======================================");
  console.log("CONSTITUENCY DUPLICATES");
  console.log("=======================================");

  const constituencyGroups =
    new Map<string, typeof dbConstituencies>();

  for (const constituency of dbConstituencies) {
    const key =
      `${constituency.countyId}::${normalize(
        constituency.name
      )}`;

    const group =
      constituencyGroups.get(key) ?? [];

    group.push(constituency);

    constituencyGroups.set(key, group);
  }

  const duplicateConstituencies =
    [...constituencyGroups.values()]
      .filter(
        (group) => group.length > 1
      )
      .flat();

  console.log(
    `Normalized duplicate constituency records: ${duplicateConstituencies.length}`
  );

  if (
    duplicateConstituencies.length > 0
  ) {
    console.table(
      duplicateConstituencies
    );
  }

  // ---------------------------------------------------
  // 4. CONSTITUENCY COUNTS BY COUNTY
  // ---------------------------------------------------

  console.log("");
  console.log("=======================================");
  console.log("CONSTITUENCIES BY COUNTY");
  console.log("=======================================");

  const constituencyCounts =
    new Map<number, number>();

  for (const constituency of dbConstituencies) {
    constituencyCounts.set(
      constituency.countyId,
      (constituencyCounts.get(
        constituency.countyId
      ) ?? 0) + 1
    );
  }

  const counties =
    await prisma.county.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.table(
    counties.map((county) => ({
      countyId: county.id,
      county: county.name,
      constituencies:
        constituencyCounts.get(
          county.id
        ) ?? 0,
    }))
  );

  // ---------------------------------------------------
  // 5. WARDS WITH INVALID PARENTS
  // ---------------------------------------------------

  console.log("");
  console.log("=======================================");
  console.log("WARD PARENT VALIDATION");
  console.log("=======================================");

  const constituencyIds =
    new Set(
      dbConstituencies.map(
        (x) => x.id
      )
    );

  const subCountyIds =
    new Set(
      dbSubCounties.map(
        (x) => x.id
      )
    );

  const invalidWardParents =
    dbWards.filter(
      (ward) =>
        !constituencyIds.has(
          ward.constituencyId
        ) ||
        (
          ward.subCountyId !== null &&
          !subCountyIds.has(
            ward.subCountyId
          )
        )
    );

  console.log(
    `Wards with invalid parent references: ${invalidWardParents.length}`
  );

  if (
    invalidWardParents.length > 0
  ) {
    console.table(
      invalidWardParents
    );
  }

  // ---------------------------------------------------
  // 6. WARD COUNT BY COUNTY
  // ---------------------------------------------------

  console.log("");
  console.log("=======================================");
  console.log("WARD COUNTS BY COUNTY");
  console.log("=======================================");

  const wardCounts =
    new Map<number, number>();

  for (const ward of dbWards) {
    wardCounts.set(
      ward.countyId,
      (wardCounts.get(
        ward.countyId
      ) ?? 0) + 1
    );
  }

  console.table(
    counties.map((county) => ({
      countyId: county.id,
      county: county.name,
      wards:
        wardCounts.get(
          county.id
        ) ?? 0,
    }))
  );

  console.log("");
  console.log("=======================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("=======================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "Diagnostic failed:"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });