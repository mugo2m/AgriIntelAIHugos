import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

async function main() {
  console.log("");
  console.log("Checking all database references to SubCounty...");
  console.log("");

  const references = await prisma.$queryRaw<
    Array<{
      table_name: string;
      column_name: string;
      constraint_name: string;
    }>
  >`
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'SubCounty'
      AND ccu.column_name = 'id'
      AND tc.table_schema = 'public'
    ORDER BY
      tc.table_name,
      kcu.column_name;
  `;

  console.table(references);

  console.log("");
  console.log(
    `Foreign-key relationships referencing SubCounty: ${references.length}`
  );
  console.log("");

  const duplicateIds = [614, 615, 616];

  console.log(
    "Checking references to duplicate IDs 614, 615 and 616..."
  );
  console.log("");

  for (const reference of references) {
    const table = `"${reference.table_name}"`;
    const column = `"${reference.column_name}"`;

    const rows = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `
      SELECT COUNT(*)::bigint AS count
      FROM ${table}
      WHERE ${column} IN (614, 615, 616)
      `,
    );

    const count = Number(rows[0]?.count ?? 0);

    console.log(
      `${reference.table_name}.${reference.column_name}: ${count} reference(s)`
    );
  }

  console.log("");
  console.log("Detailed duplicate-ID references...");
  console.log("");

  for (const reference of references) {
    const table = `"${reference.table_name}"`;
    const column = `"${reference.column_name}"`;

    const rows = await prisma.$queryRawUnsafe<
      Array<Record<string, unknown>>
    >(
      `
      SELECT *
      FROM ${table}
      WHERE ${column} IN (614, 615, 616)
      LIMIT 100
      `,
    );

    if (rows.length > 0) {
      console.log("");
      console.log(
        `${reference.table_name}.${reference.column_name}`
      );
      console.log("----------------------------------------------");

      console.table(rows);
    }
  }

  console.log("");
  console.log("Reference check complete.");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Reference check failed.");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });