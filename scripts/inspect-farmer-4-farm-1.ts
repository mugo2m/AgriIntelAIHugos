import "dotenv/config";

import { prisma } from "../lib/prisma";

function serialize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      output[key] = serialize(item);
    }

    return output;
  }

  return value;
}

async function main() {
  console.log("============================================================");
  console.log("INSPECT FARMER 4 + FARM 1");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  const farmer = await prisma.farmer.findUnique({
    where: {
      id: 4,
    },
  });

  const farm = await prisma.farm.findUnique({
    where: {
      id: 1,
    },
  });

  console.log("FARMER 4");
  console.log("--------");

  if (!farmer) {
    console.log("Farmer 4: NOT FOUND");
  } else {
    console.log(JSON.stringify(serialize(farmer), null, 2));
  }

  console.log("");
  console.log("FARM 1");
  console.log("------");

  if (!farm) {
    console.log("Farm 1: NOT FOUND");
  } else {
    console.log(JSON.stringify(serialize(farm), null, 2));
  }

  console.log("");
  console.log("RELATIONSHIP CHECK");
  console.log("------------------");

  if (farmer && farm) {
    console.log(`Farmer ID: ${farmer.id}`);
    console.log(`Farmer userId: ${farmer.userId}`);
    console.log(`Farm ID: ${farm.id}`);
    console.log(`Farm farmerId: ${farm.farmerId}`);

    if (farm.farmerId === farmer.id) {
      console.log("PASS — Farm 1 belongs to Farmer 4.");
    } else {
      console.log("FAIL — Farm 1 does not belong to Farmer 4.");
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("INSPECTION COMPLETE");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("INSPECTION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });