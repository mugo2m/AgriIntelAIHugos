import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
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

type SubCountySource = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

type WardFeature = {
  type?: string;
  properties?: {
    gid?: number | string;
    uid?: string;
    name?: string;
    subcounty_name?: string;
    sub_county_name?: string;
    subCountyName?: string;
    county_name?: string;
    countyName?: string;
    [key: string]: unknown;
  };
};

function normalizeName(value: string): string {
  return value
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

function getWardProperty(
  properties: WardFeature["properties"],
  names: string[]
): string | null {
  if (!properties) {
    return null;
  }

  for (const name of names) {
    const value = properties[name];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return null;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("FINAL BARINGO TIATY CANONICAL INSPECTION");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  /*
   * ----------------------------------------------------------
   * 1. LOAD AUTHORITATIVE SUBCOUNTIES
   * ----------------------------------------------------------
   */

  const subcountyPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "subcounties.json"
  );

  const subcountyRaw = fs.readFileSync(subcountyPath, "utf8");

  const subcounties = JSON.parse(
    subcountyRaw
  ) as SubCountySource[];

  const baringoSource = subcounties.filter(
    (record) => record.countyCode === "030"
  );

  console.log("AUTHORITATIVE BARINGO SUBCOUNTIES");
  console.log(
    `County code 030 records: ${baringoSource.length}`
  );
  console.log("");

  for (const record of baringoSource) {
    console.log(
      `${record.countyCode} | ${record.name}` +
        ` | normalized="${normalizeName(record.name)}"`
    );
  }

  console.log("");

  /*
   * ----------------------------------------------------------
   * 2. FIND TIATY RECORDS IN AUTHORITATIVE SOURCE
   * ----------------------------------------------------------
   */

  console.log("AUTHORITATIVE TIATY RECORDS");
  console.log("");

  const tiatySource = subcounties.filter((record) => {
    const normalized = normalizeName(record.name);

    return (
      record.countyCode === "030" &&
      (
        normalized.includes("tiaty") ||
        normalized.includes("east pokot") ||
        normalized.includes("pokot")
      )
    );
  });

  for (const record of tiatySource) {
    console.log(
      `SOURCE RECORD: ${record.countyCode} | ${record.name}` +
        ` | normalized="${normalizeName(record.name)}"`
    );
  }

  console.log("");

  /*
   * ----------------------------------------------------------
   * 3. LOAD AUTHORITATIVE WARD GEOJSON
   * ----------------------------------------------------------
   */

  const geojsonPath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "kenya-wards-1450.geojson"
  );

  const geojsonRaw = fs.readFileSync(
    geojsonPath,
    "utf8"
  );

  const geojson = JSON.parse(geojsonRaw) as {
    features?: WardFeature[];
  };

  const features = geojson.features ?? [];

  console.log("AUTHORITATIVE TIATY WARD FEATURES");
  console.log("");

  const tiatyFeatures = features.filter((feature) => {
    const properties = feature.properties;

    const gid = getWardProperty(properties, [
      "gid",
      "GID",
      "GID_3",
      "sourceGid",
    ]);

    const gidNumber = gid ? Number(gid) : NaN;

    return gidNumber >= 781 && gidNumber <= 787;
  });

  console.log(
    `Authoritative features with GID 781–787: ${tiatyFeatures.length}`
  );
  console.log("");

  for (const feature of tiatyFeatures) {
    const properties = feature.properties;

    const gid = getWardProperty(properties, [
      "gid",
      "GID",
      "GID_3",
      "sourceGid",
    ]);

    const uid = getWardProperty(properties, [
      "uid",
      "UID",
      "sourceUid",
    ]);

    const wardName = getWardProperty(properties, [
      "name",
      "NAME",
      "ward_name",
      "wardName",
    ]);

    const subCountyName = getWardProperty(properties, [
      "subcounty_name",
      "sub_county_name",
      "subCountyName",
      "subcounty",
      "sub_county",
      "SUBCOUNTY",
      "SubCounty",
    ]);

    const countyName = getWardProperty(properties, [
      "county_name",
      "countyName",
      "county",
      "COUNTY",
      "County",
    ]);

    console.log(
      `GID=${gid ?? "null"} | UID=${uid ?? "null"} | ` +
        `Ward=${wardName ?? "null"} | ` +
        `SubCounty=${subCountyName ?? "null"} | ` +
        `County=${countyName ?? "null"}`
    );
  }

  console.log("");

  /*
   * ----------------------------------------------------------
   * 4. DATABASE RECORDS
   * ----------------------------------------------------------
   */

  const dbRecords = await prisma.subCounty.findMany({
    where: {
      countyId: 90,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  console.log("DATABASE BARINGO SUBCOUNTIES");
  console.log("");

  for (const record of dbRecords) {
    const wardCount = await prisma.ward.count({
      where: {
        subCountyId: record.id,
      },
    });

    console.log(
      `DB ${record.id}: ${record.name}` +
        ` | normalized="${normalizeName(record.name)}"` +
        ` | wards=${wardCount}`
    );
  }

  console.log("");

  /*
   * ----------------------------------------------------------
   * 5. EXACT TARGET CHECK
   * ----------------------------------------------------------
   */

  console.log("CANONICAL TARGET CHECK");
  console.log("");

  const tiatyEast = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const eastPokot = await prisma.subCounty.findUnique({
    where: {
      id: 1448,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  console.log(
    `Target 757: ${
      tiatyEast
        ? `${tiatyEast.name} | countyId=${tiatyEast.countyId}`
        : "NOT FOUND"
    }`
  );

  console.log(
    `Target 1448: ${
      eastPokot
        ? `${eastPokot.name} | countyId=${eastPokot.countyId}`
        : "NOT FOUND"
    }`
  );

  console.log("");

  /*
   * ----------------------------------------------------------
   * 6. COMPARE THE SEVEN WARDS AGAINST POSSIBLE TARGETS
   * ----------------------------------------------------------
   */

  console.log("CURRENT TIATY 463 WARDS");
  console.log("");

  const currentWards = await prisma.ward.findMany({
    where: {
      subCountyId: 463,
    },
    orderBy: {
      sourceGid: "asc",
    },
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      constituencyId: true,
      countyId: true,
    },
  });

  for (const ward of currentWards) {
    console.log(
      `Ward ${ward.id}: ${ward.name}` +
        ` | gid=${ward.sourceGid ?? "null"}` +
        ` | uid=${ward.sourceUid ?? "null"}` +
        ` | constituencyId=${ward.constituencyId}` +
        ` | countyId=${ward.countyId}`
    );
  }

  console.log("");

  /*
   * ----------------------------------------------------------
   * 7. RELATION CHECK
   * ----------------------------------------------------------
   */

  const farmers = await prisma.farmer.count({
    where: {
      subCountyId: 463,
    },
  });

  const farms = await prisma.farm.count({
    where: {
      subCountyId: 463,
    },
  });

  const businessPartners = await prisma.businessPartner.count({
    where: {
      subCountyId: 463,
    },
  });

  const destinationTransactions =
    await prisma.commodityTransaction.count({
      where: {
        destinationSubCountyId: 463,
      },
    });

  const sourceTransactions =
    await prisma.commodityTransaction.count({
      where: {
        sourceSubCountyId: 463,
      },
    });

  console.log("RELATION SAFETY CHECK");
  console.log("");
  console.log(`Farmers:              ${farmers}`);
  console.log(`Farms:                ${farms}`);
  console.log(`Business Partners:    ${businessPartners}`);
  console.log(
    `Destination Tx:       ${destinationTransactions}`
  );
  console.log(
    `Source Tx:            ${sourceTransactions}`
  );

  console.log("");

  /*
   * ----------------------------------------------------------
   * 8. FINAL INTERPRETATION
   * ----------------------------------------------------------
   */

  console.log("============================================================");
  console.log("FINAL INTERPRETATION");
  console.log("============================================================");
  console.log("");

  console.log(
    "Current legacy record: 463 Tiaty West Sub County"
  );

  console.log(
    "Authoritative ward subcounty: Tiaty Sub County"
  );

  console.log(
    "Canonical source contains: Tiaty East"
  );

  console.log(
    "Database canonical candidate: 757 Tiaty East"
  );

  console.log("");
  console.log(
    "NO DATABASE CHANGES WERE MADE."
  );
  console.log("");

  console.log("============================================================");
  console.log("INSPECTION COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");
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