import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    console.log("============================================================");
    console.log("CURRENT MAKUENI GEOGRAPHY AUDIT");
    console.log("READ-ONLY — NO DATABASE CHANGES");
    console.log("============================================================");

    const county = await prisma.county.findFirst({
      where: {
        name: {
          contains: "Makueni",
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!county) {
      console.log("");
      console.log("MAKUENI COUNTY NOT FOUND");
      return;
    }

    console.log("");
    console.log(`COUNTY ID   : ${county.id}`);
    console.log(`COUNTY NAME : ${county.name}`);
    console.log("");

    const subCounties = await prisma.subCounty.findMany({
      where: {
        countyId: county.id,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        wards: {
          orderBy: {
            id: "asc",
          },
          select: {
            id: true,
            name: true,
            sourceGid: true,
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

    console.log(`TOTAL SUBCOUNTIES: ${subCounties.length}`);
    console.log("");

    for (const subCounty of subCounties) {
      console.log("------------------------------------------------------------");
      console.log(
        `SUBCOUNTY ID=${subCounty.id} | NAME=${subCounty.name} | WARDS=${subCounty.wards.length}`
      );

      if (subCounty.wards.length === 0) {
        console.log("  NO WARDS");
        continue;
      }

      for (const ward of subCounty.wards) {
        console.log(
          `  WARD ID=${ward.id} | NAME=${ward.name} | SOURCE_GID=${ward.sourceGid ?? "NULL"} | COUNTY_ID=${ward.countyId} | SUBCOUNTY_ID=${ward.subCountyId} | CONSTITUENCY_ID=${ward.constituencyId ?? "NULL"} | CONSTITUENCY=${ward.constituency?.name ?? "NULL"}`
        );
      }
    }

    console.log("");
    console.log("============================================================");
    console.log("SUMMARY");
    console.log("============================================================");
    console.log(`County       : ${county.name} (ID ${county.id})`);
    console.log(`SubCounties  : ${subCounties.length}`);
    console.log(
      `Total Wards  : ${subCounties.reduce((total, sc) => total + sc.wards.length, 0)}`
    );

    console.log("");
    console.log("SUBCOUNTY ID / NAME SUMMARY");

    for (const subCounty of subCounties) {
      console.log(
        `${subCounty.id} | ${subCounty.name} | ${subCounty.wards.length} wards`
      );
    }

    console.log("");
    console.log("OLD KIBWEZI REFERENCES");
    console.log(`Old target ID 666 exists: ${subCounties.some((sc) => sc.id === 666)}`);
    console.log(`Candidate ID 362 exists : ${subCounties.some((sc) => sc.id === 362)}`);
    console.log(`Candidate ID 401 exists : ${subCounties.some((sc) => sc.id === 401)}`);

    console.log("");
    console.log("AUDIT COMPLETE — READ-ONLY");
  } catch (error) {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();