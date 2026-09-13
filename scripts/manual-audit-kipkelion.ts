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

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/sub[-\s]*county/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  console.log("============================================================================");
  console.log("MANUAL READ-ONLY AUDIT — KERICHO / KIPKELION");
  console.log("============================================================================");
  console.log("TARGET: SubCounty 790 - Kipkelion");
  console.log("NO DATABASE CHANGES");
  console.log("============================================================================");
  console.log("");

  // --------------------------------------------------------------------------
  // 1. TARGET EMPTY SUBCOUNTY
  // --------------------------------------------------------------------------

  const target = await prisma.subCounty.findUnique({
    where: {
      id: 790,
    },
    include: {
      county: true,
      wards: {
        include: {
          constituency: true,
        },
        orderBy: {
          id: "asc",
        },
      },
      farmers: true,
      farms: true,
      businessPartners: true,
    },
  });

  if (!target) {
    console.log("ERROR: SubCounty 790 was not found.");
    return;
  }

  console.log("1. TARGET SUBCOUNTY");
  console.log("----------------------------------------------------------------------------");
  console.log(`ID:                ${target.id}`);
  console.log(`Name:              ${target.name}`);
  console.log(`Normalized name:   ${normalizeName(target.name)}`);
  console.log(`County ID:         ${target.countyId}`);
  console.log(`County:            ${target.county.name}`);
  console.log(`Wards:             ${target.wards.length}`);
  console.log(`Farmers:           ${target.farmers.length}`);
  console.log(`Farms:             ${target.farms.length}`);
  console.log(`Business Partners: ${target.businessPartners.length}`);
  console.log("");

  // --------------------------------------------------------------------------
  // 2. KERICHO COUNTY CONSTITUENCIES
  // --------------------------------------------------------------------------

  const constituencies = await prisma.constituency.findMany({
    where: {
      countyId: 56,
    },
    include: {
      wards: {
        include: {
          subCounty: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("2. KERICHO CONSTITUENCIES");
  console.log("----------------------------------------------------------------------------");

  for (const constituency of constituencies) {
    console.log("");
    console.log(
      `${constituency.id} - ${constituency.name} | wards=${constituency.wards.length}`
    );

    for (const ward of constituency.wards) {
      console.log(
        `  Ward ${ward.id}: ${ward.name} | ` +
        `SubCounty=${ward.subCountyId ?? "NULL"} ` +
        `${ward.subCounty?.name ?? "NULL"}`
      );
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // 3. ALL KERICHO SUBCOUNTIES
  // --------------------------------------------------------------------------

  const subCounties = await prisma.subCounty.findMany({
    where: {
      countyId: 56,
    },
    include: {
      wards: {
        include: {
          constituency: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("3. ALL KERICHO SUBCOUNTIES");
  console.log("----------------------------------------------------------------------------");

  for (const subCounty of subCounties) {
    console.log(
      `${subCounty.id} - ${subCounty.name} | ` +
      `normalized=${normalizeName(subCounty.name)} | ` +
      `wards=${subCounty.wards.length}`
    );

    if (subCounty.wards.length > 0) {
      for (const ward of subCounty.wards) {
        console.log(
          `  Ward ${ward.id}: ${ward.name} | ` +
          `Constituency=${ward.constituencyId} ${ward.constituency.name}`
        );
      }
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // 4. SPECIFIC KIPKELION CANDIDATES
  // --------------------------------------------------------------------------

  const candidateIds = [472, 491];

  console.log("4. KIPKELION DIRECTIONAL CANDIDATES");
  console.log("----------------------------------------------------------------------------");

  for (const id of candidateIds) {
    const candidate = await prisma.subCounty.findUnique({
      where: {
        id,
      },
      include: {
        county: true,
        wards: {
          include: {
            constituency: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!candidate) {
      console.log(`SubCounty ${id}: NOT FOUND`);
      continue;
    }

    console.log("");
    console.log(`ID:              ${candidate.id}`);
    console.log(`Name:            ${candidate.name}`);
    console.log(`Normalized:      ${normalizeName(candidate.name)}`);
    console.log(`County:          ${candidate.county.name}`);
    console.log(`Wards:           ${candidate.wards.length}`);

    for (const ward of candidate.wards) {
      console.log(
        `  Ward ${ward.id}: ${ward.name} | ` +
        `Constituency=${ward.constituencyId} ${ward.constituency.name}`
      );
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // 5. CHECK WHETHER TARGET NAME MATCHES ANY POPULATED SUBCOUNTY
  // --------------------------------------------------------------------------

  const normalizedTarget = normalizeName(target.name);

  const normalizedMatches = subCounties.filter(
    (subCounty) =>
      subCounty.id !== target.id &&
      normalizeName(subCounty.name) === normalizedTarget
  );

  console.log("5. NORMALIZED NAME MATCH CHECK");
  console.log("----------------------------------------------------------------------------");
  console.log(`Target normalized name: ${normalizedTarget}`);
  console.log(`Exact normalized matches: ${normalizedMatches.length}`);

  if (normalizedMatches.length === 0) {
    console.log("No populated SubCounty has the same normalized name.");
  } else {
    for (const match of normalizedMatches) {
      console.log(
        `  ${match.id} - ${match.name} | wards=${match.wards.length}`
      );
    }
  }

  console.log("");

  // --------------------------------------------------------------------------
  // 6. WARD COVERAGE
  // --------------------------------------------------------------------------

  const kipkelionEast = subCounties.find((s) => s.id === 491);
  const kipkelionWest = subCounties.find((s) => s.id === 472);

  const eastWardIds = new Set(
    kipkelionEast?.wards.map((ward) => ward.id) ?? []
  );

  const westWardIds = new Set(
    kipkelionWest?.wards.map((ward) => ward.id) ?? []
  );

  const overlappingWardIds = [...eastWardIds].filter((id) =>
    westWardIds.has(id)
  );

  console.log("6. WARD COVERAGE ANALYSIS");
  console.log("----------------------------------------------------------------------------");
  console.log(`Kipkelion East wards: ${eastWardIds.size}`);
  console.log(`Kipkelion West wards: ${westWardIds.size}`);
  console.log(`East/West overlapping wards: ${overlappingWardIds.length}`);

  if (overlappingWardIds.length > 0) {
    console.log(
      `Overlapping ward IDs: ${overlappingWardIds.join(", ")}`
    );
  }

  console.log("");

  // --------------------------------------------------------------------------
  // 7. FINAL EVIDENCE SUMMARY
  // --------------------------------------------------------------------------

  console.log("============================================================================");
  console.log("7. EVIDENCE SUMMARY");
  console.log("============================================================================");

  console.log(`Target 790 exists:              YES`);
  console.log(`Target wards:                   ${target.wards.length}`);
  console.log(`Target farmers:                 ${target.farmers.length}`);
  console.log(`Target farms:                   ${target.farms.length}`);
  console.log(
    `Kipkelion East (491) wards:     ${eastWardIds.size}`
  );
  console.log(
    `Kipkelion West (472) wards:     ${westWardIds.size}`
  );
  console.log(
    `East/West overlap:              ${overlappingWardIds.length}`
  );
  console.log(
    `Normalized name duplicate:      ${normalizedMatches.length}`
  );

  console.log("");
  console.log("IMPORTANT:");
  console.log(
    "This audit does NOT determine whether SubCounty 790 should be deleted."
  );
  console.log(
    "It only provides structural evidence for the administrative review."
  );

  console.log("");
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