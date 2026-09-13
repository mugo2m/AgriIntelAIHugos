import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

type Check = {
  name: string;
  passed: boolean;
  detail: string;
};

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("             FARMER REGISTRATION DATABASE AUDIT");
  console.log("             READ-ONLY - NO DATABASE CHANGES");
  console.log("============================================================");
  console.log("");

  const [
    farmerCount,
    farmCount,
    genderCount,
    educationLevelCount,
    occupationCount,
    maritalStatusCount,
    farmerTypeCount,
    farmingActivityCount,
    languageCount,
    communicationPreferenceCount,
    digitalLiteracyLevelCount,
  ] = await Promise.all([
    prisma.farmer.count(),
    prisma.farm.count(),
    prisma.gender.count(),
    prisma.educationLevel.count(),
    prisma.occupation.count(),
    prisma.maritalStatus.count(),
    prisma.farmerType.count(),
    prisma.farmingActivity.count(),
    prisma.language.count(),
    prisma.communicationPreference.count(),
    prisma.digitalLiteracyLevel.count(),
  ]);

  console.log("============================================================");
  console.log("DATABASE COUNTS");
  console.log("============================================================");
  console.log("Farmers:", Number(farmerCount));
  console.log("Farms:", Number(farmCount));
  console.log("Genders:", Number(genderCount));
  console.log("Education Levels:", Number(educationLevelCount));
  console.log("Occupations:", Number(occupationCount));
  console.log("Marital Statuses:", Number(maritalStatusCount));
  console.log("Farmer Types:", Number(farmerTypeCount));
  console.log("Farming Activities:", Number(farmingActivityCount));
  console.log("Languages:", Number(languageCount));
  console.log(
    "Communication Preferences:",
    Number(communicationPreferenceCount),
  );
  console.log(
    "Digital Literacy Levels:",
    Number(digitalLiteracyLevelCount),
  );
  console.log("");

  const farmer = await prisma.farmer.findFirst({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
      gender: true,
      educationLevel: true,
      occupation: true,
      maritalStatus: true,
      farmerType: true,
      farmingActivity: true,
      preferredLanguage: true,
      communicationPreference: true,
      digitalLiteracyLevel: true,
      county: true,
      subCounty: true,
      ward: true,
      village: true,
      farms: true,
    },
  });

  if (!farmer) {
    console.log("❌ NO FARMER RECORD FOUND");
    console.log("");
    return;
  }

  console.log("============================================================");
  console.log("LATEST FARMER");
  console.log("============================================================");
  console.log("Farmer ID:", farmer.id);
  console.log("User ID:", farmer.userId);
  console.log("Phone:", farmer.phone);
  console.log("National ID:", farmer.nationalId ?? "NULL");
  console.log(
    "Date of Birth:",
    farmer.dateOfBirth?.toISOString() ?? "NULL",
  );
  console.log(
    "Farming Experience:",
    farmer.farmingExperience ?? "NULL",
  );
  console.log("Updated At:", farmer.updatedAt.toISOString());
  console.log("");

  console.log("============================================================");
  console.log("USER");
  console.log("============================================================");
  console.log("User ID:", farmer.user.id);
  console.log("Firebase UID:", farmer.user.firebaseUid);
  console.log("First Name:", farmer.user.firstName);
  console.log("Last Name:", farmer.user.lastName);
  console.log("Name:", farmer.user.name);
  console.log("Phone:", farmer.user.phoneNumber);
  console.log("Role:", farmer.user.role?.name ?? "NULL");
  console.log("");

  console.log("============================================================");
  console.log("DEMOGRAPHIC PROFILE");
  console.log("============================================================");
  console.log("Gender:", farmer.gender?.name ?? "NULL");
  console.log("Education Level:", farmer.educationLevel?.name ?? "NULL");
  console.log("Occupation:", farmer.occupation?.name ?? "NULL");
  console.log("Marital Status:", farmer.maritalStatus?.name ?? "NULL");
  console.log("");

  console.log("============================================================");
  console.log("FARMER PROFILE");
  console.log("============================================================");
  console.log("Farmer Type:", farmer.farmerType?.name ?? "NULL");
  console.log(
    "Farming Activity:",
    farmer.farmingActivity?.name ?? "NULL",
  );
  console.log(
    "Farming Experience:",
    farmer.farmingExperience ?? "NULL",
  );
  console.log("Household Size:", farmer.householdSize ?? "NULL");
  console.log(
    "Number of Dependents:",
    farmer.numberOfDependents ?? "NULL",
  );
  console.log(
    "Number of Farm Workers:",
    farmer.numberOfFarmWorkers ?? "NULL",
  );
  console.log("");

  console.log("============================================================");
  console.log("FINANCIAL / AGRICULTURAL SUPPORT");
  console.log("============================================================");
  console.log("Has Loan:", farmer.hasLoan ?? "NULL");
  console.log(
    "Has Defaulted Loan:",
    farmer.hasDefaultedLoan ?? "NULL",
  );
  console.log(
    "Receives Input Subsidy:",
    farmer.receivesInputSubsidy ?? "NULL",
  );
  console.log("Receives Credit:", farmer.receivesCredit ?? "NULL");
  console.log("");

  console.log("============================================================");
  console.log("COMMUNICATION / DIGITAL PROFILE");
  console.log("============================================================");
  console.log(
    "Preferred Language:",
    farmer.preferredLanguage
      ? `${farmer.preferredLanguage.name} (${farmer.preferredLanguage.code})`
      : "NULL",
  );
  console.log(
    "Communication Preference:",
    farmer.communicationPreference?.name ?? "NULL",
  );
  console.log(
    "Digital Literacy Level:",
    farmer.digitalLiteracyLevel?.name ?? "NULL",
  );
  console.log("");

  console.log("============================================================");
  console.log("LOCATION");
  console.log("============================================================");
  console.log("County:", farmer.county.name);
  console.log("County ID:", farmer.countyId);
  console.log("Sub-County:", farmer.subCounty.name);
  console.log("Sub-County ID:", farmer.subCountyId);
  console.log("Ward:", farmer.ward.name);
  console.log("Ward ID:", farmer.wardId);
  console.log("Village:", farmer.village?.name ?? "NULL");
  console.log("Village ID:", farmer.villageId ?? "NULL");
  console.log("");

  console.log("============================================================");
  console.log("FARMS");
  console.log("============================================================");

  if (farmer.farms.length === 0) {
    console.log("❌ NO FARM FOUND");
  } else {
    for (const farm of farmer.farms) {
      console.log("");
      console.log("Farm ID:", farm.id);
      console.log("Farmer ID:", farm.farmerId);
      console.log("Farm Name:", farm.farmName);
      console.log("Acreage:", farm.acreage);
      console.log("Country ID:", farm.countryId ?? "NULL");
      console.log("County ID:", farm.countyId ?? "NULL");
      console.log("Sub-County ID:", farm.subCountyId ?? "NULL");
      console.log("Ward ID:", farm.wardId ?? "NULL");
      console.log("Village ID:", farm.villageId ?? "NULL");
    }
  }

  console.log("");

  const checks: Check[] = [];

  checks.push({
    name: "Farmer linked to User",
    passed: farmer.userId === farmer.user.id,
    detail: `Farmer userId=${farmer.userId}, User id=${farmer.user.id}`,
  });

  checks.push({
    name: "Farmer phone exists",
    passed: Boolean(farmer.phone),
    detail: farmer.phone || "NULL",
  });

  checks.push({
    name: "User phone matches Farmer phone",
    passed:
      !farmer.user.phoneNumber ||
      farmer.user.phoneNumber === farmer.phone,
    detail: `User=${farmer.user.phoneNumber ?? "NULL"}, Farmer=${farmer.phone}`,
  });

  checks.push({
    name: "Gender relation",
    passed: farmer.genderId === null || Boolean(farmer.gender),
    detail: `genderId=${farmer.genderId}, relation=${farmer.gender?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Education Level relation",
    passed:
      farmer.educationLevelId === null ||
      Boolean(farmer.educationLevel),
    detail: `educationLevelId=${farmer.educationLevelId}, relation=${farmer.educationLevel?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Occupation relation",
    passed:
      farmer.occupationId === null ||
      Boolean(farmer.occupation),
    detail: `occupationId=${farmer.occupationId}, relation=${farmer.occupation?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Marital Status relation",
    passed:
      farmer.maritalStatusId === null ||
      Boolean(farmer.maritalStatus),
    detail: `maritalStatusId=${farmer.maritalStatusId}, relation=${farmer.maritalStatus?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Farmer Type relation",
    passed:
      farmer.farmerTypeId === null ||
      Boolean(farmer.farmerType),
    detail: `farmerTypeId=${farmer.farmerTypeId}, relation=${farmer.farmerType?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Farming Activity relation",
    passed:
      farmer.farmingActivityId === null ||
      Boolean(farmer.farmingActivity),
    detail: `farmingActivityId=${farmer.farmingActivityId}, relation=${farmer.farmingActivity?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Preferred Language relation",
    passed:
      farmer.preferredLanguageId === null ||
      Boolean(farmer.preferredLanguage),
    detail: `preferredLanguageId=${farmer.preferredLanguageId}, relation=${farmer.preferredLanguage?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Communication Preference relation",
    passed:
      farmer.communicationPreferenceId === null ||
      Boolean(farmer.communicationPreference),
    detail: `communicationPreferenceId=${farmer.communicationPreferenceId}, relation=${farmer.communicationPreference?.name ?? "NULL"}`,
  });

  checks.push({
    name: "Digital Literacy relation",
    passed:
      farmer.digitalLiteracyLevelId === null ||
      Boolean(farmer.digitalLiteracyLevel),
    detail: `digitalLiteracyLevelId=${farmer.digitalLiteracyLevelId}, relation=${farmer.digitalLiteracyLevel?.name ?? "NULL"}`,
  });

  checks.push({
    name: "County exists",
    passed: Boolean(farmer.county),
    detail: farmer.county?.name ?? "NULL",
  });

  checks.push({
    name: "Sub-County exists",
    passed: Boolean(farmer.subCounty),
    detail: farmer.subCounty?.name ?? "NULL",
  });

  checks.push({
    name: "Ward exists",
    passed: Boolean(farmer.ward),
    detail: farmer.ward?.name ?? "NULL",
  });

  checks.push({
    name: "Sub-County belongs to County",
    passed: farmer.subCounty.countyId === farmer.countyId,
    detail: `SubCounty countyId=${farmer.subCounty.countyId}, Farmer countyId=${farmer.countyId}`,
  });

  checks.push({
    name: "Ward belongs to County",
    passed: farmer.ward.countyId === farmer.countyId,
    detail: `Ward countyId=${farmer.ward.countyId}, Farmer countyId=${farmer.countyId}`,
  });

  checks.push({
    name: "Ward belongs to Sub-County",
    passed: farmer.ward.subCountyId === farmer.subCountyId,
    detail: `Ward subCountyId=${farmer.ward.subCountyId}, Farmer subCountyId=${farmer.subCountyId}`,
  });

  checks.push({
    name: "Village belongs to Ward",
    passed:
      farmer.villageId === null ||
      (Boolean(farmer.village) &&
        farmer.village.wardId === farmer.wardId),
    detail: `Village=${farmer.villageId ?? "NULL"}, Ward=${farmer.wardId}`,
  });

  checks.push({
    name: "Farmer has Farm",
    passed: farmer.farms.length > 0,
    detail: `${farmer.farms.length} farm(s)`,
  });

  for (const farm of farmer.farms) {
    checks.push({
      name: `Farm ${farm.id} linked to Farmer`,
      passed: farm.farmerId === farmer.id,
      detail: `Farm farmerId=${farm.farmerId}, Farmer id=${farmer.id}`,
    });

    checks.push({
      name: `Farm ${farm.id} has name`,
      passed: Boolean(farm.farmName),
      detail: farm.farmName || "NULL",
    });

    checks.push({
      name: `Farm ${farm.id} acreage valid`,
      passed:
        Number.isFinite(farm.acreage) &&
        farm.acreage > 0,
      detail: String(farm.acreage),
    });

    checks.push({
      name: `Farm ${farm.id} county matches Farmer`,
      passed:
        farm.countyId === null ||
        farm.countyId === farmer.countyId,
      detail: `Farm=${farm.countyId ?? "NULL"}, Farmer=${farmer.countyId}`,
    });

    checks.push({
      name: `Farm ${farm.id} sub-county matches Farmer`,
      passed:
        farm.subCountyId === null ||
        farm.subCountyId === farmer.subCountyId,
      detail: `Farm=${farm.subCountyId ?? "NULL"}, Farmer=${farmer.subCountyId}`,
    });

    checks.push({
      name: `Farm ${farm.id} ward matches Farmer`,
      passed:
        farm.wardId === null ||
        farm.wardId === farmer.wardId,
      detail: `Farm=${farm.wardId ?? "NULL"}, Farmer=${farmer.wardId}`,
    });

    checks.push({
      name: `Farm ${farm.id} village matches Farmer`,
      passed:
        farm.villageId === null ||
        farm.villageId === farmer.villageId,
      detail: `Farm=${farm.villageId ?? "NULL"}, Farmer=${farmer.villageId ?? "NULL"}`,
    });
  }

  console.log("============================================================");
  console.log("CONSISTENCY CHECK RESULTS");
  console.log("============================================================");

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.passed) {
      console.log(`✅ ${check.name}`);
      console.log(`   ${check.detail}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   ${check.detail}`);
      failed++;
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("FINAL AUDIT RESULT");
  console.log("============================================================");
  console.log("Checks passed:", passed);
  console.log("Checks failed:", failed);
  console.log("");

  if (failed === 0) {
    console.log("🎉 FINAL RESULT: PASS");
    console.log("");
    console.log("User → Farmer → Profile → Location → Farm");
    console.log("are correctly synchronized.");
  } else {
    console.log("⚠️ FINAL RESULT: REVIEW REQUIRED");
    console.log("");
    console.log("One or more consistency checks failed.");
  }

  console.log("");
  console.log("DATABASE CHANGES: 0");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ AUDIT FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });