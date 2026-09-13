import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import subcounties from "../prisma/data/subcounties.json";

type SubCountySeed = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

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

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ");
}

function subCountyKey(countyId: number, name: string): string {
  return `${countyId}|${normalizeName(name)}`;
}

function wardKey(countyId: number, name: string): string {
  return `${countyId}|${normalizeName(name)}`;
}

async function main() {
  console.log("");
  console.log("===========================================");
  console.log("SUBCOUNTY → WARD RECONCILIATION AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("===========================================");
  console.log("");

  // --------------------------------------------------
  // 1. Load authoritative SubCounty source
  // --------------------------------------------------

  const authoritative = subcounties as SubCountySeed[];

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const countyByCode = new Map<string, (typeof counties)[number]>();

  for (const county of counties) {
    if (county.code) {
      countyByCode.set(county.code, county);
    }
  }

  // --------------------------------------------------
  // 2. Build authoritative SubCounty set
  // --------------------------------------------------

  const authoritativeKeys = new Set<string>();

  const authoritativeSubCounties = new Map<
    string,
    {
      countyId: number;
      countyName: string;
      countyCode: string;
      name: string;
      key: string;
    }
  >();

  for (const source of authoritative) {
    const county = countyByCode.get(source.countyCode);

    if (!county) {
      console.log(
        `WARNING: County ${source.countyCode} not found for ${source.name}`,
      );
      continue;
    }

    const key = subCountyKey(county.id, source.name);

    authoritativeKeys.add(key);

    authoritativeSubCounties.set(key, {
      countyId: county.id,
      countyName: county.name,
      countyCode: source.countyCode,
      name: source.name,
      key,
    });
  }

  // --------------------------------------------------
  // 3. Load all DB SubCounties
  // --------------------------------------------------

  const dbSubCounties = await prisma.subCounty.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  // --------------------------------------------------
  // 4. Separate authoritative and legacy SubCounties
  // --------------------------------------------------

  const authoritativeDbSubCounties = dbSubCounties.filter((row) =>
    authoritativeKeys.has(subCountyKey(row.countyId, row.name)),
  );

  const legacySubCounties = dbSubCounties.filter(
    (row) => !authoritativeKeys.has(subCountyKey(row.countyId, row.name)),
  );

  console.log(
    `Authoritative SubCounties: ${authoritativeDbSubCounties.length}`,
  );

  console.log(
    `Legacy SubCounties:        ${legacySubCounties.length}`,
  );

  console.log(
    `Total DB SubCounties:      ${dbSubCounties.length}`,
  );

  // --------------------------------------------------
  // 5. Load ALL wards
  // --------------------------------------------------

  const wards = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      sourceGid: true,
      sourceUid: true,
      subCounty: {
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      },
      county: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  console.log("");
  console.log(`Database wards: ${wards.length}`);

  // --------------------------------------------------
  // 6. Classify every ward
  // --------------------------------------------------

  const wardsUnderAuthoritative = wards.filter((ward) => {
    if (!ward.subCounty) return false;

    return authoritativeKeys.has(
      subCountyKey(
        ward.subCounty.countyId,
        ward.subCounty.name,
      ),
    );
  });

  const wardsUnderLegacy = wards.filter((ward) => {
    if (!ward.subCounty) return false;

    return !authoritativeKeys.has(
      subCountyKey(
        ward.subCounty.countyId,
        ward.subCounty.name,
      ),
    );
  });

  const wardsWithoutSubCounty = wards.filter(
    (ward) => ward.subCountyId === null,
  );

  console.log(
    `Wards under authoritative SubCounties: ${wardsUnderAuthoritative.length}`,
  );

  console.log(
    `Wards under legacy SubCounties:        ${wardsUnderLegacy.length}`,
  );

  console.log(
    `Wards without SubCounty:               ${wardsWithoutSubCounty.length}`,
  );

  // --------------------------------------------------
  // 7. Build source identity lookup
  // --------------------------------------------------

  const authoritativeWardBySourceGid = new Map<
    number,
    (typeof wards)[number]
  >();

  const authoritativeWardBySourceUid = new Map<
    string,
    (typeof wards)[number]
  >();

  for (const ward of wardsUnderAuthoritative) {
    if (ward.sourceGid !== null) {
      authoritativeWardBySourceGid.set(
        Number(ward.sourceGid),
        ward,
      );
    }

    if (ward.sourceUid) {
      authoritativeWardBySourceUid.set(
        ward.sourceUid,
        ward,
      );
    }
  }

  // --------------------------------------------------
  // 8. Compare legacy wards with authoritative wards
  // --------------------------------------------------

  const legacyWardMatches: Array<{
    legacyWard: (typeof wards)[number];
    authoritativeWard: (typeof wards)[number];
    matchType: string;
  }> = [];

  const legacyWardUnmatched: Array<(typeof wards)[number]> = [];

  for (const legacyWard of wardsUnderLegacy) {
    let match:
      | {
          ward: (typeof wards)[number];
          matchType: string;
        }
      | undefined;

    if (
      legacyWard.sourceGid !== null &&
      authoritativeWardBySourceGid.has(
        Number(legacyWard.sourceGid),
      )
    ) {
      match = {
        ward: authoritativeWardBySourceGid.get(
          Number(legacyWard.sourceGid),
        )!,
        matchType: "sourceGid",
      };
    }

    if (
      !match &&
      legacyWard.sourceUid &&
      authoritativeWardBySourceUid.has(
        legacyWard.sourceUid,
      )
    ) {
      match = {
        ward: authoritativeWardBySourceUid.get(
          legacyWard.sourceUid,
        )!,
        matchType: "sourceUid",
      };
    }

    if (match) {
      legacyWardMatches.push({
        legacyWard,
        authoritativeWard: match.ward,
        matchType: match.matchType,
      });
    } else {
      legacyWardUnmatched.push(legacyWard);
    }
  }

  // --------------------------------------------------
  // 9. Compare by county + normalized ward name
  // --------------------------------------------------

  const authoritativeWardByName = new Map<
    string,
    (typeof wards)[number][]
  >();

  for (const ward of wardsUnderAuthoritative) {
    const key = wardKey(
      ward.countyId,
      ward.name,
    );

    const existing =
      authoritativeWardByName.get(key) ?? [];

    existing.push(ward);

    authoritativeWardByName.set(key, existing);
  }

  const legacyNameMatches: Array<{
    legacyWard: (typeof wards)[number];
    candidates: (typeof wards)[number][];
  }> = [];

  for (const legacyWard of legacyWardUnmatched) {
    const candidates =
      authoritativeWardByName.get(
        wardKey(
          legacyWard.countyId,
          legacyWard.name,
        ),
      ) ?? [];

    if (candidates.length > 0) {
      legacyNameMatches.push({
        legacyWard,
        candidates,
      });
    }
  }

  // --------------------------------------------------
  // 10. Print high-level result
  // --------------------------------------------------

  console.log("");
  console.log("===========================================");
  console.log("WARD RECONCILIATION SUMMARY");
  console.log("===========================================");

  console.log(
    `Total wards:                         ${wards.length}`,
  );

  console.log(
    `Under authoritative SubCounties:     ${wardsUnderAuthoritative.length}`,
  );

  console.log(
    `Under legacy SubCounties:            ${wardsUnderLegacy.length}`,
  );

  console.log(
    `Without SubCounty:                   ${wardsWithoutSubCounty.length}`,
  );

  console.log(
    `Legacy wards matched by sourceGid/Uid: ${legacyWardMatches.length}`,
  );

  console.log(
    `Legacy wards NOT matched by source ID: ${legacyWardUnmatched.length}`,
  );

  console.log(
    `Unmatched legacy wards with name match: ${legacyNameMatches.length}`,
  );

  // --------------------------------------------------
  // 11. Legacy SubCounty ward counts
  // --------------------------------------------------

  const wardCountBySubCounty = new Map<number, number>();

  for (const ward of wards) {
    if (ward.subCountyId !== null) {
      wardCountBySubCounty.set(
        ward.subCountyId,
        (wardCountBySubCounty.get(ward.subCountyId) ?? 0) + 1,
      );
    }
  }

  console.log("");
  console.log("===========================================");
  console.log("LEGACY SUBCOUNTIES");
  console.log("===========================================");

  for (const subCounty of legacySubCounties) {
    const wardCount =
      wardCountBySubCounty.get(subCounty.id) ?? 0;

    console.log(
      `ID ${subCounty.id} | County ${subCounty.countyId} | ${subCounty.county?.name ?? "UNKNOWN"} | ${subCounty.name} | wards=${wardCount}`,
    );
  }

  // --------------------------------------------------
  // 12. Show source-identity reconciliation
  // --------------------------------------------------

  if (legacyWardMatches.length > 0) {
    console.log("");
    console.log("===========================================");
    console.log("LEGACY → AUTHORITATIVE WARD MATCHES");
    console.log("===========================================");

    for (const match of legacyWardMatches) {
      console.log(
        `Legacy Ward ${match.legacyWard.id} "${match.legacyWard.name}"`,
      );

      console.log(
        `  Legacy SubCounty: ${match.legacyWard.subCountyId} "${match.legacyWard.subCounty?.name}"`,
      );

      console.log(
        `  Authoritative Ward: ${match.authoritativeWard.id} "${match.authoritativeWard.name}"`,
      );

      console.log(
        `  Authoritative SubCounty: ${match.authoritativeWard.subCountyId} "${match.authoritativeWard.subCounty?.name}"`,
      );

      console.log(
        `  Match: ${match.matchType}`,
      );

      console.log("");
    }
  }

  // --------------------------------------------------
  // 13. Show legacy wards without source identity match
  // --------------------------------------------------

  if (legacyWardUnmatched.length > 0) {
    console.log("");
    console.log("===========================================");
    console.log("LEGACY WARDS WITHOUT SOURCE-ID MATCH");
    console.log("===========================================");

    for (const ward of legacyWardUnmatched) {
      console.log(
        `Ward ${ward.id} | County ${ward.countyId} | ${ward.name} | SubCounty ${ward.subCountyId} "${ward.subCounty?.name}" | sourceGid=${ward.sourceGid ?? "NULL"} | sourceUid=${ward.sourceUid ?? "NULL"}`,
      );
    }
  }

  // --------------------------------------------------
  // 14. Name-based candidates
  // --------------------------------------------------

  if (legacyNameMatches.length > 0) {
    console.log("");
    console.log("===========================================");
    console.log("LEGACY WARDS WITH AUTHORITATIVE NAME MATCH");
    console.log("===========================================");

    for (const item of legacyNameMatches) {
      console.log(
        `Legacy Ward ${item.legacyWard.id} "${item.legacyWard.name}"`,
      );

      console.log(
        `  Legacy SubCounty: ${item.legacyWard.subCountyId} "${item.legacyWard.subCounty?.name}"`,
      );

      for (const candidate of item.candidates) {
        console.log(
          `  Candidate authoritative Ward: ${candidate.id} "${candidate.name}" | SubCounty ${candidate.subCountyId} "${candidate.subCounty?.name}"`,
        );
      }

      console.log("");
    }
  }

  // --------------------------------------------------
  // 15. Authoritative SubCounties and ward counts
  // --------------------------------------------------

  console.log("");
  console.log("===========================================");
  console.log("AUTHORITATIVE SUBCOUNTIES WITH WARDS");
  console.log("===========================================");

  for (const subCounty of authoritativeDbSubCounties) {
    const wardCount =
      wardCountBySubCounty.get(subCounty.id) ?? 0;

    console.log(
      `ID ${subCounty.id} | County ${subCounty.countyId} | ${subCounty.county?.name ?? "UNKNOWN"} | ${subCounty.name} | wards=${wardCount}`,
    );
  }

  // --------------------------------------------------
  // 16. Final assessment
  // --------------------------------------------------

  console.log("");
  console.log("===========================================");
  console.log("FINAL ASSESSMENT");
  console.log("===========================================");

  if (
    wards.length === 1450 &&
    wardsUnderLegacy.length === 1450
  ) {
    console.log(
      "IMPORTANT: All 1,450 wards are currently under legacy SubCounties.",
    );
  } else if (
    wards.length === 1450 &&
    wardsUnderAuthoritative.length === 1450
  ) {
    console.log(
      "IMPORTANT: All 1,450 wards are currently under authoritative SubCounties.",
    );
  } else {
    console.log(
      "IMPORTANT: Wards are distributed between legacy and authoritative SubCounties.",
    );
  }

  console.log(
    `Legacy wards matched through source identity: ${legacyWardMatches.length}/${wardsUnderLegacy.length}`,
  );

  console.log(
    `Legacy wards unmatched through source identity: ${legacyWardUnmatched.length}`,
  );

  console.log("");
  console.log("NO DATABASE CHANGES WERE MADE.");
  console.log("===========================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("SUBCOUNTY WARD RECONCILIATION FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });