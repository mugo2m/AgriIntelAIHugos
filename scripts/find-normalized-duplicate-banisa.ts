import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeSubCountyName(value: string): string {
  let result = normalize(value);

  result = result
    .replace(/\s+sub\s*county$/i, "")
    .replace(/\s+sub-county$/i, "")
    .replace(/\s+subcounty$/i, "")
    .trim();

  result = result.replace(/\s+/g, " ").trim();

  const aliases: Record<string, string> = {
    banissa: "banisa",

    "sigowet/soin": "soin sigowet",
    "soin/sigowet": "soin sigowet",

    mukurweini: "mukurwe-ini",

    muranga: "murang'a",
    "muranga east": "murang'a east",
    "muranga south": "murang'a south",

    "transmara east": "trans mara east",
    "transmara west": "trans mara west",
  };

  return aliases[result] ?? result;
}

function normalizeCountyName(value: string): string {
  let result = normalize(value);

  result = result
    .replace(/\s+county$/i, "")
    .replace(/\s+city\s+county$/i, "")
    .replace(/\s+city$/i, "")
    .trim();

  if (result === "nairobi city") {
    return "nairobi";
  }

  if (
    result === "tharaka nithi" ||
    result === "tharaka-nithi"
  ) {
    return "tharaka nithi";
  }

  return result;
}

async function main() {
  try {
    const rows = await prisma.subCounty.findMany({
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
      orderBy: {
        id: "asc",
      },
    });

    const seen = new Map<
      string,
      Array<{
        id: number;
        name: string;
        county: string;
      }>
    >();

    for (const row of rows) {
      const countyKey = normalizeCountyName(row.county.name);
      const subCountyKey = normalizeSubCountyName(row.name);

      const key = `${countyKey}::${subCountyKey}`;

      const existing = seen.get(key) ?? [];

      existing.push({
        id: row.id,
        name: row.name,
        county: row.county.name,
      });

      seen.set(key, existing);
    }

    console.log("");
    console.log("NORMALIZED DUPLICATES");
    console.log("=====================");
    console.log("");

    let duplicateCount = 0;

    for (const [key, records] of seen.entries()) {
      if (records.length > 1) {
        duplicateCount++;

        console.log(`KEY: ${key}`);

        for (const record of records) {
          console.log(
            `  ID ${record.id}: "${record.name}" (${record.county})`
          );
        }

        console.log("");
      }
    }

    console.log("=====================");
    console.log(`Duplicate keys found: ${duplicateCount}`);
    console.log(`Total SubCounty records: ${rows.length}`);
    console.log("=====================");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});