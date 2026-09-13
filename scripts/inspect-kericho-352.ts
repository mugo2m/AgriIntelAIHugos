import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";

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

type GeoJSONFeature = {
  properties?: Record<string, unknown>;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/sub[\s-]*county/g, "")
    .replace(/subcounty/g, "")
    .replace(/county/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("INSPECT KERICHO BELGUT 352 → 1482");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");

  const sourceId = 352;
  const targetId = 1482;

  const source = await prisma.subCounty.findUnique({
    where: {
      id: sourceId,
    },
    include: {
      county: true,
      wards: {
        orderBy: {
          sourceGid: "asc",
        },
      },
    },
  });

  const target = await prisma.subCounty.findUnique({
    where: {
      id: targetId,
    },
    include: {
      county: true,
      wards: {
        orderBy: {
          sourceGid: "asc",
        },
      },
    },
  });

  if (!source) {
    throw new Error(`Source SubCounty ${sourceId} does not exist.`);
  }

  if (!target) {
    throw new Error(`Target SubCounty ${targetId} does not exist.`);
  }

  console.log("");
  console.log("SOURCE");
  console.log("------------------------------------------------------------");
  console.log(`ID:       ${source.id}`);
  console.log(`Name:     ${source.name}`);
  console.log(`County:   ${source.county.name} (${source.countyId})`);
  console.log(`Wards:    ${source.wards.length}`);

  console.log("");

  for (const ward of source.wards) {
    console.log(
      `${ward.id}: ${ward.name} | ` +
        `gid=${ward.sourceGid ?? ""} | ` +
        `uid=${ward.sourceUid ?? ""} | ` +
        `constituency=${ward.constituencyId}`,
    );
  }

  const farmers = await prisma.farmer.count({
    where: {
      subCountyId: sourceId,
    },
  });

  const farms = await prisma.farm.count({
    where: {
      subCountyId: sourceId,
    },
  });

  const businessPartners = await prisma.businessPartner.count({
    where: {
      subCountyId: sourceId,
    },
  });

  const destinationTransactions =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: sourceId,
      },
    });

  const sourceTransactions =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: sourceId,
      },
    });

  console.log("");
  console.log("SOURCE DIRECT RELATIONS");
  console.log("------------------------------------------------------------");
  console.log(`Farmers:              ${farmers}`);
  console.log(`Farms:                ${farms}`);
  console.log(`Business Partners:    ${businessPartners}`);
  console.log(`Destination Tx:       ${destinationTransactions}`);
  console.log(`Source Tx:            ${sourceTransactions}`);

  console.log("");
  console.log("TARGET");
  console.log("------------------------------------------------------------");
  console.log(`ID:       ${target.id}`);
  console.log(`Name:     ${target.name}`);
  console.log(`County:   ${target.county.name} (${target.countyId})`);
  console.log(`Wards:    ${target.wards.length}`);

  console.log("");

  for (const ward of target.wards) {
    console.log(
      `${ward.id}: ${ward.name} | ` +
        `gid=${ward.sourceGid ?? ""} | ` +
        `uid=${ward.sourceUid ?? ""} | ` +
        `constituency=${ward.constituencyId}`,
    );
  }

  const targetFarmers = await prisma.farmer.count({
    where: {
      subCountyId: targetId,
    },
  });

  const targetFarms = await prisma.farm.count({
    where: {
      subCountyId: targetId,
    },
  });

  const targetBusinessPartners =
    await prisma.businessPartner.count({
      where: {
        subCountyId: targetId,
      },
    });

  const targetDestinationTransactions =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: targetId,
      },
    });

  const targetSourceTransactions =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: targetId,
      },
    });

  console.log("");
  console.log("TARGET DIRECT RELATIONS");
  console.log("------------------------------------------------------------");
  console.log(`Farmers:              ${targetFarmers}`);
  console.log(`Farms:                ${targetFarms}`);
  console.log(`Business Partners:    ${targetBusinessPartners}`);
  console.log(`Destination Tx:       ${targetDestinationTransactions}`);
  console.log(`Source Tx:            ${targetSourceTransactions}`);

  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE BELGUT VERIFICATION");
  console.log("============================================================");

  const geojson = JSON.parse(
    readFileSync(
      "prisma/data/kenya-wards-1450.geojson",
      "utf8",
    ),
  );

  const features: GeoJSONFeature[] =
    Array.isArray(geojson.features)
      ? geojson.features
      : [];

  /*
   * IMPORTANT:
   * normalize("Belgut Sub County") becomes "belgut".
   * Therefore compare against "belgut", NOT "belgut sub county".
   */
  const authoritativeBelgut = features
    .map(
      (feature: GeoJSONFeature) =>
        feature.properties ?? {},
    )
    .filter(
      (properties: Record<string, unknown>) =>
        normalize(properties.county) === "kericho",
    )
    .filter(
      (properties: Record<string, unknown>) =>
        normalize(properties.subcounty) === "belgut",
    )
    .sort(
      (
        a: Record<string, unknown>,
        b: Record<string, unknown>,
      ) =>
        Number(a.gid) - Number(b.gid),
    );

  console.log("");
  console.log(
    `Authoritative Belgut wards: ${authoritativeBelgut.length}`,
  );

  for (const properties of authoritativeBelgut) {
    console.log(
      `GID=${properties.gid} | ` +
        `Ward=${properties.ward ?? ""} | ` +
        `SubCounty=${properties.subcounty ?? ""} | ` +
        `UID=${properties.uid ?? ""} | ` +
        `SCUID=${properties.scuid ?? ""} | ` +
        `CUID=${properties.cuid ?? ""}`,
    );
  }

  const authoritativeGids =
    authoritativeBelgut
      .map((properties) => Number(properties.gid))
      .sort((a, b) => a - b);

  const sourceGids = source.wards
    .map((ward) => ward.sourceGid)
    .filter(
      (gid): gid is number =>
        gid !== null,
    )
    .sort((a, b) => a - b);

  console.log("");
  console.log("SOURCE GID CHECK");
  console.log("------------------------------------------------------------");

  console.log(
    `Database source GIDs:       ${sourceGids.join(", ")}`,
  );

  console.log(
    `Authoritative Belgut GIDs: ${authoritativeGids.join(", ")}`,
  );

  const sameGids =
    sourceGids.length === authoritativeGids.length &&
    sourceGids.every(
      (gid, index) =>
        gid === authoritativeGids[index],
    );

  console.log("");
  console.log(
    `All source GIDs match authoritative Belgut: ${
      sameGids ? "YES" : "NO"
    }`,
  );

  console.log("");
  console.log("============================================================");
  console.log("FINAL SAFETY DECISION");
  console.log("============================================================");

  const sameCounty =
    source.countyId === target.countyId;

  const targetEmpty =
    target.wards.length === 0;

  const relationsClear =
    farmers === 0 &&
    farms === 0 &&
    businessPartners === 0 &&
    destinationTransactions === 0 &&
    sourceTransactions === 0;

  const safe =
    sameCounty &&
    sameGids &&
    targetEmpty &&
    relationsClear;

  console.log("");
  console.log(
    `Same county:              ${sameCounty ? "PASS" : "FAIL"}`,
  );

  console.log(
    `Authoritative GIDs match: ${sameGids ? "PASS" : "FAIL"}`,
  );

  console.log(
    `Target has no wards:      ${targetEmpty ? "PASS" : "FAIL"}`,
  );

  console.log(
    `Source relations clear:  ${relationsClear ? "PASS" : "FAIL"}`,
  );

  console.log("");

  if (safe) {
    console.log("DECISION: SAFE CANDIDATE");

    console.log(
      `Consolidation: ${sourceId} ${source.name} → ${targetId} ${target.name}`,
    );

    console.log(
      `Wards to move: ${source.wards.length}`,
    );
  } else {
    console.log("DECISION: DO NOT MIGRATE");
  }

  console.log("");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("");

  console.log("============================================================");
  console.log("INSPECTION COMPLETE");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("INSPECTION FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });