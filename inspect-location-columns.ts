import "dotenv/config";
import { PrismaClient } from "./lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  });

  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name ILIKE '%county%'
          OR column_name ILIKE '%ward%'
          OR column_name ILIKE '%subcounty%'
        )
      ORDER BY table_name, ordinal_position
    `);

    console.log(
      JSON.stringify(tables, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});