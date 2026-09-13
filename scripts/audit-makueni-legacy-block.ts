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
  console.log("AUDIT — MAKUENI LEGACY SUBCOUNTY BLOCK 1360–1368");
  console.log("============================================================");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("");

  const countyId = 74;

  const records = await prisma.subCounty.findMany({
    where: {
      countyId,
      id: {
        gte: 1360,
        lte: 1368,
      },
    },
    orderBy: {
      id: "asc",
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
        orderBy: {
          sourceGid: "asc",
        },
      },
      farmers: {
        select: {
          id: true,
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

  console.log("1. LEGACY BLOCK RECORDS");
  console.log("------------------------------------------------------------");

  if (records.length === 0) {
    console.log("NO RECORDS FOUND IN ID RANGE 1360–1368");
    return;
  }

  for (const record of records) {
    console.log("");
    console.log(`ID                : ${record.id}`);
    console.log(`NAME              : ${record.name}`);
    console.log(`NORMALIZED NAME   : ${normalizeName(record.name)}`);
    console.log(`COUNTY ID         : ${record.countyId}`);
    console.log(`COUNTY            : ${record.county?.name ?? "NULL"}`);
    console.log(`WARDS             : ${record.wards.length}`);
    console.log(`FARMERS           : ${record.farmers.length}`);
    console.log(`FARMS             : ${record.farms.length}`);
    console.log(`BUSINESS PARTNERS : ${record.businessPartners.length}`);

    if (record.wards.length > 0) {
      console.log("WARD DETAILS:");

      for (const ward of record.wards) {
        console.log(
          `  Ward ${ward.id} | ${ward.name} | GID=${ward.sourceGid} | COUNTY=${ward.countyId} | SUBCOUNTY=${ward.subCountyId} | CONSTITUENCY=${ward.constituencyId ?? "NULL"}`
        );
      }
    }
  }

  console.log("");
  console.log("2. LEGACY BLOCK SUMMARY");
  console.log("------------------------------------------------------------");

  for (const record of records) {
    console.log(
      `ID=${record.id} | NAME=${record.name} | NORMALIZED=${normalizeName(record.name)} | WARDS=${record.wards.length} | FARMERS=${record.farmers.length} | FARMS=${record.farms.length} | BUSINESS_PARTNERS=${record.businessPartners.length}`
    );
  }

  console.log("");
  console.log("3. WARD SOURCE-GID COVERAGE");
  console.log("------------------------------------------------------------");

  const allLegacyWards = records.flatMap((record) =>
    record.wards.map((ward) => ({
      ...ward,
      subCountyName: record.name,
    }))
  );

  if (allLegacyWards.length === 0) {
    console.log("NO WARDS ARE ATTACHED TO IDS 1360–1368");
  } else {
    console.log(
      `TOTAL WARDS ATTACHED TO IDS 1360–1368: ${allLegacyWards.length}`
    );

    for (const ward of allLegacyWards) {
      console.log(
        `SUBCOUNTY=${ward.subCountyName} (${ward.subCountyId}) | WARD=${ward.name} (${ward.id}) | GID=${ward.sourceGid}`
      );
    }
  }

  console.log("");
  console.log("4. SOURCE-GID RANGE ANALYSIS");
  console.log("------------------------------------------------------------");

  const sourceGids = allLegacyWards
    .map((ward) => ward.sourceGid)
    .filter((gid): gid is number => gid !== null);

  if (sourceGids.length === 0) {
    console.log("NO SOURCE GIDS FOUND");
  } else {
    const sortedGids = [...sourceGids].sort((a, b) => a - b);

    console.log(`MIN SOURCE GID : ${sortedGids[0]}`);
    console.log(`MAX SOURCE GID : ${sortedGids[sortedGids.length - 1]}`);
    console.log(`TOTAL SOURCE GIDS: ${sortedGids.length}`);
    console.log(`UNIQUE SOURCE GIDS: ${new Set(sortedGids).size}`);

    console.log("");
    console.log("SOURCE GIDS:");

    for (const gid of sortedGids) {
      console.log(`  ${gid}`);
    }
  }

  console.log("");
  console.log("5. CURRENT OPERATIONAL MAKUENI SUBCOUNTIES");
  console.log("------------------------------------------------------------");

  const currentSubcounties = await prisma.subCounty.findMany({
    where: {
      countyId,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      wards: {
        select: {
          id: true,
          sourceGid: true,
        },
      },
    },
  });

  for (const record of currentSubcounties) {
    const status = record.wards.length > 0 ? "OPERATIONAL" : "EMPTY";

    console.log(
      `ID=${record.id} | NAME=${record.name} | WARDS=${record.wards.length} | STATUS=${status}`
    );
  }

  console.log("");
  console.log("6. ID-RANGE COMPARISON");
  console.log("------------------------------------------------------------");

  const legacyIds = records.map((record) => record.id);

  const operationalLegacy = records.filter(
    (record) => record.wards.length > 0
  );

  const emptyLegacy = records.filter(
    (record) =>
      record.wards.length === 0 &&
      record.farmers.length === 0 &&
      record.farms.length === 0 &&
      record.businessPartners.length === 0
  );

  console.log(`LEGACY BLOCK RECORD COUNT : ${records.length}`);
  console.log(`RECORDS WITH WARDS        : ${operationalLegacy.length}`);
  console.log(`COMPLETELY EMPTY RECORDS  : ${emptyLegacy.length}`);

  console.log("");
  console.log(
    `LEGACY IDS: ${legacyIds.length > 0 ? legacyIds.join(", ") : "NONE"}`
  );

  console.log(
    `WITH WARDS: ${
      operationalLegacy.length > 0
        ? operationalLegacy.map((record) => record.id).join(", ")
        : "NONE"
    }`
  );

  console.log(
    `EMPTY: ${
      emptyLegacy.length > 0
        ? emptyLegacy.map((record) => record.id).join(", ")
        : "NONE"
    }`
  );

  console.log("");
  console.log("7. KIBWEZI-SPECIFIC CHECK");
  console.log("------------------------------------------------------------");

  const kibweziLegacy = records.filter((record) =>
    normalizeName(record.name).includes("kibwezi")
  );

  if (kibweziLegacy.length === 0) {
    console.log("NO KIBWEZI RECORD FOUND IN LEGACY BLOCK");
  } else {
    for (const record of kibweziLegacy) {
      console.log(
        `ID=${record.id} | NAME=${record.name} | NORMALIZED=${normalizeName(record.name)} | WARDS=${record.wards.length} | FARMERS=${record.farmers.length} | FARMS=${record.farms.length} | BUSINESS_PARTNERS=${record.businessPartners.length}`
      );
    }
  }

  console.log("");
  console.log("8. CURRENT KIBWEZI OPERATIONAL RECORDS");
  console.log("------------------------------------------------------------");

  const kibweziOperational = await prisma.subCounty.findMany({
    where: {
      countyId,
      OR: [
        {
          id: 362,
        },
        {
          id: 401,
        },
      ],
    },
    select: {
      id: true,
      name: true,
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
    orderBy: {
      id: "asc",
    },
  });

  for (const record of kibweziOperational) {
    console.log(
      `ID=${record.id} | NAME=${record.name} | NORMALIZED=${normalizeName(record.name)} | WARDS=${record.wards.length}`
    );

    for (const ward of record.wards) {
      console.log(
        `  ${ward.id} | ${ward.name} | GID=${ward.sourceGid} | CONSTITUENCY=${ward.constituencyId ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("9. OVERLAP TEST — LEGACY VS OPERATIONAL WARD IDS");
  console.log("------------------------------------------------------------");

  const legacyWardIds = new Set(
    allLegacyWards.map((ward) => ward.id)
  );

  const operationalKibweziWards = kibweziOperational.flatMap(
    (record) => record.wards
  );

  const overlappingWardIds = operationalKibweziWards.filter((ward) =>
    legacyWardIds.has(ward.id)
  );

  console.log(
    `Legacy-block ward count       : ${legacyWardIds.size}`
  );

  console.log(
    `Kibwezi West/East ward count  : ${operationalKibweziWards.length}`
  );

  console.log(
    `Overlapping ward IDs          : ${overlappingWardIds.length}`
  );

  if (overlappingWardIds.length > 0) {
    for (const ward of overlappingWardIds) {
      console.log(
        `OVERLAP: Ward ${ward.id} | ${ward.name} | GID=${ward.sourceGid}`
      );
    }
  } else {
    console.log("NO WARD-ID OVERLAP");
  }

  console.log("");
  console.log("10. OVERLAP TEST — SOURCE GIDS");
  console.log("------------------------------------------------------------");

  const legacyGids = new Set(
    allLegacyWards
      .map((ward) => ward.sourceGid)
      .filter((gid): gid is number => gid !== null)
  );

  const operationalKibweziGids = operationalKibweziWards
    .map((ward) => ward.sourceGid)
    .filter((gid): gid is number => gid !== null);

  const overlappingGids = operationalKibweziGids.filter((gid) =>
    legacyGids.has(gid)
  );

  console.log(
    `Legacy-block source GIDs      : ${legacyGids.size}`
  );

  console.log(
    `Kibwezi West/East source GIDs : ${operationalKibweziGids.length}`
  );

  console.log(
    `Overlapping source GIDs        : ${overlappingGids.length}`
  );

  if (overlappingGids.length > 0) {
    console.log(`OVERLAPPING GIDS: ${overlappingGids.join(", ")}`);
  } else {
    console.log("NO SOURCE-GID OVERLAP");
  }

  console.log("");
  console.log("11. EVIDENCE CLASSIFICATION");
  console.log("------------------------------------------------------------");

  for (const record of records) {
    const completelyEmpty =
      record.wards.length === 0 &&
      record.farmers.length === 0 &&
      record.farms.length === 0 &&
      record.businessPartners.length === 0;

    const operational = record.wards.length > 0;

    let classification = "REQUIRES REVIEW";

    if (operational) {
      classification = "OPERATIONAL — HAS WARDS";
    } else if (completelyEmpty) {
      classification = "EMPTY — NO CURRENT REFERENCES";
    }

    console.log(
      `ID=${record.id} | ${record.name} | ${classification}`
    );
  }

  console.log("");
  console.log("12. FINAL EVIDENCE SUMMARY");
  console.log("------------------------------------------------------------");

  console.log(
    `Makueni County ID 74 exists       : ${
      records.every((record) => record.countyId === 74)
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `Legacy block contains 1360–1368   : ${
      records.length === 9 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `ID 1361 has zero wards             : ${
      records.find((record) => record.id === 1361)?.wards.length === 0
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `ID 1361 has zero farmers           : ${
      records.find((record) => record.id === 1361)?.farmers.length === 0
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `ID 1361 has zero farms             : ${
      records.find((record) => record.id === 1361)?.farms.length === 0
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `ID 1361 has zero partners          : ${
      records.find((record) => record.id === 1361)
        ?.businessPartners.length === 0
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `Kibwezi West operational           : ${
      kibweziOperational.some(
        (record) => record.id === 362 && record.wards.length === 6
      )
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `Kibwezi East operational           : ${
      kibweziOperational.some(
        (record) => record.id === 401 && record.wards.length === 4
      )
        ? "PASS"
        : "CHECK"
    }`
  );

  console.log(
    `No legacy/operational ward overlap : ${
      overlappingWardIds.length === 0 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `No legacy/operational GID overlap  : ${
      overlappingGids.length === 0 ? "PASS" : "CHECK"
    }`
  );

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