import fs from "fs";
import path from "path";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type Candidate = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

type GeoFeature = {
  properties?: {
    gid?: number;
    county?: string;
    subcounty?: string;
    ward?: string;
    uid?: string;
    scuid?: string;
    cuid?: string;
  };
};

const candidates: Candidate[] = [
  // ----------------------------------------------------------
  // COUNTY 67 — NYANDARUA
  // ----------------------------------------------------------
  {
    id: 1370,
    name: "Nyandarua South",
    countyId: 67,
    countyName: "Nyandarua",
  },
  {
    id: 1371,
    name: "Mirangine",
    countyId: 67,
    countyName: "Nyandarua",
  },
  {
    id: 1373,
    name: "Nyandarua Central",
    countyId: 67,
    countyName: "Nyandarua",
  },
  {
    id: 1374,
    name: "Nyandarua West",
    countyId: 67,
    countyName: "Nyandarua",
  },
  {
    id: 1375,
    name: "Nyandarua North",
    countyId: 67,
    countyName: "Nyandarua",
  },

  // ----------------------------------------------------------
  // COUNTY 64 — MARSABIT
  // ----------------------------------------------------------
  {
    id: 1302,
    name: "Loiyangalani",
    countyId: 64,
    countyName: "Marsabit",
  },
  {
    id: 1303,
    name: "Marsabit Central",
    countyId: 64,
    countyName: "Marsabit",
  },
  {
    id: 1304,
    name: "Marsabit North",
    countyId: 64,
    countyName: "Marsabit",
  },
  {
    id: 1305,
    name: "Marsabit South",
    countyId: 64,
    countyName: "Marsabit",
  },
  {
    id: 1308,
    name: "Sololo",
    countyId: 64,
    countyName: "Marsabit",
  },

  // ----------------------------------------------------------
  // COUNTY 65 — MERU
  // ----------------------------------------------------------
  {
    id: 1312,
    name: "Buuri East",
    countyId: 65,
    countyName: "Meru",
  },
  {
    id: 1313,
    name: "Buuri West",
    countyId: 65,
    countyName: "Meru",
  },
  {
    id: 1319,
    name: "Meru Central",
    countyId: 65,
    countyName: "Meru",
  },
  {
    id: 1320,
    name: "Tigania Central",
    countyId: 65,
    countyName: "Meru",
  },

  // ----------------------------------------------------------
  // COUNTY 56 — KERICHO
  // ----------------------------------------------------------
  {
    id: 1484,
    name: "Kericho East",
    countyId: 56,
    countyName: "Kericho",
  },
  {
    id: 1485,
    name: "Kipkelion",
    countyId: 56,
    countyName: "Kericho",
  },
  {
    id: 1486,
    name: "Londiani",
    countyId: 56,
    countyName: "Kericho",
  },
  {
    id: 1487,
    name: "Soin Sigowet",
    countyId: 56,
    countyName: "Kericho",
  },

  // ----------------------------------------------------------
  // COUNTY 79 — NAIROBI CITY
  // ----------------------------------------------------------
  {
    id: 1572,
    name: "Dagoretti",
    countyId: 79,
    countyName: "Nairobi City",
  },
  {
    id: 1573,
    name: "Embakasi",
    countyId: 79,
    countyName: "Nairobi City",
  },
  {
    id: 1580,
    name: "Njiru",
    countyId: 79,
    countyName: "Nairobi City",
  },
];

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function countyVariants(value: string): string[] {
  const normalized = normalize(value);

  const variants = new Set<string>();

  variants.add(normalized);

  if (normalized === "nairobi city") {
    variants.add("nairobi");
  }

  if (normalized === "nyandarua") {
    variants.add("nyandarua county");
  }

  return [...variants];
}

