import { prisma } from "../lib/prisma";

let pass = 0;
let fail = 0;
let warn = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    pass++;
    console.log(`PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function warning(label: string, detail = "") {
  warn++;
  console.log(`WARN  ${label}${detail ? ` — ${detail}` : ""}`);
}

function section(title: string) {
  console.log("");
  console.log(title);
  console.log("=".repeat(title.length));
}

async function main() {
  console.log("============================================================");
  console.log("POSTGRESQL GEOGRAPHY + FARMER INTEGRITY AUDIT V29");
  console.log("============================================================");
  console.log("DATABASE: PostgreSQL via Prisma");
  console.log("READ-ONLY: SELECT ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("");

  /*
   * V29 deliberately uses SELECT-style Prisma operations only:
   *
   * findMany
   * findFirst
   * findUnique
   * count
   *
   * No create/update/delete/upsert operations are used.
   */

  section("1. NATIONAL GEOGRAPHY COUNTS");

  const countryCount = await prisma.country.count();
  const countyCount = await prisma.county.count();
  const subCountyCount = await prisma.subCounty.count();
  const constituencyCount = await prisma.constituency.count();
  const wardCount = await prisma.ward.count();
  const villageCount = await prisma.village.count();

  console.log(`Countries      : ${countryCount}`);
  console.log(`Counties       : ${countyCount}`);
  console.log(`SubCounties    : ${subCountyCount}`);
  console.log(`Constituencies : ${constituencyCount}`);
  console.log(`Wards          : ${wardCount}`);
  console.log(`Villages       : ${villageCount}`);

  check(
    "Country count is 2 or more",
    countryCount >= 2,
    `actual=${countryCount}`,
  );

  check(
    "County count is 47",
    countyCount === 47,
    `actual=${countyCount}`,
  );

  check(
    "SubCounty count is 301",
    subCountyCount === 301,
    `actual=${subCountyCount}`,
  );

  check(
    "Ward count is 1450",
    wardCount === 1450,
    `actual=${wardCount}`,
  );

  section("2. COUNTY → COUNTRY INTEGRITY");

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
      countryId: true,
    },
  });

  const countryIds = new Set(
    (
      await prisma.country.findMany({
        select: { id: true },
      })
    ).map((country) => country.id),
  );

  const orphanCounties = counties.filter(
    (county) => !countryIds.has(county.countryId),
  );

  check(
    "Every County references an existing Country",
    orphanCounties.length === 0,
    `invalid=${orphanCounties.length}`,
  );

  if (orphanCounties.length > 0) {
    console.log("Invalid County references:");
    for (const county of orphanCounties.slice(0, 20)) {
      console.log(
        `  County ${county.id} ${county.name} → countryId=${county.countryId}`,
      );
    }
  }

  section("3. SUBCOUNTY → COUNTY INTEGRITY");

  const subCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const countyIds = new Set(
    counties.map((county) => county.id),
  );

  const orphanSubCounties = subCounties.filter(
    (subCounty) => !countyIds.has(subCounty.countyId),
  );

  check(
    "Every SubCounty references an existing County",
    orphanSubCounties.length === 0,
    `invalid=${orphanSubCounties.length}`,
  );

  if (orphanSubCounties.length > 0) {
    console.log("Invalid SubCounty references:");
    for (const subCounty of orphanSubCounties.slice(0, 20)) {
      console.log(
        `  SubCounty ${subCounty.id} ${subCounty.name} → countyId=${subCounty.countyId}`,
      );
    }
  }

  section("4. CONSTITUENCY → COUNTY INTEGRITY");

  const constituencies = await prisma.constituency.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const orphanConstituencies = constituencies.filter(
    (constituency) => !countyIds.has(constituency.countyId),
  );

  check(
    "Every Constituency references an existing County",
    orphanConstituencies.length === 0,
    `invalid=${orphanConstituencies.length}`,
  );

  if (orphanConstituencies.length > 0) {
    console.log("Invalid Constituency references:");
    for (const constituency of orphanConstituencies.slice(0, 20)) {
      console.log(
        `  Constituency ${constituency.id} ${constituency.name} → countyId=${constituency.countyId}`,
      );
    }
  }

  section("5. WARD → COUNTY / SUBCOUNTY / CONSTITUENCY INTEGRITY");

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
    },
  });

  const subCountyById = new Map(
    subCounties.map((subCounty) => [
      subCounty.id,
      subCounty,
    ]),
  );

  const constituencyById = new Map(
    constituencies.map((constituency) => [
      constituency.id,
      constituency,
    ]),
  );

  const invalidWardCounty = wards.filter(
    (ward) => !countyIds.has(ward.countyId),
  );

  const invalidWardSubCounty = wards.filter(
    (ward) =>
      ward.subCountyId === null ||
      !subCountyById.has(ward.subCountyId),
  );

  const invalidWardConstituency = wards.filter(
    (ward) =>
      !constituencyById.has(ward.constituencyId),
  );

  const wardCountyMismatch = wards.filter((ward) => {
    const subCounty =
      ward.subCountyId === null
        ? null
        : subCountyById.get(ward.subCountyId);

    return (
      subCounty !== undefined &&
      subCounty !== null &&
      subCounty.countyId !== ward.countyId
    );
  });

  const wardConstituencyMismatch = wards.filter((ward) => {
    const constituency =
      constituencyById.get(ward.constituencyId);

    return (
      constituency !== undefined &&
      constituency.countyId !== ward.countyId
    );
  });

  check(
    "Every Ward references an existing County",
    invalidWardCounty.length === 0,
    `invalid=${invalidWardCounty.length}`,
  );

  check(
    "Every Ward references an existing SubCounty",
    invalidWardSubCounty.length === 0,
    `invalid=${invalidWardSubCounty.length}`,
  );

  check(
    "Every Ward references an existing Constituency",
    invalidWardConstituency.length === 0,
    `invalid=${invalidWardConstituency.length}`,
  );

  check(
    "Every Ward SubCounty belongs to Ward County",
    wardCountyMismatch.length === 0,
    `invalid=${wardCountyMismatch.length}`,
  );

  check(
    "Every Ward Constituency belongs to Ward County",
    wardConstituencyMismatch.length === 0,
    `invalid=${wardConstituencyMismatch.length}`,
  );

  if (
    invalidWardCounty.length > 0 ||
    invalidWardSubCounty.length > 0 ||
    invalidWardConstituency.length > 0 ||
    wardCountyMismatch.length > 0 ||
    wardConstituencyMismatch.length > 0
  ) {
    console.log("");
    console.log("Ward integrity exceptions:");

    for (const ward of invalidWardCounty.slice(0, 10)) {
      console.log(
        `  COUNTY ERROR: Ward ${ward.id} ${ward.name} → countyId=${ward.countyId}`,
      );
    }

    for (const ward of invalidWardSubCounty.slice(0, 10)) {
      console.log(
        `  SUBCOUNTY ERROR: Ward ${ward.id} ${ward.name} → subCountyId=${ward.subCountyId}`,
      );
    }

    for (const ward of invalidWardConstituency.slice(0, 10)) {
      console.log(
        `  CONSTITUENCY ERROR: Ward ${ward.id} ${ward.name} → constituencyId=${ward.constituencyId}`,
      );
    }

    for (const ward of wardCountyMismatch.slice(0, 10)) {
      const subCounty =
        ward.subCountyId === null
          ? null
          : subCountyById.get(ward.subCountyId);

      console.log(
        `  COUNTY MISMATCH: Ward ${ward.id} → wardCounty=${ward.countyId}, subCountyCounty=${subCounty?.countyId}`,
      );
    }

    for (const ward of wardConstituencyMismatch.slice(0, 10)) {
      const constituency =
        constituencyById.get(ward.constituencyId);

      console.log(
        `  CONSTITUENCY MISMATCH: Ward ${ward.id} → wardCounty=${ward.countyId}, constituencyCounty=${constituency?.countyId}`,
      );
    }
  }

  section("6. VILLAGE → WARD INTEGRITY");

  const villages = await prisma.village.findMany({
    select: {
      id: true,
      name: true,
      wardId: true,
    },
  });

  const wardIds = new Set(
    wards.map((ward) => ward.id),
  );

  const orphanVillages = villages.filter(
    (village) => !wardIds.has(village.wardId),
  );

  check(
    "Every Village references an existing Ward",
    orphanVillages.length === 0,
    `invalid=${orphanVillages.length}`,
  );

  if (orphanVillages.length > 0) {
    console.log("Invalid Village references:");

    for (const village of orphanVillages.slice(0, 20)) {
      console.log(
        `  Village ${village.id} ${village.name} → wardId=${village.wardId}`,
      );
    }
  }

  section("7. WARD → SUBCOUNTY → COUNTY CHAIN");

  const brokenWardChains = wards.filter((ward) => {
    if (ward.subCountyId === null) {
      return true;
    }

    const subCounty =
      subCountyById.get(ward.subCountyId);

    if (!subCounty) {
      return true;
    }

    return subCounty.countyId !== ward.countyId;
  });

  check(
    "Every Ward has a valid County/SubCounty chain",
    brokenWardChains.length === 0,
    `invalid=${brokenWardChains.length}`,
  );

  section("8. WARD → CONSTITUENCY → COUNTY CHAIN");

  const brokenConstituencyChains = wards.filter((ward) => {
    const constituency =
      constituencyById.get(ward.constituencyId);

    if (!constituency) {
      return true;
    }

    return constituency.countyId !== ward.countyId;
  });

  check(
    "Every Ward has a valid County/Constituency chain",
    brokenConstituencyChains.length === 0,
    `invalid=${brokenConstituencyChains.length}`,
  );

  section("9. DUPLICATE WARD NAMES WITHIN SUBCOUNTY");

  const wardNameGroups = new Map<string, typeof wards>();

  for (const ward of wards) {
    const key =
      `${ward.subCountyId}::${ward.name.trim().toLowerCase()}`;

    const existing = wardNameGroups.get(key);

    if (existing) {
      existing.push(ward);
    } else {
      wardNameGroups.set(key, [ward]);
    }
  }

  const duplicateWardGroups = [
    ...wardNameGroups.entries(),
  ].filter(([, rows]) => rows.length > 1);

  check(
    "No duplicate Ward names within a SubCounty",
    duplicateWardGroups.length === 0,
    `duplicateGroups=${duplicateWardGroups.length}`,
  );

  if (duplicateWardGroups.length > 0) {
    console.log("Duplicate Ward groups:");

    for (const [key, rows] of duplicateWardGroups.slice(0, 20)) {
      console.log(
        `  ${key} → ${rows.map((row) => `${row.id}:${row.name}`).join(", ")}`,
      );
    }
  }

  section("10. FARMER → COUNTY / SUBCOUNTY / WARD INTEGRITY");

  const farmerCount = await prisma.farmer.count();

  const farmers = await prisma.farmer.findMany({
    select: {
      id: true,
      userId: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      villageId: true,
    },
  });

  console.log(`Farmers: ${farmerCount}`);

  const farmerCountyErrors = farmers.filter(
    (farmer) => !countyIds.has(farmer.countyId),
  );

  const farmerSubCountyErrors = farmers.filter(
    (farmer) =>
      !subCountyById.has(farmer.subCountyId),
  );

  const farmerWardErrors = farmers.filter(
    (farmer) => !wardIds.has(farmer.wardId),
  );

  const farmerSubCountyCountyMismatch =
    farmers.filter((farmer) => {
      const subCounty =
        subCountyById.get(farmer.subCountyId);

      return (
        subCounty !== undefined &&
        subCounty.countyId !== farmer.countyId
      );
    });

  const farmerWardCountyMismatch =
    farmers.filter((farmer) => {
      const ward =
        wards.find((item) => item.id === farmer.wardId);

      return (
        ward !== undefined &&
        ward.countyId !== farmer.countyId
      );
    });

  const farmerWardSubCountyMismatch =
    farmers.filter((farmer) => {
      const ward =
        wards.find((item) => item.id === farmer.wardId);

      return (
        ward !== undefined &&
        ward.subCountyId !== farmer.subCountyId
      );
    });

  check(
    "Every Farmer references an existing County",
    farmerCountyErrors.length === 0,
    `invalid=${farmerCountyErrors.length}`,
  );

  check(
    "Every Farmer references an existing SubCounty",
    farmerSubCountyErrors.length === 0,
    `invalid=${farmerSubCountyErrors.length}`,
  );

  check(
    "Every Farmer references an existing Ward",
    farmerWardErrors.length === 0,
    `invalid=${farmerWardErrors.length}`,
  );

  check(
    "Every Farmer SubCounty belongs to Farmer County",
    farmerSubCountyCountyMismatch.length === 0,
    `invalid=${farmerSubCountyCountyMismatch.length}`,
  );

  check(
    "Every Farmer Ward belongs to Farmer County",
    farmerWardCountyMismatch.length === 0,
    `invalid=${farmerWardCountyMismatch.length}`,
  );

  check(
    "Every Farmer Ward belongs to Farmer SubCounty",
    farmerWardSubCountyMismatch.length === 0,
    `invalid=${farmerWardSubCountyMismatch.length}`,
  );

  section("11. FARMER → VILLAGE INTEGRITY");

  const villageById = new Map(
    villages.map((village) => [
      village.id,
      village,
    ]),
  );

  const farmerVillageErrors = farmers.filter(
    (farmer) =>
      farmer.villageId !== null &&
      !villageById.has(farmer.villageId),
  );

  const farmerVillageWardMismatch =
    farmers.filter((farmer) => {
      if (farmer.villageId === null) {
        return false;
      }

      const village =
        villageById.get(farmer.villageId);

      return (
        village !== undefined &&
        village.wardId !== farmer.wardId
      );
    });

  check(
    "Every non-null Farmer villageId references an existing Village",
    farmerVillageErrors.length === 0,
    `invalid=${farmerVillageErrors.length}`,
  );

  check(
    "Every Farmer Village belongs to Farmer Ward",
    farmerVillageWardMismatch.length === 0,
    `invalid=${farmerVillageWardMismatch.length}`,
  );

  section("12. FARMER → USER INTEGRITY");

  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  const userIds = new Set(
    users.map((user) => user.id),
  );

  const orphanFarmers = farmers.filter(
    (farmer) => !userIds.has(farmer.userId),
  );

  check(
    "Every Farmer references an existing User",
    orphanFarmers.length === 0,
    `invalid=${orphanFarmers.length}`,
  );

  if (orphanFarmers.length > 0) {
    console.log("Orphan Farmer User references:");

    for (const farmer of orphanFarmers.slice(0, 20)) {
      console.log(
        `  Farmer ${farmer.id} → userId=${farmer.userId}`,
      );
    }
  }

  section("13. FARM → FARMER INTEGRITY");

  const farmCount = await prisma.farm.count();

  const farms = await prisma.farm.findMany({
    select: {
      id: true,
      farmerId: true,
      countryId: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      villageId: true,
      farmName: true,
      acreage: true,
    },
  });

  console.log(`Farms: ${farmCount}`);

  const farmerIds = new Set(
    farmers.map((farmer) => farmer.id),
  );

  const orphanFarms = farms.filter(
    (farm) => !farmerIds.has(farm.farmerId),
  );

  check(
    "Every Farm references an existing Farmer",
    orphanFarms.length === 0,
    `invalid=${orphanFarms.length}`,
  );

  if (orphanFarms.length > 0) {
    console.log("Orphan Farm references:");

    for (const farm of orphanFarms.slice(0, 20)) {
      console.log(
        `  Farm ${farm.id} → farmerId=${farm.farmerId}`,
      );
    }
  }

  section("14. FARM GEOGRAPHY INTEGRITY");

  const farmCountyErrors = farms.filter(
    (farm) => !countyIds.has(farm.countyId),
  );

  const farmSubCountyErrors = farms.filter(
    (farm) => !subCountyById.has(farm.subCountyId),
  );

  const farmWardErrors = farms.filter(
    (farm) => !wardIds.has(farm.wardId),
  );

  const farmSubCountyCountyMismatch =
    farms.filter((farm) => {
      const subCounty =
        subCountyById.get(farm.subCountyId);

      return (
        subCounty !== undefined &&
        subCounty.countyId !== farm.countyId
      );
    });

  const farmWardCountyMismatch =
    farms.filter((farm) => {
      const ward =
        wards.find((item) => item.id === farm.wardId);

      return (
        ward !== undefined &&
        ward.countyId !== farm.countyId
      );
    });

  const farmWardSubCountyMismatch =
    farms.filter((farm) => {
      const ward =
        wards.find((item) => item.id === farm.wardId);

      return (
        ward !== undefined &&
        ward.subCountyId !== farm.subCountyId
      );
    });

  check(
    "Every Farm references an existing County",
    farmCountyErrors.length === 0,
    `invalid=${farmCountyErrors.length}`,
  );

  check(
    "Every Farm references an existing SubCounty",
    farmSubCountyErrors.length === 0,
    `invalid=${farmSubCountyErrors.length}`,
  );

  check(
    "Every Farm references an existing Ward",
    farmWardErrors.length === 0,
    `invalid=${farmWardErrors.length}`,
  );

  check(
    "Every Farm SubCounty belongs to Farm County",
    farmSubCountyCountyMismatch.length === 0,
    `invalid=${farmSubCountyCountyMismatch.length}`,
  );

  check(
    "Every Farm Ward belongs to Farm County",
    farmWardCountyMismatch.length === 0,
    `invalid=${farmWardCountyMismatch.length}`,
  );

  check(
    "Every Farm Ward belongs to Farm SubCounty",
    farmWardSubCountyMismatch.length === 0,
    `invalid=${farmWardSubCountyMismatch.length}`,
  );

  section("15. FARM → VILLAGE INTEGRITY");

  const farmVillageErrors = farms.filter(
    (farm) =>
      farm.villageId !== null &&
      !villageById.has(farm.villageId),
  );

  const farmVillageWardMismatch =
    farms.filter((farm) => {
      if (farm.villageId === null) {
        return false;
      }

      const village =
        villageById.get(farm.villageId);

      return (
        village !== undefined &&
        village.wardId !== farm.wardId
      );
    });

  check(
    "Every non-null Farm villageId references an existing Village",
    farmVillageErrors.length === 0,
    `invalid=${farmVillageErrors.length}`,
  );

  check(
    "Every Farm Village belongs to Farm Ward",
    farmVillageWardMismatch.length === 0,
    `invalid=${farmVillageWardMismatch.length}`,
  );

  section("16. FARMER ↔ FARM GEOGRAPHY CONSISTENCY");

  const farmerById = new Map(
    farmers.map((farmer) => [
      farmer.id,
      farmer,
    ]),
  );

  const farmFarmerCountyMismatch =
    farms.filter((farm) => {
      const farmer =
        farmerById.get(farm.farmerId);

      return (
        farmer !== undefined &&
        farmer.countyId !== farm.countyId
      );
    });

  const farmFarmerSubCountyMismatch =
    farms.filter((farm) => {
      const farmer =
        farmerById.get(farm.farmerId);

      return (
        farmer !== undefined &&
        farmer.subCountyId !== farm.subCountyId
      );
    });

  const farmFarmerWardMismatch =
    farms.filter((farm) => {
      const farmer =
        farmerById.get(farm.farmerId);

      return (
        farmer !== undefined &&
        farmer.wardId !== farm.wardId
      );
    });

  check(
    "Farm County matches Farmer County",
    farmFarmerCountyMismatch.length === 0,
    `invalid=${farmFarmerCountyMismatch.length}`,
  );

  check(
    "Farm SubCounty matches Farmer SubCounty",
    farmFarmerSubCountyMismatch.length === 0,
    `invalid=${farmFarmerSubCountyMismatch.length}`,
  );

  check(
    "Farm Ward matches Farmer Ward",
    farmFarmerWardMismatch.length === 0,
    `invalid=${farmFarmerWardMismatch.length}`,
  );

  section("17. TIATY PRODUCTION INTEGRITY");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Tiaty 757 exists",
    tiaty !== null,
    tiaty ? `${tiaty.id}` : "missing",
  );

  if (tiaty) {
    check(
      "Tiaty 757 has canonical name",
      tiaty.name === "Tiaty",
      `name=${tiaty.name}`,
    );

    check(
      "Tiaty 757 belongs to Baringo 90",
      tiaty.countyId === 90,
      `countyId=${tiaty.countyId}`,
    );
  }

  const tiatyWards = await prisma.ward.findMany({
    where: {
      countyId: 90,
      subCountyId: 757,
      constituencyId: 463,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const canonicalTiatyWardIds = [
    1837,
    1838,
    1839,
    1840,
    1841,
    2190,
    2193,
  ];

  const actualTiatyWardIds =
    tiatyWards.map((ward) => ward.id);

  check(
    "Tiaty has exactly 7 wards",
    tiatyWards.length === 7,
    `actual=${tiatyWards.length}`,
  );

  check(
    "Tiaty contains all canonical Ward IDs",
    JSON.stringify(actualTiatyWardIds) ===
      JSON.stringify(canonicalTiatyWardIds),
    `actual=${actualTiatyWardIds.join(",")}`,
  );

  section("18. LANG'ATA PRODUCTION GUARD");

  const langata = await prisma.subCounty.findUnique({
    where: {
      id: 1577,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Lang'ata 1577 exists",
    langata !== null,
    langata ? `${langata.id}` : "missing",
  );

  if (langata) {
    check(
      "Lang'ata has canonical name",
      langata.name === "Lang'ata",
      `name=${langata.name}`,
    );

    check(
      "Lang'ata belongs to Nairobi City 79",
      langata.countyId === 79,
      `countyId=${langata.countyId}`,
    );
  }

  const langataWards = await prisma.ward.findMany({
    where: {
      countyId: 79,
      subCountyId: 1577,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  check(
    "Lang'ata has exactly 5 wards",
    langataWards.length === 5,
    `actual=${langataWards.length}`,
  );

  section("19. KNOWN HISTORICAL IDS ABSENCE");

  const historicalSubCountyIds = [
    463,
  ];

  const historicalWardIds = [
    2629,
    2630,
    2631,
    2632,
  ];

  const historicalSubCountyRows =
    await prisma.subCounty.findMany({
      where: {
        id: {
          in: historicalSubCountyIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

  const historicalWardRows =
    await prisma.ward.findMany({
      where: {
        id: {
          in: historicalWardIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

  check(
    "Historical obsolete SubCounty ID 463 is absent",
    historicalSubCountyRows.length === 0,
    `found=${historicalSubCountyRows.length}`,
  );

  check(
    "Historical obsolete Ward IDs 2629-2632 are absent",
    historicalWardRows.length === 0,
    `found=${historicalWardRows.length}`,
  );

  section("20. FINAL DATABASE INTEGRITY SUMMARY");

  /*
   * V29 is intentionally conservative:
   *
   * PASS = no integrity violation was found.
   * FAIL = an actual database relationship inconsistency was found.
   * WARN = informational boundary that does not indicate corruption.
   */

  warning(
    "Authenticated Farmer mutation was not executed",
    "V29 is SELECT-only and does not create/update/delete application data",
  );

  console.log("");
  console.log("============================================================");
  console.log("POSTGRESQL GEOGRAPHY + FARMER INTEGRITY AUDIT V29 RESULT");
  console.log("============================================================");
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`WARN: ${warn}`);
  console.log(`TOTAL CHECKS: ${pass + fail}`);
  console.log("");

  if (fail === 0) {
    console.log("STATUS: GREEN");
    console.log(
      "PostgreSQL geography and Farmer/Farm referential integrity are clean.",
    );
  } else {
    console.log("STATUS: RED");
    console.log(
      "Database integrity violations were detected. Do NOT repair automatically until the specific FAIL records are reviewed.",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY GUARANTEE: V29 performed SELECT/count/find operations only. No INSERT, UPDATE, DELETE, or UPSERT was executed.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("V29 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });