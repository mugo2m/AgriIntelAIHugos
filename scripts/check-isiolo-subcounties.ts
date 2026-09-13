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
    mukurweini: "mukurwe-ini",
    muranga: "murang'a",
    "muranga east": "murang'a east",
    "muranga south": "murang'a south",
    "transmara east": "trans mara east",
    "transmara west": "trans mara west",
    "webuye  east": "webuye east",
    banissa: "banisa",
    "sigowet/soin": "soin sigowet",
    "soin/sigowet": "soin sigowet",
    "mwingi central sub- county": "mwingi central",
    "mumias west ": "mumias west",
    "bonchari  ": "bonchari",
    "nyaribari chache  ": "nyaribari chache",
    "mbooni  ": "mbooni",
    "kaiti  ": "kaiti",
    "manyatta  ": "manyatta",
    "runyenjes  ": "runyenjes",
    "langata  ": "lang'ata",
    "roysambu  ": "roysambu",
    "ruaraka  ": "ruaraka",
    "starehe  ": "starehe",
  };

  return aliases[result] ?? result;
}

async function main() {
  console.log("");
  console.log("Checking ALL Isiolo SubCounty records...");
  console.log("");

  const rows = await prisma.subCounty.findMany({
    where: {
      county: {
        name: {
          equals: "Isiolo",
          mode: "insensitive",
        },
      },
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
    orderBy: {
      id: "asc",
    },
  });

  console.table(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      normalized: normalizeSubCountyName(row.name),
      countyId: row.countyId,
      county: row.county.name,
    }))
  );

  console.log("");
  console.log(`Isiolo SubCounty records: ${rows.length}`);
  console.log("");

  const normalized = new Map<string, typeof rows>();

  for (const row of rows) {
    const key = normalizeSubCountyName(row.name);

    const existing = normalized.get(key) ?? [];

    existing.push(row);

    normalized.set(key, existing);
  }

  console.log("Normalized keys:");
  console.log("");

  for (const [key, records] of normalized) {
    if (records.length > 1) {
      console.log(`⚠️ COLLISION: ${key}`);

      for (const record of records) {
        console.log(
          `   ID ${record.id}: "${record.name}"`
        );
      }

      console.log("");
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Query failed.");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });