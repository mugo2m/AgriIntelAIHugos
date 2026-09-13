import prisma from "../lib/prisma";

type WardInfo = {
  id: number;
  name: string;
  constituencyId: number;
  subCountyId: number | null;
};

type SubCountyInfo = {
  id: number;
  name: string;
  countyId: number;
  wards: WardInfo[];
};

type ConstituencyInfo = {
  id: number;
  name: string;
  countyId: number;
  wards: WardInfo[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[-\s]?county\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const compact = (value: string) => normalize(value).replace(/\s/g, "");

const directionWords = new Set(["east", "west", "north", "south"]);

function isBroadVariant(broad: string, specific: string) {
  const broadWords = normalize(broad).split(" ").filter(Boolean);
  const specificWords = normalize(specific).split(" ").filter(Boolean);

  if (!broadWords.length || !specificWords.length) return false;
  if (compact(broad) === compact(specific)) return false;

  const remaining = specificWords.filter((word) => !directionWords.has(word));

  return (
    remaining.join("") === broadWords.join("") &&
    specificWords.some((word) => directionWords.has(word))
  );
}

function priority(
  variants: SubCountyInfo[],
  sharedConstituencies: ConstituencyInfo[]
) {
  let score = 0;

  if (variants.length >= 2) score += 3;
  if (sharedConstituencies.length > 0) score += 4;
  if (
    variants.some((sc) =>
      /\b(east|west|north|south|central)\b/i.test(sc.name)
    )
  ) {
    score += 2;
  }

  return score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";
}

async function main() {
  console.log("=".repeat(72));
  console.log("BARINGO-LIKE SUBCOUNTY / WARD SEMANTIC AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(72));
  console.log();

  const counties = await prisma.county.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subCounties: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          countyId: true,
          wards: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              constituencyId: true,
              subCountyId: true,
            },
          },
        },
      },
      constituencies: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          countyId: true,
          wards: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              constituencyId: true,
              subCountyId: true,
            },
          },
        },
      },
    },
  });

  const findings: Array<{
    level: string;
    county: string;
    empty: SubCountyInfo;
    variants: SubCountyInfo[];
    shared: ConstituencyInfo[];
  }> = [];

  for (const county of counties) {
    const empty = county.subCounties.filter((sc) => sc.wards.length === 0);
    const populated = county.subCounties.filter((sc) => sc.wards.length > 0);

    for (const emptySc of empty) {
      const variants = populated.filter((sc) =>
        isBroadVariant(emptySc.name, sc.name)
      );

      if (variants.length < 2) continue;

      const variantIds = new Set(variants.map((sc) => sc.id));

      const shared = county.constituencies.filter((c) => {
        const ids = new Set(
          c.wards
            .map((w) => w.subCountyId)
            .filter((id): id is number => id !== null)
        );

        return [...variantIds].filter((id) => ids.has(id)).length >= 2;
      });

      findings.push({
        level: priority(variants, shared),
        county: county.name,
        empty: emptySc,
        variants,
        shared,
      });
    }
  }

  const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  findings.sort(
    (a, b) =>
      rank[b.level as keyof typeof rank] - rank[a.level as keyof typeof rank] ||
      a.county.localeCompare(b.county)
  );

  const wardCount = counties.reduce(
    (sum, c) =>
      sum + c.subCounties.reduce((s, sc) => s + sc.wards.length, 0),
    0
  );

  console.log("DATABASE SUMMARY");
  console.log(`Counties examined: ${counties.length}`);
  console.log(
    `SubCounties examined: ${counties.reduce(
      (sum, c) => sum + c.subCounties.length,
      0
    )}`
  );
  console.log(`Wards examined: ${wardCount}`);
  console.log();

  console.log("Baringo-like detection pattern:");
  console.log("  1. EMPTY broad SubCounty record");
  console.log("  2. TWO OR MORE populated directional variants");
  console.log("  3. Those variants share at least one constituency");
  console.log("  4. The constituency wards are actually split between them");
  console.log();
  console.log("IMPORTANT: No records are modified.");
  console.log();

  console.log(`CANDIDATES FOUND: ${findings.length}`);
  console.log();

  if (!findings.length) {
    console.log("NO Baringo-like pattern detected by these rules.");
  }

  for (const f of findings) {
    console.log("=".repeat(72));
    console.log(`[${f.level}] ${f.county}`);
    console.log(
      `EMPTY BROAD SUBCOUNTY: ${f.empty.id} ${f.empty.name} — 0 wards`
    );
    console.log();

    console.log("POPULATED VARIANTS:");
    for (const sc of f.variants) {
      console.log(`  ${sc.id} ${sc.name} — ${sc.wards.length} wards`);
    }

    console.log();
    console.log(`SHARED CONSTITUENCIES: ${f.shared.length}`);

    for (const c of f.shared) {
      console.log(`  Constituency ${c.id}: ${c.name}`);

      const bySubCounty = new Map<number, WardInfo[]>();

      for (const ward of c.wards) {
        if (ward.subCountyId === null) continue;
        const list = bySubCounty.get(ward.subCountyId) ?? [];
        list.push(ward);
        bySubCounty.set(ward.subCountyId, list);
      }

      for (const sc of f.variants) {
        const wards = bySubCounty.get(sc.id) ?? [];
        if (!wards.length) continue;

        console.log(`    ${sc.id} ${sc.name}: ${wards.length} wards`);
        for (const ward of wards) {
          console.log(`      - ${ward.name} [Ward ${ward.id}]`);
        }
      }
    }

    console.log();
    console.log("REVIEW STATUS:");
    console.log(
      f.level === "HIGH"
        ? "  HIGH PRIORITY — strongly resembles the Baringo pattern."
        : f.level === "MEDIUM"
          ? "  MEDIUM PRIORITY — possible administrative naming split."
          : "  LOW PRIORITY — weak resemblance."
    );
    console.log("  Verify against an authoritative source before cleanup.");
    console.log();
  }

  console.log("=".repeat(72));
  console.log("AUDIT COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES WERE MADE");
  console.log("=".repeat(72));
}

main().catch((error) => {
  console.error("AUDIT FAILED:");
  console.error(error);
  process.exit(1);
});
