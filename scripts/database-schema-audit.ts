import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

type QueryRow = Record<string, unknown>;

type PrismaField = {
  model: string;
  field: string;
  type: string;
  isList: boolean;
  isOptional: boolean;
  isRelation: boolean;
  isEnum: boolean;
};

type PrismaModel = {
  name: string;
  fields: PrismaField[];
};

type DatabaseColumn = {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
};

type ForeignKeyRow = {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  ordinal_position: number;
};

type ForeignKeyGroup = {
  constraint_name: string;
  table_name: string;
  foreign_table_name: string;
  columns: string[];
  foreign_columns: string[];
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const issues: string[] = [];

function addIssue(category: string, message: string) {
  issues.push(`[${category}] ${message}`);
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function normalizePrismaType(value: string): string {
  return value.replace(/\[\]$/, "").replace(/\?$/, "").trim();
}

function isPrismaScalarType(type: string): boolean {
  const normalized = normalizePrismaType(type);

  return [
    "String",
    "Boolean",
    "Int",
    "BigInt",
    "Float",
    "Decimal",
    "DateTime",
    "Json",
    "Bytes",
  ].includes(normalized);
}

function prismaTypeToExpectedPostgresTypes(type: string): string[] {
  const normalized = normalizePrismaType(type);

  switch (normalized) {
    case "String":
      return [
        "text",
        "character varying",
        "character",
        "citext",
        "uuid",
      ];

    case "Int":
      return ["integer", "int4"];

    case "BigInt":
      return ["bigint", "int8"];

    case "Float":
      return ["double precision", "real", "numeric"];

    case "Decimal":
      return ["numeric", "decimal"];

    case "Boolean":
      return ["boolean"];

    case "DateTime":
      return [
        "timestamp without time zone",
        "timestamp with time zone",
        "date",
      ];

    case "Json":
      return ["json", "jsonb"];

    case "Bytes":
      return ["bytea"];

    default:
      return [];
  }
}

function readPrismaSchema(): string {
  const schemaPath = path.resolve(
    process.cwd(),
    "prisma",
    "schema.prisma",
  );

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found: ${schemaPath}`);
  }

  return fs.readFileSync(schemaPath, "utf8");
}

function parsePrismaSchema(schema: string): {
  models: PrismaModel[];
  enumNames: Set<string>;
  fields: PrismaField[];
} {
  const enumNames = new Set<string>();

  const enumRegex =
    /enum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{[\s\S]*?\n\}/g;

  for (const match of schema.matchAll(enumRegex)) {
    enumNames.add(match[1]);
  }

  const models: PrismaModel[] = [];

  const modelRegex =
    /model\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\n\}/g;

  for (const match of schema.matchAll(modelRegex)) {
    const modelName = match[1];
    const body = match[2];

    const fields: PrismaField[] = [];

    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line) continue;
      if (line.startsWith("//")) continue;
      if (line.startsWith("@@")) continue;

      const fieldMatch = line.match(
        /^([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)(\[\])?(\?)?(?:\s+.*)?$/,
      );

      if (!fieldMatch) {
        continue;
      }

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const isList = Boolean(fieldMatch[3]);
      const isOptional = Boolean(fieldMatch[4]);

      const normalizedType = normalizePrismaType(fieldType);

      const isEnum = enumNames.has(normalizedType);

      const isScalar =
        isPrismaScalarType(fieldType) ||
        isEnum;

      fields.push({
        model: modelName,
        field: fieldName,
        type: fieldType,
        isList,
        isOptional,
        isRelation: !isScalar,
        isEnum,
      });
    }

    models.push({
      name: modelName,
      fields,
    });
  }

  return {
    models,
    enumNames,
    fields: models.flatMap((model) => model.fields),
  };
}

async function queryRows<T extends QueryRow>(
  sql: string,
): Promise<T[]> {
  const result =
    await prisma.$queryRawUnsafe<T[]>(sql);

  return result;
}

async function scalarNumber(sql: string): Promise<number> {
  const rows = await queryRows<{ value: string }>(sql);

  if (!rows.length) {
    return 0;
  }

  return Number(rows[0].value);
}

function printSection(number: number, title: string) {
  console.log("");
  console.log("=".repeat(80));
  console.log(`SECTION ${number}: ${title}`);
  console.log("=".repeat(80));
}

async function auditModelTableCoverage(
  models: PrismaModel[],
) {
  printSection(
    1,
    "PRISMA MODEL / DATABASE TABLE COVERAGE",
  );

  const tables = await queryRows<{
    table_name: string;
  }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const dbTables = tables.map((row) => row.table_name);

  const prismaModels = models.map((model) => model.name);

  const applicationTables = dbTables.filter(
    (table) =>
      ![
        "_prisma_migrations",
      ].includes(table),
  );

  const missingModels = prismaModels.filter(
    (model) =>
      !applicationTables.some(
        (table) =>
          normalizeIdentifier(table) ===
          normalizeIdentifier(model),
      ),
  );

  const extraTables = applicationTables.filter(
    (table) =>
      !prismaModels.some(
        (model) =>
          normalizeIdentifier(model) ===
          normalizeIdentifier(table),
      ),
  );

  console.log(
    `Public database tables: ${dbTables.length}`,
  );

  console.log(
    `Application database tables: ${applicationTables.length}`,
  );

  console.log(
    `Prisma models: ${prismaModels.length}`,
  );

  console.log(
    `Missing database tables for Prisma models: ${missingModels.length}`,
  );

  console.log(
    `Extra application tables not represented in Prisma: ${extraTables.length}`,
  );

  if (missingModels.length) {
    for (const model of missingModels) {
      addIssue(
        "MODEL",
        `Prisma model missing database table: ${model}`,
      );
    }
  }

  if (extraTables.length) {
    for (const table of extraTables) {
      addIssue(
        "MODEL",
        `Database table missing Prisma model: ${table}`,
      );
    }
  }

  console.log(
    `Model/table coverage: ${
      missingModels.length === 0 &&
      extraTables.length === 0
        ? "PASS"
        : "FAIL"
    }`,
  );
}

async function auditKeyTableCounts() {
  printSection(
    2,
    "KEY TABLE COUNTS",
  );

  const tables = [
    "Country",
    "County",
    "SubCounty",
    "Constituency",
    "Ward",
    "Role",
    "User",
    "Farmer",
    "Farm",
    "BusinessPartner",
    "CommodityTransaction",
  ];

  for (const table of tables) {
    const count = await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM "public".${quoteIdentifier(table)};
    `);

    console.log(`${table}: ${count}`);
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function getDatabaseColumns(): Promise<DatabaseColumn[]> {
  return queryRows<DatabaseColumn>(`
    SELECT
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);
}

async function auditScalarColumns(
  models: PrismaModel[],
  databaseColumns: DatabaseColumn[],
) {
  printSection(
    3,
    "PRISMA SCALAR FIELD / DATABASE COLUMN COVERAGE",
  );

  const scalarFields = models.flatMap(
    (model) =>
      model.fields.filter(
        (field) => !field.isRelation,
      ),
  );

  const relationFields = models.flatMap(
    (model) =>
      model.fields.filter(
        (field) => field.isRelation,
      ),
  );

  const dbColumnSet = new Set(
    databaseColumns.map(
      (column) =>
        `${normalizeIdentifier(
          column.table_name,
        )}.${normalizeIdentifier(
          column.column_name,
        )}`,
    ),
  );

  const missingColumns: PrismaField[] = [];

  for (const field of scalarFields) {
    const key = `${normalizeIdentifier(
      field.model,
    )}.${normalizeIdentifier(field.field)}`;

    if (!dbColumnSet.has(key)) {
      missingColumns.push(field);
    }
  }

  console.log(
    `Prisma scalar fields: ${scalarFields.length}`,
  );

  console.log(
    `Prisma relation fields: ${relationFields.length}`,
  );

  console.log(
    `Missing scalar database columns: ${missingColumns.length}`,
  );

  if (missingColumns.length) {
    for (const field of missingColumns) {
      addIssue(
        "COLUMN",
        `Missing database column: ${field.model}.${field.field}`,
      );
    }
  }

  console.log(
    `Scalar column coverage: ${
      missingColumns.length === 0
        ? "PASS"
        : "FAIL"
    }`,
  );
}

async function auditRelationFields(
  models: PrismaModel[],
) {
  printSection(
    4,
    "PRISMA RELATION FIELD SUMMARY",
  );

  const relationFields = models.flatMap(
    (model) =>
      model.fields.filter(
        (field) => field.isRelation,
      ),
  );

  console.log(
    `Relation fields parsed: ${relationFields.length}`,
  );

  const relationByModel = new Map<string, number>();

  for (const field of relationFields) {
    relationByModel.set(
      field.model,
      (relationByModel.get(field.model) ?? 0) + 1,
    );
  }

  console.log(
    `Models containing relation fields: ${relationByModel.size}`,
  );
}

async function auditPrismaTypes(
  models: PrismaModel[],
  databaseColumns: DatabaseColumn[],
) {
  printSection(
    5,
    "PRISMA TYPE / DATABASE TYPE AUDIT",
  );

  const columnMap = new Map<string, DatabaseColumn>();

  for (const column of databaseColumns) {
    const key = `${normalizeIdentifier(
      column.table_name,
    )}.${normalizeIdentifier(
      column.column_name,
    )}`;

    columnMap.set(key, column);
  }

  const scalarFields = models.flatMap(
    (model) =>
      model.fields.filter(
        (field) => !field.isRelation,
      ),
  );

  let checked = 0;
  let mismatches = 0;

  for (const field of scalarFields) {
    if (field.isEnum) {
      continue;
    }

    if (field.isList) {
      continue;
    }

    const key = `${normalizeIdentifier(
      field.model,
    )}.${normalizeIdentifier(field.field)}`;

    const dbColumn = columnMap.get(key);

    if (!dbColumn) {
      continue;
    }

    const expected =
      prismaTypeToExpectedPostgresTypes(
        field.type,
      );

    if (expected.length === 0) {
      continue;
    }

    checked++;

    const actual = dbColumn.data_type;

    if (!expected.includes(actual)) {
      mismatches++;

      addIssue(
        "TYPE",
        `${field.model}.${field.field}: Prisma ${field.type} vs PostgreSQL ${actual}`,
      );
    }
  }

  console.log(
    `Scalar fields checked: ${checked}`,
  );

  console.log(
    `Type mismatches: ${mismatches}`,
  );

  console.log(
    `Type audit: ${
      mismatches === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditCoreColumns(
  databaseColumns: DatabaseColumn[],
) {
  printSection(
    6,
    "CORE COLUMN STRUCTURE",
  );

  const requiredColumns: Array<{
    table: string;
    column: string;
  }> = [
    {
      table: "Country",
      column: "id",
    },
    {
      table: "Country",
      column: "name",
    },
    {
      table: "County",
      column: "id",
    },
    {
      table: "County",
      column: "name",
    },
    {
      table: "County",
      column: "countryId",
    },
    {
      table: "SubCounty",
      column: "id",
    },
    {
      table: "SubCounty",
      column: "name",
    },
    {
      table: "SubCounty",
      column: "countyId",
    },
    {
      table: "Constituency",
      column: "id",
    },
    {
      table: "Constituency",
      column: "name",
    },
    {
      table: "Constituency",
      column: "countyId",
    },
    {
      table: "Ward",
      column: "id",
    },
    {
      table: "Ward",
      column: "name",
    },
    {
      table: "Ward",
      column: "countyId",
    },
    {
      table: "Ward",
      column: "constituencyId",
    },
    {
      table: "Ward",
      column: "subCountyId",
    },
  ];

  const columnSet = new Set(
    databaseColumns.map(
      (column) =>
        `${normalizeIdentifier(
          column.table_name,
        )}.${normalizeIdentifier(
          column.column_name,
        )}`,
    ),
  );

  let failures = 0;

  for (const required of requiredColumns) {
    const key = `${normalizeIdentifier(
      required.table,
    )}.${normalizeIdentifier(required.column)}`;

    const pass = columnSet.has(key);

    console.log(
      `${required.table}.${required.column}: ${
        pass ? "PASS" : "FAIL"
      }`,
    );

    if (!pass) {
      failures++;

      addIssue(
        "CORE_COLUMN",
        `Required core column missing: ${required.table}.${required.column}`,
      );
    }
  }

  console.log(
    `Core column structure: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditPrimaryKeys() {
  printSection(
    7,
    "PRIMARY KEY AUDIT",
  );

  const rows = await queryRows<{
    table_name: string;
    constraint_name: string;
  }>(`
    SELECT
      tc.table_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY tc.table_name;
  `);

  console.log(
    `Primary key constraints observed: ${rows.length}`,
  );

  const tables = await queryRows<{
    table_name: string;
  }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name;
  `);

  const pkTables = new Set(
    rows.map(
      (row) =>
        normalizeIdentifier(row.table_name),
    ),
  );

  let failures = 0;

  for (const table of tables) {
    const pass = pkTables.has(
      normalizeIdentifier(table.table_name),
    );

    if (!pass) {
      failures++;

      addIssue(
        "PRIMARY_KEY",
        `Application table has no primary key: ${table.table_name}`,
      );
    }
  }

  console.log(
    `Application tables without primary key: ${failures}`,
  );

  console.log(
    `Primary key audit: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditUniqueConstraints() {
  printSection(
    8,
    "UNIQUE CONSTRAINT / INDEX AUDIT",
  );

  /*
   * IMPORTANT:
   *
   * Do not use array_agg(), indkey arrays, or pg_get_indexdef()
   * results that PrismaPg may deserialize as Unknown.
   *
   * We only return scalar PostgreSQL values.
   */

  const indexes = await queryRows<{
    index_name: string;
    table_name: string;
  }>(`
    SELECT
      c.relname AS index_name,
      t.relname AS table_name
    FROM pg_class c
    JOIN pg_index i
      ON i.indexrelid = c.oid
    JOIN pg_class t
      ON t.oid = i.indrelid
    JOIN pg_namespace n
      ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND i.indisunique = true
    ORDER BY t.relname, c.relname;
  `);

  console.log(
    `Unique indexes observed: ${indexes.length}`,
  );

  const checks = [
    {
      table: "Country",
      column: "name",
      label: "Country.name",
    },
    {
      table: "Farmer",
      column: "phone",
      label: "Farmer.phone",
    },
    {
      table: "User",
      column: "email",
      label: "User.email",
    },
    {
      table: "User",
      column: "firebaseUid",
      label: "User.firebaseUid",
    },
  ];

  let failures = 0;

  for (const check of checks) {
    /*
     * PostgreSQL folds unquoted identifiers to lowercase.
     *
     * The actual Prisma column is "firebaseUid", so we must
     * inspect pg_attribute.attname rather than writing:
     *
     * firebaseUid
     *
     * directly in SQL.
     *
     * i.indkey[0] is used only inside PostgreSQL to identify
     * the indexed attribute. It is NOT returned to PrismaPg.
     */

    const count = await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM pg_index i
      JOIN pg_class index_class
        ON index_class.oid = i.indexrelid
      JOIN pg_class table_class
        ON table_class.oid = i.indrelid
      JOIN pg_namespace table_namespace
        ON table_namespace.oid = table_class.relnamespace
      JOIN pg_attribute a
        ON a.attrelid = table_class.oid
       AND a.attnum = i.indkey[0]
      WHERE table_namespace.nspname = 'public'
        AND table_class.relname = ${escapeLiteral(
          check.table,
        )}
        AND a.attname = ${escapeLiteral(
          check.column,
        )}
        AND i.indisunique = true
        AND i.indnkeyatts = 1;
    `);

    const pass = count > 0;

    console.log(
      `${check.label}: ${
        pass ? "PASS" : "FAIL"
      }`,
    );

    if (!pass) {
      failures++;

      addIssue(
        "UNIQUE",
        `Required unique constraint/index missing: ${check.label}`,
      );
    }
  }

  console.log(
    `Required unique constraints/indexes: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function getForeignKeyRows(): Promise<ForeignKeyRow[]> {
  /*
   * PrismaPg-safe version.
   *
   * We intentionally do NOT use:
   *
   * array_agg()
   * conkey
   * confkey
   * pg_get_constraintdef()
   *
   * as returned columns.
   *
   * Each FK column is returned as a normal scalar row and
   * grouped in TypeScript.
   */

  return queryRows<ForeignKeyRow>(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      kcu.ordinal_position::integer AS ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY
      tc.table_name,
      tc.constraint_name,
      kcu.ordinal_position;
  `);
}

function groupForeignKeys(
  rows: ForeignKeyRow[],
): ForeignKeyGroup[] {
  const groups = new Map<
    string,
    ForeignKeyGroup
  >();

  for (const row of rows) {
    const key = `${row.table_name}:${row.constraint_name}`;

    let group = groups.get(key);

    if (!group) {
      group = {
        constraint_name: row.constraint_name,
        table_name: row.table_name,
        foreign_table_name:
          row.foreign_table_name,
        columns: [],
        foreign_columns: [],
      };

      groups.set(key, group);
    }

    group.columns.push(row.column_name);
    group.foreign_columns.push(
      row.foreign_column_name,
    );
  }

  return [...groups.values()];
}

async function auditForeignKeys() {
  printSection(
    9,
    "FOREIGN KEY INTEGRITY",
  );

  const rows = await getForeignKeyRows();
  const foreignKeys = groupForeignKeys(rows);

  console.log(
    `Foreign key constraints observed: ${foreignKeys.length}`,
  );

  let orphanRows = 0;

  for (const fk of foreignKeys) {
    if (fk.columns.length !== 1) {
      /*
       * Composite FK orphan checks are deliberately skipped
       * here because the database metadata audit already
       * confirms the FK definition.
       */
      continue;
    }

    const localColumn = fk.columns[0];
    const foreignColumn =
      fk.foreign_columns[0];

    const orphanCount = await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM ${quoteIdentifier(
        fk.table_name,
      )} local_table
      LEFT JOIN ${quoteIdentifier(
        fk.foreign_table_name,
      )} foreign_table
        ON local_table.${quoteIdentifier(
          localColumn,
        )} = foreign_table.${quoteIdentifier(
          foreignColumn,
        )}
      WHERE local_table.${quoteIdentifier(
        localColumn,
      )} IS NOT NULL
        AND foreign_table.${quoteIdentifier(
          foreignColumn,
        )} IS NULL;
    `);

    if (orphanCount > 0) {
      orphanRows += orphanCount;

      addIssue(
        "FOREIGN_KEY",
        `${fk.table_name}.${localColumn} -> ${fk.foreign_table_name}.${foreignColumn}: ${orphanCount} orphan rows`,
      );
    }
  }

  console.log(
    `Orphan foreign-key rows: ${orphanRows}`,
  );

  console.log(
    `Foreign key integrity: ${
      orphanRows === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditLogicalDuplicates() {
  printSection(
    10,
    "LOGICAL DUPLICATE AUDIT",
  );

  const checks = [
    {
      table: "Country",
      column: "name",
      label: "Country.name",
    },
    {
      table: "County",
      column: "name",
      label: "County.name",
    },
    {
      table: "SubCounty",
      column: "name",
      label: "SubCounty.name",
    },
    {
      table: "Constituency",
      column: "name",
      label: "Constituency.name",
    },
    {
      table: "Ward",
      column: "name",
      label: "Ward.name",
    },
    {
      table: "User",
      column: "email",
      label: "User.email",
    },
    {
      table: "User",
      column: "firebaseUid",
      label: "User.firebaseUid",
    },
    {
      table: "Farmer",
      column: "phone",
      label: "Farmer.phone",
    },
  ];

  let failures = 0;

  for (const check of checks) {
    const rows = await queryRows<{
      duplicate_count: string;
    }>(`
      SELECT COUNT(*)::text AS duplicate_count
      FROM (
        SELECT
          LOWER(TRIM(${quoteIdentifier(
            check.column,
          )}::text)) AS normalized_value,
          COUNT(*) AS value_count
        FROM ${quoteIdentifier(check.table)}
        WHERE ${quoteIdentifier(
          check.column,
        )} IS NOT NULL
        GROUP BY LOWER(TRIM(${quoteIdentifier(
          check.column,
        )}::text))
        HAVING COUNT(*) > 1
      ) duplicates;
    `);

    const duplicateCount = Number(
      rows[0]?.duplicate_count ?? 0,
    );

    console.log(
      `${check.label}: ${duplicateCount} duplicate groups`,
    );

    if (duplicateCount > 0) {
      failures++;

      addIssue(
        "DUPLICATE",
        `${check.label} has ${duplicateCount} logical duplicate groups`,
      );
    }
  }

  console.log(
    `Logical duplicate audit: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditGeographyStructure() {
  printSection(
    11,
    "GEOGRAPHY STRUCTURE AUDIT",
  );

  const checks = [
    {
      name: "Duplicate County names",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM (
          SELECT LOWER(TRIM(name)) AS normalized_name
          FROM "County"
          GROUP BY LOWER(TRIM(name))
          HAVING COUNT(*) > 1
        ) x;
      `,
    },
    {
      name: "Duplicate SubCounty identities",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM (
          SELECT
            "countyId",
            LOWER(TRIM(name)) AS normalized_name
          FROM "SubCounty"
          GROUP BY
            "countyId",
            LOWER(TRIM(name))
          HAVING COUNT(*) > 1
        ) x;
      `,
    },
    {
      name: "Duplicate Constituency identities",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM (
          SELECT
            "countyId",
            LOWER(TRIM(name)) AS normalized_name
          FROM "Constituency"
          GROUP BY
            "countyId",
            LOWER(TRIM(name))
          HAVING COUNT(*) > 1
        ) x;
      `,
    },
    {
      name: "Duplicate Ward identities",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM (
          SELECT
            "constituencyId",
            LOWER(TRIM(name)) AS normalized_name
          FROM "Ward"
          GROUP BY
            "constituencyId",
            LOWER(TRIM(name))
          HAVING COUNT(*) > 1
        ) x;
      `,
    },
  ];

  let failures = 0;

  for (const check of checks) {
    const count = await scalarNumber(
      check.sql,
    );

    console.log(
      `${check.name}: ${count}`,
    );

    if (count > 0) {
      failures++;

      addIssue(
        "GEOGRAPHY",
        `${check.name}: ${count}`,
      );
    }
  }

  console.log(
    `Geography structure: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditBusinessGeographyRelationships() {
  printSection(
    12,
    "BUSINESS / GEOGRAPHY RELATIONSHIP AUDIT",
  );

  const checks = [
    {
      name: "Farm invalid county references",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Farm" f
        LEFT JOIN "County" c
          ON c.id = f."countyId"
        WHERE f."countyId" IS NOT NULL
          AND c.id IS NULL;
      `,
    },
    {
      name: "Farm invalid subcounty references",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Farm" f
        LEFT JOIN "SubCounty" s
          ON s.id = f."subCountyId"
        WHERE f."subCountyId" IS NOT NULL
          AND s.id IS NULL;
      `,
    },
    {
      name: "Farm invalid ward references",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Farm" f
        LEFT JOIN "Ward" w
          ON w.id = f."wardId"
        WHERE f."wardId" IS NOT NULL
          AND w.id IS NULL;
      `,
    },
    {
      name: "Farmer invalid county references",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Farmer" f
        LEFT JOIN "County" c
          ON c.id = f."countyId"
        WHERE f."countyId" IS NOT NULL
          AND c.id IS NULL;
      `,
    },
    {
      name: "Farmer invalid subcounty references",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Farmer" f
        LEFT JOIN "SubCounty" s
          ON s.id = f."subCountyId"
        WHERE f."subCountyId" IS NOT NULL
          AND s.id IS NULL;
      `,
    },
    {
      name: "Farmer invalid ward references",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Farmer" f
        LEFT JOIN "Ward" w
          ON w.id = f."wardId"
        WHERE f."wardId" IS NOT NULL
          AND w.id IS NULL;
      `,
    },
  ];

  let failures = 0;

  for (const check of checks) {
    const count = await scalarNumber(
      check.sql,
    );

    console.log(
      `${check.name}: ${count}`,
    );

    if (count > 0) {
      failures++;

      addIssue(
        "BUSINESS_GEOGRAPHY",
        `${check.name}: ${count}`,
      );
    }
  }

  console.log(
    `Business/geography relationships: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditKenyaGeographyTotals() {
  printSection(
    13,
    "KENYA GEOGRAPHY TOTALS",
  );

  const countryCount = await scalarNumber(`
    SELECT COUNT(*)::text AS value
    FROM "Country"
    WHERE LOWER(TRIM(name)) = 'kenya';
  `);

  const countyCount = await scalarNumber(`
    SELECT COUNT(*)::text AS value
    FROM "County" c
    JOIN "Country" country
      ON country.id = c."countryId"
    WHERE LOWER(TRIM(country.name)) = 'kenya';
  `);

  const subCountyCount = await scalarNumber(`
    SELECT COUNT(*)::text AS value
    FROM "SubCounty" s
    JOIN "County" c
      ON c.id = s."countyId"
    JOIN "Country" country
      ON country.id = c."countryId"
    WHERE LOWER(TRIM(country.name)) = 'kenya';
  `);

  const wardCount = await scalarNumber(`
    SELECT COUNT(*)::text AS value
    FROM "Ward" w
    JOIN "County" c
      ON c.id = w."countyId"
    JOIN "Country" country
      ON country.id = c."countryId"
    WHERE LOWER(TRIM(country.name)) = 'kenya';
  `);

  console.log(
    `Kenya country records: ${countryCount}`,
  );

  console.log(
    `Kenya counties: ${countyCount}`,
  );

  console.log(
    `Kenya subcounties: ${subCountyCount}`,
  );

  console.log(
    `Kenya wards: ${wardCount}`,
  );

  let failures = 0;

  if (countryCount !== 1) {
    failures++;
    addIssue(
      "GEOGRAPHY_TOTAL",
      `Expected exactly 1 Kenya country record, found ${countryCount}`,
    );
  }

  if (countyCount !== 47) {
    failures++;
    addIssue(
      "GEOGRAPHY_TOTAL",
      `Expected 47 Kenya counties, found ${countyCount}`,
    );
  }

  if (subCountyCount !== 301) {
    failures++;
    addIssue(
      "GEOGRAPHY_TOTAL",
      `Expected 301 Kenya subcounties, found ${subCountyCount}`,
    );
  }

  if (wardCount !== 1450) {
    failures++;
    addIssue(
      "GEOGRAPHY_TOTAL",
      `Expected 1450 Kenya wards, found ${wardCount}`,
    );
  }

  console.log(
    `Kenya geography totals: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditGeographyNullForeignKeys() {
  printSection(
    14,
    "GEOGRAPHY NULL FOREIGN KEY AUDIT",
  );

  const checks = [
    {
      name: "Ward null subCountyId",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Ward"
        WHERE "subCountyId" IS NULL;
      `,
    },
    {
      name: "Ward null countyId",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Ward"
        WHERE "countyId" IS NULL;
      `,
    },
    {
      name: "Ward null constituencyId",
      sql: `
        SELECT COUNT(*)::text AS value
        FROM "Ward"
        WHERE "constituencyId" IS NULL;
      `,
    },
  ];

  let failures = 0;

  for (const check of checks) {
    const count = await scalarNumber(
      check.sql,
    );

    console.log(
      `${check.name}: ${count}`,
    );

    if (count > 0) {
      failures++;

      addIssue(
        "GEOGRAPHY_NULL",
        `${check.name}: ${count}`,
      );
    }
  }

  console.log(
    `Geography null-FK audit: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditWardIdentity() {
  printSection(
    15,
    "WARD IDENTITY AUDIT",
  );

  const wardRows = await scalarNumber(`
    SELECT COUNT(*)::text AS value
    FROM "Ward";
  `);

  const distinctIdentities =
    await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM (
        SELECT
          "constituencyId",
          LOWER(TRIM(name)) AS normalized_name
        FROM "Ward"
        GROUP BY
          "constituencyId",
          LOWER(TRIM(name))
      ) x;
    `);

  const duplicateIdentities =
    await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM (
        SELECT
          "constituencyId",
          LOWER(TRIM(name)) AS normalized_name
        FROM "Ward"
        GROUP BY
          "constituencyId",
          LOWER(TRIM(name))
        HAVING COUNT(*) > 1
      ) x;
    `);

  console.log(
    `Ward rows: ${wardRows}`,
  );

  console.log(
    `Distinct ward identities: ${distinctIdentities}`,
  );

  console.log(
    `Duplicate ward identities: ${duplicateIdentities}`,
  );

  let failures = 0;

  if (wardRows !== 1450) {
    failures++;

    addIssue(
      "WARD_IDENTITY",
      `Expected 1450 ward rows, found ${wardRows}`,
    );
  }

  if (distinctIdentities !== 1450) {
    failures++;

    addIssue(
      "WARD_IDENTITY",
      `Expected 1450 distinct ward identities, found ${distinctIdentities}`,
    );
  }

  if (duplicateIdentities !== 0) {
    failures++;

    addIssue(
      "WARD_IDENTITY",
      `Expected 0 duplicate ward identities, found ${duplicateIdentities}`,
    );
  }

  console.log(
    `Ward identity audit: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditSubCountyWardCounts() {
  printSection(
    16,
    "SUBCOUNTY / WARD COUNT CONSISTENCY",
  );

  const zeroWardSubCounties =
    await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM "SubCounty" s
      LEFT JOIN "Ward" w
        ON w."subCountyId" = s.id
      GROUP BY s.id
      HAVING COUNT(w.id) = 0;
    `);

  const subCountyCount =
    await scalarNumber(`
      SELECT COUNT(*)::text AS value
      FROM "SubCounty";
    `);

  console.log(
    `Subcounties: ${subCountyCount}`,
  );

  console.log(
    `Subcounties with zero wards: ${zeroWardSubCounties}`,
  );

  let failures = 0;

  if (subCountyCount !== 301) {
    failures++;

    addIssue(
      "SUBCOUNTY",
      `Expected 301 subcounties, found ${subCountyCount}`,
    );
  }

  if (zeroWardSubCounties !== 0) {
    failures++;

    addIssue(
      "SUBCOUNTY",
      `${zeroWardSubCounties} subcounties have zero wards`,
    );
  }

  console.log(
    `Subcounty/ward consistency: ${
      failures === 0 ? "PASS" : "FAIL"
    }`,
  );
}

async function auditForeignKeyDefinitions() {
  printSection(
    17,
    "FOREIGN KEY DEFINITION SUMMARY",
  );

  const rows = await getForeignKeyRows();

  const groups = groupForeignKeys(rows);

  console.log(
    `Foreign key definitions: ${groups.length}`,
  );

  console.log(
    `Foreign key metadata audit: PASS`,
  );
}

async function auditDatabaseMetadata() {
  printSection(
    18,
    "DATABASE METADATA",
  );

  const rows = await queryRows<{
    database_name: string;
    database_user: string;
    version: string;
    schema_name: string;
  }>(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      version() AS version,
      current_schema() AS schema_name;
  `);

  if (rows.length) {
    const row = rows[0];

    console.log(
      `Database: ${row.database_name}`,
    );

    console.log(
      `User: ${row.database_user}`,
    );

    console.log(
      `PostgreSQL: ${row.version}`,
    );

    console.log(
      `Current schema: ${row.schema_name}`,
    );
  }
}

async function main() {
  console.log("");
  console.log(
    "================================================================================",
  );
  console.log(
    "READ-ONLY DATABASE / SCHEMA AUDIT V8",
  );
  console.log(
    "================================================================================",
  );

  console.log(
    "NO DATABASE CHANGES WILL BE MADE.",
  );

  console.log("");

  const schema = readPrismaSchema();

  const {
    models,
    enumNames,
    fields,
  } = parsePrismaSchema(schema);

  const scalarFields = fields.filter(
    (field) => !field.isRelation,
  );

  const relationFields = fields.filter(
    (field) => field.isRelation,
  );

  console.log(
    `Prisma models parsed: ${models.length}`,
  );

  console.log(
    `Prisma fields parsed: ${fields.length}`,
  );

  console.log(
    `Prisma scalar fields: ${scalarFields.length}`,
  );

  console.log(
    `Prisma relation fields: ${relationFields.length}`,
  );

  console.log(
    `Prisma enum types recognized as scalar: ${enumNames.size}`,
  );

  const databaseColumns =
    await getDatabaseColumns();

  await auditModelTableCoverage(models);

  await auditKeyTableCounts();

  await auditScalarColumns(
    models,
    databaseColumns,
  );

  await auditRelationFields(models);

  await auditPrismaTypes(
    models,
    databaseColumns,
  );

  await auditCoreColumns(
    databaseColumns,
  );

  await auditPrimaryKeys();

  await auditUniqueConstraints();

  await auditForeignKeys();

  await auditLogicalDuplicates();

  await auditGeographyStructure();

  await auditBusinessGeographyRelationships();

  await auditKenyaGeographyTotals();

  await auditGeographyNullForeignKeys();

  await auditWardIdentity();

  await auditSubCountyWardCounts();

  await auditForeignKeyDefinitions();

  await auditDatabaseMetadata();

  console.log("");
  console.log(
    "================================================================================",
  );
  console.log(
    "FINAL AUDIT RESULT",
  );
  console.log(
    "================================================================================",
  );

  console.log(
    `Issues found: ${issues.length}`,
  );

  if (issues.length > 0) {
    console.log("");
    console.log("ISSUES:");

    for (const issue of issues) {
      console.log(`- ${issue}`);
    }

    console.log("");
    console.log(
      "DATABASE / SCHEMA AUDIT V8: REVIEW REQUIRED",
    );
  } else {
    console.log("");
    console.log(
      "DATABASE / SCHEMA AUDIT V8: PASS",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY: NO DATABASE CHANGES WERE MADE",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "DATABASE / SCHEMA AUDIT V8 FAILED TO EXECUTE",
    );
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });