import fs from "fs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const COUNTY_IDS = [68, 87, 51, 53, 54] as const;

function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

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

type CandidateResult = {
  countyId: number;
  countyName: string;
  subCountyId: number;
  subCountyName: string;
  databaseWardCount: number;
  authoritativeWardCount: number;
  authoritativeName?: string;
  authoritativeScuid?: string;
  authoritativeCuid?: string;
  authoritativeGids: number[];
  farmerCount: number;
  farmCount: number;
  businessPartnerCount: number;
  sourceTransactionCount: number;
  destinationTransactionCount: number;
  totalReferences: number;
  classification: string;
};

async function main() {
  console.log("============================================================");
  console.log("BATCH 1 AUTHORITATIVE GEOJSON AUDIT");
  console.log("KITUI | KISII | HOMA BAY | BUNGOMA | KAKAMEGA");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log();

  const geojsonPath = "prisma/data/kenya-wards-1450.geojson";

  const geojson = JSON.parse(
    fs.readFileSync(geojsonPath, "utf8")
  ) as {
    features?: GeoFeature[];
  };

  const features = geojson.features ?? [];

  console.log(
    `Authoritative GeoJSON features: ${features.length}`
  );

  if (features.length !== 1450) {
    throw new Error(
      `Expected 1450 GeoJSON features, found ${features.length}.`
    );
  }

  console.log("PASS | Authoritative source contains exactly 1450 wards.");
  console.log();

  const counties = await prisma.county.findMany({
    where: {
      id: {
        in: [...COUNTY_IDS],
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Database counties found: ${counties.length}/${COUNTY_IDS.length}`
  );

  if (counties.length !== COUNTY_IDS.length) {
    throw new Error(
      "One or more Batch 1 counties could not be found."
    );
  }

  const countyNameById = new Map(
    counties.map((county) => [county.id, county.name])
  );

  const subCounties = await prisma.subCounty.findMany({
    where: {
      countyId: {
        in: [...COUNTY_IDS],
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const databaseCandidates: CandidateResult[] = [];

  for (const subCounty of subCounties) {
    const databaseWardCount = await prisma.ward.count({
      where: {
        subCountyId: subCounty.id,
      },
    });

    if (databaseWardCount !== 0) {
      continue;
    }

    const [
      farmerCount,
      farmCount,
      businessPartnerCount,
      sourceTransactionCount,
      destinationTransactionCount,
    ] = await Promise.all([
      prisma.farmer.count({
        where: {
          subCountyId: subCounty.id,
        },
      }),

      prisma.farm.count({
        where: {
          subCountyId: subCounty.id,
        },
      }),

      prisma.businessPartner.count({
        where: {
          subCountyId: subCounty.id,
        },
      }),

      prisma.commodityTransaction.count({
        where: {
          sourceSubCountyId: subCounty.id,
        },
      }),

      prisma.commodityTransaction.count({
        where: {
          destinationSubCountyId: subCounty.id,
        },
      }),
    ]);

    const totalReferences =
      farmerCount +
      farmCount +
      businessPartnerCount +
      sourceTransactionCount +
      destinationTransactionCount;

    const countyName =
      countyNameById.get(subCounty.countyId) ?? "UNKNOWN";

    const normalizedDatabaseName = normalizeName(
      subCounty.name
    );

    const matchingFeatures = features.filter((feature) => {
      const properties = feature.properties;

      if (!properties?.subcounty) {
        return false;
      }

      if (
        normalizeName(properties.subcounty) !==
        normalizedDatabaseName
      ) {
        return false;
      }

      if (!properties.county) {
        return false;
      }

      return (
        normalizeName(properties.county) ===
        normalizeName(countyName)
      );
    });

    const authoritativeGids = matchingFeatures
      .map((feature) => feature.properties?.gid)
      .filter(
        (gid): gid is number =>
          typeof gid === "number"
      )
      .sort((a, b) => a - b);

    const authoritativeWardCount =
      matchingFeatures.length;

    const authoritativeName =
      matchingFeatures[0]?.properties?.subcounty;

    const authoritativeScuid =
      matchingFeatures[0]?.properties?.scuid;

    const authoritativeCuid =
      matchingFeatures[0]?.properties?.cuid;

    let classification = "";

    if (totalReferences > 0) {
      if (authoritativeWardCount > 0) {
        classification =
          "REFERENCED + AUTHORITATIVE WARDS — REVIEW";
      } else {
        classification =
          "REFERENCED + NO AUTHORITATIVE WARDS — REVIEW";
      }
    } else if (authoritativeWardCount > 0) {
      classification =
        "AUTHORITATIVE WARDS EXIST — DO NOT DELETE";
    } else {
      classification =
        "NO REFERENCES + NO AUTHORITATIVE WARDS — SAFE LEGACY CANDIDATE";
    }

    databaseCandidates.push({
      countyId: subCounty.countyId,
      countyName,
      subCountyId: subCounty.id,
      subCountyName: subCounty.name,
      databaseWardCount,
      authoritativeWardCount,
      authoritativeName,
      authoritativeScuid,
      authoritativeCuid,
      authoritativeGids,
      farmerCount,
      farmCount,
      businessPartnerCount,
      sourceTransactionCount,
      destinationTransactionCount,
      totalReferences,
      classification,
    });
  }

  console.log();
  console.log(
    `Empty database SubCounties found: ${databaseCandidates.length}`
  );

  console.log();
  console.log("============================================================");
  console.log("AUTHORITATIVE COMPARISON");
  console.log("============================================================");

  let safeLegacy = 0;
  let authoritativeWardCandidates = 0;
  let referencedCandidates = 0;
  let reviewCandidates = 0;

  for (const candidate of databaseCandidates) {
    console.log();
    console.log(
      `COUNTY ${candidate.countyId} | ${candidate.countyName}`
    );
    console.log(
      `ID ${candidate.subCountyId} | ${candidate.subCountyName}`
    );
    console.log(
      `Database Wards: ${candidate.databaseWardCount}`
    );
    console.log(
      `Authoritative SubCounty: ${
        candidate.authoritativeName ?? "NO MATCH"
      }`
    );
    console.log(
      `Authoritative Wards: ${candidate.authoritativeWardCount}`
    );

    if (candidate.authoritativeScuid) {
      console.log(
        `Authoritative SCUID: ${candidate.authoritativeScuid}`
      );
    }

    if (candidate.authoritativeCuid) {
      console.log(
        `Authoritative CUID: ${candidate.authoritativeCuid}`
      );
    }

    console.log(
      `Authoritative GIDs: ${
        candidate.authoritativeGids.length > 0
          ? candidate.authoritativeGids.join(", ")
          : "NONE"
      }`
    );

    console.log(
      `Farmers=${candidate.farmerCount} | ` +
        `Farms=${candidate.farmCount} | ` +
        `Partners=${candidate.businessPartnerCount} | ` +
        `SourceTx=${candidate.sourceTransactionCount} | ` +
        `DestinationTx=${candidate.destinationTransactionCount}`
    );

    console.log(
      `CLASSIFICATION: ${candidate.classification}`
    );

    if (
      candidate.classification.includes(
        "SAFE LEGACY CANDIDATE"
      )
    ) {
      safeLegacy++;
    }

    if (
      candidate.classification.includes(
        "AUTHORITATIVE WARDS EXIST"
      )
    ) {
      authoritativeWardCandidates++;
    }

    if (candidate.totalReferences > 0) {
      referencedCandidates++;
    }

    if (
      candidate.classification.includes("REVIEW")
    ) {
      reviewCandidates++;
    }
  }

  console.log();
  console.log("============================================================");
  console.log("FINAL BATCH 1 CLASSIFICATION SUMMARY");
  console.log("============================================================");
  console.log();

  console.log(
    `Total empty database candidates: ${databaseCandidates.length}`
  );

  console.log(
    `Safe legacy candidates: ${safeLegacy}`
  );

  console.log(
    `Candidates with authoritative wards: ${authoritativeWardCandidates}`
  );

  console.log(
    `Candidates with database references: ${referencedCandidates}`
  );

  console.log(
    `Candidates requiring review: ${reviewCandidates}`
  );

  console.log();

  if (
    safeLegacy +
      authoritativeWardCandidates +
      referencedCandidates <
    databaseCandidates.length
  ) {
    console.log(
      "WARNING | Some records require further classification."
    );
  }

  console.log();
  console.log("============================================================");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
