import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

type MappingWard = {
  id?: number;
  name: string;
  code?: string | null;
  sourceGid?: number | null;
  sourceUid?: string | null;
};

type SubCountyMapping = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  wards: MappingWard[];
};

type WardRecord = {
  id: number;
  name: string;
  countyId: number;
  subCountyId: number | null;
  constituencyId: number;
  sourceGid: number | null;
  sourceUid: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/[’']/g, "")
    .replace(/\s+ward$/i, "")
    .replace(/\s+sub county$/i, "")
    .trim();
}

function sourceKey(
  sourceGid: number | null | undefined,
  sourceUid: string | null | undefined,
): string | null {
  if (sourceGid !== null && sourceGid !== undefined) {
    return `gid:${sourceGid}`;
  }

  if (sourceUid && sourceUid.trim()) {
    return `uid:${sourceUid.trim()}`;
  }

  return null;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("WARD → AUTHORITATIVE SUBCOUNTY MIGRATION");
  console.log("READ/VALIDATE FIRST — THEN ONE TRANSACTION");
  console.log("============================================================");
  console.log("");

  const mappings = subcountyWardMap as SubCountyMapping[];

  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error(
      "subcounty-ward-map.json is empty or is not an array.",
    );
  }

  /*
   * ----------------------------------------------------------
   * 1. BUILD AUTHORITATIVE WARD LOOKUP
   * ----------------------------------------------------------
   */

  const authoritativeWardMap = new Map<
    string,
    {
      subCountyId: number;
      subCountyName: string;
      countyId: number;
      countyName: string;
      wardName: string;
      sourceGid: number | null;
      sourceUid: string | null;
    }
  >();

  let mappingWardCount = 0;

  for (const mapping of mappings) {
    if (
      !mapping ||
      typeof mapping.subCountyId !== "number" ||
      typeof mapping.countyId !== "number" ||
      !Array.isArray(mapping.wards)
    ) {
      throw new Error(
        `Invalid SubCounty mapping encountered: ${JSON.stringify(mapping)}`,
      );
    }

    for (const ward of mapping.wards) {
      mappingWardCount++;

      const key = sourceKey(
        ward.sourceGid ?? null,
        ward.sourceUid ?? null,
      );

      if (!key) {
        throw new Error(
          `Authoritative ward has no sourceGid/sourceUid: ` +
            `${mapping.subCountyName} → ${ward.name}`,
        );
      }

      const existing = authoritativeWardMap.get(key);

      if (existing) {
        throw new Error(
          [
            "DUPLICATE AUTHORITATIVE SOURCE ID DETECTED.",
            `Key: ${key}`,
            `Existing: ${existing.subCountyName} → ${existing.wardName}`,
            `New: ${mapping.subCountyName} → ${ward.name}`,
          ].join("\n"),
        );
      }

      authoritativeWardMap.set(key, {
        subCountyId: mapping.subCountyId,
        subCountyName: mapping.subCountyName,
        countyId: mapping.countyId,
        countyName: mapping.countyName,
        wardName: ward.name,
        sourceGid: ward.sourceGid ?? null,
        sourceUid: ward.sourceUid ?? null,
      });
    }
  }

  console.log(`Authoritative mappings:       ${mappings.length}`);
  console.log(`Authoritative ward records:   ${mappingWardCount}`);
  console.log(
    `Unique authoritative IDs:     ${authoritativeWardMap.size}`,
  );
  console.log("");

  if (mappingWardCount !== 1450) {
    throw new Error(
      `Expected 1450 authoritative ward mappings, found ${mappingWardCount}.`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 2. LOAD DATABASE
   * ----------------------------------------------------------
   */

  const dbWards = await prisma.ward.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
      sourceGid: true,
      sourceUid: true,
    },
  });

  const dbSubCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const subCountyById = new Map(
    dbSubCounties.map((subCounty) => [
      subCounty.id,
      subCounty,
    ]),
  );

  console.log(`Database wards:               ${dbWards.length}`);
  console.log(`Database SubCounties:         ${dbSubCounties.length}`);
  console.log("");

  if (dbWards.length !== 1450) {
    throw new Error(
      `Expected 1450 database wards, found ${dbWards.length}.`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 3. VERIFY DATABASE SOURCE IDS ARE UNIQUE
   * ----------------------------------------------------------
   */

  const dbSourceMap = new Map<number | string, WardRecord>();

  const duplicateDbSourceIds: string[] = [];

  for (const ward of dbWards) {
    const key = sourceKey(
      ward.sourceGid,
      ward.sourceUid,
    );

    if (!key) {
      throw new Error(
        `Database Ward ${ward.id} (${ward.name}) has no sourceGid/sourceUid.`,
      );
    }

    const existing = dbSourceMap.get(key);

    if (existing) {
      duplicateDbSourceIds.push(
        `${key}: Ward ${existing.id} "${existing.name}" and Ward ${ward.id} "${ward.name}"`,
      );
    } else {
      dbSourceMap.set(key, ward);
    }
  }

  if (duplicateDbSourceIds.length > 0) {
    console.log("DUPLICATE DATABASE SOURCE IDS:");

    for (const item of duplicateDbSourceIds) {
      console.log(`  ${item}`);
    }

    throw new Error(
      `Found ${duplicateDbSourceIds.length} duplicate database source identities.`,
    );
  }

  console.log(
    `Unique database source identities: ${dbSourceMap.size}`,
  );
  console.log("");

  /*
   * ----------------------------------------------------------
   * 4. PRE-FLIGHT ALL 1450 WARDS
   * ----------------------------------------------------------
   */

  type Migration = {
    wardId: number;
    wardName: string;
    sourceGid: number | null;
    sourceUid: string | null;

    oldSubCountyId: number | null;
    oldSubCountyName: string | null;

    newSubCountyId: number;
    newSubCountyName: string;

    countyId: number;
    constituencyId: number;
  };

  const migrations: Migration[] = [];

  const alreadyCorrect: Migration[] = [];

  const destinationConflicts: string[] = [];

  const missingAuthoritativeIds: string[] = [];

  const countyMismatches: string[] = [];

  const nameWarnings: string[] = [];

  for (const ward of dbWards) {
    const key = sourceKey(
      ward.sourceGid,
      ward.sourceUid,
    );

    if (!key) {
      throw new Error(
        `Ward ${ward.id} has no source identity.`,
      );
    }

    const authoritative = authoritativeWardMap.get(key);

    if (!authoritative) {
      missingAuthoritativeIds.push(
        `Ward ${ward.id} "${ward.name}" | ${key}`,
      );
      continue;
    }

    const targetSubCounty = subCountyById.get(
      authoritative.subCountyId,
    );

    if (!targetSubCounty) {
      throw new Error(
        [
          "TARGET SUBCOUNTY DOES NOT EXIST.",
          `Ward: ${ward.id} ${ward.name}`,
          `Source: ${key}`,
          `Target SubCounty ID: ${authoritative.subCountyId}`,
          `Target name: ${authoritative.subCountyName}`,
        ].join("\n"),
      );
    }

    /*
     * County must never change as part of this migration.
     */
    if (
      targetSubCounty.countyId !== ward.countyId ||
      authoritative.countyId !== ward.countyId
    ) {
      countyMismatches.push(
        [
          `Ward ${ward.id} "${ward.name}"`,
          `ward county=${ward.countyId}`,
          `target subcounty county=${targetSubCounty.countyId}`,
          `authoritative county=${authoritative.countyId}`,
          `target=${authoritative.subCountyId} "${authoritative.subCountyName}"`,
        ].join(" | "),
      );
      continue;
    }

    const oldSubCounty = ward.subCountyId
      ? subCountyById.get(ward.subCountyId)
      : null;

    const migration: Migration = {
      wardId: ward.id,
      wardName: ward.name,
      sourceGid: ward.sourceGid,
      sourceUid: ward.sourceUid,

      oldSubCountyId: ward.subCountyId,
      oldSubCountyName: oldSubCounty?.name ?? null,

      newSubCountyId: authoritative.subCountyId,
      newSubCountyName: authoritative.subCountyName,

      countyId: ward.countyId,
      constituencyId: ward.constituencyId,
    };

    /*
     * Name differences are warnings only.
     *
     * Source identity is authoritative.
     */
    if (
      normalize(ward.name) !==
      normalize(authoritative.wardName)
    ) {
      nameWarnings.push(
        [
          `Ward ${ward.id}`,
          `"${ward.name}"`,
          `authoritative="${authoritative.wardName}"`,
          `source=${key}`,
        ].join(" | "),
      );
    }

    if (
      ward.subCountyId ===
      authoritative.subCountyId
    ) {
      alreadyCorrect.push(migration);
      continue;
    }

    /*
     * Check whether another Ward already occupies the
     * destination relationship.
     *
     * Current uniqueness:
     * @@unique([constituencyId, subCountyId, name])
     */
    const conflictingWard = dbWards.find(
      (other) =>
        other.id !== ward.id &&
        other.constituencyId === ward.constituencyId &&
        other.subCountyId === authoritative.subCountyId &&
        normalize(other.name) === normalize(ward.name),
    );

    if (conflictingWard) {
      destinationConflicts.push(
        [
          `Ward ${ward.id} "${ward.name}"`,
          `source=${key}`,
          `targetSubCounty=${authoritative.subCountyId}`,
          `conflicts with Ward ${conflictingWard.id} "${conflictingWard.name}"`,
        ].join(" | "),
      );
      continue;
    }

    migrations.push(migration);
  }

  /*
   * ----------------------------------------------------------
   * 5. PREFLIGHT RESULTS
   * ----------------------------------------------------------
   */

  console.log("============================================================");
  console.log("PREFLIGHT RESULTS");
  console.log("============================================================");
  console.log("");

  console.log(
    `Total database wards:                 ${dbWards.length}`,
  );

  console.log(
    `Matched authoritative wards:          ${
      dbWards.length - missingAuthoritativeIds.length
    }`,
  );

  console.log(
    `Already under correct SubCounty:      ${alreadyCorrect.length}`,
  );

  console.log(
    `Wards requiring SubCounty migration:  ${migrations.length}`,
  );

  console.log(
    `Missing authoritative source IDs:     ${missingAuthoritativeIds.length}`,
  );

  console.log(
    `County mismatches:                    ${countyMismatches.length}`,
  );

  console.log(
    `Destination conflicts:               ${destinationConflicts.length}`,
  );

  console.log(
    `Ward-name warnings:                  ${nameWarnings.length}`,
  );

  console.log("");

  /*
   * ----------------------------------------------------------
   * 6. HARD SAFETY STOP
   * ----------------------------------------------------------
   */

  if (missingAuthoritativeIds.length > 0) {
    console.log("MISSING AUTHORITATIVE SOURCE IDS:");

    for (const item of missingAuthoritativeIds) {
      console.log(`  ${item}`);
    }

    throw new Error(
      "Migration stopped because not all database wards matched the authoritative mapping.",
    );
  }

  if (countyMismatches.length > 0) {
    console.log("COUNTY MISMATCHES:");

    for (const item of countyMismatches) {
      console.log(`  ${item}`);
    }

    throw new Error(
      "Migration stopped because at least one county mismatch was detected.",
    );
  }

  if (destinationConflicts.length > 0) {
    console.log("DESTINATION CONFLICTS:");

    for (const item of destinationConflicts) {
      console.log(`  ${item}`);
    }

    throw new Error(
      "Migration stopped because at least one destination Ward conflict was detected.",
    );
  }

  /*
   * Every ward must be accounted for.
   */
  if (
    alreadyCorrect.length +
      migrations.length !==
    1450
  ) {
    throw new Error(
      [
        "WARD ACCOUNTING FAILED.",
        `Already correct: ${alreadyCorrect.length}`,
        `To migrate: ${migrations.length}`,
        `Total: ${alreadyCorrect.length + migrations.length}`,
        "Expected: 1450",
      ].join("\n"),
    );
  }

  /*
   * ----------------------------------------------------------
   * 7. DISPLAY MIGRATION SUMMARY
   * ----------------------------------------------------------
   */

  console.log("============================================================");
  console.log("MIGRATION PLAN");
  console.log("============================================================");
  console.log("");

  console.log(
    `Wards staying where they are: ${alreadyCorrect.length}`,
  );

  console.log(
    `Wards moving to canonical SubCounties: ${migrations.length}`,
  );

  console.log("");

  /*
   * Group migration counts by old → new SubCounty.
   */

  const grouped = new Map<
    string,
    {
      oldId: number | null;
      oldName: string | null;
      newId: number;
      newName: string;
      count: number;
    }
  >();

  for (const migration of migrations) {
    const key =
      `${migration.oldSubCountyId ?? "NULL"}→` +
      `${migration.newSubCountyId}`;

    const existing = grouped.get(key);

    if (existing) {
      existing.count++;
    } else {
      grouped.set(key, {
        oldId: migration.oldSubCountyId,
        oldName: migration.oldSubCountyName,
        newId: migration.newSubCountyId,
        newName: migration.newSubCountyName,
        count: 1,
      });
    }
  }

  console.log("SUBCOUNTY MIGRATION GROUPS");
  console.log("--------------------------");

  for (const group of grouped.values()) {
    console.log(
      `${group.oldId} "${group.oldName}" → ` +
        `${group.newId} "${group.newName}" : ` +
        `${group.count} wards`,
    );
  }

  console.log("");

  /*
   * ----------------------------------------------------------
   * 8. WARN ABOUT WARD NAME DIFFERENCES
   * ----------------------------------------------------------
   */

  if (nameWarnings.length > 0) {
    console.log("WARD NAME WARNINGS");
    console.log("------------------");

    for (const warning of nameWarnings) {
      console.log(`  ${warning}`);
    }

    console.log("");
    console.log(
      "These are warnings only. No Ward names will be changed.",
    );
    console.log("");
  }

  /*
   * ----------------------------------------------------------
   * 9. EXECUTE ONE TRANSACTION
   * ----------------------------------------------------------
   */

  console.log("============================================================");
  console.log("STARTING DATABASE TRANSACTION");
  console.log("============================================================");
  console.log("");

  let moved = 0;

  await prisma.$transaction(
    async (tx) => {
      /*
       * Re-check the ward count inside the transaction.
       */
      const countBefore = await tx.ward.count();

      if (countBefore !== 1450) {
        throw new Error(
          `Ward count changed before migration: ${countBefore}`,
        );
      }

      /*
       * Move each Ward by its primary key.
       *
       * We change ONLY subCountyId.
       *
       * countyId and constituencyId remain untouched.
       * sourceGid/sourceUid remain untouched.
       * Ward ID remains untouched.
       */
      for (const migration of migrations) {
        await tx.ward.update({
          where: {
            id: migration.wardId,
          },
          data: {
            subCountyId: migration.newSubCountyId,
          },
        });

        moved++;
      }

      /*
       * Verify count after updates.
       */
      const countAfter = await tx.ward.count();

      if (countAfter !== 1450) {
        throw new Error(
          `Ward count changed during migration: ${countAfter}`,
        );
      }
    },
    {
      timeout: 300000,
    },
  );

  /*
   * ----------------------------------------------------------
   * 10. FINAL VALIDATION
   * ----------------------------------------------------------
   */

  console.log("");
  console.log("============================================================");
  console.log("FINAL VALIDATION");
  console.log("============================================================");
  console.log("");

  const finalWardCount = await prisma.ward.count();

  const finalWards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
      sourceGid: true,
      sourceUid: true,
    },
  });

  const finalSubCountyMap = new Map(
    (
      await prisma.subCounty.findMany({
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      })
    ).map((sc) => [sc.id, sc]),
  );

  let finalSourceMatches = 0;
  let finalCorrectParents = 0;
  const finalProblems: string[] = [];

  for (const ward of finalWards) {
    const key = sourceKey(
      ward.sourceGid,
      ward.sourceUid,
    );

    if (!key) {
      finalProblems.push(
        `Ward ${ward.id} has no source identity.`,
      );
      continue;
    }

    const authoritative = authoritativeWardMap.get(key);

    if (!authoritative) {
      finalProblems.push(
        `Ward ${ward.id} ${ward.name} no longer matches authoritative source.`,
      );
      continue;
    }

    finalSourceMatches++;

    if (
      ward.subCountyId ===
      authoritative.subCountyId
    ) {
      finalCorrectParents++;
    } else {
      finalProblems.push(
        [
          `Ward ${ward.id} "${ward.name}"`,
          `actualSubCounty=${ward.subCountyId}`,
          `expectedSubCounty=${authoritative.subCountyId}`,
        ].join(" | "),
      );
    }

    const targetSubCounty =
      ward.subCountyId !== null
        ? finalSubCountyMap.get(ward.subCountyId)
        : null;

    if (!targetSubCounty) {
      finalProblems.push(
        `Ward ${ward.id} has invalid SubCounty ${ward.subCountyId}.`,
      );
      continue;
    }

    if (targetSubCounty.countyId !== ward.countyId) {
      finalProblems.push(
        [
          `Ward ${ward.id} county mismatch after migration`,
          `wardCounty=${ward.countyId}`,
          `subCountyCounty=${targetSubCounty.countyId}`,
        ].join(" | "),
      );
    }
  }

  console.log(`Final database wards:             ${finalWardCount}`);
  console.log(
    `Final source identity matches:    ${finalSourceMatches}`,
  );
  console.log(
    `Final correct SubCounty parents:  ${finalCorrectParents}`,
  );
  console.log(`Final validation problems:        ${finalProblems.length}`);
  console.log(`Wards moved:                      ${moved}`);
  console.log("");

  if (finalProblems.length > 0) {
    console.log("FINAL VALIDATION PROBLEMS:");

    for (const problem of finalProblems) {
      console.log(`  ${problem}`);
    }

    throw new Error(
      `Final validation failed with ${finalProblems.length} problems.`,
    );
  }

  if (finalWardCount !== 1450) {
    throw new Error(
      `FINAL WARD COUNT FAILED: ${finalWardCount}`,
    );
  }

  if (finalSourceMatches !== 1450) {
    throw new Error(
      `FINAL SOURCE MATCH COUNT FAILED: ${finalSourceMatches}`,
    );
  }

  if (finalCorrectParents !== 1450) {
    throw new Error(
      `FINAL SUBCOUNTY PARENT COUNT FAILED: ${finalCorrectParents}`,
    );
  }

  console.log("============================================================");
  console.log("MIGRATION COMPLETED SUCCESSFULLY");
  console.log("============================================================");
  console.log("");
  console.log("✅ 1,450 wards preserved");
  console.log(`✅ ${moved} wards moved to canonical SubCounties`);
  console.log("✅ Source GID/UID preserved");
  console.log("✅ County IDs preserved");
  console.log("✅ Constituency IDs preserved");
  console.log("✅ No Ward records deleted");
  console.log("✅ No SubCounty records deleted");
  console.log("✅ Final Ward count = 1450");
  console.log("✅ All 1,450 authoritative parent relationships verified");
  console.log("");
  console.log(
    "NEXT STEP: audit legacy SubCounties and their Farmer/Farm/etc. relationships before any deletion.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("MIGRATION FAILED");
    console.error("============================================================");
    console.error("");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
