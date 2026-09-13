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

type MappingSubCounty = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  wards: {
    id: number;
    name: string;
    code: string | null;
    sourceGid?: number;
    sourceUid?: string;
  }[];
};

async function main() {
  console.log("");
  console.log("=======================================");
  console.log("NYARIBARI CHACHE WARD INSPECTION");
  console.log("=======================================");
  console.log("");

  const mappings =
    subcountyWardMap as MappingSubCounty[];

  const mapping = mappings.find(
    (item) =>
      item.subCountyName
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim() ===
      "nyaribari chache sub county"
  );

  if (!mapping) {
    throw new Error(
      "Nyaribari Chache mapping was not found."
    );
  }

  console.log("MAPPING:");
  console.table(
    mapping.wards.map((ward) => ({
      name: ward.name,
      code: ward.code,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
    }))
  );

  const databaseSubCounty =
    await prisma.subCounty.findUnique({
      where: {
        id: mapping.subCountyId,
      },
      include: {
        county: true,
        wards: {
          orderBy: {
            name: "asc",
          },
          include: {
            constituency: true,
          },
        },
      },
    });

  if (!databaseSubCounty) {
    throw new Error(
      `SubCounty ${mapping.subCountyId} was not found.`
    );
  }

  console.log("");
  console.log("DATABASE SUBCOUNTY:");
  console.log(
    `${databaseSubCounty.name} | ID ${databaseSubCounty.id}`
  );

  console.log("");
  console.log("DATABASE WARDS:");
  console.table(
    databaseSubCounty.wards.map((ward) => ({
      id: ward.id,
      name: ward.name,
      constituency: ward.constituency?.name,
      constituencyId: ward.constituencyId,
      countyId: ward.countyId,
      subCountyId: ward.subCountyId,
      code: ward.code,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
    }))
  );

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\bward\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const databaseWardNames = new Set(
    databaseSubCounty.wards.map((ward) =>
      normalize(ward.name)
    )
  );

  const missing = mapping.wards.filter(
    (ward) =>
      !databaseWardNames.has(
        normalize(ward.name)
      )
  );

  console.log("");
  console.log("MISSING FROM DATABASE:");
  console.table(
    missing.map((ward) => ({
      name: ward.name,
      code: ward.code,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
    }))
  );

  console.log("");
  console.log("=======================================");
  console.log("INSPECTION COMPLETE");
  console.log("=======================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Inspection failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });