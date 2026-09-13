import { prisma } from "../lib/prisma";

const COMPLETED_COUNTY_IDS = [
  51, 53, 54, 56, 64, 65, 67, 68, 74, 79, 87,
  50, 57, 59, 61, 62, 63, 66, 71, 73, 75, 76,
  81, 82, 83, 84, 88, 89, 90, 91, 92, 94,
] as const;

const EXPECTED_REMAINING_COUNTY_IDS = [
  48,
  49,
  52,
  55,
  58,
  60,
  69,
  70,
  72,
  77,
  78,
  80,
  85,
  86,
  93,
] as const;

const FK_PATHS = [
  {
    table: "BusinessPartner",
    column: "subCountyId",
  },
  {
    table: "CommodityTransaction",
    column: "destinationSubCountyId",
  },
  {
    table: "CommodityTransaction",
    column: "sourceSubCountyId",
  },
  {
    table: "Farm",
    column: "subCountyId",
  },
  {
    table: "Farmer",
    column: "subCountyId",
  },
  {
    table: "Ward",
    column: "subCountyId",
  },
] as const;

type CountyRow = {
  id: number;
  name: string;
};

type SubCountyRow = {
  id: number;
  name: string;
  countyId: number;
  countyName: string;
  wardCount: number;
  businessPartnerRefs: number;
  destinationTransactionRefs: number;
  sourceTransactionRefs: number;
  farmRefs: number;
  farmerRefs: number;
  wardRefs: number;
};

function separator(char = "=", length = 110) {
  console.log(char.repeat(length));
}

async function getReferenceCount(
  table: string,
  column: string,
  subCountyId: number,
): Promise<number> {
  const result = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `
      SELECT COUNT(*)::int AS count
      FROM "${table}"
      WHERE "${column}" = $1
    `,
    subCountyId,
  );

  return Number(result[0]?.count ?? 0);
}

async function main() {
  separator();
  console.log("BATCH 4 DISCOVERY — READ ONLY");
  separator();

  console.log();
  console.log(
    `Completed counties excluded: ${COMPLETED_COUNTY_IDS.join(", ")}`,
  );

  const completedSet = new Set<number>(COMPLETED_COUNTY_IDS);

  if (completedSet.size !== COMPLETED_COUNTY_IDS.length) {
    throw new Error(
      "SAFETY FAILURE: Duplicate completed county IDs detected.",
    );
  }

  separator("-");
  console.log("STEP 1 — VERIFY REMAINING COUNTIES");
  separator("-");

  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const remainingCounties = counties.filter(
    (county) => !completedSet.has(Number(county.id)),
  );

  console.log(`Database counties: ${counties.length}`);
  console.log(`Completed counties: ${completedSet.size}`);
  console.log(`Remaining counties: ${remainingCounties.length}`);

  if (counties.length !== 47) {
    throw new Error(
      `SAFETY FAILURE: Expected 47 counties, found ${counties.length}.`,
    );
  }

  if (remainingCounties.length !== EXPECTED_REMAINING_COUNTY_IDS.length) {
    throw new Error(
      `SAFETY FAILURE: Expected ${EXPECTED_REMAINING_COUNTY_IDS.length} remaining counties, found ${remainingCounties.length}.`,
    );
  }

  const expectedRemainingSet = new Set<number>(
    EXPECTED_REMAINING_COUNTY_IDS,
  );

  for (const county of remainingCounties) {
    if (!expectedRemainingSet.has(Number(county.id))) {
      throw new Error(
        `SAFETY FAILURE: Unexpected remaining county ${county.id} ${county.name}.`,
      );
    }
  }

  for (const countyId of EXPECTED_REMAINING_COUNTY_IDS) {
    if (!remainingCounties.some((c) => Number(c.id) === countyId)) {
      throw new Error(
        `SAFETY FAILURE: Expected remaining county ${countyId} was not found.`,
      );
    }
  }

  console.log("PASS: Exactly 15 expected counties remain.");

  console.log();
  for (const county of remainingCounties) {
    console.log(
      `${String(county.id).padEnd(5)} ${county.name}`,
    );
  }

  separator("-");
  console.log("STEP 2 — INSPECT REMAINING SUBCOUNTIES");
  separator("-");

  const allSubCounties = await prisma.subCounty.findMany({
    where: {
      countyId: {
        in: EXPECTED_REMAINING_COUNTY_IDS.map(Number),
      },
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      county: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          wards: true,
        },
      },
    },
    orderBy: [
      {
        countyId: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  console.log(
    `Remaining SubCounties inspected: ${allSubCounties.length}`,
  );

  const candidates: SubCountyRow[] = [];

  const countySummary = new Map<
    number,
    {
      name: string;
      subCounties: number;
      zeroWard: number;
    }
  >();

  for (const county of remainingCounties) {
    countySummary.set(Number(county.id), {
      name: county.name,
      subCounties: 0,
      zeroWard: 0,
    });
  }

  for (const subCounty of allSubCounties) {
    const countyId = Number(subCounty.countyId);
    const wardCount = Number(subCounty._count.wards);

    const summary = countySummary.get(countyId);

    if (summary) {
      summary.subCounties += 1;

      if (wardCount === 0) {
        summary.zeroWard += 1;
      }
    }

    if (wardCount !== 0) {
      continue;
    }

    const businessPartnerRefs = await getReferenceCount(
      "BusinessPartner",
      "subCountyId",
      Number(subCounty.id),
    );

    const destinationTransactionRefs = await getReferenceCount(
      "CommodityTransaction",
      "destinationSubCountyId",
      Number(subCounty.id),
    );

    const sourceTransactionRefs = await getReferenceCount(
      "CommodityTransaction",
      "sourceSubCountyId",
      Number(subCounty.id),
    );

    const farmRefs = await getReferenceCount(
      "Farm",
      "subCountyId",
      Number(subCounty.id),
    );

    const farmerRefs = await getReferenceCount(
      "Farmer",
      "subCountyId",
      Number(subCounty.id),
    );

    const wardRefs = await getReferenceCount(
      "Ward",
      "subCountyId",
      Number(subCounty.id),
    );

    candidates.push({
      id: Number(subCounty.id),
      name: subCounty.name,
      countyId,
      countyName: subCounty.county.name,
      wardCount,
      businessPartnerRefs,
      destinationTransactionRefs,
      sourceTransactionRefs,
      farmRefs,
      farmerRefs,
      wardRefs,
    });
  }

  separator("-");
  console.log("COUNTY SUMMARY");
  separator("-");

  for (const county of remainingCounties) {
    const summary = countySummary.get(Number(county.id));

    if (!summary) {
      continue;
    }

    console.log(
      `${String(county.id).padEnd(5)} ` +
        `${county.name.padEnd(25)} ` +
        `subcounties=${String(summary.subCounties).padEnd(3)} ` +
        `zero-ward=${summary.zeroWard}`,
    );
  }

  separator("-");
  console.log("ZERO-WARD SUBCOUNTIES");
  separator("-");

  if (candidates.length === 0) {
    console.log("None.");
  } else {
    for (const candidate of candidates) {
      console.log(
        `${String(candidate.id).padEnd(6)} ` +
          `${candidate.countyName.padEnd(25)} ` +
          `${candidate.name.padEnd(30)} ` +
          `wards=${candidate.wardCount}`,
      );
    }
  }

  separator("-");
  console.log("STEP 3 — ZERO-WARD + ZERO-REFERENCE ANALYSIS");
  separator("-");

  const safeCandidates = candidates.filter(
    (candidate) =>
      candidate.businessPartnerRefs === 0 &&
      candidate.destinationTransactionRefs === 0 &&
      candidate.sourceTransactionRefs === 0 &&
      candidate.farmRefs === 0 &&
      candidate.farmerRefs === 0 &&
      candidate.wardRefs === 0,
  );

  const referencedCandidates = candidates.filter(
    (candidate) =>
      candidate.businessPartnerRefs !== 0 ||
      candidate.destinationTransactionRefs !== 0 ||
      candidate.sourceTransactionRefs !== 0 ||
      candidate.farmRefs !== 0 ||
      candidate.farmerRefs !== 0 ||
      candidate.wardRefs !== 0,
  );

  console.log(`Zero-ward candidates: ${candidates.length}`);
  console.log(
    `Zero-ward + zero-reference candidates: ${safeCandidates.length}`,
  );
  console.log(
    `Zero-ward candidates with references: ${referencedCandidates.length}`,
  );

  separator("-");
  console.log("PRELIMINARY CANDIDATES");
  separator("-");

  if (safeCandidates.length === 0) {
    console.log("None.");
  } else {
    for (const candidate of safeCandidates) {
      console.log(
        `${String(candidate.id).padEnd(6)} ` +
          `${candidate.countyName.padEnd(25)} ` +
          `${candidate.name.padEnd(30)} ` +
          `wards=${candidate.wardCount} ` +
          `BP=${candidate.businessPartnerRefs} ` +
          `CT-D=${candidate.destinationTransactionRefs} ` +
          `CT-S=${candidate.sourceTransactionRefs} ` +
          `Farm=${candidate.farmRefs} ` +
          `Farmer=${candidate.farmerRefs} ` +
          `Ward=${candidate.wardRefs}`,
      );
    }
  }

  separator("-");
  console.log("ZERO-WARD CANDIDATES WITH REFERENCES");
  separator("-");

  if (referencedCandidates.length === 0) {
    console.log("None.");
  } else {
    for (const candidate of referencedCandidates) {
      console.log(
        `${String(candidate.id).padEnd(6)} ` +
          `${candidate.countyName.padEnd(25)} ` +
          `${candidate.name.padEnd(30)} ` +
          `wards=${candidate.wardCount} ` +
          `BP=${candidate.businessPartnerRefs} ` +
          `CT-D=${candidate.destinationTransactionRefs} ` +
          `CT-S=${candidate.sourceTransactionRefs} ` +
          `Farm=${candidate.farmRefs} ` +
          `Farmer=${candidate.farmerRefs} ` +
          `Ward=${candidate.wardRefs}`,
      );
    }
  }

  separator("-");
  console.log("STEP 4 — FINAL DISCOVERY SAFETY CHECKS");
  separator("-");

  for (const candidate of safeCandidates) {
    if (candidate.wardCount !== 0) {
      throw new Error(
        `SAFETY FAILURE: Candidate ${candidate.id} has wards.`,
      );
    }

    const totalReferences =
      candidate.businessPartnerRefs +
      candidate.destinationTransactionRefs +
      candidate.sourceTransactionRefs +
      candidate.farmRefs +
      candidate.farmerRefs +
      candidate.wardRefs;

    if (totalReferences !== 0) {
      throw new Error(
        `SAFETY FAILURE: Candidate ${candidate.id} has ${totalReferences} references.`,
      );
    }
  }

  console.log(
    "PASS: Every preliminary candidate has zero wards and zero FK references.",
  );

  separator();
  console.log("BATCH 4 DISCOVERY SUMMARY");
  separator();

  console.log(`Remaining counties: ${remainingCounties.length}`);
  console.log(`SubCounties inspected: ${allSubCounties.length}`);
  console.log(`Zero-ward candidates: ${candidates.length}`);
  console.log(
    `Zero-ward + zero-reference candidates: ${safeCandidates.length}`,
  );
  console.log(
    `Zero-ward candidates with references: ${referencedCandidates.length}`,
  );

  separator("-");
  console.log("BATCH 4 PRELIMINARY WHITELIST");
  separator("-");

  if (safeCandidates.length === 0) {
    console.log("None.");
  } else {
    for (const candidate of safeCandidates) {
      console.log(
        `${candidate.id}    ${candidate.name}    County ${candidate.countyId} ${candidate.countyName}`,
      );
    }
  }

  separator("-");
  console.log("DATABASE SAFETY STATUS");
  separator("-");

  console.log("INSERT: NONE");
  console.log("UPDATE: NONE");
  console.log("DELETE: NONE");

  separator();
  console.log("BATCH 4 DISCOVERY: COMPLETE");
  console.log("READ ONLY — NO DATABASE CHANGES WERE MADE.");
  separator();

  console.log();
  console.log(
    "NEXT STEP: Run authoritative GeoJSON comparison on the preliminary candidates.",
  );
}

main()
  .catch((error) => {
    console.error();
    console.error("BATCH 4 DISCOVERY: FAILED");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });