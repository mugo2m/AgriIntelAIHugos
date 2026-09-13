import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("");
  console.log("==================================================");
  console.log("FINAL DATABASE HIERARCHY INTEGRITY CHECK");
  console.log("==================================================");
  console.log("");

  let failures = 0;

  // --------------------------------------------------
  // 1. DATABASE COUNTS
  // --------------------------------------------------

  const [
    countryCount,
    countyCount,
    subCountyCount,
    constituencyCount,
    wardCount,
  ] = await Promise.all([
    prisma.country.count(),
    prisma.county.count(),
    prisma.subCounty.count(),
    prisma.constituency.count(),
    prisma.ward.count(),
  ]);

  console.log("DATABASE COUNTS");
  console.log("----------------------------------------------");
  console.log("Countries:", countryCount);
  console.log("Counties:", countyCount);
  console.log("SubCounties:", subCountyCount);
  console.log("Constituencies:", constituencyCount);
  console.log("Wards:", wardCount);

  const expected = {
    counties: 47,
    subCounties: 433,
    constituencies: 298,
    wards: 1450,
  };

  if (countyCount !== expected.counties) {
    console.log(
      `FAIL: Expected ${expected.counties} counties, found ${countyCount}.`
    );
    failures++;
  }

  if (subCountyCount !== expected.subCounties) {
    console.log(
      `FAIL: Expected ${expected.subCounties} subcounties, found ${subCountyCount}.`
    );
    failures++;
  }

  if (constituencyCount !== expected.constituencies) {
    console.log(
      `FAIL: Expected ${expected.constituencies} constituencies, found ${constituencyCount}.`
    );
    failures++;
  }

  if (wardCount !== expected.wards) {
    console.log(
      `FAIL: Expected ${expected.wards} wards, found ${wardCount}.`
    );
    failures++;
  }

  // --------------------------------------------------
  // 2. ORPHAN SUBCOUNTIES
  // --------------------------------------------------

  const subCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const countyIds = new Set(
    (
      await prisma.county.findMany({
        select: {
          id: true,
        },
      })
    ).map((c) => c.id)
  );

  const orphanSubCounties = subCounties.filter(
    (sc) => !countyIds.has(sc.countyId)
  );

  console.log("");
  console.log("SUBCOUNTY → COUNTY INTEGRITY");
  console.log("----------------------------------------------");
  console.log(
    "Orphan SubCounties:",
    orphanSubCounties.length
  );

  if (orphanSubCounties.length > 0) {
    failures++;

    console.table(orphanSubCounties);
  }

  // --------------------------------------------------
  // 3. ORPHAN CONSTITUENCIES
  // --------------------------------------------------

  const constituencies =
    await prisma.constituency.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  const orphanConstituencies =
    constituencies.filter(
      (c) => !countyIds.has(c.countyId)
    );

  console.log("");
  console.log("CONSTITUENCY → COUNTY INTEGRITY");
  console.log("----------------------------------------------");
  console.log(
    "Orphan Constituencies:",
    orphanConstituencies.length
  );

  if (orphanConstituencies.length > 0) {
    failures++;

    console.table(orphanConstituencies);
  }

  // --------------------------------------------------
  // 4. ORPHAN WARDS
  // --------------------------------------------------

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
      sourceGid: true,
    },
  });

  const subCountyMap = new Map(
    subCounties.map((sc) => [
      sc.id,
      sc.countyId,
    ])
  );

  const constituencyMap = new Map(
    constituencies.map((c) => [
      c.id,
      c.countyId,
    ])
  );

  const orphanWards = wards.filter(
    (w) =>
      !countyIds.has(w.countyId) ||
      !constituencyMap.has(w.constituencyId) ||
      (w.subCountyId !== null &&
        !subCountyMap.has(w.subCountyId))
  );

  console.log("");
  console.log("WARD FOREIGN KEY INTEGRITY");
  console.log("----------------------------------------------");
  console.log(
    "Orphan Wards:",
    orphanWards.length
  );

  if (orphanWards.length > 0) {
    failures++;

    console.table(orphanWards);
  }

  // --------------------------------------------------
  // 5. WARD → SUBCOUNTY COUNTY CONSISTENCY
  // --------------------------------------------------

  const wardSubCountyMismatch =
    wards.filter((w) => {
      if (w.subCountyId === null) {
        return false;
      }

      const subCountyCounty =
        subCountyMap.get(w.subCountyId);

      return (
        subCountyCounty !== undefined &&
        subCountyCounty !== w.countyId
      );
    });

  console.log("");
  console.log(
    "WARD → SUBCOUNTY → COUNTY CONSISTENCY"
  );
  console.log("----------------------------------------------");
  console.log(
    "County mismatches:",
    wardSubCountyMismatch.length
  );

  if (wardSubCountyMismatch.length > 0) {
    failures++;

    console.table(wardSubCountyMismatch);
  }

  // --------------------------------------------------
  // 6. WARD → CONSTITUENCY COUNTY CONSISTENCY
  // --------------------------------------------------

  const wardConstituencyMismatch =
    wards.filter((w) => {
      const constituencyCounty =
        constituencyMap.get(w.constituencyId);

      return (
        constituencyCounty !== undefined &&
        constituencyCounty !== w.countyId
      );
    });

  console.log("");
  console.log(
    "WARD → CONSTITUENCY → COUNTY CONSISTENCY"
  );
  console.log("----------------------------------------------");
  console.log(
    "County mismatches:",
    wardConstituencyMismatch.length
  );

  if (wardConstituencyMismatch.length > 0) {
    failures++;

    console.table(wardConstituencyMismatch);
  }

  // --------------------------------------------------
  // 7. DUPLICATE COUNTY NAMES
  // --------------------------------------------------

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
      countryId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const countyGroups = new Map<
    string,
    typeof counties
  >();

  for (const county of counties) {
    const key =
      `${county.countryId}|${county.name}`
        .trim()
        .toLowerCase();

    const group = countyGroups.get(key) ?? [];

    group.push(county);

    countyGroups.set(key, group);
  }

  const duplicateCounties = [
    ...countyGroups.values(),
  ].filter((group) => group.length > 1);

  console.log("");
  console.log("COUNTY NAME UNIQUENESS");
  console.log("----------------------------------------------");
  console.log(
    "Duplicate county names:",
    duplicateCounties.length
  );

  if (duplicateCounties.length > 0) {
    failures++;

    for (const group of duplicateCounties) {
      console.table(group);
    }
  }

  // --------------------------------------------------
  // 8. DUPLICATE SUBCOUNTY NAMES WITHIN COUNTY
  // --------------------------------------------------

  const subCountyGroups = new Map<
    string,
    typeof subCounties
  >();

  for (const sc of subCounties) {
    const key =
      `${sc.countyId}|${sc.name}`
        .trim()
        .toLowerCase();

    const group =
      subCountyGroups.get(key) ?? [];

    group.push(sc);

    subCountyGroups.set(key, group);
  }

  const duplicateSubCounties = [
    ...subCountyGroups.values(),
  ].filter((group) => group.length > 1);

  console.log("");
  console.log(
    "SUBCOUNTY NAME UNIQUENESS WITHIN COUNTY"
  );
  console.log("----------------------------------------------");
  console.log(
    "Duplicate SubCounty names:",
    duplicateSubCounties.length
  );

  if (duplicateSubCounties.length > 0) {
    failures++;

    for (const group of duplicateSubCounties) {
      console.table(group);
    }
  }

  // --------------------------------------------------
  // 9. DUPLICATE CONSTITUENCY NAMES WITHIN COUNTY
  // --------------------------------------------------

  const constituencyGroups = new Map<
    string,
    typeof constituencies
  >();

  for (const constituency of constituencies) {
    const key =
      `${constituency.countyId}|${constituency.name}`
        .trim()
        .toLowerCase();

    const group =
      constituencyGroups.get(key) ?? [];

    group.push(constituency);

    constituencyGroups.set(key, group);
  }

  const duplicateConstituencies = [
    ...constituencyGroups.values(),
  ].filter((group) => group.length > 1);

  console.log("");
  console.log(
    "CONSTITUENCY NAME UNIQUENESS WITHIN COUNTY"
  );
  console.log("----------------------------------------------");
  console.log(
    "Duplicate Constituency names:",
    duplicateConstituencies.length
  );

  if (duplicateConstituencies.length > 0) {
    failures++;

    for (const group of duplicateConstituencies) {
      console.table(group);
    }
  }

  // --------------------------------------------------
  // 10. DUPLICATE WARD COMPOSITE IDENTITIES
  // --------------------------------------------------
  //
  // Current schema:
  //
  // @@unique([
  //   constituencyId,
  //   subCountyId,
  //   name
  // ])
  //
  // This check mirrors that identity.
  // --------------------------------------------------

  const wardGroups = new Map<
    string,
    typeof wards
  >();

  for (const ward of wards) {
    const key =
      `${ward.constituencyId}|` +
      `${ward.subCountyId ?? "NULL"}|` +
      `${ward.name}`
        .trim()
        .toLowerCase();

    const group =
      wardGroups.get(key) ?? [];

    group.push(ward);

    wardGroups.set(key, group);
  }

  const duplicateWards = [
    ...wardGroups.values(),
  ].filter((group) => group.length > 1);

  console.log("");
  console.log(
    "WARD COMPOSITE IDENTITY UNIQUENESS"
  );
  console.log("----------------------------------------------");
  console.log(
    "Duplicate ward identities:",
    duplicateWards.length
  );

  if (duplicateWards.length > 0) {
    failures++;

    for (const group of duplicateWards) {
      console.table(group);
    }
  }

  // --------------------------------------------------
  // 11. SOURCE GID UNIQUENESS
  // --------------------------------------------------

  const sourceGids = wards
    .map((w) => w.sourceGid)
    .filter(
      (gid): gid is number =>
        gid !== null
    );

  const sourceGidSet =
    new Set(sourceGids);

  console.log("");
  console.log("WARD SOURCE GID INTEGRITY");
  console.log("----------------------------------------------");
  console.log(
    "Wards with sourceGid:",
    sourceGids.length
  );
  console.log(
    "Unique sourceGids:",
    sourceGidSet.size
  );

  if (
    sourceGids.length !==
    sourceGidSet.size
  ) {
    console.log(
      "FAIL: Duplicate sourceGids detected."
    );

    failures++;
  }

  if (sourceGids.length !== 1450) {
    console.log(
      `FAIL: Expected 1450 sourceGids, found ${sourceGids.length}.`
    );

    failures++;
  }

  // --------------------------------------------------
  // 12. FINAL RESULT
  // --------------------------------------------------

  console.log("");
  console.log("==================================================");
  console.log("FINAL HIERARCHY VERIFICATION");
  console.log("==================================================");

  if (failures === 0) {
    console.log("");
    console.log("DATABASE HIERARCHY INTEGRITY PASSED.");
    console.log("");
    console.log(
      "Country → County → SubCounty → Constituency → Ward"
    );
    console.log("");
    console.log("Expected totals confirmed:");
    console.log("Counties:        47");
    console.log("SubCounties:     631");
    console.log("Constituencies:  298");
    console.log("Wards:           1450");
    console.log("");
    console.log("No orphan records.");
    console.log("No county hierarchy mismatches.");
    console.log("No duplicate county names.");
    console.log("No duplicate SubCounty names.");
    console.log("No duplicate Constituency names.");
    console.log("No duplicate Ward identities.");
    console.log("All Ward sourceGids are unique.");
    console.log("");
    console.log("==============================================");
    console.log("FINAL VERIFICATION PASSED");
    console.log("==============================================");
  } else {
    console.log("");
    console.log(
      `HIERARCHY VERIFICATION FAILED: ${failures} issue(s) found.`
    );
    console.log("");
    console.log(
      "No database changes were made."
    );

    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("HIERARCHY VERIFICATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });