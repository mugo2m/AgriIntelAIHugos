import "dotenv/config";

import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("VERIFY V31 ORIGINAL FARMER GEOGRAPHY");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  const countyId = 92;
  const subCountyId = 1478;
  const wardId = 1859;

  const county = await prisma.county.findUnique({
    where: { id: countyId },
    select: {
      id: true,
      name: true,
    },
  });

  const subCounty = await prisma.subCounty.findUnique({
    where: { id: subCountyId },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
    },
  });

  console.log("ORIGINAL COUNTY");
  console.log("----------------");
  console.log(`ID   : ${countyId}`);
  console.log(`Name : ${county?.name ?? "NOT FOUND"}`);
  console.log("");

  console.log("ORIGINAL SUB-COUNTY");
  console.log("-------------------");
  console.log(`ID       : ${subCountyId}`);
  console.log(`Name     : ${subCounty?.name ?? "NOT FOUND"}`);
  console.log(`County ID: ${subCounty?.countyId ?? "NOT FOUND"}`);
  console.log("");

  console.log("ORIGINAL WARD");
  console.log("-------------");
  console.log(`ID            : ${wardId}`);
  console.log(`Name          : ${ward?.name ?? "NOT FOUND"}`);
  console.log(`County ID     : ${ward?.countyId ?? "NOT FOUND"}`);
  console.log(`SubCounty ID  : ${ward?.subCountyId ?? "NOT FOUND"}`);
  console.log(`Constituency  : ${ward?.constituencyId ?? "NOT FOUND"}`);
  console.log("");

  let passed = true;

  if (!county) {
    console.log("FAIL — County 92 does not exist.");
    passed = false;
  }

  if (!subCounty) {
    console.log("FAIL — SubCounty 1478 does not exist.");
    passed = false;
  }

  if (!ward) {
    console.log("FAIL — Ward 1859 does not exist.");
    passed = false;
  }

  if (subCounty && subCounty.countyId !== countyId) {
    console.log(
      `FAIL — SubCounty 1478 belongs to County ${subCounty.countyId}, not County ${countyId}.`,
    );
    passed = false;
  }

  if (ward) {
    if (ward.countyId !== countyId) {
      console.log(
        `FAIL — Ward 1859 belongs to County ${ward.countyId}, not County ${countyId}.`,
      );
      passed = false;
    }

    if (ward.subCountyId !== subCountyId) {
      console.log(
        `FAIL — Ward 1859 belongs to SubCounty ${ward.subCountyId}, not SubCounty ${subCountyId}.`,
      );
      passed = false;
    }
  }

  console.log("");
  console.log("============================================================");

  if (passed) {
    console.log("PASS — ORIGINAL GEOGRAPHY IDS ARE VALID");
    console.log("============================================================");
    console.log("");
    console.log("Safe to proceed to Farmer restoration.");
  } else {
    console.log("FAIL — DO NOT RESTORE YET");
    console.log("============================================================");
    console.log("");
    console.log("Stop and inspect the geography before any UPDATE.");
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("VERIFICATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });