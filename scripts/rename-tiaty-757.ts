
import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.subCounty.findUnique({
      where: { id: 757 },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

    if (!target) {
      throw new Error("ABORT: SubCounty 757 does not exist");
    }

    if (target.name !== "Tiaty East") {
      throw new Error(
        `ABORT: Expected current name "Tiaty East", found "${target.name}"`,
      );
    }

    if (target.countyId !== 90) {
      throw new Error(
        `ABORT: Expected countyId 90, found ${target.countyId}`,
      );
    }

    const collision = await tx.subCounty.findFirst({
      where: {
        countyId: 90,
        name: "Tiaty",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (collision) {
      throw new Error(
        `ABORT: "Tiaty" already exists in Baringo with ID ${collision.id}`,
      );
    }

    const wards = await tx.ward.findMany({
      where: {
        subCountyId: 757,
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (wards.length !== 7) {
      throw new Error(
        `ABORT: Expected exactly 7 wards, found ${wards.length}`,
      );
    }

    if (wards.some((ward) => ward.subCountyId !== 757)) {
      throw new Error(
        "ABORT: Ward foreign-key integrity check failed",
      );
    }

    const farmers = await tx.farmer.count({
      where: {
        subCountyId: 757,
      },
    });

    const farms = await tx.farm.count({
      where: {
        subCountyId: 757,
      },
    });

    const villages = await tx.village.count({
      where: {
        ward: {
          subCountyId: 757,
        },
      },
    });

    if (farmers !== 0) {
      throw new Error(
        `ABORT: Expected 0 farmers, found ${farmers}`,
      );
    }

    if (farms !== 0) {
      throw new Error(
        `ABORT: Expected 0 farms, found ${farms}`,
      );
    }

    if (villages !== 0) {
      throw new Error(
        `ABORT: Expected 0 villages, found ${villages}`,
      );
    }

    const updated = await tx.subCounty.update({
      where: {
        id: 757,
      },
      data: {
        name: "Tiaty",
      },
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

    if (
      updated.id !== 757 ||
      updated.name !== "Tiaty" ||
      updated.countyId !== 90
    ) {
      throw new Error(
        "ABORT: Post-update identity verification failed",
      );
    }

    const wardCheck = await tx.ward.findMany({
      where: {
        subCountyId: 757,
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (wardCheck.length !== 7) {
      throw new Error(
        `ABORT: Post-update ward count failed; found ${wardCheck.length}`,
      );
    }

    if (wardCheck.some((ward) => ward.subCountyId !== 757)) {
      throw new Error(
        "ABORT: Post-update ward foreign-key integrity failed",
      );
    }

    return {
      status: "RENAMED",
      before: target,
      after: updated,
      wardsBefore: wards,
      wardsAfter: wardCheck,
      farmers,
      farms,
      villages,
      mutation: {
        changed: "SubCounty.name",
        from: "Tiaty East",
        to: "Tiaty",
        idPreserved: updated.id === 757,
        countyPreserved: updated.countyId === 90,
      },
    };
  });

  console.log("");
  console.log("==============================================");
  console.log("TIATY SUBCOUNTY RENAME RESULT");
  console.log("==============================================");
  console.log(JSON.stringify(result, null, 2));
  console.log("==============================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==============================================");
    console.error("TIATY RENAME ABORTED");
    console.error("==============================================");
    console.error(error);
    console.error("==============================================");
    console.error("");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
