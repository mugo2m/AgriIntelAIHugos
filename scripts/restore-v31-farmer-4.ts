import "dotenv/config";

import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("RESTORE V31 FARMER 4");
  console.log("============================================================");
  console.log("TARGET: Farmer ID 4");
  console.log("");

  const before = await prisma.farmer.findUnique({
    where: { id: 4 },
  });

  if (!before) {
    throw new Error("Farmer 4 was not found. NOTHING WAS CHANGED.");
  }

  console.log("CURRENT STATE BEFORE RESTORATION");
  console.log("---------------------------------");
  console.log(`Phone          : ${before.phone}`);
  console.log(`Date of birth  : ${before.dateOfBirth?.toISOString() ?? "NULL"}`);
  console.log(`Experience     : ${before.farmingExperience ?? "NULL"}`);
  console.log(`Gender ID      : ${before.genderId ?? "NULL"}`);
  console.log(`Education ID   : ${before.educationLevelId ?? "NULL"}`);
  console.log(`Occupation ID  : ${before.occupationId ?? "NULL"}`);
  console.log(`Marital ID     : ${before.maritalStatusId ?? "NULL"}`);
  console.log(`Farmer type ID : ${before.farmerTypeId ?? "NULL"}`);
  console.log(`Activity ID    : ${before.farmingActivityId ?? "NULL"}`);
  console.log(`Language ID    : ${before.preferredLanguageId ?? "NULL"}`);
  console.log(`Communication  : ${before.communicationPreferenceId ?? "NULL"}`);
  console.log(`Digital lit.   : ${before.digitalLiteracyLevelId ?? "NULL"}`);
  console.log(`Household size : ${before.householdSize ?? "NULL"}`);
  console.log(`County ID      : ${before.countyId}`);
  console.log(`SubCounty ID   : ${before.subCountyId}`);
  console.log(`Ward ID        : ${before.wardId}`);
  console.log(`Village ID     : ${before.villageId ?? "NULL"}`);
  console.log("");

  console.log("RESTORING ORIGINAL V31 SNAPSHOT VALUES...");
  console.log("");

  await prisma.$transaction(async (tx) => {
    await tx.farmer.update({
      where: { id: 4 },
      data: {
        phone: "+254714272371",
        dateOfBirth: new Date("1978-08-08T00:00:00.000Z"),
        farmingExperience: 1,

        genderId: 2,
        educationLevelId: 8,
        occupationId: 3,
        maritalStatusId: 2,
        farmerTypeId: 4,
        farmingActivityId: 1,
        preferredLanguageId: 1,
        communicationPreferenceId: 5,
        digitalLiteracyLevelId: 4,

        householdSize: 1,
        numberOfDependents: null,
        numberOfFarmWorkers: null,

        countyId: 92,
        subCountyId: 1478,
        wardId: 1859,
        villageId: null,
      },
    });
  });

  const after = await prisma.farmer.findUnique({
    where: { id: 4 },
  });

  if (!after) {
    throw new Error("Farmer 4 disappeared after restoration.");
  }

  console.log("RESTORED STATE");
  console.log("--------------");
  console.log(`ID             : ${after.id}`);
  console.log(`User ID        : ${after.userId}`);
  console.log(`Phone          : ${after.phone}`);
  console.log(`Date of birth  : ${after.dateOfBirth?.toISOString() ?? "NULL"}`);
  console.log(`Experience     : ${after.farmingExperience ?? "NULL"}`);
  console.log(`Gender ID      : ${after.genderId ?? "NULL"}`);
  console.log(`Education ID   : ${after.educationLevelId ?? "NULL"}`);
  console.log(`Occupation ID  : ${after.occupationId ?? "NULL"}`);
  console.log(`Marital ID     : ${after.maritalStatusId ?? "NULL"}`);
  console.log(`Farmer type ID : ${after.farmerTypeId ?? "NULL"}`);
  console.log(`Activity ID    : ${after.farmingActivityId ?? "NULL"}`);
  console.log(`Language ID    : ${after.preferredLanguageId ?? "NULL"}`);
  console.log(`Communication  : ${after.communicationPreferenceId ?? "NULL"}`);
  console.log(`Digital lit.   : ${after.digitalLiteracyLevelId ?? "NULL"}`);
  console.log(`Household size : ${after.householdSize ?? "NULL"}`);
  console.log(`Dependents     : ${after.numberOfDependents ?? "NULL"}`);
  console.log(`Farm workers   : ${after.numberOfFarmWorkers ?? "NULL"}`);
  console.log(`County ID      : ${after.countyId}`);
  console.log(`SubCounty ID   : ${after.subCountyId}`);
  console.log(`Ward ID        : ${after.wardId}`);
  console.log(`Village ID     : ${after.villageId ?? "NULL"}`);
  console.log("");

  const checks = [
    ["userId", after.userId === 1],
    ["phone", after.phone === "+254714272371"],
    [
      "dateOfBirth",
      after.dateOfBirth?.toISOString() === "1978-08-08T00:00:00.000Z",
    ],
    ["farmingExperience", after.farmingExperience === 1],
    ["genderId", after.genderId === 2],
    ["educationLevelId", after.educationLevelId === 8],
    ["occupationId", after.occupationId === 3],
    ["maritalStatusId", after.maritalStatusId === 2],
    ["farmerTypeId", after.farmerTypeId === 4],
    ["farmingActivityId", after.farmingActivityId === 1],
    ["preferredLanguageId", after.preferredLanguageId === 1],
    ["communicationPreferenceId", after.communicationPreferenceId === 5],
    ["digitalLiteracyLevelId", after.digitalLiteracyLevelId === 4],
    ["householdSize", after.householdSize === 1],
    ["numberOfDependents", after.numberOfDependents === null],
    ["numberOfFarmWorkers", after.numberOfFarmWorkers === null],
    ["countyId", after.countyId === 92],
    ["subCountyId", after.subCountyId === 1478],
    ["wardId", after.wardId === 1859],
    ["villageId", after.villageId === null],
  ];

  console.log("RESTORATION CHECKS");
  console.log("------------------");

  let passed = 0;
  let failed = 0;

  for (const [name, ok] of checks) {
    if (ok) {
      console.log(`PASS — ${name}`);
      passed++;
    } else {
      console.log(`FAIL — ${name}`);
      failed++;
    }
  }

  console.log("");
  console.log("============================================================");
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);

  if (failed === 0) {
    console.log("STATUS: GREEN");
    console.log("Farmer 4 restored successfully.");
  } else {
    console.log("STATUS: RED");
    console.log("Farmer 4 restoration verification failed.");
    process.exitCode = 1;
  }

  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("RESTORATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });