import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bsub\s*county\b/g, "")
    .replace(/\bsubcounty\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  console.log("============================================================");
  console.log("MANUAL AUDIT — CURRENT MAKUENI KIBWEZI");
  console.log("============================================================");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("");

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
    console.log("MAKUENI COUNTY NOT FOUND");
    return;
  }

  console.log(`COUNTY: ${county.name}`);
  console.log(`COUNTY ID: ${county.id}`);
  console.log("");

  const kibweziWest = await prisma.subCounty.findUnique({
    where: {
      id: 362,
    },
    include: {
      county: true,
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

  const kibweziEast = await prisma.subCounty.findUnique({
    where: {
      id: 401,
    },
    include: {
      county: true,
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

  const old666 = await prisma.subCounty.findUnique({
    where: {
      id: 666,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const kibweziRecord = await prisma.subCounty.findUnique({
    where: {
      id: 1361,
    },
    include: {
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

  console.log("============================================================");
  console.log("1. KIBWEZI WEST — CURRENT RECORD");
  console.log("============================================================");

  if (!kibweziWest) {
    console.log("KIBWEZI WEST ID 362 NOT FOUND");
  } else {
    console.log(`ID                : ${kibweziWest.id}`);
    console.log(`NAME              : ${kibweziWest.name}`);
    console.log(`COUNTY ID         : ${kibweziWest.countyId}`);
    console.log(`COUNTY            : ${kibweziWest.county?.name ?? "NULL"}`);
    console.log(`WARDS             : ${kibweziWest.wards.length}`);
    console.log(`FARMERS           : ${kibweziWest.farmers.length}`);
    console.log(`FARMS             : ${kibweziWest.farms.length}`);
    console.log(
      `BUSINESS PARTNERS : ${kibweziWest.businessPartners.length}`
    );

    const constituencies = new Map<number, string>();

    for (const ward of kibweziWest.wards) {
      if (ward.constituency) {
        constituencies.set(
          ward.constituency.id,
          ward.constituency.name
        );
      }
    }

    console.log(
      `CONSTITUENCIES     : ${
        constituencies.size > 0
          ? [...constituencies.entries()]
              .map(([id, name]) => `${id} - ${name}`)
              .join(", ")
          : "NONE"
      }`
    );

    console.log("");
    console.log("KIBWEZI WEST WARDS:");

    for (const ward of kibweziWest.wards) {
      console.log(
        `  ID=${ward.id} | NAME=${ward.name} | SOURCE_GID=${ward.sourceGid} | COUNTY=${ward.countyId} | SUBCOUNTY=${ward.subCountyId} | CONSTITUENCY=${ward.constituencyId ?? "NULL"} | CONSTITUENCY_NAME=${ward.constituency?.name ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("2. KIBWEZI EAST — CURRENT RECORD");
  console.log("============================================================");

  if (!kibweziEast) {
    console.log("KIBWEZI EAST ID 401 NOT FOUND");
  } else {
    console.log(`ID                : ${kibweziEast.id}`);
    console.log(`NAME              : ${kibweziEast.name}`);
    console.log(`COUNTY ID         : ${kibweziEast.countyId}`);
    console.log(`COUNTY            : ${kibweziEast.county?.name ?? "NULL"}`);
    console.log(`WARDS             : ${kibweziEast.wards.length}`);
    console.log(`FARMERS           : ${kibweziEast.farmers.length}`);
    console.log(`FARMS             : ${kibweziEast.farms.length}`);
    console.log(
      `BUSINESS PARTNERS : ${kibweziEast.businessPartners.length}`
    );

    const constituencies = new Map<number, string>();

    for (const ward of kibweziEast.wards) {
      if (ward.constituency) {
        constituencies.set(
          ward.constituency.id,
          ward.constituency.name
        );
      }
    }

    console.log(
      `CONSTITUENCIES     : ${
        constituencies.size > 0
          ? [...constituencies.entries()]
              .map(([id, name]) => `${id} - ${name}`)
              .join(", ")
          : "NONE"
      }`
    );

    console.log("");
    console.log("KIBWEZI EAST WARDS:");

    for (const ward of kibweziEast.wards) {
      console.log(
        `  ID=${ward.id} | NAME=${ward.name} | SOURCE_GID=${ward.sourceGid} | COUNTY=${ward.countyId} | SUBCOUNTY=${ward.subCountyId} | CONSTITUENCY=${ward.constituencyId ?? "NULL"} | CONSTITUENCY_NAME=${ward.constituency?.name ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("3. OLD TARGET ID 666");
  console.log("============================================================");

  if (!old666) {
    console.log("ID 666 DOES NOT EXIST IN CURRENT DATABASE");
  } else {
    console.log(`ID        : ${old666.id}`);
    console.log(`NAME      : ${old666.name}`);
    console.log(`COUNTY ID : ${old666.countyId}`);
  }

  console.log("");
  console.log("============================================================");
  console.log("4. CURRENT 'KIBWEZI' RECORD — ID 1361");
  console.log("============================================================");

  if (!kibweziRecord) {
    console.log("ID 1361 DOES NOT EXIST");
  } else {
    console.log(`ID                : ${kibweziRecord.id}`);
    console.log(`NAME              : ${kibweziRecord.name}`);
    console.log(`COUNTY ID         : ${kibweziRecord.countyId}`);
    console.log(`COUNTY            : ${kibweziRecord.county?.name ?? "NULL"}`);
    console.log(`WARDS             : ${kibweziRecord.wards.length}`);
    console.log(`FARMERS           : ${kibweziRecord.farmers.length}`);
    console.log(`FARMS             : ${kibweziRecord.farms.length}`);
    console.log(
      `BUSINESS PARTNERS : ${kibweziRecord.businessPartners.length}`
    );

    if (kibweziRecord.wards.length > 0) {
      console.log("");
      console.log("WARDS:");

      for (const ward of kibweziRecord.wards) {
        console.log(
          `  ID=${ward.id} | NAME=${ward.name} | SOURCE_GID=${ward.sourceGid}`
        );
      }
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("5. WARD OVERLAP TEST");
  console.log("============================================================");

  if (kibweziWest && kibweziEast) {
    const westWardIds = new Set(
      kibweziWest.wards.map((ward) => ward.id)
    );

    const eastWardIds = new Set(
      kibweziEast.wards.map((ward) => ward.id)
    );

    const westGids = new Set(
      kibweziWest.wards
        .map((ward) => ward.sourceGid)
        .filter((gid): gid is number => gid !== null)
    );

    const eastGids = new Set(
      kibweziEast.wards
        .map((ward) => ward.sourceGid)
        .filter((gid): gid is number => gid !== null)
    );

    const overlappingWardIds = [...westWardIds].filter((id) =>
      eastWardIds.has(id)
    );

    const overlappingGids = [...westGids].filter((gid) =>
      eastGids.has(gid)
    );

    console.log(`WEST WARD COUNT          : ${westWardIds.size}`);
    console.log(`EAST WARD COUNT          : ${eastWardIds.size}`);
    console.log(
      `OVERLAPPING WARD IDS     : ${overlappingWardIds.length}`
    );
    console.log(
      `OVERLAPPING SOURCE GIDS  : ${overlappingGids.length}`
    );

    if (overlappingWardIds.length > 0) {
      console.log("");
      console.log("OVERLAPPING WARD IDS:");
      console.log(overlappingWardIds.join(", "));
    }

    if (overlappingGids.length > 0) {
      console.log("");
      console.log("OVERLAPPING SOURCE GIDS:");
      console.log(overlappingGids.join(", "));
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("6. EXPECTED SOURCE GID SEQUENCE");
  console.log("============================================================");

  if (kibweziWest) {
    const westGids = kibweziWest.wards
      .map((ward) => ward.sourceGid)
      .filter((gid): gid is number => gid !== null)
      .sort((a, b) => a - b);

    const westExpected =
      westGids.length === 6 &&
      westGids.every((gid, index) => gid === 431 + index);

    console.log(`KIBWEZI WEST GIDS : ${westGids.join(", ")}`);
    console.log(
      `EXPECTED 431-436  : ${westExpected ? "PASS" : "FAIL"}`
    );
  }

  if (kibweziEast) {
    const eastGids = kibweziEast.wards
      .map((ward) => ward.sourceGid)
      .filter((gid): gid is number => gid !== null)
      .sort((a, b) => a - b);

    const eastExpected =
      eastGids.length === 4 &&
      eastGids.every((gid, index) => gid === 437 + index);

    console.log(`KIBWEZI EAST GIDS : ${eastGids.join(", ")}`);
    console.log(
      `EXPECTED 437-440  : ${eastExpected ? "PASS" : "FAIL"}`
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("7. NORMALIZED NAME ANALYSIS");
  console.log("============================================================");

  if (kibweziWest && kibweziEast) {
    const westNormalized = normalizeName(kibweziWest.name);
    const eastNormalized = normalizeName(kibweziEast.name);

    console.log(`WEST RAW        : ${kibweziWest.name}`);
    console.log(`WEST NORMALIZED  : ${westNormalized}`);
    console.log("");
    console.log(`EAST RAW        : ${kibweziEast.name}`);
    console.log(`EAST NORMALIZED  : ${eastNormalized}`);
    console.log("");
    console.log(
      `WEST/EAST NORMALIZED MATCH: ${
        westNormalized === eastNormalized ? "YES" : "NO"
      }`
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("8. FINAL EVIDENCE SUMMARY");
  console.log("============================================================");

  console.log(
    `Makueni County ID 74 confirmed       : ${
      county.id === 74 ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Kibwezi West ID 362 confirmed        : ${
      kibweziWest ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Kibwezi East ID 401 confirmed        : ${
      kibweziEast ? "PASS" : "FAIL"
    }`
  );

  console.log(
    `Old ID 666 absent                     : ${
      old666 === null ? "PASS" : "CHECK"
    }`
  );

  console.log(
    `Kibwezi ID 1361 exists                : ${
      kibweziRecord ? "YES" : "NO"
    }`
  );

  console.log(
    `Kibwezi ID 1361 has zero wards       : ${
      kibweziRecord?.wards.length === 0 ? "PASS" : "CHECK"
    }`
  );

  if (kibweziWest && kibweziEast) {
    const westWardIds = new Set(
      kibweziWest.wards.map((ward) => ward.id)
    );

    const eastWardIds = new Set(
      kibweziEast.wards.map((ward) => ward.id)
    );

    const overlap = [...westWardIds].filter((id) =>
      eastWardIds.has(id)
    );

    console.log(
      `West/East ward overlap                : ${
        overlap.length === 0 ? "PASS — NONE" : `CHECK — ${overlap.length}`
      }`
    );
  }

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