function subCountyVariants(value: string): string[] {
  const normalized = normalize(value);

  const variants = new Set<string>();

  variants.add(normalized);

  const withoutSubCounty = normalized
    .replace(/\bsub county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (withoutSubCounty) {
    variants.add(withoutSubCounty);
  }

  return [...variants];
}

function fail(message: string): never {
  console.error(`\n❌ FAIL: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function pass(message: string): void {
  console.log(`✅ ${message}`);
}

function loadGeoJSON(): GeoFeature[] {
  const geoJsonPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson",
  );

  if (!fs.existsSync(geoJsonPath)) {
    fail(`Authoritative GeoJSON not found: ${geoJsonPath}`);
  }

  const raw = fs.readFileSync(geoJsonPath, "utf8");

  const parsed = JSON.parse(raw) as {
    features?: GeoFeature[];
  };

  if (!Array.isArray(parsed.features)) {
    fail("Authoritative GeoJSON does not contain a valid features array.");
  }

  return parsed.features;
}

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("============================================================");
    console.log("BATCH 2 AUTHORITATIVE SUBCOUNTY AUDIT");
    console.log("READ-ONLY — NO DATABASE CHANGES");
    console.log("============================================================\n");

    /*
     * ----------------------------------------------------------
     * Basic candidate validation
     * ----------------------------------------------------------
     */

    console.log("Candidate count:", candidates.length);

    if (candidates.length !== 21) {
      fail(
        `Expected exactly 21 Batch 2 candidates, found ${candidates.length}.`,
      );
    }

    const candidateIds = candidates.map((candidate) => candidate.id);

    const uniqueIds = new Set(candidateIds);

    if (uniqueIds.size !== candidateIds.length) {
      fail("Duplicate candidate IDs detected.");
    }

    pass("21 candidate IDs are unique.");

    /*
     * ----------------------------------------------------------
     * Load authoritative GeoJSON
     * ----------------------------------------------------------
     */

    console.log("\n1. LOAD AUTHORITATIVE GEOGRAPHY");

    const features = loadGeoJSON();

    console.log(
      `Authoritative GeoJSON features loaded: ${features.length}`,
    );

    if (features.length !== 1450) {
      fail(
        `Expected 1450 authoritative ward features, found ${features.length}.`,
      );
    }

    pass("Authoritative GeoJSON contains exactly 1450 ward features.");

    /*
     * ----------------------------------------------------------
     * Build authoritative index
     * ----------------------------------------------------------
     */

    console.log("\n2. BUILD AUTHORITATIVE SUBCOUNTY INDEX");

    const authoritative = new Map<
      string,
      {
        countyName: string;
        subCountyName: string;
        wards: Set<number>;
        wardNames: Set<string>;
      }
    >();

    for (const feature of features) {
      const countyName = feature.properties?.county ?? "";
      const subCountyName = feature.properties?.subcounty ?? "";
      const wardName = feature.properties?.ward ?? "";
      const gid = Number(feature.properties?.gid);

      if (!countyName || !subCountyName) {
        continue;
      }

      for (const countyKey of countyVariants(countyName)) {
        for (const subCountyKey of subCountyVariants(subCountyName)) {
          const key = `${countyKey}|||${subCountyKey}`;

          if (!authoritative.has(key)) {
            authoritative.set(key, {
              countyName,
              subCountyName,
              wards: new Set<number>(),
              wardNames: new Set<string>(),
            });
          }

          const entry = authoritative.get(key)!;

          if (Number.isFinite(gid)) {
            entry.wards.add(gid);
          }

          if (wardName) {
            entry.wardNames.add(wardName);
          }
        }
      }
    }

    console.log(
      `Authoritative county/subcounty index entries: ${authoritative.size}`,
    );

    pass("Authoritative geography index built.");

    /*
     * ----------------------------------------------------------
     * 3. Verify all candidate DB records exist
     * ----------------------------------------------------------
     */

    console.log("\n3. VERIFY ALL 21 CANDIDATES EXIST IN DATABASE");

    const dbResult = await client.query<{
      id: number;
      name: string;
      countyId: number;
      countyName: string;
    }>(
      `
      SELECT
        sc.id,
        sc.name,
        sc."countyId",
        c.name AS "countyName"
      FROM "SubCounty" sc
      INNER JOIN "County" c
        ON c.id = sc."countyId"
      WHERE sc.id = ANY($1::int[])
      ORDER BY sc."countyId", sc.id
      `,
      [candidateIds],
    );

    if (dbResult.rows.length !== candidates.length) {
      console.table(dbResult.rows);

      const foundIds = new Set(
        dbResult.rows.map((row) => Number(row.id)),
      );

      const missing = candidates.filter(
        (candidate) => !foundIds.has(candidate.id),
      );

      console.log("\nMissing candidates:");
      console.table(missing);

      fail(
        `Expected ${candidates.length} candidate records, found ${dbResult.rows.length}.`,
      );
    }

    pass("All 21 candidate records exist in the database.");

    /*
     * ----------------------------------------------------------
     * 4. Verify exact county/name identity
     * ----------------------------------------------------------
     */

    console.log("\n4. VERIFY DATABASE COUNTY/SUBCOUNTY IDENTITY");

    for (const candidate of candidates) {
      const row = dbResult.rows.find(
        (item) => Number(item.id) === candidate.id,
      );

      if (!row) {
        fail(`Candidate ${candidate.id} was not returned from database.`);
      }

      if (Number(row.countyId) !== candidate.countyId) {
        fail(
          `Candidate ${candidate.id} (${candidate.name}) is attached to county ${row.countyId}, expected ${candidate.countyId}.`,
        );
      }

      if (normalize(row.countyName) !== normalize(candidate.countyName)) {
        fail(
          `Candidate ${candidate.id} county name mismatch. Expected "${candidate.countyName}", found "${row.countyName}".`,
        );
      }

      if (normalize(row.name) !== normalize(candidate.name)) {
        fail(
          `Candidate ${candidate.id} name mismatch. Expected "${candidate.name}", found "${row.name}".`,
        );
      }
    }

    pass("All 21 candidates have exact expected county/name identity.");

    /*
     * ----------------------------------------------------------
     * 5. Verify Ward references
     * ----------------------------------------------------------
     */

    console.log("\n5. VERIFY WARD REFERENCES");

    const wardResult = await client.query<{
      subCountyId: number;
      wardCount: string;
    }>(
      `
      SELECT
        w."subCountyId",
        COUNT(*)::text AS "wardCount"
      FROM "Ward" w
      WHERE w."subCountyId" = ANY($1::int[])
      GROUP BY w."subCountyId"
      ORDER BY w."subCountyId"
      `,
      [candidateIds],
    );

    const wardCounts = new Map<number, number>();

    for (const row of wardResult.rows) {
      wardCounts.set(
        Number(row.subCountyId),
        Number(row.wardCount),
      );
    }

    let totalDbWardRefs = 0;

    for (const candidate of candidates) {
      const count = wardCounts.get(candidate.id) ?? 0;

      totalDbWardRefs += count;

      console.log(
        `   ${candidate.id} ${candidate.name}: ${count} Ward refs`,
      );

      if (count !== 0) {
        fail(
          `Candidate ${candidate.id} (${candidate.name}) has ${count} Ward references.`,
        );
      }
    }

    if (totalDbWardRefs !== 0) {
      fail(
        `Expected 0 Ward references across candidates, found ${totalDbWardRefs}.`,
      );
    }

    pass("All 21 candidates have 0 database Ward references.");

    /*
     * ----------------------------------------------------------
     * 6. Verify six FK paths
     * ----------------------------------------------------------
     */

    console.log("\n6. VERIFY ALL SIX FK REFERENCE PATHS");

    const fkChecks = [
      {
        label: "BusinessPartner.subCountyId",
        table: "BusinessPartner",
        column: "subCountyId",
      },
      {
        label: "CommodityTransaction.destinationSubCountyId",
        table: "CommodityTransaction",
        column: "destinationSubCountyId",
      },
      {
        label: "CommodityTransaction.sourceSubCountyId",
        table: "CommodityTransaction",
        column: "sourceSubCountyId",
      },
      {
        label: "Farm.subCountyId",
        table: "Farm",
        column: "subCountyId",
      },
      {
        label: "Farmer.subCountyId",
        table: "Farmer",
        column: "subCountyId",
      },
      {
        label: "Ward.subCountyId",
        table: "Ward",
        column: "subCountyId",
      },
    ];

    let totalReferences = 0;

    for (const fk of fkChecks) {
      const result = await client.query<{ count: string }>(
        `
        SELECT COUNT(*)::text AS count
        FROM "${fk.table}"
        WHERE "${fk.column}" = ANY($1::int[])
        `,
        [candidateIds],
      );

      const count = Number(result.rows[0]?.count ?? 0);

      console.log(`   ${fk.label}: ${count}`);

      totalReferences += count;

      if (count !== 0) {
        fail(
          `${fk.label} contains ${count} references to Batch 2 candidate IDs.`,
        );
      }
    }

    if (totalReferences !== 0) {
      fail(
        `Total references to Batch 2 candidates = ${totalReferences}.`,
      );
    }

    pass("All six FK paths contain 0 references.");

    /*
     * ----------------------------------------------------------
     * 7. Authoritative comparison
     * ----------------------------------------------------------
     */

    console.log(
      "\n7. COMPARE ALL 21 CANDIDATES AGAINST AUTHORITATIVE GEOGRAPHY",
    );

    const noMatch: Candidate[] = [];
    const authoritativeMatches: Array<{
      id: number;
      county: string;
      databaseSubCounty: string;
      authoritativeSubCounty: string;
      authoritativeWardCount: number;
      authoritativeWardGids: number[];
    }> = [];

    for (const candidate of candidates) {
      const countyKeys = countyVariants(candidate.countyName);
      const subCountyKeys = subCountyVariants(candidate.name);

      let match:
        | {
            countyName: string;
            subCountyName: string;
            wards: Set<number>;
            wardNames: Set<string>;
          }
        | undefined;

      for (const countyKey of countyKeys) {
        for (const subCountyKey of subCountyKeys) {
          const key = `${countyKey}|||${subCountyKey}`;

          const candidateMatch = authoritative.get(key);

          if (candidateMatch) {
            match = candidateMatch;
            break;
          }
        }

        if (match) {
          break;
        }
      }

      if (!match) {
        noMatch.push(candidate);

        console.log(
          `   ${candidate.id} ${candidate.countyName} / ${candidate.name}: NO MATCH`,
        );

        continue;
      }

      authoritativeMatches.push({
        id: candidate.id,
        county: candidate.countyName,
        databaseSubCounty: candidate.name,
        authoritativeSubCounty: match.subCountyName,
        authoritativeWardCount: match.wards.size,
        authoritativeWardGids: [...match.wards].sort((a, b) => a - b),
      });

      console.log(
        `   ${candidate.id} ${candidate.countyName} / ${candidate.name}: MATCH — ${match.wards.size} authoritative wards`,
      );
    }

    /*
     * ----------------------------------------------------------
     * 8. Classification
     * ----------------------------------------------------------
     */

    console.log("\n8. CLASSIFY CANDIDATES");

    if (noMatch.length > 0) {
      console.log("\nNO AUTHORITATIVE MATCH:");
      console.table(noMatch);
    }

    if (authoritativeMatches.length > 0) {
      console.log("\nAUTHORITATIVE MATCHES:");
      console.table(
        authoritativeMatches.map((row) => ({
          ID: row.id,
          County: row.county,
          DB_SubCounty: row.databaseSubCounty,
          Authoritative_SubCounty: row.authoritativeSubCounty,
          Authoritative_Wards: row.authoritativeWardCount,
          Authoritative_GIDs:
            row.authoritativeWardGids.join(", "),
        })),
      );
    }

    /*
     * ----------------------------------------------------------
     * Important decision rule
     * ----------------------------------------------------------
     *
     * A candidate is SAFE LEGACY only if:
     *
     *   DB references = 0
     *   AND
     *   authoritative match = NO
     *   AND
     *   authoritative wards = 0
     *
     * If it matches authoritative geography, it MUST NOT be
     * deleted automatically.
     * ----------------------------------------------------------
     */

    const safeLegacy = noMatch.filter((candidate) => {
      const match = authoritativeMatches.find(
        (row) => row.id === candidate.id,
      );

      return !match;
    });

    /*
     * ----------------------------------------------------------
     * 9. Final strict decision
     * ----------------------------------------------------------
     */

    console.log("\n============================================================");
    console.log("BATCH 2 AUTHORITATIVE AUDIT RESULT");
    console.log("============================================================");

    console.log(`Candidates audited: ${candidates.length}`);
    console.log(`Authoritative matches: ${authoritativeMatches.length}`);
    console.log(`No authoritative match: ${noMatch.length}`);
    console.log(`Safe legacy candidates: ${safeLegacy.length}`);
    console.log(`DB references: ${totalReferences}`);
    console.log(`DB Ward references: ${totalDbWardRefs}`);

    if (
      noMatch.length === candidates.length &&
      authoritativeMatches.length === 0 &&
      totalReferences === 0 &&
      totalDbWardRefs === 0
    ) {
      console.log("\n============================================================");
      console.log("BATCH 2 AUTHORITATIVE AUDIT: PASS");
      console.log("============================================================");

      console.log(
        `All ${candidates.length} candidates have:`,
      );
      console.log("  • 0 database references");
      console.log("  • 0 database Ward references");
      console.log("  • no authoritative SubCounty match");
      console.log("  • no authoritative wards");

      console.log(
        "\nAll 21 candidates are classified as SAFE LEGACY CANDIDATES.",
      );

      console.log(
        "\nNEXT STEP: Run the Batch 2 FK-rule catalog audit.",
      );

      return;
    }

    /*
     * ----------------------------------------------------------
     * If any authoritative matches exist, STOP.
     * ----------------------------------------------------------
     */

    console.log("\n============================================================");
    console.log("BATCH 2 AUTHORITATIVE AUDIT: REVIEW REQUIRED");
    console.log("============================================================");

    if (authoritativeMatches.length > 0) {
      console.log(
        `WARNING: ${authoritativeMatches.length} candidate(s) match authoritative geography.`,
      );

      console.log(
        "These records MUST NOT be deleted until reviewed.",
      );
    }

    if (totalReferences > 0) {
      console.log(
        `WARNING: ${totalReferences} database references exist.`,
      );

      console.log(
        "Candidates with references MUST NOT be deleted.",
      );
    }

    if (totalDbWardRefs > 0) {
      console.log(
        `WARNING: ${totalDbWardRefs} Ward references exist.`,
      );

      console.log(
        "Candidates with Ward references MUST NOT be deleted.",
      );
    }

    process.exitCode = 1;
  } catch (error) {
    console.error("\n============================================================");
    console.error("BATCH 2 AUTHORITATIVE AUDIT FAILED");
    console.error("============================================================");

    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("\nUNHANDLED ERROR:");

  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});