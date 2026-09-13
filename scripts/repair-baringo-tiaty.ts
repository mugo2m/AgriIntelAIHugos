import prisma from "../lib/prisma";

const BARINGO_COUNTY_ID = 90;
const TIATY_WEST_ID = 463;
const TIATY_EAST_ID = 757;

const EAST_WARD_IDS = [1840, 2190, 1841, 2193];

async function main() {
  console.log("=== BARINGO TIATY REPAIR ===");
  console.log("Safety checks starting...\n");

  // 1. Verify county
  const county = await prisma.county.findUnique({
    where: { id: BARINGO_COUNTY_ID },
    select: { id: true, name: true },
  });

  if (!county || county.name !== "Baringo") {
    throw new Error("SAFETY CHECK FAILED: County 90 is not Baringo.");
  }

  // 2. Verify SubCounty 463
  const tiatyWest = await prisma.subCounty.findUnique({
    where: { id: TIATY_WEST_ID },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
          constituencyId: true,
        },
      },
    },
  });

  if (!tiatyWest) {
    throw new Error("SAFETY CHECK FAILED: SubCounty 463 not found.");
  }

  if (tiatyWest.countyId !== BARINGO_COUNTY_ID) {
    throw new Error("SAFETY CHECK FAILED: SubCounty 463 is not in Baringo.");
  }

  if (tiatyWest.name !== "Tiaty Sub County") {
    throw new Error(
      `SAFETY CHECK FAILED: Expected SubCounty 463 to be "Tiaty Sub County", found "${tiatyWest.name}".`,
    );
  }

  // 3. Verify SubCounty 757
  const tiatyEast = await prisma.subCounty.findUnique({
    where: { id: TIATY_EAST_ID },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!tiatyEast) {
    throw new Error("SAFETY CHECK FAILED: SubCounty 757 not found.");
  }

  if (tiatyEast.countyId !== BARINGO_COUNTY_ID) {
    throw new Error("SAFETY CHECK FAILED: SubCounty 757 is not in Baringo.");
  }

  if (tiatyEast.name !== "Tiaty East") {
    throw new Error(
      `SAFETY CHECK FAILED: Expected SubCounty 757 to be "Tiaty East", found "${tiatyEast.name}".`,
    );
  }

  if (tiatyEast.wards.length !== 0) {
    throw new Error(
      "SAFETY CHECK FAILED: Tiaty East already has wards. Nothing changed.",
    );
  }

  // 4. Verify Tiaty 463 currently has exactly 7 wards
  if (tiatyWest.wards.length !== 7) {
    throw new Error(
      `SAFETY CHECK FAILED: Expected 7 wards under Tiaty 463, found ${tiatyWest.wards.length}.`,
    );
  }

  // 5. Verify exact four East wards
  const eastWards = tiatyWest.wards.filter((ward) =>
    EAST_WARD_IDS.includes(ward.id),
  );

  if (eastWards.length !== 4) {
    console.table(tiatyWest.wards);
    throw new Error(
      `SAFETY CHECK FAILED: Expected exactly 4 East wards, found ${eastWards.length}.`,
    );
  }

  // 6. Verify all four wards belong to constituency 463
  const wrongConstituency = eastWards.filter(
    (ward) => ward.constituencyId !== 463,
  );

  if (wrongConstituency.length > 0) {
    console.table(wrongConstituency);
    throw new Error(
      "SAFETY CHECK FAILED: One or more East wards have an unexpected constituency.",
    );
  }

  console.log("SAFETY CHECKS PASSED.");
  console.log("\nEast wards to move:");

  console.table(
    eastWards.map((ward) => ({
      id: ward.id,
      name: ward.name,
      constituencyId: ward.constituencyId,
    })),
  );

  // 7. Rename 463 to Tiaty West
  await prisma.subCounty.update({
    where: { id: TIATY_WEST_ID },
    data: {
      name: "Tiaty West Sub County",
    },
  });

  // 8. Move the four East wards to 757
  const moveResult = await prisma.ward.updateMany({
    where: {
      id: { in: EAST_WARD_IDS },
      subCountyId: TIATY_WEST_ID,
    },
    data: {
      subCountyId: TIATY_EAST_ID,
    },
  });

  if (moveResult.count !== 4) {
    throw new Error(
      `REPAIR FAILED: Expected to move 4 wards, moved ${moveResult.count}.`,
    );
  }

  // 9. Final verification
  const finalWest = await prisma.subCounty.findUnique({
    where: { id: TIATY_WEST_ID },
    select: {
      id: true,
      name: true,
      wards: {
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  const finalEast = await prisma.subCounty.findUnique({
    where: { id: TIATY_EAST_ID },
    select: {
      id: true,
      name: true,
      wards: {
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  console.log("\n=== REPAIR RESULT ===");

  console.log("\nTiaty West:");
  console.log(JSON.stringify(finalWest, null, 2));

  console.log("\nTiaty East:");
  console.log(JSON.stringify(finalEast, null, 2));

  if (!finalWest || finalWest.wards.length !== 3) {
    throw new Error("FINAL CHECK FAILED: Tiaty West should have 3 wards.");
  }

  if (!finalEast || finalEast.wards.length !== 4) {
    throw new Error("FINAL CHECK FAILED: Tiaty East should have 4 wards.");
  }

  console.log("\nSUCCESS: Baringo Tiaty structure repaired.");
}

main()
  .catch((error) => {
    console.error("\nREPAIR FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });