import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

type CheckResult = {
  section: string;
  message: string;
  pass: boolean;
  details?: string;
};

const results: CheckResult[] = [];

function check(
  section: string,
  message: string,
  condition: boolean,
  details = "",
) {
  results.push({
    section,
    message,
    pass: condition,
    details,
  });

  const status = condition ? "PASS" : "FAIL";
  console.log(
    `${status}  ${message}${details ? ` — ${details}` : ""}`,
  );
}

function section(title: string) {
  console.log("");
  console.log(title);
  console.log("=".repeat(title.length));
}

async function main() {
  console.log("============================================================");
  console.log("POSTGRESQL PRODUCTION READINESS AUDIT V30");
  console.log("============================================================");
  console.log("DATABASE: PostgreSQL via Prisma");
  console.log("READ-ONLY: SELECT ONLY");
  console.log("NO INSERT / UPDATE / DELETE / UPSERT");
  console.log("");

  /*
   * ----------------------------------------------------------
   * 1. NATIONAL DATABASE COUNTS
   * ----------------------------------------------------------
   */

  section("1. NATIONAL DATABASE COUNTS");

  const [
    countryCount,
    countyCount,
    subCountyCount,
    constituencyCount,
    wardCount,
    villageCount,
    userCount,
    farmerCount,
    farmCount,
  ] = await Promise.all([
    prisma.country.count(),
    prisma.county.count(),
    prisma.subCounty.count(),
    prisma.constituency.count(),
    prisma.ward.count(),
    prisma.village.count(),
    prisma.user.count(),
    prisma.farmer.count(),
    prisma.farm.count(),
  ]);

  console.log(`Countries      : ${countryCount}`);
  console.log(`Counties       : ${countyCount}`);
  console.log(`SubCounties    : ${subCountyCount}`);
  console.log(`Constituencies : ${constituencyCount}`);
  console.log(`Wards          : ${wardCount}`);
  console.log(`Villages       : ${villageCount}`);
  console.log(`Users          : ${userCount}`);
  console.log(`Farmers        : ${farmerCount}`);
  console.log(`Farms          : ${farmCount}`);

  check(
    "National counts",
    "County count is 47",
    countyCount === 47,
    `actual=${countyCount}`,
  );

  check(
    "National counts",
    "SubCounty count is 301",
    subCountyCount === 301,
    `actual=${subCountyCount}`,
  );

  check(
    "National counts",
    "Ward count is 1450",
    wardCount === 1450,
    `actual=${wardCount}`,
  );

  check(
    "National counts",
    "Country count is at least 2",
    countryCount >= 2,
    `actual=${countryCount}`,
  );

  /*
   * ----------------------------------------------------------
   * 2. DATABASE CONSTRAINT / RELATIONSHIP READINESS
   * ----------------------------------------------------------
   */

  section("2. COUNTY → COUNTRY INTEGRITY");

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      countryId: true,
    },
  });

  const countries = await prisma.country.findMany({
    select: {
      id: true,
    },
  });

  const countryIds = new Set(countries.map((c) => c.id));

  const invalidCounties = counties.filter(
    (c) => !countryIds.has(c.countryId),
  );

  check(
    "County → Country",
    "Every County references an existing Country",
    invalidCounties.length === 0,
    `invalid=${invalidCounties.length}`,
  );

  section("3. SUBCOUNTY → COUNTY INTEGRITY");

  const subCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      countyId: true,
    },
  });

  const countyIds = new Set(counties.map((c) => c.id));

  const invalidSubCounties = subCounties.filter(
    (sc) => !countyIds.has(sc.countyId),
  );

  check(
    "SubCounty → County",
    "Every SubCounty references an existing County",
    invalidSubCounties.length === 0,
    `invalid=${invalidSubCounties.length}`,
  );

  section("4. CONSTITUENCY → COUNTY INTEGRITY");

  const constituencies = await prisma.constituency.findMany({
    select: {
      id: true,
      countyId: true,
    },
  });

  const invalidConstituencies = constituencies.filter(
    (con) => !countyIds.has(con.countyId),
  );

  check(
    "Constituency → County",
    "Every Constituency references an existing County",
    invalidConstituencies.length === 0,
    `invalid=${invalidConstituencies.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 5. WARD INTEGRITY
   * ----------------------------------------------------------
   */

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

  const subCountyMap = new Map(
    subCounties.map((sc) => [sc.id, sc]),
  );

  const constituencyMap = new Map(
    constituencies.map((con) => [con.id, con]),
  );

  const invalidWardCounty = wards.filter(
    (w) => !countyIds.has(w.countyId),
  );

  const invalidWardSubCounty = wards.filter(
    (w) =>
      w.subCountyId === null ||
      !subCountyMap.has(w.subCountyId),
  );

  const invalidWardConstituency = wards.filter(
    (w) => !constituencyMap.has(w.constituencyId),
  );

  const invalidWardSubCountyCounty = wards.filter((w) => {
    if (w.subCountyId === null) {
      return true;
    }

    const sc = subCountyMap.get(w.subCountyId);

    return !sc || sc.countyId !== w.countyId;
  });

  const invalidWardConstituencyCounty = wards.filter((w) => {
    const con = constituencyMap.get(w.constituencyId);

    return !con || con.countyId !== w.countyId;
  });

  check(
    "Ward → County",
    "Every Ward references an existing County",
    invalidWardCounty.length === 0,
    `invalid=${invalidWardCounty.length}`,
  );

  check(
    "Ward → SubCounty",
    "Every Ward references an existing SubCounty",
    invalidWardSubCounty.length === 0,
    `invalid=${invalidWardSubCounty.length}`,
  );

  check(
    "Ward → Constituency",
    "Every Ward references an existing Constituency",
    invalidWardConstituency.length === 0,
    `invalid=${invalidWardConstituency.length}`,
  );

  check(
    "Ward hierarchy",
    "Every Ward SubCounty belongs to Ward County",
    invalidWardSubCountyCounty.length === 0,
    `invalid=${invalidWardSubCountyCounty.length}`,
  );

  check(
    "Ward hierarchy",
    "Every Ward Constituency belongs to Ward County",
    invalidWardConstituencyCounty.length === 0,
    `invalid=${invalidWardConstituencyCounty.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 6. VILLAGE INTEGRITY
   * ----------------------------------------------------------
   */

  section("6. VILLAGE → WARD INTEGRITY");

  const villages = await prisma.village.findMany({
    select: {
      id: true,
      wardId: true,
    },
  });

  const wardIds = new Set(wards.map((w) => w.id));

  const invalidVillages = villages.filter(
    (v) => !wardIds.has(v.wardId),
  );

  check(
    "Village → Ward",
    "Every Village references an existing Ward",
    invalidVillages.length === 0,
    `invalid=${invalidVillages.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 7. WARD → SUBCOUNTY → COUNTY CHAIN
   * ----------------------------------------------------------
   */

  section("7. WARD → SUBCOUNTY → COUNTY CHAIN");

  const brokenWardSubCountyChain = wards.filter((w) => {
    if (w.subCountyId === null) {
      return true;
    }

    const sc = subCountyMap.get(w.subCountyId);

    return !sc || sc.countyId !== w.countyId;
  });

  check(
    "Ward hierarchy",
    "Every Ward has a valid County/SubCounty chain",
    brokenWardSubCountyChain.length === 0,
    `invalid=${brokenWardSubCountyChain.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 8. WARD → CONSTITUENCY → COUNTY CHAIN
   * ----------------------------------------------------------
   */

  section("8. WARD → CONSTITUENCY → COUNTY CHAIN");

  const brokenWardConstituencyChain = wards.filter((w) => {
    const con = constituencyMap.get(w.constituencyId);

    return !con || con.countyId !== w.countyId;
  });

  check(
    "Ward hierarchy",
    "Every Ward has a valid County/Constituency chain",
    brokenWardConstituencyChain.length === 0,
    `invalid=${brokenWardConstituencyChain.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 9. DUPLICATE WARD NAMES
   * ----------------------------------------------------------
   */

  section("9. DUPLICATE WARD NAMES WITHIN SUBCOUNTY");

  const wardNameGroups = new Map<string, number>();

  for (const ward of wards) {
    const key = `${ward.subCountyId}::${ward.name
      .trim()
      .toLowerCase()}`;

    wardNameGroups.set(
      key,
      (wardNameGroups.get(key) ?? 0) + 1,
    );
  }

  const duplicateWardGroups = [...wardNameGroups.entries()].filter(
    ([, count]) => count > 1,
  );

  check(
    "Ward uniqueness",
    "No duplicate Ward names within a SubCounty",
    duplicateWardGroups.length === 0,
    `duplicateGroups=${duplicateWardGroups.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 10. FARMER INTEGRITY
   * ----------------------------------------------------------
   */

  section("10. FARMER → USER / GEOGRAPHY INTEGRITY");

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

  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  const userIds = new Set(users.map((u) => u.id));

  const invalidFarmerUsers = farmers.filter(
    (f) => !userIds.has(f.userId),
  );

  const invalidFarmerCounties = farmers.filter(
    (f) => !countyIds.has(f.countyId),
  );

  const invalidFarmerSubCounties = farmers.filter(
    (f) => !subCountyMap.has(f.subCountyId),
  );

  const invalidFarmerWards = farmers.filter(
    (f) => !wardIds.has(f.wardId),
  );

  const invalidFarmerCountyWard = farmers.filter((f) => {
    const w = wards.find((ward) => ward.id === f.wardId);

    return !w || w.countyId !== f.countyId;
  });

  const invalidFarmerSubCountyWard = farmers.filter((f) => {
    const w = wards.find((ward) => ward.id === f.wardId);

    return !w || w.subCountyId !== f.subCountyId;
  });

  console.log(`Farmers: ${farmers.length}`);

  check(
    "Farmer → User",
    "Every Farmer references an existing User",
    invalidFarmerUsers.length === 0,
    `invalid=${invalidFarmerUsers.length}`,
  );

  check(
    "Farmer → County",
    "Every Farmer references an existing County",
    invalidFarmerCounties.length === 0,
    `invalid=${invalidFarmerCounties.length}`,
  );

  check(
    "Farmer → SubCounty",
    "Every Farmer references an existing SubCounty",
    invalidFarmerSubCounties.length === 0,
    `invalid=${invalidFarmerSubCounties.length}`,
  );

  check(
    "Farmer → Ward",
    "Every Farmer references an existing Ward",
    invalidFarmerWards.length === 0,
    `invalid=${invalidFarmerWards.length}`,
  );

  check(
    "Farmer geography",
    "Every Farmer Ward belongs to Farmer County",
    invalidFarmerCountyWard.length === 0,
    `invalid=${invalidFarmerCountyWard.length}`,
  );

  check(
    "Farmer geography",
    "Every Farmer Ward belongs to Farmer SubCounty",
    invalidFarmerSubCountyWard.length === 0,
    `invalid=${invalidFarmerSubCountyWard.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 11. FARMER → VILLAGE
   * ----------------------------------------------------------
   */

  section("11. FARMER → VILLAGE INTEGRITY");

  const villageMap = new Map(
    villages.map((v) => [v.id, v]),
  );

  const invalidFarmerVillages = farmers.filter((f) => {
    if (f.villageId === null) {
      return false;
    }

    return !villageMap.has(f.villageId);
  });

  const invalidFarmerVillageWard = farmers.filter((f) => {
    if (f.villageId === null) {
      return false;
    }

    const village = villageMap.get(f.villageId);

    return !village || village.wardId !== f.wardId;
  });

  check(
    "Farmer → Village",
    "Every non-null Farmer villageId references an existing Village",
    invalidFarmerVillages.length === 0,
    `invalid=${invalidFarmerVillages.length}`,
  );

  check(
    "Farmer → Village",
    "Every Farmer Village belongs to Farmer Ward",
    invalidFarmerVillageWard.length === 0,
    `invalid=${invalidFarmerVillageWard.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 12. FARM INTEGRITY
   * ----------------------------------------------------------
   */

  section("12. FARM → FARMER INTEGRITY");

  const farms = await prisma.farm.findMany({
    select: {
      id: true,
      farmerId: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      villageId: true,
    },
  });

  const farmerIds = new Set(farmers.map((f) => f.id));

  const invalidFarmFarmers = farms.filter(
    (farm) => !farmerIds.has(farm.farmerId),
  );

  console.log(`Farms: ${farms.length}`);

  check(
    "Farm → Farmer",
    "Every Farm references an existing Farmer",
    invalidFarmFarmers.length === 0,
    `invalid=${invalidFarmFarmers.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 13. FARM GEOGRAPHY
   * ----------------------------------------------------------
   */

  section("13. FARM GEOGRAPHY INTEGRITY");

  const invalidFarmCounties = farms.filter(
    (farm) => !countyIds.has(farm.countyId),
  );

  const invalidFarmSubCounties = farms.filter(
    (farm) => !subCountyMap.has(farm.subCountyId),
  );

  const invalidFarmWards = farms.filter(
    (farm) => !wardIds.has(farm.wardId),
  );

  const invalidFarmCountyWard = farms.filter((farm) => {
    const w = wards.find((ward) => ward.id === farm.wardId);

    return !w || w.countyId !== farm.countyId;
  });

  const invalidFarmSubCountyWard = farms.filter((farm) => {
    const w = wards.find((ward) => ward.id === farm.wardId);

    return !w || w.subCountyId !== farm.subCountyId;
  });

  check(
    "Farm → County",
    "Every Farm references an existing County",
    invalidFarmCounties.length === 0,
    `invalid=${invalidFarmCounties.length}`,
  );

  check(
    "Farm → SubCounty",
    "Every Farm references an existing SubCounty",
    invalidFarmSubCounties.length === 0,
    `invalid=${invalidFarmSubCounties.length}`,
  );

  check(
    "Farm → Ward",
    "Every Farm references an existing Ward",
    invalidFarmWards.length === 0,
    `invalid=${invalidFarmWards.length}`,
  );

  check(
    "Farm geography",
    "Every Farm SubCounty belongs to Farm County",
    invalidFarmCountyWard.length === 0,
    `invalid=${invalidFarmCountyWard.length}`,
  );

  check(
    "Farm geography",
    "Every Farm Ward belongs to Farm SubCounty",
    invalidFarmSubCountyWard.length === 0,
    `invalid=${invalidFarmSubCountyWard.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 14. FARM → VILLAGE
   * ----------------------------------------------------------
   */

  section("14. FARM → VILLAGE INTEGRITY");

  const invalidFarmVillages = farms.filter((farm) => {
    if (farm.villageId === null) {
      return false;
    }

    return !villageMap.has(farm.villageId);
  });

  const invalidFarmVillageWard = farms.filter((farm) => {
    if (farm.villageId === null) {
      return false;
    }

    const village = villageMap.get(farm.villageId);

    return !village || village.wardId !== farm.wardId;
  });

  check(
    "Farm → Village",
    "Every non-null Farm villageId references an existing Village",
    invalidFarmVillages.length === 0,
    `invalid=${invalidFarmVillages.length}`,
  );

  check(
    "Farm → Village",
    "Every Farm Village belongs to Farm Ward",
    invalidFarmVillageWard.length === 0,
    `invalid=${invalidFarmVillageWard.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 15. FARM ↔ FARMER GEOGRAPHY
   * ----------------------------------------------------------
   */

  section("15. FARMER ↔ FARM GEOGRAPHY CONSISTENCY");

  const farmerMap = new Map(
    farmers.map((farmer) => [farmer.id, farmer]),
  );

  const invalidFarmFarmerCounty = farms.filter((farm) => {
    const farmer = farmerMap.get(farm.farmerId);

    return !farmer || farm.countyId !== farmer.countyId;
  });

  const invalidFarmFarmerSubCounty = farms.filter((farm) => {
    const farmer = farmerMap.get(farm.farmerId);

    return !farmer || farm.subCountyId !== farmer.subCountyId;
  });

  const invalidFarmFarmerWard = farms.filter((farm) => {
    const farmer = farmerMap.get(farm.farmerId);

    return !farmer || farm.wardId !== farmer.wardId;
  });

  check(
    "Farm ↔ Farmer",
    "Farm County matches Farmer County",
    invalidFarmFarmerCounty.length === 0,
    `invalid=${invalidFarmFarmerCounty.length}`,
  );

  check(
    "Farm ↔ Farmer",
    "Farm SubCounty matches Farmer SubCounty",
    invalidFarmFarmerSubCounty.length === 0,
    `invalid=${invalidFarmFarmerSubCounty.length}`,
  );

  check(
    "Farm ↔ Farmer",
    "Farm Ward matches Farmer Ward",
    invalidFarmFarmerWard.length === 0,
    `invalid=${invalidFarmFarmerWard.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 16. TIATY PRODUCTION GUARD
   * ----------------------------------------------------------
   */

  section("16. TIATY PRODUCTION INTEGRITY");

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
    "Tiaty",
    "Tiaty 757 exists",
    tiaty !== null,
    `757=${tiaty?.id ?? "missing"}`,
  );

  check(
    "Tiaty",
    "Tiaty 757 has canonical name",
    tiaty?.name === "Tiaty",
    `name=${tiaty?.name ?? "missing"}`,
  );

  check(
    "Tiaty",
    "Tiaty 757 belongs to Baringo 90",
    tiaty?.countyId === 90,
    `countyId=${tiaty?.countyId ?? "missing"}`,
  );

  const tiatyWards = wards
    .filter((w) => w.subCountyId === 757)
    .sort((a, b) => a.id - b.id);

  const expectedTiatyWardIds = [
    1837,
    1838,
    1839,
    1840,
    1841,
    2190,
    2193,
  ];

  const actualTiatyWardIds = tiatyWards.map((w) => w.id);

  check(
    "Tiaty",
    "Tiaty has exactly 7 wards",
    tiatyWards.length === 7,
    `actual=${tiatyWards.length}`,
  );

  check(
    "Tiaty",
    "Tiaty contains all canonical Ward IDs",
    JSON.stringify(actualTiatyWardIds) ===
      JSON.stringify(expectedTiatyWardIds),
    `actual=${actualTiatyWardIds.join(",")}`,
  );

  /*
   * ----------------------------------------------------------
   * 17. LANG'ATA PRODUCTION GUARD
   * ----------------------------------------------------------
   */

  section("17. LANG'ATA PRODUCTION GUARD");

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
    "Lang'ata",
    "Lang'ata 1577 exists",
    langata !== null,
    `1577=${langata?.id ?? "missing"}`,
  );

  check(
    "Lang'ata",
    "Lang'ata has canonical name",
    langata?.name === "Lang'ata",
    `name=${langata?.name ?? "missing"}`,
  );

  check(
    "Lang'ata",
    "Lang'ata belongs to Nairobi City 79",
    langata?.countyId === 79,
    `countyId=${langata?.countyId ?? "missing"}`,
  );

  const langataWardCount = wards.filter(
    (w) => w.subCountyId === 1577,
  ).length;

  check(
    "Lang'ata",
    "Lang'ata has exactly 5 wards",
    langataWardCount === 5,
    `actual=${langataWardCount}`,
  );

  /*
   * ----------------------------------------------------------
   * 18. HISTORICAL IDS
   * ----------------------------------------------------------
   */

  section("18. KNOWN HISTORICAL IDS ABSENCE");

  const historicalSubCounty = await prisma.subCounty.findUnique({
    where: {
      id: 463,
    },
    select: {
      id: true,
    },
  });

  const historicalWards = await prisma.ward.findMany({
    where: {
      id: {
        in: [2629, 2630, 2631, 2632],
      },
    },
    select: {
      id: true,
    },
  });

  check(
    "Historical IDs",
    "Historical obsolete SubCounty ID 463 is absent",
    historicalSubCounty === null,
    `found=${historicalSubCounty ? 1 : 0}`,
  );

  check(
    "Historical IDs",
    "Historical obsolete Ward IDs 2629-2632 are absent",
    historicalWards.length === 0,
    `found=${historicalWards.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 19. DATABASE COMPLETENESS
   * ----------------------------------------------------------
   */

  section("19. DATABASE COMPLETENESS");

  const incompleteFarmers = farmers.filter(
    (f) =>
      f.countyId === null ||
      f.subCountyId === null ||
      f.wardId === null,
  );

  const incompleteFarms = farms.filter(
    (farm) =>
      farm.countyId === null ||
      farm.subCountyId === null ||
      farm.wardId === null,
  );

  check(
    "Farmer completeness",
    "Every Farmer has County, SubCounty and Ward",
    incompleteFarmers.length === 0,
    `incomplete=${incompleteFarmers.length}`,
  );

  check(
    "Farm completeness",
    "Every Farm has County, SubCounty and Ward",
    incompleteFarms.length === 0,
    `incomplete=${incompleteFarms.length}`,
  );

  /*
   * ----------------------------------------------------------
   * 20. RUNTIME SOURCE GUARDS
   * ----------------------------------------------------------
   */

  section("20. RUNTIME SOURCE GUARDS");

  const projectRoot = process.cwd();

  const farmerRoutePath = path.join(
    projectRoot,
    "app",
    "api",
    "farmers",
    "route.ts",
  );

  const wardsRoutePath = path.join(
    projectRoot,
    "app",
    "api",
    "locations",
    "wards",
    "route.ts",
  );

  const farmerFormPath = path.join(
    projectRoot,
    "components",
    "FarmerFarmForm.tsx",
  );

  const farmerRouteExists = fs.existsSync(farmerRoutePath);
  const wardsRouteExists = fs.existsSync(wardsRoutePath);
  const farmerFormExists = fs.existsSync(farmerFormPath);

  check(
    "Runtime source",
    "Farmer API route exists",
    farmerRouteExists,
    farmerRoutePath,
  );

  check(
    "Runtime source",
    "Wards location API route exists",
    wardsRouteExists,
    wardsRoutePath,
  );

  check(
    "Runtime source",
    "Farmer registration form exists",
    farmerFormExists,
    farmerFormPath,
  );

  /*
   * ----------------------------------------------------------
   * 21. FINAL SUMMARY
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log(
    "POSTGRESQL PRODUCTION READINESS AUDIT V30 RESULT",
  );
  console.log("============================================================");

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.filter((r) => !r.pass).length;

  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`TOTAL CHECKS: ${results.length}`);
  console.log("");

  if (failCount === 0) {
    console.log("STATUS: GREEN");
    console.log(
      "PostgreSQL geography, Farmer/Farm integrity, production guards, and runtime source presence are clean.",
    );
  } else {
    console.log("STATUS: RED");
    console.log(
      "One or more production-readiness checks failed.",
    );

    console.log("");
    console.log("FAILED CHECKS");
    console.log("-------------");

    for (const result of results.filter((r) => !r.pass)) {
      console.log(
        `FAIL  ${result.message}${result.details ? ` — ${result.details}` : ""}`,
      );
    }
  }

  console.log("");
  console.log(
    "READ-ONLY GUARANTEE: V30 performed SELECT/count/find operations only.",
  );
  console.log(
    "No INSERT, UPDATE, DELETE, or UPSERT was executed.",
  );

  await prisma.$disconnect();

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error("");
  console.error("============================================================");
  console.error("V30 AUDIT ERROR");
  console.error("============================================================");
  console.error(error);

  await prisma.$disconnect();

  process.exitCode = 1;
});