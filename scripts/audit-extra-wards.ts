import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import subcountyWardMap from "../prisma/data/subcounty-ward-map.json";

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
  console.log("");
  console.log("============================================================");
  console.log("AUDIT EXTRA WARDS");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const mappings =
    subcountyWardMap as MappingSubCounty[];

  // ========================================================
  // BUILD AUTHORITATIVE WARD KEY SET
  // ========================================================

  const mappedWardKeys = new Set<string>();

  for (const mapping of mappings) {
    for (const ward of mapping.wards) {
      const wardName =
        ward.name?.trim();

      if (!wardName) {
        continue;
      }

      const key =
        `${mapping.subCountyId}|${wardName}`;

      mappedWardKeys.add(key);
    }
  }

  console.log(
    `Authoritative mapped ward keys: ${mappedWardKeys.size}`
  );

  // ========================================================
  // LOAD ALL DATABASE WARDS
  // ========================================================

  const databaseWards =
    await prisma.ward.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        sourceGid: true,
        sourceUid: true,
        countyId: true,
        subCountyId: true,
        constituencyId: true,
        county: {
          select: {
            id: true,
            name: true,
          },
        },
        subCounty: {
          select: {
            id: true,
            name: true,
          },
        },
        constituency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  console.log(
    `Database wards:              ${databaseWards.length}`
  );

  // ========================================================
  // FIND WARDS NOT IN AUTHORITATIVE MAPPING
  // ========================================================

  const extraWards =
    databaseWards.filter((ward) => {
      if (ward.subCountyId === null) {
        return true;
      }

      const key =
        `${ward.subCountyId}|${ward.name.trim()}`;

      return !mappedWardKeys.has(key);
    });

  console.log(
    `Wards outside mapping:        ${extraWards.length}`
  );

  console.log("");

  // ========================================================
  // DISPLAY EXTRA WARDS
  // ========================================================

  if (extraWards.length === 0) {
    console.log(
      "✅ No wards exist outside the authoritative mapping."
    );
  } else {
    console.log(
      "WARDS OUTSIDE AUTHORITATIVE MAPPING:"
    );
    console.log("");

    for (const ward of extraWards) {
      console.log(
        `ID:            ${ward.id}`
      );

      console.log(
        `Name:          ${ward.name}`
      );

      console.log(
        `County:        ${ward.county.name} (${ward.countyId})`
      );

      console.log(
        `SubCounty:     ${
          ward.subCounty
            ? `${ward.subCounty.name} (${ward.subCounty.id})`
            : "NULL"
        }`
      );

      console.log(
        `Constituency:  ${
          ward.constituency
            ? `${ward.constituency.name} (${ward.constituency.id})`
            : "NULL"
        }`
      );

      console.log(
        `Code:          ${ward.code ?? "NULL"}`
      );

      console.log(
        `sourceGid:     ${ward.sourceGid ?? "NULL"}`
      );

      console.log(
        `sourceUid:     ${ward.sourceUid ?? "NULL"}`
      );

      console.log(
        "------------------------------------------------------------"
      );
    }
  }

  // ========================================================
  // SUMMARY
  // ========================================================

  console.log("");
  console.log("============================================================");
  console.log("SUMMARY");
  console.log("============================================================");

  console.log(
    `Authoritative wards:          ${mappedWardKeys.size}`
  );

  console.log(
    `Database wards:               ${databaseWards.length}`
  );

  console.log(
    `Extra database wards:         ${extraWards.length}`
  );

  console.log("");

  if (
    mappedWardKeys.size === 1450 &&
    databaseWards.length === 1454 &&
    extraWards.length === 4
  ) {
    console.log(
      "✅ EXPECTED STATE CONFIRMED:"
    );

    console.log(
      "   1450 authoritative wards + 4 pre-existing extra wards = 1454 database wards."
    );
  }

  console.log("");
  console.log(
    "READ-ONLY AUDIT COMPLETE — NO DATABASE CHANGES."
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ Audit failed:"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });