import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import subcountyWardMap from "../prisma/data/subcounty-ward-map.json";

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

type MappingWard = {
  id: number;
  name: string;
  code: string | null;
  sourceGid?: number;
  sourceUid?: string;
};

type MappingSubCounty = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  wards: MappingWard[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\bward\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("");
  console.log("=======================================");
  console.log("VALIDATING WARD SOURCE IDENTITIES");
  console.log("=======================================");
  console.log("");

  const mappings =
    subcountyWardMap as MappingSubCounty[];

  const databaseWards =
    await prisma.ward.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
        subCountyId: true,
        sourceGid: true,
        sourceUid: true,
      },
    });

  console.log(
    `Database wards: ${databaseWards.length}`
  );

  const bySourceGid = new Map<
    number,
    typeof databaseWards[number]
  >();

  for (const ward of databaseWards) {
    if (ward.sourceGid != null) {
      bySourceGid.set(
        ward.sourceGid,
        ward
      );
    }
  }

  const missing = [];
  const mismatched = [];
  const matched = [];

  for (const mapping of mappings) {
    for (const sourceWard of mapping.wards) {
      if (sourceWard.sourceGid == null) {
        continue;
      }

      const databaseWard =
        bySourceGid.get(
          sourceWard.sourceGid
        );

      if (!databaseWard) {
        missing.push({
          sourceGid: sourceWard.sourceGid,
          sourceUid: sourceWard.sourceUid,
          name: sourceWard.name,
          subCounty:
            mapping.subCountyName,
        });

        continue;
      }

      if (
        normalize(databaseWard.name) !==
        normalize(sourceWard.name)
      ) {
        mismatched.push({
          sourceGid:
            sourceWard.sourceGid,
          sourceName:
            sourceWard.name,
          databaseName:
            databaseWard.name,
          databaseId:
            databaseWard.id,
        });

        continue;
      }

      matched.push({
        sourceGid:
          sourceWard.sourceGid,
        name:
          sourceWard.name,
        databaseId:
          databaseWard.id,
      });
    }
  }

  console.log("");
  console.log("=======================================");
  console.log("SOURCE IDENTITY RESULTS");
  console.log("=======================================");

  console.log(
    `Matched source wards:    ${matched.length}`
  );

  console.log(
    `Missing source wards:    ${missing.length}`
  );

  console.log(
    `Name mismatches:         ${mismatched.length}`
  );

  if (missing.length > 0) {
    console.log("");
    console.log("MISSING SOURCE WARDS:");
    console.table(missing);
  }

  if (mismatched.length > 0) {
    console.log("");
    console.log("NAME MISMATCHES:");
    console.table(mismatched);
  }

  console.log("");
  console.log("=======================================");
  console.log("VALIDATION COMPLETE");
  console.log("=======================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Validation failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });