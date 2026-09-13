import "dotenv/config";
import { readFileSync } from "fs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
});

type GeoJSONFeature = {
  type?: string;
  properties?: Record<string, unknown>;
};

type GeoJSONData = {
  type?: string;
  features?: GeoJSONFeature[];
};

function getProperty(
  properties: Record<string, unknown>,
  possibleKeys: string[],
): unknown {
  for (const key of possibleKeys) {
    if (
      properties[key] !== undefined &&
      properties[key] !== null
    ) {
      return properties[key];
    }
  }

  return null;
}

function getGid(
  properties: Record<string, unknown>,
): number | null {
  const value = getProperty(properties, [
    "gid",
    "GID",
    "GID_3",
    "sourceGid",
  ]);

  if (value === null) {
    return null;
  }

  const gid = Number(value);

  return Number.isFinite(gid) ? gid : null;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("INSPECT AUTHORITATIVE KERICHO WARDS");
  console.log("GIDS 944–949 AND 961");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");

  const geojsonPath =
    "prisma/data/kenya-wards-1450.geojson";

  const geojson = JSON.parse(
    readFileSync(geojsonPath, "utf8"),
  ) as GeoJSONData;

  const features = geojson.features ?? [];

  const targetGids = [
    944,
    945,
    946,
    947,
    948,
    949,
    961,
  ];

  console.log("");
  console.log("AUTHORITATIVE GEOJSON");
  console.log("------------------------------------------------------------");
  console.log(`Total features: ${features.length}`);
  console.log(`Requested GIDs: ${targetGids.length}`);

  for (const gid of targetGids) {
    const feature = features.find((item) => {
      const properties = item.properties ?? {};
      return getGid(properties) === gid;
    });

    console.log("");
    console.log(`GID ${gid}`);

    if (!feature) {
      console.log("  NOT FOUND");
      continue;
    }

    const properties = feature.properties ?? {};

    const uid = getProperty(properties, [
      "uid",
      "UID",
      "sourceUid",
    ]);

    const ward = getProperty(properties, [
      "ward",
      "WARD",
      "ward_name",
      "WARD_NAME",
      "name",
      "NAME",
    ]);

    const subCounty = getProperty(properties, [
      "subcounty",
      "sub_county",
      "SUBCOUNTY",
      "SUB_COUNTY",
      "subcounty_name",
      "SUBCOUNTY_NAME",
    ]);

    const constituency = getProperty(properties, [
      "constituency",
      "CONSTITUENCY",
      "constituency_name",
      "CONSTITUENCY_NAME",
    ]);

    const county = getProperty(properties, [
      "county",
      "COUNTY",
      "county_name",
      "COUNTY_NAME",
    ]);

    console.log(`  Ward:          ${String(ward ?? "")}`);
    console.log(`  SubCounty:     ${String(subCounty ?? "")}`);
    console.log(`  Constituency:  ${String(constituency ?? "")}`);
    console.log(`  County:        ${String(county ?? "")}`);
    console.log(`  UID:           ${String(uid ?? "")}`);

    console.log("  ALL PROPERTIES:");

    for (const [key, value] of Object.entries(properties)) {
      console.log(`    ${key}: ${String(value)}`);
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("DATABASE SOURCE: SUBCOUNTY 295");
  console.log("============================================================");

  const source = await prisma.subCounty.findUnique({
    where: {
      id: 295,
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
      wards: {
        orderBy: {
          sourceGid: "asc",
        },
        select: {
          id: true,
          name: true,
          sourceGid: true,
          sourceUid: true,
          countyId: true,
          subCountyId: true,
          constituencyId: true,
          constituency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!source) {
    console.log("");
    console.log("ERROR: SubCounty 295 does not exist.");
    return;
  }

  console.log("");
  console.log(`ID:       ${source.id}`);
  console.log(`Name:     ${source.name}`);
  console.log(
    `County:   ${source.county.name} (${source.county.id})`,
  );
  console.log(`Wards:    ${source.wards.length}`);

  console.log("");
  console.log("DATABASE WARDS");

  for (const ward of source.wards) {
    console.log(
      `  ${ward.id}: ${ward.name} | ` +
        `gid=${ward.sourceGid} | ` +
        `uid=${ward.sourceUid ?? ""} | ` +
        `constituency=${ward.constituencyId} ${ward.constituency.name}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("DATABASE KERICHO SUBCOUNTIES");
  console.log("============================================================");

  const kerichoSubcounties =
    await prisma.subCounty.findMany({
      where: {
        countyId: 56,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        wards: {
          orderBy: {
            sourceGid: "asc",
          },
          select: {
            id: true,
            name: true,
            sourceGid: true,
            sourceUid: true,
            constituencyId: true,
            constituency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

  for (const subCounty of kerichoSubcounties) {
    console.log("");
    console.log(
      `${subCounty.id}: ${subCounty.name} | ` +
        `wards=${subCounty.wards.length}`,
    );

    for (const ward of subCounty.wards) {
      console.log(
        `  ${ward.id}: ${ward.name} | ` +
          `gid=${ward.sourceGid} | ` +
          `constituency=${ward.constituencyId} ${ward.constituency.name}`,
      );
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("INSPECTION COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
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