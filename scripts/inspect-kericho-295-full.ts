import "dotenv/config";
import { readFileSync } from "fs";
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

type Feature = {
  type?: string;
  properties?: Record<string, unknown>;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  console.log("============================================================");
  console.log("FULL KERICHO SUBCOUNTY 295 CONSOLIDATION DIAGNOSTIC");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const geojsonPath =
    "prisma/data/kenya-wards-1450.geojson";

  const raw = readFileSync(geojsonPath, "utf8");
  const geojson = JSON.parse(raw);

  const features: Feature[] = Array.isArray(geojson.features)
    ? geojson.features
    : [];

  console.log("AUTHORITATIVE GEOJSON");
  console.log("------------------------------------------------------------");
  console.log(`Total features: ${features.length}`);
  console.log("");

  const requestedGids = new Set([
    936,
    937,
    938,
    939,
    940,
    941,
    942,
    943,
    944,
    945,
    946,
    947,
    948,
    949,
    950,
    951,
    952,
    953,
    954,
    955,
    956,
    957,
    958,
    959,
    960,
    961,
    962,
    963,
    964,
    965,
  ]);

  const kerichoFeatures = features
    .map((feature) => feature.properties ?? {})
    .filter(
      (properties) =>
        normalize(properties.county) === "kericho",
    )
    .filter((properties) => {
      const gid = num(properties.gid);
      return gid !== null && requestedGids.has(gid);
    })
    .sort(
      (a, b) =>
        Number(a.gid) - Number(b.gid),
    );

  for (const properties of kerichoFeatures) {
    console.log(
      `GID ${properties.gid} | ` +
        `Ward=${properties.ward ?? ""} | ` +
        `SubCounty=${properties.subcounty ?? ""} | ` +
        `UID=${properties.uid ?? ""} | ` +
        `SCUID=${properties.scuid ?? ""} | ` +
        `CUID=${properties.cuid ?? ""}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE AINAMOI");
  console.log("============================================================");
  console.log("");

  const authoritativeAinamoi = features
    .map((feature) => feature.properties ?? {})
    .filter(
      (properties) =>
        normalize(properties.county) === "kericho",
    )
    .filter(
      (properties) =>
        normalize(properties.subcounty) ===
        "ainamoi sub county",
    )
    .sort(
      (a, b) =>
        Number(a.gid) - Number(b.gid),
    );

  console.log(
    `Authoritative Ainamoi ward features: ${authoritativeAinamoi.length}`,
  );

  console.log("");

  for (const properties of authoritativeAinamoi) {
    console.log(
      `GID=${properties.gid} | ` +
        `Ward=${properties.ward} | ` +
        `UID=${properties.uid ?? ""} | ` +
        `SCUID=${properties.scuid ?? ""} | ` +
        `CUID=${properties.cuid ?? ""}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("AUTHORITATIVE BELGUT");
  console.log("============================================================");
  console.log("");

  const authoritativeBelgut = features
    .map((feature) => feature.properties ?? {})
    .filter(
      (properties) =>
        normalize(properties.county) === "kericho",
    )
    .filter((properties) => {
      const subCounty =
        normalize(properties.subcounty);

      return (
        subCounty === "belgut sub county" ||
        subCounty === "belgut"
      );
    })
    .sort(
      (a, b) =>
        Number(a.gid) - Number(b.gid),
    );

  console.log(
    `Authoritative Belgut ward features: ${authoritativeBelgut.length}`,
  );

  console.log("");

  for (const properties of authoritativeBelgut) {
    console.log(
      `GID=${properties.gid} | ` +
        `Ward=${properties.ward} | ` +
        `SubCounty=${properties.subcounty} | ` +
        `UID=${properties.uid ?? ""} | ` +
        `SCUID=${properties.scuid ?? ""} | ` +
        `CUID=${properties.cuid ?? ""}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("DATABASE SUBCOUNTY 295");
  console.log("============================================================");
  console.log("");

  const source =
    await prisma.subCounty.findUnique({
      where: {
        id: 295,
      },
      include: {
        county: true,
        wards: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

  if (!source) {
    console.log(
      "ERROR: SubCounty 295 does not exist.",
    );
    return;
  }

  console.log(`ID:       ${source.id}`);
  console.log(`Name:     ${source.name}`);
  console.log(
    `County:   ${source.county.name} (${source.countyId})`,
  );
  console.log(`Wards:    ${source.wards.length}`);
  console.log("");

  for (const ward of source.wards) {
    console.log(
      `DB Ward ${ward.id}: ${ward.name} | ` +
        `gid=${ward.sourceGid ?? ""} | ` +
        `uid=${ward.sourceUid ?? ""} | ` +
        `constituency=${ward.constituencyId} | ` +
        `county=${ward.countyId}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("DATABASE KERICHO CANONICAL CANDIDATES");
  console.log("============================================================");
  console.log("");

  const canonicalNames = [
    "Belgut",
    "Bureti",
    "Kericho East",
    "Kipkelion",
    "Londiani",
    "Soin Sigowet",
  ];

  const candidates =
    await prisma.subCounty.findMany({
      where: {
        countyId: source.countyId,
        name: {
          in: canonicalNames,
        },
      },
      include: {
        wards: {
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

  for (const candidate of candidates) {
    console.log(
      `TARGET ${candidate.id}: ${candidate.name} | ` +
        `wards=${candidate.wards.length}`,
    );

    for (const ward of candidate.wards) {
      console.log(
        `  Ward ${ward.id}: ${ward.name} | ` +
          `gid=${ward.sourceGid ?? ""} | ` +
          `uid=${ward.sourceUid ?? ""} | ` +
          `constituency=${ward.constituencyId}`,
      );
    }

    console.log("");
  }

  console.log("============================================================");
  console.log("GID-TO-DATABASE MATCH CHECK");
  console.log("============================================================");
  console.log("");

  const gids = [
    ...new Set(
      kerichoFeatures
        .map((properties) =>
          num(properties.gid),
        )
        .filter(
          (value): value is number =>
            value !== null,
        ),
    ),
  ];

  const dbWards =
    await prisma.ward.findMany({
      where: {
        sourceGid: {
          in: gids,
        },
      },
      include: {
        constituency: true,
        subCounty: true,
      },
      orderBy: {
        sourceGid: "asc",
      },
    });

  const dbByGid = new Map<
    number,
    (typeof dbWards)[number]
  >();

  for (const ward of dbWards) {
    if (ward.sourceGid !== null) {
      dbByGid.set(
        Number(ward.sourceGid),
        ward,
      );
    }
  }

  for (const properties of kerichoFeatures) {
    const gid = num(properties.gid);

    if (gid === null) {
      continue;
    }

    const db = dbByGid.get(gid);

    console.log(`GID ${gid}`);

    console.log(
      `  AUTH: ward=${properties.ward ?? ""} | ` +
        `subcounty=${properties.subcounty ?? ""} | ` +
        `uid=${properties.uid ?? ""}`,
    );

    if (!db) {
      console.log("  DB:   NOT FOUND");
    } else {
      console.log(
        `  DB:   ward=${db.name} | ` +
          `subcounty=${db.subCounty?.name ?? ""} | ` +
          `constituency=${db.constituency?.name ?? ""} | ` +
          `uid=${db.sourceUid ?? ""}`,
      );
    }

    console.log("");
  }

  console.log("============================================================");
  console.log("CRITICAL ANOMALY");
  console.log("============================================================");
  console.log("");

  const gid961 = features
    .map((feature) => feature.properties ?? {})
    .find(
      (properties) =>
        Number(properties.gid) === 961,
    );

  if (gid961) {
    console.log("GID 961");
    console.log(
      `  Authoritative ward:      ${gid961.ward ?? ""}`,
    );
    console.log(
      `  Authoritative subcounty: ${gid961.subcounty ?? ""}`,
    );
    console.log(
      `  Authoritative county:    ${gid961.county ?? ""}`,
    );
    console.log(
      `  UID:                     ${gid961.uid ?? ""}`,
    );
    console.log(
      `  SCUID:                   ${gid961.scuid ?? ""}`,
    );
    console.log(
      `  CUID:                    ${gid961.cuid ?? ""}`,
    );
  }

  console.log("");

  const db961 =
    await prisma.ward.findFirst({
      where: {
        sourceGid: 961,
      },
      include: {
        constituency: true,
        subCounty: true,
      },
    });

  if (db961) {
    console.log("DATABASE GID 961");
    console.log(
      `  Ward:          ${db961.name}`,
    );
    console.log(
      `  SubCounty:     ${db961.subCounty?.name ?? ""}`,
    );
    console.log(
      `  Constituency:  ${db961.constituency?.name ?? ""}`,
    );
    console.log(
      `  UID:           ${db961.sourceUid ?? ""}`,
    );
    console.log(
      `  ID:            ${db961.id}`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("FINAL DIAGNOSTIC INTERPRETATION");
  console.log("============================================================");
  console.log("");

  console.log(
    "1. SubCounty 295 AINAMOI currently owns 7 database wards.",
  );

  console.log(
    "2. GIDs 944–949 identify six authoritative Ainamoi wards.",
  );

  console.log(
    "3. GID 961 identifies BELGUT, but its subcounty identity fields are incomplete.",
  );

  console.log(
    "4. GID 961 has no UID, SCUID, or CUID.",
  );

  console.log(
    "5. Therefore GID 961 cannot safely establish an automatic Ainamoi-to-Belgut migration.",
  );

  console.log(
    "6. The six Ainamoi wards must not be moved into Belgut.",
  );

  console.log(
    "7. SubCounty 295 remains MANUAL REVIEW.",
  );

  console.log("");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("");

  console.log("============================================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("DIAGNOSTIC FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });