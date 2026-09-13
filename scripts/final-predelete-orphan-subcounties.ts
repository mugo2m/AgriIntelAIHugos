
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

/**
 * FINAL PRE-DELETE DEPENDENCY VERIFICATION
 *
 * READ-ONLY.
 *
 * Verifies the 101 authoritative SAFE_DELETE_CANDIDATE
 * SubCounty records before any deletion is attempted.
 *
 * NO DATABASE CHANGES ARE PERFORMED.
 *
 * A candidate is BLOCKED if it has ANY:
 *   - wards
 *   - farmers
 *   - farms
 *   - business partners
 *   - commodity source references
 *   - commodity destination references
 */

const CANDIDATE_IDS = [
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

type VerificationResult = {
  id: number;
  name: string;
  countyId: number | null;
  countyName: string | null;

  wards: number;
  farmers: number;
  farms: number;
  businessPartners: number;
  sourceTransactions: number;
  destinationTransactions: number;

  status: "SAFE" | "BLOCKED" | "MISSING";
};

async function main() {
  console.log("==============================================");
  console.log("FINAL PRE-DELETE DEPENDENCY VERIFICATION");
  console.log("==============================================");
  console.log("");
  console.log("READ-ONLY: NO DATABASE CHANGES");
  console.log(`Candidates: ${CANDIDATE_IDS.length}`);
  console.log("");

  const results: VerificationResult[] = [];

  for (const id of CANDIDATE_IDS) {
    const subCounty = await prisma.subCounty.findUnique({
      where: {
        id,
      },

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

        _count: {
          select: {
            wards: true,
            farmers: true,
            farms: true,
            businessPartners: true,
            sourceTransactions: true,
            destinationTransactions: true,
          },
        },
      },
    });

    if (!subCounty) {
      results.push({
        id,
        name: "",
        countyId: null,
        countyName: null,

        wards: 0,
        farmers: 0,
        farms: 0,
        businessPartners: 0,
        sourceTransactions: 0,
        destinationTransactions: 0,

        status: "MISSING",
      });

      continue;
    }

    const counts = subCounty._count;

    const hasDependencies =
      counts.wards > 0 ||
      counts.farmers > 0 ||
      counts.farms > 0 ||
      counts.businessPartners > 0 ||
      counts.sourceTransactions > 0 ||
      counts.destinationTransactions > 0;

    results.push({
      id: subCounty.id,
      name: subCounty.name,
      countyId: subCounty.countyId,
      countyName: subCounty.county?.name ?? null,

      wards: counts.wards,
      farmers: counts.farmers,
      farms: counts.farms,
      businessPartners: counts.businessPartners,
      sourceTransactions: counts.sourceTransactions,
      destinationTransactions: counts.destinationTransactions,

      status: hasDependencies ? "BLOCKED" : "SAFE",
    });
  }

  console.log("----------------------------------------------");
  console.log("INDIVIDUAL RESULTS");
  console.log("----------------------------------------------");

  for (const result of results) {
    console.log(
      `${result.status.padEnd(7)} | ` +
        `${String(result.id).padStart(4)} | ` +
        `${result.name || "[MISSING]"} | ` +
        `${result.countyName ?? "[NO COUNTY]"} | ` +
        `wards=${result.wards}, ` +
        `farmers=${result.farmers}, ` +
        `farms=${result.farms}, ` +
        `partners=${result.businessPartners}, ` +
        `source=${result.sourceTransactions}, ` +
        `destination=${result.destinationTransactions}`
    );
  }

  const safe = results.filter(
    (result) => result.status === "SAFE"
  );

  const blocked = results.filter(
    (result) => result.status === "BLOCKED"
  );

  const missing = results.filter(
    (result) => result.status === "MISSING"
  );

  console.log("");
  console.log("==============================================");
  console.log("FINAL SUMMARY");
  console.log("==============================================");
  console.log(`Candidates checked : ${results.length}`);
  console.log(`SAFE               : ${safe.length}`);
  console.log(`BLOCKED            : ${blocked.length}`);
  console.log(`MISSING            : ${missing.length}`);
  console.log("");

  if (blocked.length === 0 && missing.length === 0) {
    console.log(
      "PASS: ALL 101 CANDIDATES HAVE ZERO DATABASE DEPENDENCIES."
    );

    console.log("");

    console.log(
      "The 101 candidates pass the final dependency safety gate."
    );

    console.log(
      "No database changes were made."
    );
  } else {
    console.log(
      "FAIL: DELETE MUST NOT PROCEED."
    );

    console.log("");

    if (blocked.length > 0) {
      console.log("BLOCKED RECORDS:");
      console.log("");

      for (const result of blocked) {
        console.log(
          `  ${result.id} ${result.name} ` +
            `(${result.countyName ?? "NO COUNTY"})`
        );

        console.log(
          `      wards=${result.wards}, ` +
            `farmers=${result.farmers}, ` +
            `farms=${result.farms}, ` +
            `partners=${result.businessPartners}, ` +
            `source=${result.sourceTransactions}, ` +
            `destination=${result.destinationTransactions}`
        );
      }
    }

    if (missing.length > 0) {
      console.log("");
      console.log("MISSING RECORDS:");
      console.log("");

      for (const result of missing) {
        console.log(`  ${result.id}`);
      }
    }
  }

  console.log("");
  console.log("==============================================");
  console.log("EXPECTED POST-CLEANUP COUNTS");
  console.log("==============================================");
  console.log("Counties    : 47");
  console.log("SubCounties : 302");
  console.log("Wards       : 1450");
  console.log("");

  console.log(
    "Duplicate 1016 is NOT included in these 101 candidates."
  );

  console.log(
    "Duplicate 1016 will be handled separately after this safety gate."
  );

  console.log("");
  console.log("==============================================");
  console.log("DATABASE CHANGES");
  console.log("==============================================");
  console.log("Created      : 0");
  console.log("Updated      : 0");
  console.log("Deleted      : 0");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "FINAL PRE-DELETE VERIFICATION FAILED:"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

