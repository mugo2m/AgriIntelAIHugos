// scripts/second-level-audit-orphan-subcounties.ts
//
// SECOND-LEVEL AUDIT OF ORPHAN SUBCOUNTIES
//
// PURPOSE:
//   Validate the 102 SubCounty records previously classified as ORPHAN.
//
// IMPORTANT:
//   READ-ONLY.
//   NO INSERT.
//   NO UPDATE.
//   NO DELETE.
//   NO SCHEMA CHANGES.
//
// CLASSIFICATION:
//   SAFE_DELETE
//   DUPLICATE_OR_MERGE
//   REVIEW_KEEP
//
// The script checks:
//   1. County relationship
//   2. Ward references
//   3. Farmer references
//   4. Farm references
//   5. BusinessPartner references
//   6. CommodityTransaction source/destination references
//   7. Every formal FK pointing to SubCounty.id
//   8. Normalized duplicate names
//   9. Similar names within the same County
//  10. Potential duplicate administrative names
//
// NOTE:
//   This script deliberately does NOT delete anything.

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

type Classification =
  | "SAFE_DELETE"
  | "DUPLICATE_OR_MERGE"
  | "REVIEW_KEEP";

type Candidate = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
};

type FormalFk = {
  tableName: string;
  columnName: string;
  onDelete: string;
};

type CandidateResult = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;

  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  commoditySource: number;
  commodityDestination: number;

  formalFkReferences: number;

  exactNormalizedMatches: {
    id: number;
    name: string;
  }[];

  similarNameMatches: {
    id: number;
    name: string;
    wardCount: number;
  }[];

  classification: Classification;
  reasons: string[];
};

const ORPHAN_IDS = [
  657,
  845,
  847,
  848,
  849,
  851,
  852,
  817,
  818,
  819,
  820,
  823,
  799,
  800,
  801,
  802,
  806,
  789,
  790,
  791,
  1157,
  576,
  577,
  578,
  582,
  592,
  594,
  828,
  602,
  604,
  966,
  607,
  608,
  609,
  610,
  613,
  617,
  618,
  624,
  625,
  629,
  630,
  675,
  676,
  678,
  679,
  680,
  638,
  639,
  640,
  643,
  644,
  645,
  646,
  647,
  648,
  649,
  650,
  652,
  653,
  654,
  655,
  1016,
  722,
  567,
  570,
  692,
  693,
  694,
  697,
  877,
  878,
  885,
  730,
  731,
  708,
  713,
  714,
  834,
  566,
  861,
  862,
  863,
  864,
  865,
  866,
  867,
  868,
  869,
  870,
  871,
  746,
  748,
  749,
  633,
  634,
  635,
  759,
  763,
  781,
  786,
  876,
];

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/subcounty$/i, "");
}

function similarityKey(value: string): string {
  return normalizeName(value)
    .replace(/central/g, "")
    .replace(/east/g, "")
    .replace(/west/g, "")
    .replace(/north/g, "")
    .replace(/south/g, "")
    .replace(/town/g, "")
    .replace(/municipality/g, "")
    .replace(/area/g, "");
}

async function getFormalForeignKeys(): Promise<FormalFk[]> {
  const rows = await prisma.$queryRawUnsafe<
    {
      table_name: string;
      column_name: string;
      on_delete: string;
    }[]
  >(`
    SELECT
      cls.relname AS table_name,
      att.attname AS column_name,
      CASE con.confdeltype::text
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confdeltype::text
      END AS on_delete
    FROM pg_constraint con
    JOIN pg_class cls
      ON cls.oid = con.conrelid
    JOIN pg_class refcls
      ON refcls.oid = con.confrelid
    JOIN pg_attribute att
      ON att.attrelid = cls.oid
     AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND refcls.relname = 'SubCounty'
    ORDER BY cls.relname, att.attname;
  `);

  return rows.map((row) => ({
    tableName: row.table_name,
    columnName: row.column_name,
    onDelete: row.on_delete,
  }));
}

async function countFormalFkReferences(
  tableName: string,
  columnName: string,
  subCountyId: number,
): Promise<number> {
  const safeTable = `"${tableName.replace(/"/g, '""')}"`;
  const safeColumn = `"${columnName.replace(/"/g, '""')}"`;

  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*)::bigint AS count
    FROM ${safeTable}
    WHERE ${safeColumn} = ${subCountyId}
  `);

  return Number(rows[0]?.count ?? 0);
}

async function countTableRows(
  tableName: string,
  columnName: string,
  subCountyId: number,
): Promise<number> {
  const safeTable = `"${tableName.replace(/"/g, '""')}"`;
  const safeColumn = `"${columnName.replace(/"/g, '""')}"`;

  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*)::bigint AS count
    FROM ${safeTable}
    WHERE ${safeColumn} = ${subCountyId}
  `);

  return Number(rows[0]?.count ?? 0);
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log(" SECOND-LEVEL ORPHAN SUBCOUNTY AUDIT");
  console.log("============================================================");
  console.log("");
  console.log("DATABASE CHANGES: 0");
  console.log("INSERT: 0");
  console.log("UPDATE: 0");
  console.log("DELETE: 0");
  console.log("SCHEMA CHANGES: 0");
  console.log("");

  // ----------------------------------------------------------
  // 1. Database counts
  // ----------------------------------------------------------

  const countyCount = await prisma.county.count();
  const subCountyCount = await prisma.subCounty.count();
  const wardCount = await prisma.ward.count();

  console.log("DATABASE SUMMARY");
  console.log("----------------");
  console.log(`Counties:     ${countyCount}`);
  console.log(`SubCounties:  ${subCountyCount}`);
  console.log(`Wards:        ${wardCount}`);
  console.log("");

  // ----------------------------------------------------------
  // 2. Discover all formal SubCounty FKs
  // ----------------------------------------------------------

  const formalFks = await getFormalForeignKeys();

  console.log("FORMAL FOREIGN KEYS → SubCounty.id");
  console.log("----------------------------------");

  if (formalFks.length === 0) {
    console.log("WARNING: No formal foreign keys found.");
  } else {
    for (const fk of formalFks) {
      console.log(
        `${fk.tableName}.${fk.columnName} → SubCounty.id [${fk.onDelete}]`,
      );
    }
  }

  console.log("");
  console.log(`Formal FK count: ${formalFks.length}`);
  console.log("");

  // ----------------------------------------------------------
  // 3. Load all SubCounties
  // ----------------------------------------------------------

  const allSubCounties = await prisma.subCounty.findMany({
    include: {
      county: true,
      wards: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const candidates: Candidate[] = allSubCounties
    .filter((sc) => ORPHAN_IDS.includes(sc.id))
    .map((sc) => ({
      id: sc.id,
      name: sc.name,
      countyId: sc.countyId,
      countyName: sc.county?.name ?? "UNKNOWN",
    }));

  console.log("EXPECTED ORPHAN CANDIDATES");
  console.log("--------------------------");
  console.log(`Expected: ${ORPHAN_IDS.length}`);
  console.log(`Found:    ${candidates.length}`);
  console.log("");

  if (candidates.length !== ORPHAN_IDS.length) {
    const foundIds = new Set(candidates.map((c) => c.id));

    const missing = ORPHAN_IDS.filter((id) => !foundIds.has(id));

    console.log("WARNING — EXPECTED IDs NOT FOUND:");
    console.log(missing.join(", "));
    console.log("");
  }

  // ----------------------------------------------------------
  // 4. Audit candidates
  // ----------------------------------------------------------

  const results: CandidateResult[] = [];

  console.log("STARTING SECOND-LEVEL VALIDATION");
  console.log("================================");
  console.log("");

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    console.log(
      `[${i + 1}/${candidates.length}] ${candidate.id} ${candidate.name} — ${candidate.countyName}`,
    );

    const reasons: string[] = [];

    // --------------------------------------------------------
    // Ward references
    // --------------------------------------------------------

    const wards = await countTableRows(
      "Ward",
      "subCountyId",
      candidate.id,
    );

    // --------------------------------------------------------
    // Known application relationships
    // --------------------------------------------------------

    const farmers = await countTableRows(
      "Farmer",
      "subCountyId",
      candidate.id,
    );

    const farms = await countTableRows(
      "Farm",
      "subCountyId",
      candidate.id,
    );

    const businessPartners = await countTableRows(
      "BusinessPartner",
      "subCountyId",
      candidate.id,
    );

    const commoditySource = await countTableRows(
      "CommodityTransaction",
      "sourceSubCountyId",
      candidate.id,
    );

    const commodityDestination = await countTableRows(
      "CommodityTransaction",
      "destinationSubCountyId",
      candidate.id,
    );

    // --------------------------------------------------------
    // Formal FK references
    // --------------------------------------------------------

    let formalFkReferences = 0;

    for (const fk of formalFks) {
      const count = await countFormalFkReferences(
        fk.tableName,
        fk.columnName,
        candidate.id,
      );

      formalFkReferences += count;

      if (count > 0) {
        reasons.push(
          `FORMAL FK ${fk.tableName}.${fk.columnName} has ${count} reference(s)`,
        );
      }
    }

    // --------------------------------------------------------
    // Exact normalized duplicate search
    // --------------------------------------------------------

    const candidateNormalized = normalizeName(candidate.name);

    const exactNormalizedMatches = allSubCounties
      .filter(
        (sc) =>
          sc.id !== candidate.id &&
          sc.countyId === candidate.countyId &&
          normalizeName(sc.name) === candidateNormalized,
      )
      .map((sc) => ({
        id: sc.id,
        name: sc.name,
      }));

    // --------------------------------------------------------
    // Similar-name search
    // --------------------------------------------------------

    const candidateSimilarity = similarityKey(candidate.name);

    const similarNameMatches = allSubCounties
      .filter((sc) => {
        if (sc.id === candidate.id) {
          return false;
        }

        if (sc.countyId !== candidate.countyId) {
          return false;
        }

        const otherKey = similarityKey(sc.name);

        if (!candidateSimilarity || !otherKey) {
          return false;
        }

        return (
          candidateSimilarity === otherKey ||
          candidateSimilarity.includes(otherKey) ||
          otherKey.includes(candidateSimilarity)
        );
      })
      .map((sc) => ({
        id: sc.id,
        name: sc.name,
        wardCount: sc.wards.length,
      }));

    // --------------------------------------------------------
    // Classification logic
    // --------------------------------------------------------

    if (wards > 0) {
      reasons.push(`has ${wards} Ward reference(s)`);
    }

    if (farmers > 0) {
      reasons.push(`has ${farmers} Farmer reference(s)`);
    }

    if (farms > 0) {
      reasons.push(`has ${farms} Farm reference(s)`);
    }

    if (businessPartners > 0) {
      reasons.push(
        `has ${businessPartners} BusinessPartner reference(s)`,
      );
    }

    if (commoditySource > 0) {
      reasons.push(
        `has ${commoditySource} CommodityTransaction source reference(s)`,
      );
    }

    if (commodityDestination > 0) {
      reasons.push(
        `has ${commodityDestination} CommodityTransaction destination reference(s)`,
      );
    }

    if (exactNormalizedMatches.length > 0) {
      reasons.push(
        `exact normalized duplicate exists: ${exactNormalizedMatches
          .map((x) => `${x.id} ${x.name}`)
          .join(", ")}`,
      );
    }

    if (similarNameMatches.length > 0) {
      reasons.push(
        `similar administrative name exists: ${similarNameMatches
          .map((x) => `${x.id} ${x.name} (${x.wardCount} wards)`)
          .join(", ")}`,
      );
    }

    let classification: Classification;

    const hasDependencies =
      wards > 0 ||
      farmers > 0 ||
      farms > 0 ||
      businessPartners > 0 ||
      commoditySource > 0 ||
      commodityDestination > 0 ||
      formalFkReferences > 0;

    if (exactNormalizedMatches.length > 0) {
      classification = "DUPLICATE_OR_MERGE";
    } else if (hasDependencies) {
      classification = "REVIEW_KEEP";
    } else if (similarNameMatches.length > 0) {
      classification = "REVIEW_KEEP";
    } else {
      classification = "SAFE_DELETE";
    }

    if (reasons.length === 0) {
      reasons.push(
        "No application dependencies, no formal FK references, and no name match found",
      );
    }

    const result: CandidateResult = {
      id: candidate.id,
      name: candidate.name,
      countyId: candidate.countyId,
      countyName: candidate.countyName,

      wards,
      farmers,
      farms,
      businessPartners,
      commoditySource,
      commodityDestination,

      formalFkReferences,

      exactNormalizedMatches,
      similarNameMatches,

      classification,
      reasons,
    };

    results.push(result);

    console.log(
      `  → ${classification} | wards=${wards} | farmers=${farmers} | farms=${farms} | formalFK=${formalFkReferences}`,
    );

    if (exactNormalizedMatches.length > 0) {
      console.log(
        `  → DUPLICATE: ${exactNormalizedMatches
          .map((x) => `${x.id} ${x.name}`)
          .join(", ")}`,
      );
    }

    if (similarNameMatches.length > 0) {
      console.log(
        `  → SIMILAR: ${similarNameMatches
          .map((x) => `${x.id} ${x.name} (${x.wardCount} wards)`)
          .join(", ")}`,
      );
    }

    console.log("");
  }

  // ----------------------------------------------------------
  // 5. Classification summary
  // ----------------------------------------------------------

  const safeDelete = results.filter(
    (r) => r.classification === "SAFE_DELETE",
  );

  const duplicateMerge = results.filter(
    (r) => r.classification === "DUPLICATE_OR_MERGE",
  );

  const reviewKeep = results.filter(
    (r) => r.classification === "REVIEW_KEEP",
  );

  console.log("");
  console.log("============================================================");
  console.log(" SECOND-LEVEL CLASSIFICATION SUMMARY");
  console.log("============================================================");
  console.log("");

  console.log(`Total candidates:       ${results.length}`);
  console.log(`SAFE_DELETE:            ${safeDelete.length}`);
  console.log(`DUPLICATE_OR_MERGE:     ${duplicateMerge.length}`);
  console.log(`REVIEW_KEEP:            ${reviewKeep.length}`);
  console.log("");

  // ----------------------------------------------------------
  // 6. SAFE DELETE list
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log(" SAFE_DELETE CANDIDATES");
  console.log("============================================================");
  console.log("");

  if (safeDelete.length === 0) {
    console.log("None.");
  } else {
    for (const r of safeDelete) {
      console.log(
        `${r.id} | ${r.name} | County ${r.countyId} ${r.countyName}`,
      );
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 7. DUPLICATE / MERGE list
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log(" DUPLICATE / MERGE CANDIDATES");
  console.log("============================================================");
  console.log("");

  if (duplicateMerge.length === 0) {
    console.log("None.");
  } else {
    for (const r of duplicateMerge) {
      console.log(
        `${r.id} | ${r.name} | County ${r.countyId} ${r.countyName}`,
      );

      for (const match of r.exactNormalizedMatches) {
        console.log(
          `  MATCH → ${match.id} | ${match.name}`,
        );
      }
    }
  }

  console.log("");

  // ----------------------------------------------------------
  // 8. REVIEW / KEEP list
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log(" REVIEW / KEEP CANDIDATES");
  console.log("============================================================");
  console.log("");

  if (reviewKeep.length === 0) {
    console.log("None.");
  } else {
    for (const r of reviewKeep) {
      console.log(
        `${r.id} | ${r.name} | County ${r.countyId} ${r.countyName}`,
      );

      for (const reason of r.reasons) {
        console.log(`  - ${reason}`);
      }

      console.log("");
    }
  }

  // ----------------------------------------------------------
  // 9. Detailed dependency report
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log(" DETAILED DEPENDENCY REPORT");
  console.log("============================================================");
  console.log("");

  for (const r of results) {
    console.log(
      `${r.id} | ${r.name} | ${r.countyName} | ${r.classification}`,
    );

    console.log(
      `  Wards:                  ${r.wards}`,
    );

    console.log(
      `  Farmers:                ${r.farmers}`,
    );

    console.log(
      `  Farms:                  ${r.farms}`,
    );

    console.log(
      `  BusinessPartners:       ${r.businessPartners}`,
    );

    console.log(
      `  Commodity source:       ${r.commoditySource}`,
    );

    console.log(
      `  Commodity destination:  ${r.commodityDestination}`,
    );

    console.log(
      `  Formal FK references:   ${r.formalFkReferences}`,
    );

    if (r.exactNormalizedMatches.length > 0) {
      console.log("  Exact normalized matches:");

      for (const match of r.exactNormalizedMatches) {
        console.log(
          `    ${match.id} | ${match.name}`,
        );
      }
    }

    if (r.similarNameMatches.length > 0) {
      console.log("  Similar names:");

      for (const match of r.similarNameMatches) {
        console.log(
          `    ${match.id} | ${match.name} | wards=${match.wardCount}`,
        );
      }
    }

    console.log("");
  }

  // ----------------------------------------------------------
  // 10. Special verification of known duplicate 1016
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log(" SPECIAL KITUI DUPLICATE CHECK");
  console.log("============================================================");
  console.log("");

  const kitui345 = allSubCounties.find(
    (sc) => sc.id === 345,
  );

  const kitui1016 = allSubCounties.find(
    (sc) => sc.id === 1016,
  );

  if (kitui345) {
    console.log(
      `345 → ${kitui345.name} | County ${kitui345.countyId} | wards=${kitui345.wards.length}`,
    );
  } else {
    console.log("WARNING: SubCounty 345 not found.");
  }

  if (kitui1016) {
    console.log(
      `1016 → ${kitui1016.name} | County ${kitui1016.countyId} | wards=${kitui1016.wards.length}`,
    );
  } else {
    console.log("1016 is absent.");
  }

  console.log("");

  // ----------------------------------------------------------
  // 11. Final safety checks
  // ----------------------------------------------------------

  console.log("============================================================");
  console.log(" FINAL SAFETY CHECK");
  console.log("============================================================");
  console.log("");

  const totalWardReferences = results.reduce(
    (sum, r) => sum + r.wards,
    0,
  );

  const totalFarmerReferences = results.reduce(
    (sum, r) => sum + r.farmers,
    0,
  );

  const totalFarmReferences = results.reduce(
    (sum, r) => sum + r.farms,
    0,
  );

  const totalBusinessReferences = results.reduce(
    (sum, r) => sum + r.businessPartners,
    0,
  );

  const totalCommodityReferences = results.reduce(
    (sum, r) =>
      sum + r.commoditySource + r.commodityDestination,
    0,
  );

  const totalFormalFkReferences = results.reduce(
    (sum, r) => sum + r.formalFkReferences,
    0,
  );

  console.log(
    `Total Ward references across candidates:             ${totalWardReferences}`,
  );

  console.log(
    `Total Farmer references across candidates:           ${totalFarmerReferences}`,
  );

  console.log(
    `Total Farm references across candidates:             ${totalFarmReferences}`,
  );

  console.log(
    `Total BusinessPartner references across candidates:  ${totalBusinessReferences}`,
  );

  console.log(
    `Total CommodityTransaction references:               ${totalCommodityReferences}`,
  );

  console.log(
    `Total formal FK references:                           ${totalFormalFkReferences}`,
  );

  console.log("");

  if (
    totalWardReferences === 0 &&
    totalFarmerReferences === 0 &&
    totalFarmReferences === 0 &&
    totalBusinessReferences === 0 &&
    totalCommodityReferences === 0 &&
    totalFormalFkReferences === 0
  ) {
    console.log(
      "DEPENDENCY SAFETY: PASS — all candidates have zero references.",
    );
  } else {
    console.log(
      "DEPENDENCY SAFETY: REVIEW REQUIRED — references exist.",
    );
  }

  console.log("");

  console.log("============================================================");
  console.log(" AUDIT COMPLETE");
  console.log("============================================================");
  console.log("");
  console.log("DATABASE CHANGES: 0");
  console.log("INSERT: 0");
  console.log("UPDATE: 0");
  console.log("DELETE: 0");
  console.log("SCHEMA CHANGES: 0");
  console.log("");

  console.log(
    "IMPORTANT: This script only classifies records.",
  );

  console.log(
    "NO SubCounty has been deleted or modified.",
  );

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("SECOND-LEVEL AUDIT FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });