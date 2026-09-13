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
  console.log("KISII LOCATION STRUCTURE");
  console.log("=======================================");
  console.log("");

  const kisii = await prisma.county.findFirst({
    where: {
      name: "Kisii",
    },
  });

  if (!kisii) {
    throw new Error("Kisii county was not found.");
  }

  console.log(
    `Kisii County: ID ${kisii.id}`
  );

  // ---------------------------------------------------
  // CONSTITUENCIES
  // ---------------------------------------------------

  const constituencies =
    await prisma.constituency.findMany({
      where: {
        countyId: kisii.id,
      },
      orderBy: {
        id: "asc",
      },
      include: {
        wards: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });

  console.log("");
  console.log("=======================================");
  console.log("KISII CONSTITUENCIES");
  console.log("=======================================");

  console.table(
    constituencies.map((c) => ({
      id: c.id,
      name: c.name,
      wardCount: c.wards.length,
    }))
  );

  // ---------------------------------------------------
  // SUBCOUNTIES
  // ---------------------------------------------------

  const subCounties =
    await prisma.subCounty.findMany({
      where: {
        countyId: kisii.id,
      },
      orderBy: {
        id: "asc",
      },
      include: {
        wards: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });

  console.log("");
  console.log("=======================================");
  console.log("KISII SUBCOUNTIES");
  console.log("=======================================");

  console.table(
    subCounties.map((sc) => ({
      id: sc.id,
      name: sc.name,
      wardCount: sc.wards.length,
    }))
  );

  // ---------------------------------------------------
  // NYARIBARI CHACHE
  // ---------------------------------------------------

  const nyaribari =
    subCounties.find((sc) =>
      sc.name
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .startsWith("nyaribari chache")
    );

  if (!nyaribari) {
    throw new Error(
      "Nyaribari Chache Sub County was not found."
    );
  }

  console.log("");
  console.log("=======================================");
  console.log("NYARIBARI CHACHE WARDS");
  console.log("=======================================");

  console.table(
    nyaribari.wards.map((ward) => ({
      id: ward.id,
      name: ward.name,
      constituencyId: ward.constituencyId,
      countyId: ward.countyId,
      subCountyId: ward.subCountyId,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,
    }))
  );

  // ---------------------------------------------------
  // WARDS WITHOUT CONSTITUENCY
  // ---------------------------------------------------

  const wardsWithoutConstituency =
    await prisma.ward.count({
      where: {
        countyId: kisii.id,
        constituencyId: undefined,
      },
    });

  console.log("");
  console.log(
    `Kisii wards without constituency: ${wardsWithoutConstituency}`
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