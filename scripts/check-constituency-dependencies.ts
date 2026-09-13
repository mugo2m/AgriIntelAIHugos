// scripts/check-constituency-dependencies.ts
//
// READ-ONLY SAFETY CHECK
// Checks every foreign key in the database that references Constituency.
// No INSERT / UPDATE / DELETE / schema changes.

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  console.log("=".repeat(100));
  console.log("CONSTITUENCY FOREIGN KEY DEPENDENCY AUDIT");
  console.log("=".repeat(100));
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log();

  const sql = `
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'Constituency'
    ORDER BY tc.table_name, kcu.column_name;
  `;

  const rows = await prisma.$queryRawUnsafe(sql);

  console.log("FOREIGN KEYS REFERENCING CONSTITUENCY");
  console.log("-".repeat(100));

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log("No foreign keys referencing Constituency were found.");
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }

  console.log();
  console.log("=".repeat(100));
  console.log(`TOTAL FOREIGN KEY REFERENCES: ${Array.isArray(rows) ? rows.length : 0}`);
  console.log("=".repeat(100));
}

main()
  .catch((error) => {
    console.error();
    console.error("🔴 CONSTITUENCY DEPENDENCY AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });