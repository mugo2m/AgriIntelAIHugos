import "dotenv/config";
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

async function main() {
  console.log("============================================================================");
  console.log("SUBCOUNTY / WARD HIERARCHY INTEGRITY AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================================");
  console.log("");

  // --------------------------------------------------------------------------
  // DATABASE COUNTS
  // --------------------------------------------------------------------------

  const countyCount = await prisma.county.count();
  const subCountyCount = await prisma.subCounty.count();
  const constituencyCount = await prisma.constituency.count();
  const wardCount = await prisma.ward.count();

  console.log("DATABASE COUNTS");
  console.log("----------------------------------------------------------------------------");
  console.log(`Counties:         ${countyCount}`);
  console.log(`SubCounties:      ${subCountyCount}`);
  console.log(`Constituencies:   ${constituencyCount}`);
  console.log(`Wards:            ${wardCount}`);
  console.log("");

  // --------------------------------------------------------------------------
  // LOAD WARDS
  // --------------------------------------------------------------------------

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      constituencyId: true,
      subCountyId: true,

      county: {
        select: {
          id: true,
          name: true,
        },
      },

      constituency: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },

      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  // --------------------------------------------------------------------------
  // PROBLEM COLLECTIONS
  // --------------------------------------------------------------------------

  const missingSubCounty: typeof wards = [];
  const missingConstituency: typeof wards = [];
  const subCountyCountyMismatch: typeof wards = [];
  const constituencyCountyMismatch: typeof wards = [];
  const subCountyConstituencyCountyMismatch: typeof wards = [];

  // --------------------------------------------------------------------------
  // CHECK EACH WARD
  // --------------------------------------------------------------------------

  for (const ward of wards) {
    // Ward must have a SubCounty
    if (!ward.subCountyId || !ward.subCounty) {
      missingSubCounty.push(ward);
    }

    // Ward must have a Constituency
    if (!ward.constituencyId || !ward.constituency) {
      missingConstituency.push(ward);
    }

    // Ward County must equal SubCounty County
    if (
      ward.subCounty &&
      ward.subCounty.countyId !== ward.countyId
    ) {
      subCountyCountyMismatch.push(ward);
    }

    // Ward County must equal Constituency County
    if (
      ward.constituency &&
      ward.constituency.countyId !== ward.countyId
    ) {
      constituencyCountyMismatch.push(ward);
    }

    // SubCounty County must equal Constituency County
    if (
      ward.subCounty &&
      ward.constituency &&
      ward.subCounty.countyId !== ward.constituency.countyId
    ) {
      subCountyConstituencyCountyMismatch.push(ward);
    }
  }

  // --------------------------------------------------------------------------
  // RESULTS
  // --------------------------------------------------------------------------

  console.log("WARD HIERARCHY RESULTS");
  console.log("----------------------------------------------------------------------------");
  console.log(`Wards examined:                         ${wards.length}`);
  console.log(`Missing SubCounty:                      ${missingSubCounty.length}`);
  console.log(`Missing Constituency:                   ${missingConstituency.length}`);
  console.log(
    `SubCounty → County mismatch:            ${subCountyCountyMismatch.length}`
  );
  console.log(
    `Constituency → County mismatch:         ${constituencyCountyMismatch.length}`
  );
  console.log(
    `SubCounty ↔ Constituency mismatch:      ${subCountyConstituencyCountyMismatch.length}`
  );
  console.log("");

  // --------------------------------------------------------------------------
  // DETAILED PROBLEMS
  // --------------------------------------------------------------------------

  const totalProblems =
    missingSubCounty.length +
    missingConstituency.length +
    subCountyCountyMismatch.length +
    constituencyCountyMismatch.length +
    subCountyConstituencyCountyMismatch.length;

  if (totalProblems === 0) {
    console.log("============================================================================");
    console.log("RESULT: PASS");
    console.log("============================================================================");
    console.log("");
    console.log(
      `All ${wards.length} wards have valid County → Constituency → SubCounty relationships.`
    );
    console.log("No hierarchy integrity problems detected.");
  } else {
    console.log("============================================================================");
    console.log(`RESULT: ${totalProblems} PROBLEM(S) DETECTED`);
    console.log("============================================================================");
    console.log("");

    if (missingSubCounty.length > 0) {
      console.log("MISSING SUBCOUNTY");
      console.log("----------------------------------------------------------------------------");

      for (const ward of missingSubCounty) {
        console.log(
          `Ward ${ward.id} - ${ward.name} | ` +
          `County=${ward.countyId} ${ward.county?.name ?? "UNKNOWN"} | ` +
          `subCountyId=${ward.subCountyId}`
        );
      }

      console.log("");
    }

    if (missingConstituency.length > 0) {
      console.log("MISSING CONSTITUENCY");
      console.log("----------------------------------------------------------------------------");

      for (const ward of missingConstituency) {
        console.log(
          `Ward ${ward.id} - ${ward.name} | ` +
          `County=${ward.countyId} ${ward.county?.name ?? "UNKNOWN"} | ` +
          `constituencyId=${ward.constituencyId}`
        );
      }

      console.log("");
    }

    if (subCountyCountyMismatch.length > 0) {
      console.log("SUBCOUNTY → COUNTY MISMATCH");
      console.log("----------------------------------------------------------------------------");

      for (const ward of subCountyCountyMismatch) {
        console.log(
          `Ward ${ward.id} - ${ward.name} | ` +
          `Ward County=${ward.countyId} ${ward.county?.name ?? "UNKNOWN"} | ` +
          `SubCounty=${ward.subCounty?.id ?? "NULL"} ` +
          `${ward.subCounty?.name ?? "UNKNOWN"} | ` +
          `SubCounty County=${ward.subCounty?.countyId ?? "NULL"}`
        );
      }

      console.log("");
    }

    if (constituencyCountyMismatch.length > 0) {
      console.log("CONSTITUENCY → COUNTY MISMATCH");
      console.log("----------------------------------------------------------------------------");

      for (const ward of constituencyCountyMismatch) {
        console.log(
          `Ward ${ward.id} - ${ward.name} | ` +
          `Ward County=${ward.countyId} ${ward.county?.name ?? "UNKNOWN"} | ` +
          `Constituency=${ward.constituency?.id ?? "NULL"} ` +
          `${ward.constituency?.name ?? "UNKNOWN"} | ` +
          `Constituency County=${ward.constituency?.countyId ?? "NULL"}`
        );
      }

      console.log("");
    }

    if (subCountyConstituencyCountyMismatch.length > 0) {
      console.log("SUBCOUNTY ↔ CONSTITUENCY COUNTY MISMATCH");
      console.log("----------------------------------------------------------------------------");

      for (const ward of subCountyConstituencyCountyMismatch) {
        console.log(
          `Ward ${ward.id} - ${ward.name} | ` +
          `SubCounty County=${ward.subCounty?.countyId ?? "NULL"} | ` +
          `Constituency County=${ward.constituency?.countyId ?? "NULL"}`
        );
      }

      console.log("");
    }
  }

  console.log("============================================================================");
  console.log("READ-ONLY AUDIT COMPLETE");
  console.log("NO DATABASE CHANGES WERE MADE");
  console.log("============================================================================");
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