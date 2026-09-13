import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import subcounties from "../prisma/data/subcounties.json";

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

type SourceSubCounty = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

/*
 * ============================================================
 * VERIFIED SUBCOUNTY FALLBACKS
 * ============================================================
 */

const VERIFIED_SUBCOUNTY_FALLBACKS: Record<string, string> = {
  "migori::awendo": "Awendo",
  "migori::nyatike": "Nyatike",
  "migori::kuria west": "Kuria West",
  "migori::suna west": "Suna West",

  "machakos::athi river": "Mavoko",
  "machakos::machakos": "Machakos Town",
  "machakos::mwala": "Mwala",

  "homa bay::ndhiwa": "Ndhiwa",
  "homa bay::karachuonyo": "Karachuonyo",

  "bungoma::cheptais": "Mt Elgon",
  "bungoma::tongaren": "Tongaren",

  "kakamega::malava": "Malava",
  "kakamega::navakholo": "Navakholo",
  "kakamega::mumias east": "Mumias East",

  "taita taveta::taveta": "Taveta",
  "taita taveta::mwatate": "Mwatate",
  "taita taveta::voi": "Voi",

  "lamu::lamu west": "Lamu West",

  "meru::imenti central": "Imenti Central",

  "west pokot::pokot north": "Pokot North",
  "west pokot::pokot central": "Pokot Central",

  "nyandarua::olkalou": "Ol Kalou",

  "nyeri::nyeri central": "Nyeri Town",

  "kirinyaga::kirinyaga east": "Gichugu",

  "muranga::kiharu": "Kiharu",
  "muranga::muranga south": "Kandara",
  "muranga::gatanga": "Gatanga",
  "muranga::kangema": "Kangema",

  "samburu::samburu central": "Samburu East",

  "kiambu::kiambu town": "Kiambu",

  "kwale::lunga lunga": "Lunga Lunga",

  "nakuru::nakuru east": "Nakuru Town East",

  "nyamira::manga": "Kitutu Masaba North",

  "narok::transmara east": "Trans Mara East",

  "baringo::marigat": "Baringo South",

  "kajiado::loitokitok": "Kajiado South",

  "tharaka nithi::tharaka south": "Tharaka",
};

/*
 * ============================================================
 * COUNTY + SUBCOUNTY RULES
 * ============================================================
 */

const COUNTY_SUBCOUNTY_RULES: Record<string, string> = {
  "isiolo::isiolo": "Isiolo North",
  "mandera::mandera north": "Mandera North",
  "kericho::belgut": "Ainamoi",
};

/*
 * ============================================================
 * NORMALIZATION
 * ============================================================
 *
 * IMPORTANT:
 *
 * "Kajiado North Sub County"
 * becomes
 * "kajiado north"
 *
 * This is the critical correction missing from the previous audit.
 */

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[-_]/g, " ")
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCounty(value: string): string {
  return normalize(value)
    .replace(/\bcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSubCounty(value: string): string {
  return normalize(value)
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * ============================================================
 * RESOLVE TARGET NAME
 * ============================================================
 */

function resolveTargetName(
  countyName: string,
  sourceName: string,
): {
  targetName: string;
  method: string;
} {
  const countyKey = normalizeCounty(countyName);
  const subCountyKey = normalizeSubCounty(sourceName);

  const key = `${countyKey}::${subCountyKey}`;

  if (VERIFIED_SUBCOUNTY_FALLBACKS[key]) {
    return {
      targetName: VERIFIED_SUBCOUNTY_FALLBACKS[key],
      method: "VERIFIED_FALLBACK",
    };
  }

  if (COUNTY_SUBCOUNTY_RULES[key]) {
    return {
      targetName: COUNTY_SUBCOUNTY_RULES[key],
      method: "COUNTY_RULE",
    };
  }

  return {
    targetName: sourceName,
    method: "NORMALIZED_NAME",
  };
}

/*
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main() {
  console.log("");
  console.log("======================================================");
  console.log("GLOBAL SUBCOUNTY CONSOLIDATION PREFLIGHT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("======================================================");
  console.log("");

  /*
   * ----------------------------------------------------------
   * 1. AUTHORITATIVE SOURCE
   * ----------------------------------------------------------
   */

  const authoritative = subcounties as SourceSubCounty[];

  console.log(
    `Authoritative subcounties.json records: ${authoritative.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 2. DATABASE SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const dbSubCounties = await prisma.subCounty.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,

      county: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },

      _count: {
        select: {
          wards: true,
          farms: true,
          farmers: true,
          businessPartners: true,
          destinationTransactions: true,
          sourceTransactions: true,
        },
      },
    },
  });

  console.log(
    `Database SubCounties: ${dbSubCounties.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 3. BUILD AUTHORITATIVE TARGETS
   * ----------------------------------------------------------
   */

  const authoritativeTargets = new Map<
    string,
    {
      id: number;
      name: string;
      countyId: number;
      countyName: string;
    }
  >();

  for (const source of authoritative) {
    const county = await prisma.county.findUnique({
      where: {
        code: source.countyCode,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!county) {
      throw new Error(
        `County code ${source.countyCode} not found for SubCounty "${source.name}".`,
      );
    }

    const resolved = resolveTargetName(
      county.name,
      source.name,
    );

    const target = dbSubCounties.find(
      (sc) =>
        sc.countyId === county.id &&
        normalizeSubCounty(sc.name) ===
          normalizeSubCounty(resolved.targetName),
    );

    if (!target) {
      console.warn(
        `WARNING: authoritative target not found in DB: ${county.name} → ${resolved.targetName}`,
      );

      continue;
    }

    const key =
      `${county.id}::${normalizeSubCounty(resolved.targetName)}`;

    authoritativeTargets.set(key, {
      id: target.id,
      name: target.name,
      countyId: county.id,
      countyName: county.name,
    });
  }

  /*
   * ----------------------------------------------------------
   * 4. CLASSIFY POPULATED RECORDS
   * ----------------------------------------------------------
   */

  const consolidationRows: Array<{
    legacyId: number;
    legacyName: string;

    targetId: number;
    targetName: string;

    countyId: number;
    countyName: string;

    method: string;

    wards: number;
    farmers: number;
    farms: number;
    businessPartners: number;
    destinationTransactions: number;
    sourceTransactions: number;
  }> = [];

  const alreadyCanonical: typeof dbSubCounties = [];
  const unmatched: typeof dbSubCounties = [];

  for (const sc of dbSubCounties) {
    const populated =
      sc._count.wards > 0 ||
      sc._count.farmers > 0 ||
      sc._count.farms > 0 ||
      sc._count.businessPartners > 0 ||
      sc._count.destinationTransactions > 0 ||
      sc._count.sourceTransactions > 0;

    if (!populated) {
      continue;
    }

    /*
     * First determine whether this record itself is
     * one of the authoritative targets.
     */

    const exactKey =
      `${sc.countyId}::${normalizeSubCounty(sc.name)}`;

    if (authoritativeTargets.has(exactKey)) {
      alreadyCanonical.push(sc);
      continue;
    }

    /*
     * Resolve its intended canonical target.
     */

    const resolved = resolveTargetName(
      sc.county.name,
      sc.name,
    );

    const targetKey =
      `${sc.countyId}::${normalizeSubCounty(resolved.targetName)}`;

    const targetInfo =
      authoritativeTargets.get(targetKey);

    if (!targetInfo) {
      unmatched.push(sc);
      continue;
    }

    if (targetInfo.id === sc.id) {
      alreadyCanonical.push(sc);
      continue;
    }

    consolidationRows.push({
      legacyId: sc.id,
      legacyName: sc.name,

      targetId: targetInfo.id,
      targetName: targetInfo.name,

      countyId: sc.countyId,
      countyName: sc.county.name,

      method: resolved.method,

      wards: sc._count.wards,
      farmers: sc._count.farmers,
      farms: sc._count.farms,
      businessPartners:
        sc._count.businessPartners,
      destinationTransactions:
        sc._count.destinationTransactions,
      sourceTransactions:
        sc._count.sourceTransactions,
    });
  }

  /*
   * ----------------------------------------------------------
   * 5. SUMMARY
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");
  console.log("CONSOLIDATION PREFLIGHT SUMMARY");
  console.log("======================================================");
  console.log("");

  console.log(
    `Populated SubCounties:                 ${
      consolidationRows.length +
      alreadyCanonical.length +
      unmatched.length
    }`,
  );

  console.log(
    `Records requiring consolidation:       ${consolidationRows.length}`,
  );

  console.log(
    `Already canonical/populated:            ${alreadyCanonical.length}`,
  );

  console.log(
    `Unmatched populated SubCounties:       ${unmatched.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 6. RELATION TOTALS
   * ----------------------------------------------------------
   */

  const wardTotal = consolidationRows.reduce(
    (sum, row) => sum + row.wards,
    0,
  );

  const farmerTotal = consolidationRows.reduce(
    (sum, row) => sum + row.farmers,
    0,
  );

  const farmTotal = consolidationRows.reduce(
    (sum, row) => sum + row.farms,
    0,
  );

  const businessPartnerTotal =
    consolidationRows.reduce(
      (sum, row) =>
        sum + row.businessPartners,
      0,
    );

  const destinationTransactionTotal =
    consolidationRows.reduce(
      (sum, row) =>
        sum + row.destinationTransactions,
      0,
    );

  const sourceTransactionTotal =
    consolidationRows.reduce(
      (sum, row) =>
        sum + row.sourceTransactions,
      0,
    );

  console.log("");
  console.log("RELATIONS REQUIRING MIGRATION");
  console.log("----------------------------------------------");
  console.log(`Wards:                  ${wardTotal}`);
  console.log(`Farmers:                ${farmerTotal}`);
  console.log(`Farms:                  ${farmTotal}`);
  console.log(
    `Business Partners:      ${businessPartnerTotal}`,
  );
  console.log(
    `Destination Tx:         ${destinationTransactionTotal}`,
  );
  console.log(
    `Source Tx:              ${sourceTransactionTotal}`,
  );

  /*
   * ----------------------------------------------------------
   * 7. SPECIAL RELATIONS
   * ----------------------------------------------------------
   */

  const specialRelations =
    consolidationRows.filter(
      (row) =>
        row.businessPartners > 0 ||
        row.destinationTransactions > 0 ||
        row.sourceTransactions > 0,
    );

  console.log("");
  console.log("======================================================");
  console.log("SPECIAL RELATION WARNINGS");
  console.log("======================================================");
  console.log("");

  if (specialRelations.length === 0) {
    console.log(
      "No BusinessPartner or transaction references found.",
    );
  } else {
    for (const row of specialRelations) {
      console.log("----------------------------------------------");

      console.log(
        `${row.legacyId} ${row.legacyName} → ${row.targetId} ${row.targetName}`,
      );

      console.log(
        `BusinessPartners: ${row.businessPartners}`,
      );

      console.log(
        `Destination Tx:   ${row.destinationTransactions}`,
      );

      console.log(
        `Source Tx:        ${row.sourceTransactions}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 8. FARMER / FARM WARNINGS
   * ----------------------------------------------------------
   */

  const farmerFarmRows =
    consolidationRows.filter(
      (row) =>
        row.farmers > 0 ||
        row.farms > 0,
    );

  console.log("");
  console.log("======================================================");
  console.log("FARM / FARMER RELATION WARNINGS");
  console.log("======================================================");
  console.log("");

  if (farmerFarmRows.length === 0) {
    console.log(
      "No Farms or Farmers require migration.",
    );
  } else {
    for (const row of farmerFarmRows) {
      console.log("----------------------------------------------");

      console.log(
        `${row.legacyId} ${row.legacyName} → ${row.targetId} ${row.targetName}`,
      );

      console.log(`Wards:   ${row.wards}`);
      console.log(`Farmers: ${row.farmers}`);
      console.log(`Farms:   ${row.farms}`);
    }
  }

  /*
   * ----------------------------------------------------------
   * 9. FULL PLAN
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");
  console.log("FULL CONSOLIDATION PLAN");
  console.log("======================================================");
  console.log("");

  if (consolidationRows.length === 0) {
    console.log("No consolidation records found.");
  } else {
    for (const row of consolidationRows) {
      console.log(
        `${row.legacyId} ${row.legacyName} → ` +
        `${row.targetId} ${row.targetName} | ` +
        `county=${row.countyName} | ` +
        `wards=${row.wards} | ` +
        `farmers=${row.farmers} | ` +
        `farms=${row.farms} | ` +
        `BP=${row.businessPartners} | ` +
        `destTx=${row.destinationTransactions} | ` +
        `srcTx=${row.sourceTransactions} | ` +
        `method=${row.method}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 10. TARGET COLLISIONS
   * ----------------------------------------------------------
   */

  const targetGroups =
    new Map<number, typeof consolidationRows>();

  for (const row of consolidationRows) {
    const group =
      targetGroups.get(row.targetId) ?? [];

    group.push(row);

    targetGroups.set(
      row.targetId,
      group,
    );
  }

  const targetCollisions =
    Array.from(targetGroups.entries())
      .filter(
        ([, group]) =>
          group.length > 1,
      );

  console.log("");
  console.log("======================================================");
  console.log("TARGET COLLISION CHECK");
  console.log("======================================================");
  console.log("");

  if (targetCollisions.length === 0) {
    console.log("No target collisions.");
  } else {
    for (const [
      targetId,
      group,
    ] of targetCollisions) {
      console.log(
        `Target ${targetId} receives ${group.length} legacy records:`,
      );

      for (const row of group) {
        console.log(
          `  ${row.legacyId} ${row.legacyName} | wards=${row.wards}`,
        );
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * 11. COUNTY CONSISTENCY
   * ----------------------------------------------------------
   */

  const countyMismatches =
    consolidationRows.filter(
      (row) => {
        const target =
          dbSubCounties.find(
            (sc) =>
              sc.id === row.targetId,
          );

        return (
          !target ||
          target.countyId !==
            row.countyId
        );
      },
    );

  console.log("");
  console.log("======================================================");
  console.log("COUNTY CONSISTENCY CHECK");
  console.log("======================================================");
  console.log("");

  if (countyMismatches.length === 0) {
    console.log(
      "All legacy → target pairs remain in the same county.",
    );
  } else {
    for (const row of countyMismatches) {
      console.log(
        `COUNTY MISMATCH: ${row.legacyId} → ${row.targetId}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 12. UNMATCHED RECORDS
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");
  console.log("UNMATCHED POPULATED SUBCOUNTIES");
  console.log("======================================================");
  console.log("");

  if (unmatched.length === 0) {
    console.log("None.");
  } else {
    for (const sc of unmatched) {
      console.log(
        `${sc.id} ${sc.name} | county=${sc.county.name} (${sc.countyId}) | ` +
        `wards=${sc._count.wards} | ` +
        `farmers=${sc._count.farmers} | ` +
        `farms=${sc._count.farms} | ` +
        `BP=${sc._count.businessPartners} | ` +
        `destTx=${sc._count.destinationTransactions} | ` +
        `srcTx=${sc._count.sourceTransactions}`,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * 13. METHOD SUMMARY
   * ----------------------------------------------------------
   */

  const methodCounts =
    new Map<string, number>();

  for (const row of consolidationRows) {
    methodCounts.set(
      row.method,
      (methodCounts.get(row.method) ?? 0) + 1,
    );
  }

  console.log("");
  console.log("======================================================");
  console.log("MATCH METHOD SUMMARY");
  console.log("======================================================");
  console.log("");

  for (const [
    method,
    count,
  ] of methodCounts.entries()) {
    console.log(
      `${method}: ${count}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 14. FINAL RESULT
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("======================================================");
  console.log("FINAL PREFLIGHT RESULT");
  console.log("======================================================");
  console.log("");

  const passed =
    unmatched.length === 0 &&
    specialRelations.length === 0 &&
    targetCollisions.length === 0 &&
    countyMismatches.length === 0;

  if (passed) {
    console.log("PASS");
    console.log("");
    console.log(
      "Every populated legacy SubCounty has a verified target.",
    );
    console.log(
      "No BusinessPartner or transaction references require special handling.",
    );
    console.log(
      "No target collisions detected.",
    );
    console.log(
      "No county mismatches detected.",
    );
  } else {
    console.log("REVIEW REQUIRED");
    console.log("");

    if (unmatched.length > 0) {
      console.log(
        `Unmatched populated SubCounties: ${unmatched.length}`,
      );
    }

    if (specialRelations.length > 0) {
      console.log(
        `Records with BusinessPartner/transaction relations: ${specialRelations.length}`,
      );
    }

    if (targetCollisions.length > 0) {
      console.log(
        `Target collisions: ${targetCollisions.length}`,
      );
    }

    if (countyMismatches.length > 0) {
      console.log(
        `County mismatches: ${countyMismatches.length}`,
      );
    }

    console.log("");
    console.log(
      "DO NOT RUN MIGRATION YET.",
    );
  }

  console.log("");
  console.log("======================================================");
  console.log("READ-ONLY AUDIT COMPLETE");
  console.log("NO DATABASE CHANGES");
  console.log("======================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });