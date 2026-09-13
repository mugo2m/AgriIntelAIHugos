import prisma from "../lib/prisma";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\bsub[- ]?county\b/g, "")
    .replace(/[^a-z0-9]/g, "");

async function main() {
  console.log("==================================================");
  console.log("NATIONWIDE SUBCOUNTY → WARD SEMANTIC AUDIT");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("==================================================\n");

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
          wards: {
            select: {
              id: true,
              name: true,
              sourceGid: true,
              constituencyId: true,
              constituency: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      },
      constituencies: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          wards: {
            select: {
              id: true,
              name: true,
              sourceGid: true,
              subCountyId: true,
              subCounty: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  const emptySubCounties: Array<{
    county: string;
    countyId: number;
    subCountyId: number;
    subCounty: string;
  }> = [];

  const possibleBaseSplits: Array<{
    county: string;
    emptyId: number;
    emptyName: string;
    populatedId: number;
    populatedName: string;
    populatedWardCount: number;
  }> = [];

  const constituencySpans: Array<{
    county: string;
    constituency: string;
    constituencyId: number;
    wardCount: number;
    subCounties: string;
  }> = [];

  const wardSubCountyMismatchCandidates: Array<{
    county: string;
    constituency: string;
    constituencyId: number;
    ward: string;
    wardId: number;
    subCountyId: number;
    subCounty: string;
  }> = [];

  let totalSubCounties = 0;
  let totalWards = 0;

  for (const county of counties) {
    totalSubCounties += county.subCounties.length;

    const normalizedSubCounties = county.subCounties.map((sc) => ({
      ...sc,
      normalized: normalize(sc.name),
    }));

    // ------------------------------------------------
    // 1. Empty SubCounties
    // ------------------------------------------------
    for (const sc of county.subCounties) {
      if (sc.wards.length === 0) {
        emptySubCounties.push({
          county: county.name,
          countyId: county.id,
          subCountyId: sc.id,
          subCounty: sc.name,
        });
      }
    }

    // ------------------------------------------------
    // 2. Detect possible BASE / EAST / WEST splits
    // Example:
    // Tiaty + Tiaty East
    // ------------------------------------------------
    for (const empty of normalizedSubCounties.filter(
      (sc) => sc.wards.length === 0,
    )) {
      for (const populated of normalizedSubCounties.filter(
        (sc) => sc.wards.length > 0,
      )) {
        const emptyName = empty.normalized;
        const populatedName = populated.normalized;

        const possibleBase =
          emptyName === `${populatedName}east` ||
          emptyName === `${populatedName}west` ||
          populatedName === `${emptyName}east` ||
          populatedName === `${emptyName}west`;

        if (possibleBase) {
          possibleBaseSplits.push({
            county: county.name,
            emptyId: empty.id,
            emptyName: empty.name,
            populatedId: populated.id,
            populatedName: populated.name,
            populatedWardCount: populated.wards.length,
          });
        }
      }
    }

    // ------------------------------------------------
    // 3. Constituencies spanning multiple SubCounties
    // This is important because Baringo/Tiaty does this.
    // ------------------------------------------------
    for (const constituency of county.constituencies) {
      totalWards += constituency.wards.length;

      const subCountyMap = new Map<number, string>();

      for (const ward of constituency.wards) {
        if (ward.subCountyId !== null && ward.subCounty) {
          subCountyMap.set(
            ward.subCountyId,
            ward.subCounty.name,
          );
        }
      }

      if (subCountyMap.size > 1) {
        constituencySpans.push({
          county: county.name,
          constituency: constituency.name,
          constituencyId: constituency.id,
          wardCount: constituency.wards.length,
          subCounties: Array.from(subCountyMap.values()).join(" | "),
        });
      }

      // ------------------------------------------------
      // 4. Capture all ward → SubCounty assignments
      // where the constituency spans multiple SubCounties.
      // ------------------------------------------------
      if (subCountyMap.size > 1) {
        for (const ward of constituency.wards) {
          if (ward.subCountyId !== null && ward.subCounty) {
            wardSubCountyMismatchCandidates.push({
              county: county.name,
              constituency: constituency.name,
              constituencyId: constituency.id,
              ward: ward.name,
              wardId: ward.id,
              subCountyId: ward.subCountyId,
              subCounty: ward.subCounty.name,
            });
          }
        }
      }
    }
  }

  // Remove duplicate split candidates
  const uniqueSplits = Array.from(
    new Map(
      possibleBaseSplits.map((x) => [
        `${x.county}|${x.emptyId}|${x.populatedId}`,
        x,
      ]),
    ).values(),
  );

  console.log("DATABASE SUMMARY");
  console.log("----------------------------------------------");
  console.log(`Counties: ${counties.length}`);
  console.log(`SubCounties: ${totalSubCounties}`);
  console.log(`Wards examined through constituencies: ${totalWards}`);
  console.log();

  console.log("1. EMPTY SUBCOUNTIES");
  console.log("----------------------------------------------");
  console.log(`Total empty SubCounties: ${emptySubCounties.length}`);

  if (emptySubCounties.length > 0) {
    console.table(emptySubCounties);
  } else {
    console.log("None.");
  }

  console.log("\n2. POSSIBLE SUBCOUNTY SPLIT PATTERNS");
  console.log("----------------------------------------------");
  console.log(
    "These require human review — NOTHING is assumed to be wrong.",
  );
  console.log(`Candidates: ${uniqueSplits.length}`);

  if (uniqueSplits.length > 0) {
    console.table(uniqueSplits);
  } else {
    console.log("None detected.");
  }

  console.log("\n3. CONSTITUENCIES SPANNING MULTIPLE SUBCOUNTIES");
  console.log("----------------------------------------------");
  console.log(
    `Constituencies spanning multiple SubCounties: ${constituencySpans.length}`,
  );

  if (constituencySpans.length > 0) {
    console.table(constituencySpans);
  } else {
    console.log("None detected.");
  }

  console.log("\n4. WARDS INSIDE MULTI-SUBCOUNTY CONSTITUENCIES");
  console.log("----------------------------------------------");

  if (wardSubCountyMismatchCandidates.length > 0) {
    console.table(wardSubCountyMismatchCandidates);
  } else {
    console.log("None.");
  }

  console.log("\n==================================================");
  console.log("AUDIT COMPLETE");
  console.log("READ-ONLY — NO DATABASE CHANGES");
  console.log("==================================================");
}

main()
  .catch((error) => {
    console.error("AUDIT FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });