import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

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
  console.log("=======================================");
  console.log("DIAGNOSE MISSING CONSTITUENCY LINKS");
  console.log("=======================================");
  console.log("");

  const kisii = await prisma.county.findUnique({
    where: {
      id: 87,
    },
  });

  if (!kisii) {
    throw new Error("Kisii county ID 87 not found.");
  }

  // ---------------------------------------------------
  // ALL KISII WARDS
  // ---------------------------------------------------

  const wards = await prisma.ward.findMany({
    where: {
      countyId: kisii.id,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      constituencyId: true,
      subCountyId: true,
      sourceGid: true,
      sourceUid: true,
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
        },
      },
    },
  });

  console.log(`Total Kisii wards: ${wards.length}`);

  // ---------------------------------------------------
  // WARDS WITH INVALID CONSTITUENCY RELATIONSHIP
  // ---------------------------------------------------

  const invalid = wards.filter(
    (ward) =>
      !ward.constituency ||
      ward.constituency.countyId !== kisii.id
  );

  console.log("");
  console.log(
    `Wards with missing/invalid constituency: ${invalid.length}`
  );

  console.log("");

  console.table(
    invalid.map((ward) => ({
      id: ward.id,
      name: ward.name,
      constituencyId: ward.constituencyId,
      constituency:
        ward.constituency?.name ?? "MISSING",
      subCountyId: ward.subCountyId,
      subCounty:
        ward.subCounty?.name ?? "MISSING",
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
    }))
  );

  // ---------------------------------------------------
  // CHECK ALL KISII CONSTITUENCIES
  // ---------------------------------------------------

  const constituencies =
    await prisma.constituency.findMany({
      where: {
        countyId: kisii.id,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        wards: {
          select: {
            id: true,
            name: true,
            subCountyId: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

  console.log("");
  console.log("=======================================");
  console.log("KISII CONSTITUENCY COVERAGE");
  console.log("=======================================");

  console.table(
    constituencies.map((c) => ({
      id: c.id,
      name: c.name,
      wardCount: c.wards.length,
    }))
  );

  // ---------------------------------------------------
  // CHECK DUPLICATE WARD NAMES
  // ---------------------------------------------------

  const nameGroups = new Map<
    string,
    typeof wards
  >();

  for (const ward of wards) {
    const key = ward.name
      .toLowerCase()
      .replace(/\bward\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const group = nameGroups.get(key) ?? [];
    group.push(ward);
    nameGroups.set(key, group);
  }

  const duplicates = [
    ...nameGroups.entries(),
  ].filter(([, group]) => group.length > 1);

  console.log("");
  console.log(
    `Duplicate normalized Kisii ward names: ${duplicates.length}`
  );

  if (duplicates.length > 0) {
    console.log("");
    for (const [name, group] of duplicates) {
      console.log(`WARD: ${name}`);

      console.table(
        group.map((ward) => ({
          id: ward.id,
          name: ward.name,
          constituencyId:
            ward.constituencyId,
          constituency:
            ward.constituency?.name ?? "MISSING",
          subCountyId:
            ward.subCountyId,
          subCounty:
            ward.subCounty?.name ?? "MISSING",
        }))
      );
    }
  }

  console.log("");
  console.log("=======================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("=======================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Diagnostic failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });