import prisma from "../lib/prisma";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\bsub[-\s]?county\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const compact = (value: string) => normalize(value).replace(/\s/g, "");

const directionalWords = new Set([
  "east",
  "west",
  "north",
  "south",
  "central",
]);

const stripDirectional = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((word) => word && !directionalWords.has(word))
    .join(" ");

const similarity = (a: string, b: string) => {
  const aa = compact(a);
  const bb = compact(b);

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.9;

  const aWords = new Set(normalize(a).split(" ").filter(Boolean));
  const bWords = new Set(normalize(b).split(" ").filter(Boolean));

  const intersection = [...aWords].filter((x) => bWords.has(x)).length;
  const union = new Set([...aWords, ...bWords]).size;

  return union ? intersection / union : 0;
};

async function main() {
  console.log("=".repeat(76));
  console.log("NATIONWIDE EMPTY SUBCOUNTY DUPLICATE / HISTORICAL RECORD AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("=".repeat(76));
  console.log();

  const counties = await prisma.county.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subCounties: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          name: true,
          countyId: true,
          _count: {
            select: {
              wards: true,
              farmers: true,
              farms: true,
            },
          },
        },
      },
      constituencies: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const findings: Array<{
    priority: "HIGH" | "REVIEW" | "SAFE";
    county: string;
    countyId: number;
    emptyId: number;
    emptyName: string;
    wards: number;
    farmers: number;
    farms: number;
    matchingSubCounties: Array<{
      id: number;
      name: string;
      wards: number;
      similarity: number;
    }>;
    matchingConstituencies: Array<{
      id: number;
      name: string;
      similarity: number;
    }>;
    reason: string;
  }> = [];

  let emptyTotal = 0;

  for (const county of counties) {
    const empty = county.subCounties.filter(
      (sc) =>
        sc._count.wards === 0 &&
        sc._count.farmers === 0 &&
        sc._count.farms === 0
    );

    emptyTotal += empty.length;

    for (const sc of empty) {
      const matchingSubCounties = county.subCounties
        .filter((other) => other.id !== sc.id && other._count.wards > 0)
        .map((other) => ({
          id: other.id,
          name: other.name,
          wards: other._count.wards,
          similarity: similarity(sc.name, other.name),
        }))
        .filter((x) => x.similarity >= 0.75)
        .sort((a, b) => b.similarity - a.similarity);

      const matchingConstituencies = county.constituencies
        .map((c) => ({
          id: c.id,
          name: c.name,
          similarity: similarity(sc.name, c.name),
        }))
        .filter((x) => x.similarity >= 0.75)
        .sort((a, b) => b.similarity - a.similarity);

      const exactOrStrongSubCountyMatch = matchingSubCounties.some(
        (x) => x.similarity >= 0.9
      );

      const strippedEmpty = compact(stripDirectional(sc.name));

      const directionalVariantMatches = matchingSubCounties.filter((x) => {
        const strippedCandidate = compact(stripDirectional(x.name));
        return (
          strippedEmpty &&
          strippedCandidate === strippedEmpty &&
          normalize(x.name) !== normalize(sc.name)
        );
      });

      let priority: "HIGH" | "REVIEW" | "SAFE" = "SAFE";
      let reason = "Empty record with no strong duplicate-name evidence.";

      if (
        exactOrStrongSubCountyMatch &&
        directionalVariantMatches.length >= 2
      ) {
        priority = "HIGH";
        reason =
          "Empty record resembles a broad administrative name with multiple populated directional variants.";
      } else if (
        exactOrStrongSubCountyMatch &&
        matchingConstituencies.length > 0
      ) {
        priority = "REVIEW";
        reason =
          "Empty record strongly resembles a populated SubCounty and/or constituency.";
      } else if (
        exactOrStrongSubCountyMatch ||
        matchingConstituencies.length > 0
      ) {
        priority = "REVIEW";
        reason =
          "Name similarity suggests this empty record may be historical or duplicated.";
      }

      findings.push({
        priority,
        county: county.name,
        countyId: county.id,
        emptyId: sc.id,
        emptyName: sc.name,
        wards: sc._count.wards,
        farmers: sc._count.farmers,
        farms: sc._count.farms,
        matchingSubCounties,
        matchingConstituencies,
        reason,
      });
    }
  }

  const rank = { HIGH: 3, REVIEW: 2, SAFE: 1 };

  findings.sort(
    (a, b) =>
      rank[b.priority] - rank[a.priority] ||
      a.county.localeCompare(b.county) ||
      a.emptyName.localeCompare(b.emptyName)
  );

  const high = findings.filter((x) => x.priority === "HIGH");
  const review = findings.filter((x) => x.priority === "REVIEW");
  const safe = findings.filter((x) => x.priority === "SAFE");

  console.log("DATABASE SUMMARY");
  console.log(`Counties examined: ${counties.length}`);
  console.log(`Empty SubCounties examined: ${emptyTotal}`);
  console.log();

  console.log("SAFETY FILTER");
  console.log(
    "The audit focuses on EMPTY records: 0 wards, 0 farmers, and 0 farms."
  );
  console.log("No records are deleted, updated, or moved.");
  console.log();

  console.log("RESULT SUMMARY");
  console.log(`HIGH priority:   ${high.length}`);
  console.log(`REVIEW priority: ${review.length}`);
  console.log(`SAFE:            ${safe.length}`);
  console.log();

  if (high.length > 0) {
    console.log("=".repeat(76));
    console.log("HIGH PRIORITY — POSSIBLE BARINGO-LIKE / DUPLICATE STRUCTURE");
    console.log("=".repeat(76));

    for (const x of high) {
      console.log();
      console.log(`${x.county} (County ${x.countyId})`);
      console.log(`EMPTY: ${x.emptyId} - ${x.emptyName}`);
      console.log(
        `Dependencies: wards=${x.wards}, farmers=${x.farmers}, farms=${x.farms}`
      );
      console.log(`Reason: ${x.reason}`);

      console.log("Similar populated SubCounties:");
      for (const m of x.matchingSubCounties) {
        console.log(
          `  ${m.id} - ${m.name} | wards=${m.wards} | similarity=${m.similarity.toFixed(
            2
          )}`
        );
      }

      if (x.matchingConstituencies.length > 0) {
        console.log("Similar constituencies:");
        for (const c of x.matchingConstituencies) {
          console.log(
            `  ${c.id} - ${c.name} | similarity=${c.similarity.toFixed(2)}`
          );
        }
      }
    }
    console.log();
  }

  console.log("=".repeat(76));
  console.log("REVIEW PRIORITY — POSSIBLE HISTORICAL / DUPLICATE RECORDS");
  console.log("=".repeat(76));

  if (review.length === 0) {
    console.log("None.");
  } else {
    for (const x of review) {
      console.log();
      console.log(
        `${x.county} | ${x.emptyId} - ${x.emptyName} | ` +
          `wards=${x.wards}, farmers=${x.farmers}, farms=${x.farms}`
      );

      if (x.matchingSubCounties.length > 0) {
        console.log("  Similar populated SubCounties:");
        for (const m of x.matchingSubCounties.slice(0, 5)) {
          console.log(
            `    ${m.id} - ${m.name} | wards=${m.wards} | similarity=${m.similarity.toFixed(
              2
            )}`
          );
        }
      }

      if (x.matchingConstituencies.length > 0) {
        console.log("  Similar constituencies:");
        for (const c of x.matchingConstituencies.slice(0, 5)) {
          console.log(
            `    ${c.id} - ${c.name} | similarity=${c.similarity.toFixed(2)}`
          );
        }
      }

      console.log(`  Reason: ${x.reason}`);
    }
  }

  console.log();
  console.log("=".repeat(76));
  console.log("SAFE EMPTY RECORDS");
  console.log("=".repeat(76));
  console.log(
    "These had no strong name evidence under the current diagnostic rules."
  );
  console.log("They are NOT automatically safe to delete.");

  for (const x of safe) {
    console.log(
      `  ${x.county} | ${x.emptyId} - ${x.emptyName}`
    );
  }

  console.log();
  console.log("=".repeat(76));
  console.log("FINAL INTERPRETATION");
  console.log("=".repeat(76));
  console.log(
    "HIGH and REVIEW records require authoritative administrative-source verification."
  );
  console.log(
    "An empty SubCounty is not by itself evidence that it is a duplicate."
  );
  console.log(
    "This script is diagnostic only and makes ZERO database changes."
  );
  console.log("=".repeat(76));
}

main()
  .catch((error) => {
    console.error();
    console.error("AUDIT FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
