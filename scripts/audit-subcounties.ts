import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import subcounties from "../prisma/data/subcounties.json";

type SubCountySeed = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

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

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ");
}

function key(countyId: number, name: string): string {
  return `${countyId}|${normalizeName(name)}`;
}

async function main() {
  console.log("");
  console.log("===========================================");
  console.log("SUBCOUNTY READ-ONLY AUDIT");
  console.log("===========================================");
  console.log("");

  // --------------------------------------------------
  // 1. Load authoritative source
  // --------------------------------------------------

  const authoritative = subcounties as SubCountySeed[];

  console.log(
    `Authoritative subcounties.json records: ${authoritative.length}`,
  );

  // --------------------------------------------------
  // 2. Load counties
  // --------------------------------------------------

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const countyByCode = new Map<string, (typeof counties)[number]>();

  for (const county of counties) {
    if (county.code) {
      countyByCode.set(county.code, county);
    }
  }

  console.log(`Database counties:                 ${counties.length}`);

  // --------------------------------------------------
  // 3. Resolve authoritative subcounties
  // --------------------------------------------------

  const expectedKeys = new Set<string>();

  const expectedRecords: Array<{
    countyId: number;
    countyCode: string;
    countyName: string;
    name: string;
    key: string;
  }> = [];

  const missingCountyCodes = new Set<string>();

  for (const item of authoritative) {
    const county = countyByCode.get(item.countyCode);

    if (!county) {
      missingCountyCodes.add(item.countyCode);
      continue;
    }

    const recordKey = key(county.id, item.name);

    if (expectedKeys.has(recordKey)) {
      console.log(
        `WARNING: Duplicate authoritative key: ${item.countyCode} | ${item.name}`,
      );
      continue;
    }

    expectedKeys.add(recordKey);

    expectedRecords.push({
      countyId: county.id,
      countyCode: item.countyCode,
      countyName: county.name,
      name: item.name,
      key: recordKey,
    });
  }

  console.log(
    `Resolved authoritative records:       ${expectedRecords.length}`,
  );

  if (missingCountyCodes.size > 0) {
    console.log("");
    console.log("MISSING COUNTY CODES REFERENCED BY SOURCE:");

    for (const code of [...missingCountyCodes].sort()) {
      console.log(`  ${code}`);
    }
  }

  // --------------------------------------------------
  // 4. Load ALL database SubCounties
  // --------------------------------------------------

  const dbSubCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  console.log("");
  console.log(`Database SubCounties:                 ${dbSubCounties.length}`);

  // --------------------------------------------------
  // 5. Build database lookup
  // --------------------------------------------------

  const dbByKey = new Map<string, typeof dbSubCounties>();

  for (const row of dbSubCounties) {
    const recordKey = key(row.countyId, row.name);

    const existing = dbByKey.get(recordKey) ?? [];
    existing.push(row);
    dbByKey.set(recordKey, existing);
  }

  // --------------------------------------------------
  // 6. Exact authoritative matches
  // --------------------------------------------------

  const matched: typeof dbSubCounties = [];
  const missing: typeof expectedRecords = [];

  for (const expected of expectedRecords) {
    const rows = dbByKey.get(expected.key) ?? [];

    if (rows.length === 0) {
      missing.push(expected);
    } else {
      matched.push(rows[0]);
    }
  }

  // --------------------------------------------------
  // 7. Database records not represented by source
  // --------------------------------------------------

  const authoritativeKeySet = expectedKeys;

  const extraDbRows = dbSubCounties.filter((row) => {
    return !authoritativeKeySet.has(key(row.countyId, row.name));
  });

  // --------------------------------------------------
  // 8. Normalized-name differences
  //
  // Example:
  // Source: "Murang'a"
  // DB:     "Muranga"
  //
  // These are NOT automatically changed.
  // --------------------------------------------------

  const normalizedCandidates: Array<{
    source: (typeof expectedRecords)[number];
    db: (typeof dbSubCounties)[number];
  }> = [];

  const dbByCountyNormalized = new Map<
    string,
    typeof dbSubCounties
  >();

  for (const row of dbSubCounties) {
    const countyKey = `${row.countyId}|${normalizeName(row.name)}`;

    const existing = dbByCountyNormalized.get(countyKey) ?? [];
    existing.push(row);
    dbByCountyNormalized.set(countyKey, existing);
  }

  for (const expected of expectedRecords) {
    const candidates =
      dbByCountyNormalized.get(
        `${expected.countyId}|${normalizeName(expected.name)}`,
      ) ?? [];

    for (const candidate of candidates) {
      if (candidate.name !== expected.name) {
        normalizedCandidates.push({
          source: expected,
          db: candidate,
        });
      }
    }
  }

  // --------------------------------------------------
  // 9. County distribution
  // --------------------------------------------------

  const sourceCountyCounts = new Map<number, number>();
  const dbCountyCounts = new Map<number, number>();

  for (const item of expectedRecords) {
    sourceCountyCounts.set(
      item.countyId,
      (sourceCountyCounts.get(item.countyId) ?? 0) + 1,
    );
  }

  for (const row of dbSubCounties) {
    dbCountyCounts.set(
      row.countyId,
      (dbCountyCounts.get(row.countyId) ?? 0) + 1,
    );
  }

  // --------------------------------------------------
  // 10. Report
  // --------------------------------------------------

  console.log("");
  console.log("===========================================");
  console.log("SUMMARY");
  console.log("===========================================");

  console.log(
    `Authoritative records:                 ${expectedRecords.length}`,
  );

  console.log(
    `Database records:                      ${dbSubCounties.length}`,
  );

  console.log(
    `Authoritative records found in DB:     ${matched.length}`,
  );

  console.log(
    `Authoritative records missing in DB:   ${missing.length}`,
  );

  console.log(
    `DB records outside authoritative set:  ${extraDbRows.length}`,
  );

  console.log(
    `Normalized-name differences:           ${normalizedCandidates.length}`,
  );

  console.log("");

  // --------------------------------------------------
  // 11. Missing authoritative records
  // --------------------------------------------------

  if (missing.length > 0) {
    console.log("===========================================");
    console.log("MISSING AUTHORITATIVE SUBCOUNTIES");
    console.log("===========================================");

    for (const row of missing) {
      console.log(
        `County ${row.countyId} (${row.countyCode}) ${row.countyName} | ${row.name}`,
      );
    }

    console.log("");
  }

  // --------------------------------------------------
  // 12. Extra / legacy DB records
  // --------------------------------------------------

  if (extraDbRows.length > 0) {
    console.log("===========================================");
    console.log("DATABASE RECORDS OUTSIDE AUTHORITATIVE SET");
    console.log("===========================================");

    for (const row of extraDbRows) {
      console.log(
        `ID ${row.id} | County ${row.countyId} | ${row.county?.name ?? "UNKNOWN"} | ${row.name}`,
      );
    }

    console.log("");
  }

  // --------------------------------------------------
  // 13. Normalized-name differences
  // --------------------------------------------------

  if (normalizedCandidates.length > 0) {
    console.log("===========================================");
    console.log("NORMALIZED NAME DIFFERENCES");
    console.log("===========================================");

    for (const item of normalizedCandidates) {
      console.log(
        `County ${item.source.countyId} (${item.source.countyName})`,
      );

      console.log(`  SOURCE: ${item.source.name}`);

      console.log(
        `  DB:     ID ${item.db.id} | ${item.db.name}`,
      );

      console.log("");
    }
  }

  // --------------------------------------------------
  // 14. County comparison
  // --------------------------------------------------

  console.log("===========================================");
  console.log("COUNTY-LEVEL COMPARISON");
  console.log("===========================================");

  for (const county of counties) {
    const sourceCount = sourceCountyCounts.get(county.id) ?? 0;
    const dbCount = dbCountyCounts.get(county.id) ?? 0;

    if (sourceCount !== dbCount) {
      console.log(
        `${county.id} | ${county.code ?? "NO-CODE"} | ${county.name} | source=${sourceCount} | db=${dbCount} | difference=${dbCount - sourceCount}`,
      );
    }
  }

  // --------------------------------------------------
  // 15. Ward distribution by SubCounty
  //
  // This helps identify whether "extra" records are
  // legacy parents that still own wards.
  // --------------------------------------------------

  const wardCounts = await prisma.ward.groupBy({
    by: ["subCountyId"],
    _count: {
      id: true,
    },
  });

  const wardCountBySubCountyId = new Map<number, number>();

  for (const row of wardCounts) {
    if (row.subCountyId !== null) {
      wardCountBySubCountyId.set(
        row.subCountyId,
        Number(row._count.id),
      );
    }
  }

  console.log("");
  console.log("===========================================");
  console.log("EXTRA DATABASE SUBCOUNTIES WITH WARDS");
  console.log("===========================================");

  let extraWithWards = 0;
  let extraWithoutWards = 0;

  for (const row of extraDbRows) {
    const wardCount = wardCountBySubCountyId.get(row.id) ?? 0;

    if (wardCount > 0) {
      extraWithWards++;

      console.log(
        `ID ${row.id} | County ${row.countyId} | ${row.county?.name ?? "UNKNOWN"} | ${row.name} | wards=${wardCount}`,
      );
    } else {
      extraWithoutWards++;
    }
  }

  console.log("");
  console.log(`Extra records WITH wards:    ${extraWithWards}`);
  console.log(`Extra records WITHOUT wards: ${extraWithoutWards}`);

  // --------------------------------------------------
  // 16. Final assessment
  // --------------------------------------------------

  console.log("");
  console.log("===========================================");
  console.log("AUDIT ASSESSMENT");
  console.log("===========================================");

  if (
    expectedRecords.length === 330 &&
    matched.length === 330 &&
    missing.length === 0
  ) {
    console.log(
      "PASS: All 330 authoritative SubCounties exist in the database.",
    );
  } else {
    console.log(
      "REVIEW: Authoritative SubCounty set is not completely matched.",
    );
  }

  console.log(
    `Database total: ${dbSubCounties.length}`,
  );

  console.log(
    `Authoritative total: ${expectedRecords.length}`,
  );

  console.log(
    `Potential legacy/extraneous records: ${extraDbRows.length}`,
  );

  console.log("");
  console.log("READ-ONLY AUDIT COMPLETE.");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("SUBCOUNTY AUDIT FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });