import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

type ForeignKeyRow = {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
};

type CodeMatch = {
  file: string;
  line: number;
  text: string;
};

function safeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(safeValue);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      output[key] = safeValue(item);
    }

    return output;
  }

  return value;
}

function safeJson(value: unknown): string {
  return JSON.stringify(
    safeValue(value),
    null,
    2,
  );
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function walkSourceFiles(
  root: string,
  results: CodeMatch[],
  pattern: RegExp,
): void {
  if (!fs.existsSync(root)) {
    return;
  }

  const entries = fs.readdirSync(
    root,
    { withFileTypes: true },
  );

  for (const entry of entries) {
    const fullPath = path.join(
      root,
      entry.name,
    );

    if (entry.isDirectory()) {
      if (
        [
          "node_modules",
          ".next",
          ".git",
          ".venv",
          "dist",
          "build",
        ].includes(entry.name)
      ) {
        continue;
      }

      walkSourceFiles(
        fullPath,
        results,
        pattern,
      );

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(
      entry.name,
    ).toLowerCase();

    const allowed = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".json",
      ".prisma",
      ".sql",
      ".md",
    ];

    if (!allowed.includes(extension)) {
      continue;
    }

    let content = "";

    try {
      content = fs.readFileSync(
        fullPath,
        "utf8",
      );
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        results.push({
          file: path.relative(
            process.cwd(),
            fullPath,
          ),
          line: index + 1,
          text: line.trim(),
        });
      }

      pattern.lastIndex = 0;
    });
  }
}

async function getForeignKeys(): Promise<
  ForeignKeyRow[]
> {
  const rows = await prisma.$queryRaw<
    Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      referenced_table: string;
      referenced_column: string;
    }>
  >`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY
      tc.table_name,
      tc.constraint_name,
      kcu.ordinal_position
  `;

  return rows.map((row) => ({
    constraintName: row.constraint_name,
    tableName: row.table_name,
    columnName: row.column_name,
    referencedTable: row.referenced_table,
    referencedColumn: row.referenced_column,
  }));
}

async function countReferences(
  tableName: string,
  columnName: string,
  id: number,
): Promise<number> {
  const allowedTables =
    await prisma.$queryRaw<
      Array<{
        table_name: string;
      }>
    >`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    `;

  if (allowedTables.length === 0) {
    return 0;
  }

  const allowedColumns =
    await prisma.$queryRaw<
      Array<{
        column_name: string;
      }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    `;

  if (allowedColumns.length === 0) {
    return 0;
  }

  const query = `
    SELECT COUNT(*)::text AS count
    FROM public."${tableName.replace(/"/g, '""')}"
    WHERE "${columnName.replace(/"/g, '""')}" = $1
  `;

  const rows =
    await prisma.$queryRawUnsafe<
      Array<{ count: string }>
    >(
      query,
      id,
    );

  return Number(
    rows[0]?.count ?? "0",
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "GEOGRAPHY REPAIR-IMPACT AUDIT V16",
  );
  console.log(
    "Tiaty East -> Tiaty",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "READ-ONLY: NO DATABASE CHANGES WILL BE MADE.",
  );
  console.log("");

  const targetSubCountyId = 757;
  const targetSubCountyName = "Tiaty East";
  const targetCountyId = 90;
  const targetCountyName = "Baringo";
  const proposedName = "Tiaty";

  console.log(
    "TARGET RECORD",
  );
  console.log(
    "-------------",
  );

  console.log(
    `SubCounty ID       : ${targetSubCountyId}`,
  );

  console.log(
    `Current name       : ${targetSubCountyName}`,
  );

  console.log(
    `Proposed name      : ${proposedName}`,
  );

  console.log(
    `County ID          : ${targetCountyId}`,
  );

  console.log(
    `County             : ${targetCountyName}`,
  );

  console.log("");

  console.log(
    "SECTION 1: TARGET SUBCOUNTY",
  );
  console.log(
    "----------------------------",
  );

  const target =
    await prisma.subCounty.findUnique({
      where: {
        id: targetSubCountyId,
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
          orderBy: {
            id: "asc",
          },
        },
      },
    });

  if (!target) {
    throw new Error(
      `SubCounty ${targetSubCountyId} was not found.`,
    );
  }

  console.log(
    safeJson(target),
  );

  console.log("");

  if (
    normalize(target.name) !==
    normalize(targetSubCountyName)
  ) {
    throw new Error(
      `Unexpected target name: ${target.name}`,
    );
  }

  if (
    target.countyId !==
    targetCountyId
  ) {
    throw new Error(
      `Unexpected target countyId: ${target.countyId}`,
    );
  }

  console.log(
    "Target identity check: PASS",
  );

  console.log("");

  console.log(
    "SECTION 2: WARD DEPENDENCIES",
  );
  console.log(
    "---------------------------",
  );

  console.log(
    `Ward rows referencing SubCounty ${targetSubCountyId}: ${target.wards.length}`,
  );

  for (const ward of target.wards) {
    console.log("");
    console.log(
      `Ward ID          : ${ward.id}`,
    );
    console.log(
      `Ward name        : ${ward.name}`,
    );
    console.log(
      `County ID        : ${ward.countyId}`,
    );
    console.log(
      `SubCounty ID     : ${ward.subCountyId}`,
    );
    console.log(
      `Constituency ID  : ${ward.constituencyId}`,
    );
    console.log(
      `Constituency     : ${ward.constituency?.name}`,
    );
  }

  console.log("");

  const expectedWardNames = [
    "Tirioko Ward",
    "Kolowa Ward",
    "Ribkwo Ward",
    "Silale Ward",
    "Loiyamorok Ward",
    "Tangulbei/korossi Ward",
    "Churo/amaya Ward",
  ];

  const actualWardNames =
    target.wards
      .map((ward) =>
        normalize(ward.name),
      )
      .sort();

  const expectedNormalizedWardNames =
    expectedWardNames
      .map((name) =>
        normalize(name),
      )
      .sort();

  const wardSetMatches =
    JSON.stringify(
      actualWardNames,
    ) ===
    JSON.stringify(
      expectedNormalizedWardNames,
    );

  console.log(
    `Expected seven authoritative wards: ${
      wardSetMatches
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log("");

  console.log(
    "SECTION 3: CONSTITUENCY DEPENDENCY",
  );
  console.log(
    "---------------------------------",
  );

  const constituencyIds =
    [
      ...new Set(
        target.wards
          .map(
            (ward) =>
              ward.constituencyId,
          )
          .filter(
            (
              value,
            ): value is number =>
              value !== null,
          ),
      ),
    ];

  console.log(
    `Distinct Constituencies used by target wards: ${constituencyIds.length}`,
  );

  for (const id of constituencyIds) {
    const constituency =
      await prisma.constituency.findUnique({
        where: {
          id,
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
        },
      });

    const wardCount =
      target.wards.filter(
        (ward) =>
          ward.constituencyId === id,
      ).length;

    console.log(
      `Constituency ${id} | ${
        constituency?.name
      } | County ${
        constituency?.countyId
      } ${
        constituency?.county?.name
      } | Target wards ${wardCount}`,
    );
  }

  console.log("");

  console.log(
    "SECTION 4: VILLAGE DEPENDENCIES",
  );
  console.log(
    "-------------------------------",
  );

  const targetWardIds =
    target.wards.map(
      (ward) => ward.id,
    );

  if (targetWardIds.length === 0) {
    console.log(
      "No target wards found.",
    );
  } else {
    const villageRows =
      await prisma.village.findMany({
        where: {
          wardId: {
            in: targetWardIds,
          },
        },
        select: {
          id: true,
          name: true,
          wardId: true,
        },
        orderBy: {
          id: "asc",
        },
      });

    console.log(
      `Village rows under target wards: ${villageRows.length}`,
    );

    for (const village of villageRows) {
      console.log(
        `Village ${village.id} | ${village.name} | Ward ${village.wardId}`,
      );
    }
  }

  console.log("");

  console.log(
    "SECTION 5: ALL DATABASE FOREIGN KEYS TO SUBCOUNTY",
  );
  console.log(
    "-----------------------------------------------",
  );

  const foreignKeys =
    await getForeignKeys();

  const subCountyForeignKeys =
    foreignKeys.filter(
      (fk) =>
        fk.referencedTable ===
          "SubCounty" &&
        fk.referencedColumn ===
          "id",
    );

  console.log(
    `Foreign-key definitions referencing SubCounty.id: ${subCountyForeignKeys.length}`,
  );

  for (const fk of subCountyForeignKeys) {
    console.log(
      `${fk.tableName}.${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn} | ${fk.constraintName}`,
    );
  }

  console.log("");

  console.log(
    "SECTION 6: ACTUAL ROW COUNTS REFERENCING SUBCOUNTY 757",
  );
  console.log(
    "------------------------------------------------------",
  );

  let totalReferences = 0;

  for (const fk of subCountyForeignKeys) {
    const count =
      await countReferences(
        fk.tableName,
        fk.columnName,
        targetSubCountyId,
      );

    console.log(
      `${fk.tableName}.${fk.columnName}: ${count}`,
    );

    totalReferences += count;
  }

  console.log("");

  console.log(
    `Total FK references to SubCounty ${targetSubCountyId}: ${totalReferences}`,
  );

  console.log("");

  console.log(
    "SECTION 7: DIRECT FARMER REFERENCES",
  );
  console.log(
    "----------------------------------",
  );

  const farmerColumns =
    await prisma.$queryRaw<
      Array<{
        column_name: string;
      }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Farmer'
        AND column_name IN (
          'subCountyId',
          'countyId',
          'wardId',
          'villageId'
        )
      ORDER BY column_name
    `;

  if (farmerColumns.length === 0) {
    console.log(
      "No expected Farmer geography columns found.",
    );
  } else {
    for (const column of farmerColumns) {
      const count =
        await countReferences(
          "Farmer",
          column.column_name,
          targetSubCountyId,
        );

      console.log(
        `Farmer.${column.column_name}: ${count}`,
      );
    }
  }

  console.log("");

  console.log(
    "SECTION 8: DIRECT FARM REFERENCES",
  );
  console.log(
    "--------------------------------",
  );

  const farmColumns =
    await prisma.$queryRaw<
      Array<{
        column_name: string;
      }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Farm'
        AND column_name IN (
          'subCountyId',
          'countyId',
          'wardId',
          'villageId'
        )
      ORDER BY column_name
    `;

  if (farmColumns.length === 0) {
    console.log(
      "No expected Farm geography columns found.",
    );
  } else {
    for (const column of farmColumns) {
      const count =
        await countReferences(
          "Farm",
          column.column_name,
          targetSubCountyId,
        );

      console.log(
        `Farm.${column.column_name}: ${count}`,
      );
    }
  }

  console.log("");

  console.log(
    "SECTION 9: SUBCOUNTY NAME UNIQUENESS IMPACT",
  );
  console.log(
    "------------------------------------------",
  );

  const sameNameRows =
    await prisma.subCounty.findMany({
      where: {
        countyId:
          targetCountyId,
        name: {
          equals:
            proposedName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        county: {
          select: {
            name: true,
          },
        },
      },
    });

  console.log(
    `Existing Baringo SubCounty rows named "${proposedName}": ${sameNameRows.length}`,
  );

  for (const row of sameNameRows) {
    console.log(
      `ID ${row.id} | ${row.name} | County ${row.countyId} ${row.county.name}`,
    );
  }

  const nameCollision =
    sameNameRows.some(
      (row) =>
        row.id !==
        targetSubCountyId,
    );

  console.log(
    `Proposed rename collision: ${
      nameCollision
        ? "FAIL"
        : "PASS"
    }`,
  );

  console.log("");

  console.log(
    "SECTION 10: DATABASE RECORDS CONTAINING 'TIATY EAST'",
  );
  console.log(
    "---------------------------------------------------",
  );

  const subCountyNameMatches =
    await prisma.subCounty.findMany({
      where: {
        name: {
          contains:
            "Tiaty East",
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        countyId: true,
        county: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `SubCounty records containing "Tiaty East": ${subCountyNameMatches.length}`,
  );

  for (const row of subCountyNameMatches) {
    console.log(
      `ID ${row.id} | ${row.name} | County ${row.county.name}`,
    );
  }

  console.log("");

  console.log(
    "SECTION 11: DATABASE SCHEMA CHECK",
  );
  console.log(
    "-------------------------------",
  );

  const prismaSchemaPath =
    path.join(
      process.cwd(),
      "prisma",
      "schema.prisma",
    );

  if (
    fs.existsSync(
      prismaSchemaPath,
    )
  ) {
    const schema =
      fs.readFileSync(
        prismaSchemaPath,
        "utf8",
      );

    const subCountyBlockMatch =
      schema.match(
        /model\s+SubCounty\s*\{([\s\S]*?)\n\}/m,
      );

    if (
      subCountyBlockMatch
    ) {
      const block =
        subCountyBlockMatch[1];

      console.log(
        "SubCounty model found: YES",
      );

      const uniqueLines =
        block
          .split(/\r?\n/)
          .map((line) =>
            line.trim(),
          )
          .filter((line) =>
            line.startsWith(
              "@@unique",
            ),
          );

      if (
        uniqueLines.length === 0
      ) {
        console.log(
          "SubCounty composite @@unique declarations: NONE",
        );
      } else {
        console.log(
          "SubCounty composite @@unique declarations:",
        );

        for (const line of uniqueLines) {
          console.log(
            `  ${line}`,
          );
        }
      }

      const countyIdLine =
        block
          .split(/\r?\n/)
          .find((line) =>
            line.trim().startsWith(
              "countyId ",
            ),
          );

      const nameLine =
        block
          .split(/\r?\n/)
          .find((line) =>
            line.trim().startsWith(
              "name ",
            ),
          );

      console.log(
        `countyId field: ${
          countyIdLine?.trim() ??
          "NOT FOUND"
        }`,
      );

      console.log(
        `name field: ${
          nameLine?.trim() ??
          "NOT FOUND"
        }`,
      );
    } else {
      console.log(
        "SubCounty model found: NO",
      );
    }
  } else {
    console.log(
      `Prisma schema not found: ${prismaSchemaPath}`,
    );
  }

  console.log("");

  console.log(
    "SECTION 12: SOURCE-CODE REFERENCES TO 'TIATY EAST'",
  );
  console.log(
    "-----------------------------------------------",
  );

  const codeMatches: CodeMatch[] = [];

  walkSourceFiles(
    process.cwd(),
    codeMatches,
    /tiaty\s+east/i,
  );

  console.log(
    `Source-code matches: ${codeMatches.length}`,
  );

  for (const match of codeMatches) {
    console.log("");
    console.log(
      `${match.file}:${match.line}`,
    );
    console.log(
      `  ${match.text}`,
    );
  }

  console.log("");

  console.log(
    "SECTION 13: SOURCE-CODE REFERENCES TO 'TIATY'",
  );
  console.log(
    "------------------------------------------",
  );

  const tiatyMatches: CodeMatch[] = [];

  walkSourceFiles(
    process.cwd(),
    tiatyMatches,
    /\btiaty\b/i,
  );

  console.log(
    `Source-code matches containing standalone "Tiaty": ${tiatyMatches.length}`,
  );

  for (const match of tiatyMatches.slice(
    0,
    100,
  )) {
    console.log("");
    console.log(
      `${match.file}:${match.line}`,
    );
    console.log(
      `  ${match.text}`,
    );
  }

  if (
    tiatyMatches.length > 100
  ) {
    console.log("");
    console.log(
      `Only first 100 of ${tiatyMatches.length} matches displayed.`,
    );
  }

  console.log("");

  console.log(
    "SECTION 14: API / LOCATION DATA RISK CHECK",
  );
  console.log(
    "-----------------------------------------",
  );

  const apiFiles: string[] = [];

  const apiRoot =
    path.join(
      process.cwd(),
      "app",
      "api",
    );

  function findApiFiles(
    root: string,
  ): void {
    if (!fs.existsSync(root)) {
      return;
    }

    const entries =
      fs.readdirSync(
        root,
        { withFileTypes: true },
      );

    for (const entry of entries) {
      const fullPath =
        path.join(
          root,
          entry.name,
        );

      if (entry.isDirectory()) {
        findApiFiles(fullPath);
      } else if (
        entry.isFile() &&
        (
          entry.name ===
            "route.ts" ||
          entry.name ===
            "route.tsx"
        )
      ) {
        apiFiles.push(
          path.relative(
            process.cwd(),
            fullPath,
          ),
        );
      }
    }
  }

  findApiFiles(apiRoot);

  console.log(
    `API route files found: ${apiFiles.length}`,
  );

  const locationApiMatches =
    codeMatches.filter(
      (match) =>
        match.file
          .toLowerCase()
          .includes(
            "location",
          ) ||
        match.file
          .toLowerCase()
          .includes(
            "farmer",
          ),
    );

  console.log(
    `Location/Farmer API files containing "Tiaty East": ${locationApiMatches.length}`,
  );

  for (const match of locationApiMatches) {
    console.log(
      `${match.file}:${match.line} | ${match.text}`,
    );
  }

  console.log("");

  console.log(
    "SECTION 15: DIRECT DATABASE NAME-DEPENDENCY TEST",
  );
  console.log(
    "-----------------------------------------------",
  );

  console.log(
    "A database rename of SubCounty.id=757 changes only the SubCounty.name value.",
  );

  console.log(
    "It does NOT change:",
  );

  console.log(
    "  - SubCounty ID 757",
  );

  console.log(
    "  - County ID 90",
  );

  console.log(
    "  - any Ward ID",
  );

  console.log(
    "  - any Ward foreign key",
  );

  console.log(
    "  - any Constituency ID",
  );

  console.log(
    "  - any Farmer geography FK",
  );

  console.log(
    "  - any Farm geography FK",
  );

  console.log(
    "  - any Village ID",
  );

  console.log("");

  console.log(
    "The main database risk is therefore a name-dependent application or external integration, not relational integrity.",
  );

  console.log("");

  console.log(
    "SECTION 16: FINAL REPAIR-IMPACT ASSESSMENT",
  );
  console.log(
    "------------------------------------------",
  );

  const targetExists =
    target.id ===
    targetSubCountyId;

  const targetNameCorrect =
    normalize(target.name) ===
    normalize(targetSubCountyName);

  const targetCountyCorrect =
    target.countyId ===
    targetCountyId;

  const sevenWards =
    target.wards.length ===
    7;

  const noWardSetProblem =
    wardSetMatches;

  const noNameCollision =
    !nameCollision;

  const hasForeignKeyReferences =
    totalReferences > 0;

  const hasCodeDependency =
    codeMatches.length > 0;

  console.log(
    `Target exists                         : ${
      targetExists
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Target name is Tiaty East             : ${
      targetNameCorrect
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Target county is Baringo (90)         : ${
      targetCountyCorrect
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Target has exactly 7 wards            : ${
      sevenWards
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Seven-ward identity set is correct    : ${
      noWardSetProblem
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `No proposed Tiaty name collision      : ${
      noNameCollision
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `Existing FK references are present    : ${
      hasForeignKeyReferences
        ? "YES"
        : "NO"
    }`,
  );

  console.log(
    `Source-code name references present   : ${
      hasCodeDependency
        ? "YES"
        : "NO"
    }`,
  );

  console.log("");

  if (
    targetExists &&
    targetNameCorrect &&
    targetCountyCorrect &&
    sevenWards &&
    noWardSetProblem &&
    noNameCollision
  ) {
    console.log(
      "V16 DATABASE STRUCTURAL SAFETY: PASS",
    );

    console.log(
      "",
    );

    console.log(
      "The SubCounty row can theoretically be renamed in place:",
    );

    console.log(
      `  ID ${targetSubCountyId}: "${targetSubCountyName}" -> "${proposedName}"`,
    );

    console.log(
      "",
    );

    console.log(
      "IMPORTANT:",
    );

    console.log(
      "This audit has NOT performed that rename.",
    );

    console.log(
      "No INSERT, UPDATE, DELETE, or schema change was executed.",
    );

    console.log(
      "",
    );

    console.log(
      "Before executing the rename, review any source-code matches and FK counts above.",
    );
  } else {
    console.log(
      "V16 DATABASE STRUCTURAL SAFETY: REVIEW REQUIRED",
    );

    console.log(
      "DO NOT RENAME THE SUBCOUNTY.",
    );
  }

  console.log("");

  console.log(
    "============================================================",
  );
  console.log(
    "V16 COMPLETE",
  );
  console.log(
    "READ-ONLY: NO DATABASE CHANGES WERE MADE.",
  );
  console.log(
    "============================================================",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "V16 AUDIT FAILED",
    );
    console.error("");

    console.error(
      error instanceof Error
        ? error.message
        : error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });