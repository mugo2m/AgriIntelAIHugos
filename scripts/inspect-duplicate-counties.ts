import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const COUNTY_MAP: Record<number, number> = {
  145: 66,
  146: 76,
  147: 79,
  148: 85,
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\//g, " ")
    .replace(/-/g, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

type ForeignKey = {
  child_schema: string;
  child_table: string;
  child_column: string;
  parent_table: string;
  constraint_name: string;
};

async function getForeignKeys(
  tx: any,
  parentTable: string
): Promise<ForeignKey[]> {
  return tx.$queryRawUnsafe(
    `SELECT
       child_ns.nspname AS child_schema,
       child_tbl.relname AS child_table,
       child_col.attname AS child_column,
       parent_tbl.relname AS parent_table,
       con.conname AS constraint_name
     FROM pg_constraint con
     JOIN pg_class child_tbl
       ON child_tbl.oid = con.conrelid
     JOIN pg_namespace child_ns
       ON child_ns.oid = child_tbl.relnamespace
     JOIN pg_class parent_tbl
       ON parent_tbl.oid = con.confrelid
     JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ord)
       ON true
     JOIN pg_attribute child_col
       ON child_col.attrelid = child_tbl.oid
       AND child_col.attnum = cols.attnum
     WHERE con.contype = 'f'
       AND parent_tbl.relname = '${parentTable}'
     ORDER BY child_tbl.relname, con.conname, child_col.attname`
  );
}

async function verifySimpleForeignKeys(tx: any) {
  const rows = await tx.$queryRawUnsafe(`
    SELECT
      parent_tbl.relname AS parent_table,
      con.conname AS constraint_name,
      COUNT(*) AS column_count
    FROM pg_constraint con
    JOIN pg_class parent_tbl
      ON parent_tbl.oid = con.confrelid
    JOIN LATERAL unnest(con.conkey) AS cols(attnum)
      ON true
    WHERE con.contype = 'f'
      AND parent_tbl.relname IN ('County', 'SubCounty', 'Constituency', 'Ward')
    GROUP BY parent_tbl.relname, con.conname
    HAVING COUNT(*) > 1
    ORDER BY parent_tbl.relname, con.conname
  `);

  if (rows.length > 0) {
    console.error("\nCOMPOSITE FOREIGN KEYS DETECTED.");
    console.table(rows);
    throw new Error(
      "Repair aborted because a composite foreign key requires manual handling."
    );
  }
}

async function updateForeignKeyReferences(
  tx: any,
  parentTable: string,
  oldId: number,
  newId: number
) {
  const foreignKeys = await getForeignKeys(tx, parentTable);

  for (const fk of foreignKeys) {
    const childTable = quoteIdentifier(fk.child_table);
    const childColumn = quoteIdentifier(fk.child_column);

    const result = await tx.$executeRawUnsafe(
      `UPDATE ${childTable}
       SET ${childColumn} = $1
       WHERE ${childColumn} = $2`,
      newId,
      oldId
    );

    if (result > 0) {
      console.log(
        `      ${fk.child_table}.${fk.child_column}: ${result} reference(s) ${oldId} → ${newId}`
      );
    }
  }
}

async function mergeWard(
  tx: any,
  duplicateWardId: number,
  canonicalWardId: number
) {
  await updateForeignKeyReferences(
    tx,
    "Ward",
    duplicateWardId,
    canonicalWardId
  );

  await tx.$executeRawUnsafe(
    `DELETE FROM "Ward" WHERE id = $1`,
    duplicateWardId
  );

  console.log(
    `      Ward ${duplicateWardId} → ${canonicalWardId} merged`
  );
}

async function mergeConstituency(
  tx: any,
  duplicateId: number,
  canonicalId: number
) {
  await updateForeignKeyReferences(
    tx,
    "Constituency",
    duplicateId,
    canonicalId
  );

  await tx.$executeRawUnsafe(
    `DELETE FROM "Constituency" WHERE id = $1`,
    duplicateId
  );

  console.log(
    `    Constituency ${duplicateId} → ${canonicalId} merged`
  );
}

async function mergeSubCounty(
  tx: any,
  duplicateId: number,
  canonicalId: number
) {
  await updateForeignKeyReferences(
    tx,
    "SubCounty",
    duplicateId,
    canonicalId
  );

  await tx.$executeRawUnsafe(
    `DELETE FROM "SubCounty" WHERE id = $1`,
    duplicateId
  );

  console.log(
    `    SubCounty ${duplicateId} → ${canonicalId} merged`
  );
}

async function mergeCounty(
  tx: any,
  duplicateId: number,
  canonicalId: number
) {
  await updateForeignKeyReferences(
    tx,
    "County",
    duplicateId,
    canonicalId
  );

  await tx.$executeRawUnsafe(
    `DELETE FROM "County" WHERE id = $1`,
    duplicateId
  );

  console.log(
    `  County ${duplicateId} → ${canonicalId} merged`
  );
}

async function getCanonicalSubCounty(
  tx: any,
  duplicateSubCounty: any,
  canonicalCountyId: number
) {
  const candidates = await tx.subCounty.findMany({
    where: {
      countyId: canonicalCountyId,
    },
  });

  const matches = candidates.filter(
    (candidate: any) =>
      normalize(candidate.name) ===
      normalize(duplicateSubCounty.name)
  );

  if (matches.length !== 1) {
    throw new Error(
      `SubCounty ${duplicateSubCounty.id} "${duplicateSubCounty.name}" has ${matches.length} canonical matches.`
    );
  }

  return matches[0];
}

async function getCanonicalConstituency(
  tx: any,
  duplicateConstituency: any,
  canonicalCountyId: number
) {
  const candidates = await tx.constituency.findMany({
    where: {
      countyId: canonicalCountyId,
    },
  });

  const matches = candidates.filter(
    (candidate: any) =>
      normalize(candidate.name) ===
      normalize(duplicateConstituency.name)
  );

  if (matches.length !== 1) {
    throw new Error(
      `Constituency ${duplicateConstituency.id} "${duplicateConstituency.name}" has ${matches.length} canonical matches.`
    );
  }

  return matches[0];
}

async function getCanonicalWard(
  tx: any,
  duplicateWard: any,
  canonicalConstituencyId: number
) {
  const candidates = await tx.ward.findMany({
    where: {
      constituencyId: canonicalConstituencyId,
    },
  });

  const matches = candidates.filter(
    (candidate: any) =>
      normalize(candidate.name) ===
      normalize(duplicateWard.name)
  );

  if (matches.length !== 1) {
    throw new Error(
      `Ward ${duplicateWard.id} "${duplicateWard.name}" has ${matches.length} canonical matches in constituency ${canonicalConstituencyId}.`
    );
  }

  return matches[0];
}

async function verifyFinalState(tx: any) {
  console.log("\n==============================================");
  console.log("FINAL VERIFICATION");
  console.log("==============================================");

  const counties = await tx.county.count();
  const subCounties = await tx.subCounty.count();
  const constituencies = await tx.constituency.count();
  const wards = await tx.ward.count();

  console.log(`Counties:        ${counties}`);
  console.log(`SubCounties:     ${subCounties}`);
  console.log(`Constituencies:  ${constituencies}`);
  console.log(`Wards:           ${wards}`);

  if (counties !== 47) {
    throw new Error(
      `County verification failed. Expected 47, found ${counties}.`
    );
  }

  const duplicateCounties = await tx.county.findMany({
    where: {
      id: {
        in: [145, 146, 147, 148],
      },
    },
  });

  if (duplicateCounties.length !== 0) {
    throw new Error(
      `Duplicate counties still exist: ${duplicateCounties
        .map((x: any) => x.id)
        .join(", ")}`
    );
  }

  const orphanSubCounties = await tx.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS count
    FROM "SubCounty" s
    LEFT JOIN "County" c
      ON c.id = s."countyId"
    WHERE c.id IS NULL
  `);

  const orphanConstituencies = await tx.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS count
    FROM "Constituency" x
    LEFT JOIN "County" c
      ON c.id = x."countyId"
    WHERE c.id IS NULL
  `);

  const orphanWards = await tx.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS count
    FROM "Ward" w
    LEFT JOIN "County" c
      ON c.id = w."countyId"
    LEFT JOIN "Constituency" x
      ON x.id = w."constituencyId"
    LEFT JOIN "SubCounty" s
      ON s.id = w."subCountyId"
    WHERE c.id IS NULL
       OR x.id IS NULL
       OR (w."subCountyId" IS NOT NULL AND s.id IS NULL)
  `);

  const subCountyOrphans = Number(orphanSubCounties[0]?.count ?? 0);
  const constituencyOrphans = Number(
    orphanConstituencies[0]?.count ?? 0
  );
  const wardOrphans = Number(orphanWards[0]?.count ?? 0);

  console.log(`Orphan SubCounties:    ${subCountyOrphans}`);
  console.log(`Orphan Constituencies: ${constituencyOrphans}`);
  console.log(`Orphan Wards:          ${wardOrphans}`);

  if (
    subCountyOrphans !== 0 ||
    constituencyOrphans !== 0 ||
    wardOrphans !== 0
  ) {
    throw new Error(
      "Orphaned administrative records detected."
    );
  }

  const remainingDuplicateWards =
    await tx.ward.count({
      where: {
        id: {
          gte: 2473,
        },
      },
    });

  console.log(
    `High-ID duplicate wards remaining: ${remainingDuplicateWards}`
  );

  if (remainingDuplicateWards !== 0) {
    throw new Error(
      "Duplicate ward records remain."
    );
  }

  console.log("\nFINAL VERIFICATION PASSED.");
}

async function main() {
  console.log("\n==============================================");
  console.log("AGRIINTELAIHUGOS ADMINISTRATIVE REPAIR");
  console.log("==============================================");
  console.log("TRANSACTIONAL DATABASE MERGE");
  console.log("==============================================\n");

  await prisma.$transaction(
    async (tx) => {
      await verifySimpleForeignKeys(tx);

      const duplicateCountyIds =
        Object.keys(COUNTY_MAP).map(Number);

      // --------------------------------------------
      // Preflight: ensure all canonical counties exist
      // --------------------------------------------

      for (const [duplicateText, canonicalId] of Object.entries(
        COUNTY_MAP
      )) {
        const duplicateId = Number(duplicateText);

        const duplicateCounty =
          await tx.county.findUnique({
            where: { id: duplicateId },
          });

        const canonicalCounty =
          await tx.county.findUnique({
            where: { id: canonicalId },
          });

        if (!duplicateCounty) {
          throw new Error(
            `Duplicate county ${duplicateId} does not exist.`
          );
        }

        if (!canonicalCounty) {
          throw new Error(
            `Canonical county ${canonicalId} does not exist.`
          );
        }

        console.log(
          `Preflight OK: ${duplicateCounty.name} (${duplicateId}) → ${canonicalCounty.name} (${canonicalId})`
        );
      }

      // --------------------------------------------
      // Process each duplicate county
      // --------------------------------------------

      for (const [duplicateText, canonicalCountyId] of Object.entries(
        COUNTY_MAP
      )) {
        const duplicateCountyId = Number(duplicateText);

        const duplicateCounty =
          await tx.county.findUnique({
            where: { id: duplicateCountyId },
          });

        const canonicalCounty =
          await tx.county.findUnique({
            where: { id: canonicalCountyId },
          });

        console.log(
          `\n==============================================`
        );
        console.log(
          `${duplicateCounty!.name} (${duplicateCountyId})`
        );
        console.log(
          `→ ${canonicalCounty!.name} (${canonicalCountyId})`
        );
        console.log(
          `==============================================`
        );

        // ------------------------------------------
        // Build constituency mapping FIRST
        // ------------------------------------------

        const duplicateConstituencies =
          await tx.constituency.findMany({
            where: {
              countyId: duplicateCountyId,
            },
            orderBy: {
              id: "asc",
            },
          });

        const constituencyMap = new Map<
          number,
          number
        >();

        for (const duplicateConstituency of duplicateConstituencies) {
          const canonicalConstituency =
            await getCanonicalConstituency(
              tx,
              duplicateConstituency,
              canonicalCountyId
            );

          constituencyMap.set(
            duplicateConstituency.id,
            canonicalConstituency.id
          );
        }

        // ------------------------------------------
        // Merge WARDS first
        // ------------------------------------------

        const duplicateWards =
          await tx.ward.findMany({
            where: {
              countyId: duplicateCountyId,
            },
            orderBy: {
              id: "asc",
            },
          });

        console.log(
          `\nMerging ${duplicateWards.length} wards...`
        );

        for (const duplicateWard of duplicateWards) {
          const canonicalConstituencyId =
            constituencyMap.get(
              duplicateWard.constituencyId
            );

          if (!canonicalConstituencyId) {
            throw new Error(
              `No canonical constituency mapping for ward ${duplicateWard.id}.`
            );
          }

          const canonicalWard =
            await getCanonicalWard(
              tx,
              duplicateWard,
              canonicalConstituencyId
            );

          await mergeWard(
            tx,
            duplicateWard.id,
            canonicalWard.id
          );
        }

        // ------------------------------------------
        // Merge CONSTITUENCIES
        // ------------------------------------------

        console.log(
          `\nMerging ${duplicateConstituencies.length} constituencies...`
        );

        for (const duplicateConstituency of duplicateConstituencies) {
          const canonicalId =
            constituencyMap.get(
              duplicateConstituency.id
            );

          if (!canonicalId) {
            throw new Error(
              `No canonical constituency ID for ${duplicateConstituency.id}.`
            );
          }

          await mergeConstituency(
            tx,
            duplicateConstituency.id,
            canonicalId
          );
        }

        // ------------------------------------------
        // Merge SUBCOUNTIES
        // ------------------------------------------

        const duplicateSubCounties =
          await tx.subCounty.findMany({
            where: {
              countyId: duplicateCountyId,
            },
            orderBy: {
              id: "asc",
            },
          });

        console.log(
          `\nMerging ${duplicateSubCounties.length} SubCounties...`
        );

        for (const duplicateSubCounty of duplicateSubCounties) {
          const canonicalSubCounty =
            await getCanonicalSubCounty(
              tx,
              duplicateSubCounty,
              canonicalCountyId
            );

          await mergeSubCounty(
            tx,
            duplicateSubCounty.id,
            canonicalSubCounty.id
          );
        }

        // ------------------------------------------
        // Finally merge COUNTY
        // ------------------------------------------

        await mergeCounty(
          tx,
          duplicateCountyId,
          canonicalCountyId
        );
      }

      // --------------------------------------------
      // Final verification INSIDE transaction
      // --------------------------------------------

      await verifyFinalState(tx);

      console.log(
        "\n=============================================="
      );
      console.log(
        "TRANSACTION READY TO COMMIT"
      );
      console.log(
        "=============================================="
      );
    },
    {
      maxWait: 10000,
      timeout: 120000,
    }
  );

  console.log("\n==============================================");
  console.log("REPAIR COMPLETED SUCCESSFULLY");
  console.log("==============================================");
  console.log("\nThe transaction was committed.");
  console.log("The four duplicate counties were removed.");
  console.log("Duplicate hierarchy records were merged.");
  console.log("Application references were preserved.");
  console.log("");
}

main()
  .catch((error) => {
    console.error("\n==============================================");
    console.error("REPAIR FAILED");
    console.error("==============================================");
    console.error(error);
    console.error(
      "\nIMPORTANT: The transaction was rolled back."
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });