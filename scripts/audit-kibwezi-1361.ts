import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  console.log("============================================================");
  console.log("AUDIT — KIBWEZI SUBCOUNTY ID 1361");
  console.log("============================================================");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("");

  const target = await prisma.subCounty.findUnique({
    where: {
      id: 1361,
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
        select: {
          id: true,
          name: true,
          sourceGid: true,
          countyId: true,
          subCountyId: true,
          constituencyId: true,
        },
      },
      farmers: {
        select: {
          id: true,
          userId: true,
          phone: true,
          countyId: true,
          subCountyId: true,
          wardId: true,
          villageId: true,
        },
      },
      farms: {
        select: {
          id: true,
        },
      },
      businessPartners: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!target) {
    console.log("SUBCOUNTY ID 1361 NOT FOUND");
    return;
  }

  console.log("1. TARGET RECORD");
  console.log("------------------------------------------------------------");
  console.log(`ID                : ${target.id}`);
  console.log(`NAME              : ${target.name}`);
  console.log(`NORMALIZED NAME   : ${normalizeName(target.name)}`);
  console.log(`COUNTY ID         : ${target.countyId}`);
  console.log(`COUNTY            : ${target.county?.name ?? "NULL"}`);
  console.log(`WARDS             : ${target.wards.length}`);
  console.log(`FARMERS           : ${target.farmers.length}`);
  console.log(`FARMS             : ${target.farms.length}`);
  console.log(
    `BUSINESS PARTNERS : ${target.businessPartners.length}`
  );

  console.log("");
  console.log("2. WARDS");
  console.log("------------------------------------------------------------");

  if (target.wards.length === 0) {
    console.log("NO WARDS REFER TO SUBCOUNTY 1361");
  } else {
    for (const ward of target.wards) {
      console.log(
        `ID=${ward.id} | NAME=${ward.name} | SOURCE_GID=${ward.sourceGid} | COUNTY=${ward.countyId} | SUBCOUNTY=${ward.subCountyId} | CONSTITUENCY=${ward.constituencyId ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("3. FARMERS");
  console.log("------------------------------------------------------------");

  if (target.farmers.length === 0) {
    console.log("NO FARMERS REFER TO SUBCOUNTY 1361");
  } else {
    for (const farmer of target.farmers) {
      console.log(
        `ID=${farmer.id} | USER_ID=${farmer.userId} | PHONE=${farmer.phone ?? "NULL"} | COUNTY=${farmer.countyId} | SUBCOUNTY=${farmer.subCountyId} | WARD=${farmer.wardId ?? "NULL"} | VILLAGE=${farmer.villageId ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("4. FARMS");
  console.log("------------------------------------------------------------");

  if (target.farms.length === 0) {
    console.log("NO FARMS REFER TO SUBCOUNTY 1361");
  } else {
    for (const farm of target.farms) {
      console.log(`FARM ID=${farm.id}`);
    }
  }

  console.log("");
  console.log("5. BUSINESS PARTNERS");
  console.log("------------------------------------------------------------");

  if (target.businessPartners.length === 0) {
    console.log("NO BUSINESS PARTNERS REFER TO SUBCOUNTY 1361");
  } else {
    for (const partner of target.businessPartners) {
      console.log(`BUSINESS PARTNER ID=${partner.id}`);
    }
  }

  console.log("");
  console.log("6. ALL MAKUENI SUBCOUNTIES");
  console.log("------------------------------------------------------------");

  const makueniSubcounties = await prisma.subCounty.findMany({
    where: {
      countyId: 74,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      _count: {
        select: {
          wards: true,
          farmers: true,
          farms: true,
          businessPartners: true,
        },
      },
    },
  });

  for (const record of makueniSubcounties) {
    const normalized = normalizeName(record.name);

    const marker = record.id === 1361 ? "  <-- TARGET 1361" : "";

    console.log(
      `ID=${record.id} | NAME=${record.name} | NORMALIZED=${normalized} | WARDS=${record._count.wards} | FARMERS=${record._count.farmers} | FARMS=${record._count.farms} | BUSINESS_PARTNERS=${record._count.businessPartners}${marker}`
    );
  }

  console.log("");
  console.log("7. SUBCOUNTIES CONTAINING 'KIBWEZI'");
  console.log("------------------------------------------------------------");

  const kibweziRecords = makueniSubcounties.filter((record) =>
    record.name.toLowerCase().includes("kibwezi")
  );

  for (const record of kibweziRecords) {
    console.log(
      `ID=${record.id} | NAME=${record.name} | NORMALIZED=${normalizeName(record.name)} | WARDS=${record._count.wards} | FARMERS=${record._count.farmers} | FARMS=${record._count.farms} | BUSINESS_PARTNERS=${record._count.businessPartners}`
    );
  }

  console.log("");
  console.log("8. FOREIGN-KEY CROSS-CHECKS");
  console.log("------------------------------------------------------------");

  const wardCount = await prisma.ward.count({
    where: {
      subCountyId: 1361,
    },
  });

  const farmerCount = await prisma.farmer.count({
    where: {
      subCountyId: 1361,
    },
  });

  console.log(`Ward.subCountyId = 1361     : ${wardCount}`);
  console.log(`Farmer.subCountyId = 1361   : ${farmerCount}`);

  console.log("");
  console.log("9. OPERATIONAL KIBWEZI COMPARISON");
  console.log("------------------------------------------------------------");

  const west = await prisma.subCounty.findUnique({
    where: {
      id: 362,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
          sourceGid: true,
          constituencyId: true,
        },
        orderBy: {
          sourceGid: "asc",
        },
      },
    },
  });

  const east = await prisma.subCounty.findUnique({
    where: {
      id: 401,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
          sourceGid: true,
          constituencyId: true,
        },
        orderBy: {
          sourceGid: "asc",
        },
      },
    },
  });

  console.log("");
  console.log("KIBWEZI WEST");
  console.log(`ID        : ${west?.id ?? "NOT FOUND"}`);
  console.log(`NAME      : ${west?.name ?? "NOT FOUND"}`);
  console.log(`NORMALIZED: ${west ? normalizeName(west.name) : "N/A"}`);
  console.log(`WARDS     : ${west?.wards.length ?? 0}`);

  if (west) {
    for (const ward of west.wards) {
      console.log(
        `  Ward ${ward.id} | ${ward.name} | GID=${ward.sourceGid} | Constituency=${ward.constituencyId ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("KIBWEZI EAST");
  console.log(`ID        : ${east?.id ?? "NOT FOUND"}`);
  console.log(`NAME      : ${east?.name ?? "NOT FOUND"}`);
  console.log(`NORMALIZED: ${east ? normalizeName(east.name) : "N/A"}`);
  console.log(`WARDS     : ${east?.wards.length ?? 0}`);

  if (east) {
    for (const ward of east.wards) {
      console.log(
        `  Ward ${ward.id} | ${ward.name} | GID=${ward.sourceGid} | Constituency=${ward.constituencyId ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("10. EVIDENCE SUMMARY");
  console.log("------------------------------------------------------------");

  console.log(
    `Record 1361 exists             : ${target ? "PASS" : "FAIL"}`
  );

  console.log(
    `Record belongs to Makueni      : ${
      target.countyId === 74 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Record has zero wards          : ${
      target.wards.length === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Record has zero farmers        : ${
      target.farmers.length === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Record has zero farms          : ${
      target.farms.length === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Record has zero partners       : ${
      target.businessPartners.length === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Ward FK count = 0              : ${
      wardCount === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Farmer FK count = 0            : ${
      farmerCount === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log("");
  console.log("IMPORTANT:");
  console.log("This audit does NOT modify, delete, rename, or merge SubCounty 1361.");
  console.log("The purpose is to establish evidence before any repair decision.");

  console.log("");
  console.log("============================================================");
  console.log("AUDIT COMPLETE");
  console.log("============================================================");
  console.log("NO DATABASE CHANGES WERE MADE.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });