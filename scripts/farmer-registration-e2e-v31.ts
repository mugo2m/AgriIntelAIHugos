import fs from "fs";
import path from "path";

console.log("");
console.log("============================================================");
console.log("V31 AUTHENTICATED FARMER REGISTRATION E2E TEST");
console.log("============================================================");
console.log("");

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalIndex = line.indexOf("=");

    if (equalIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function normalizePhone(phone: string): string {
  const value = phone.trim();

  if (value.startsWith("+254")) {
    return value;
  }

  if (value.startsWith("254")) {
    return `+${value}`;
  }

  if (value.startsWith("0")) {
    return `+254${value.slice(1)}`;
  }

  return value;
}

type FarmerSnapshot = {
  id: number;
  userId: number;
  phone: string;
  dateOfBirth: Date | null;
  farmingExperience: number | null;

  genderId: number | null;
  educationLevelId: number | null;
  occupationId: number | null;
  maritalStatusId: number | null;
  farmerTypeId: number | null;
  farmingActivityId: number | null;
  preferredLanguageId: number | null;
  communicationPreferenceId: number | null;
  digitalLiteracyLevelId: number | null;

  hasLoan: boolean | null;
  hasDefaultedLoan: boolean | null;
  receivesInputSubsidy: boolean | null;
  receivesCredit: boolean | null;

  householdSize: number | null;
  numberOfDependents: number | null;
  numberOfFarmWorkers: number | null;

  countyId: number;
  subCountyId: number;
  wardId: number;
  villageId: number | null;
};

type FarmSnapshot = {
  id: number;
  farmerId: number;
  farmName: string;
  acreage: number;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  villageId: number | null;
  soilTypeId: number | null;
  waterSourceId: number | null;
};

async function main() {
  //
  // ==========================================================
  // 1. LOAD ENVIRONMENT BEFORE FIREBASE ADMIN IMPORT
  // ==========================================================
  //

  const projectRoot = process.cwd();

  loadEnvFile(path.join(projectRoot, ".env.local"));
  loadEnvFile(path.join(projectRoot, ".env"));

  console.log("STEP 1/10 — Checking Firebase environment");

  console.log(
    "   FIREBASE_PROJECT_ID:",
    process.env.FIREBASE_PROJECT_ID ? "FOUND" : "MISSING",
  );

  console.log(
    "   FIREBASE_CLIENT_EMAIL:",
    process.env.FIREBASE_CLIENT_EMAIL
      ? "FOUND"
      : "MISSING",
  );

  console.log(
    "   FIREBASE_PRIVATE_KEY:",
    process.env.FIREBASE_PRIVATE_KEY
      ? "FOUND"
      : "MISSING",
  );

  console.log(
    "   FIREBASE_CONFIG:",
    process.env.FIREBASE_CONFIG
      ? "FOUND"
      : "MISSING",
  );

  console.log(
    "   NEXT_PUBLIC_FIREBASE_API_KEY:",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? "FOUND"
      : "MISSING",
  );

  console.log("");

  assert(
    process.env.FIREBASE_CONFIG ||
      process.env.FIREBASE_PROJECT_ID,
    "Firebase Admin project configuration is missing.",
  );

  assert(
    process.env.FIREBASE_CONFIG ||
      process.env.FIREBASE_CLIENT_EMAIL,
    "Firebase Admin client email configuration is missing.",
  );

  assert(
    process.env.FIREBASE_CONFIG ||
      process.env.FIREBASE_PRIVATE_KEY,
    "Firebase Admin private key configuration is missing.",
  );

  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY;

  assert(
    apiKey,
    "Firebase Web API key is missing. Check NEXT_PUBLIC_FIREBASE_API_KEY.",
  );

  //
  // ==========================================================
  // 2. DYNAMIC IMPORTS AFTER ENVIRONMENT LOAD
  // ==========================================================
  //

  const { auth } = await import("../firebase/admin");
  const prismaModule = await import("../lib/prisma");

  const prisma = prismaModule.default;

  const baseUrl =
    process.env.V31_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  console.log("STEP 2/10 — Modules loaded");
  console.log(`   Base URL: ${baseUrl}`);
  console.log("   PASS");
  console.log("");

  let mutationAttempted = false;
  let targetUserId: number | null = null;

  let beforeFarmer: FarmerSnapshot | null = null;
  let beforeFarm: FarmSnapshot | null = null;

  try {
    //
    // ========================================================
    // 3. RESOLVE POSTGRES USER
    // ========================================================
    //

    console.log("STEP 3/10 — Resolving PostgreSQL User");

    const users = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
      include: {
        farmer: true,
      },
    });

    assert(
      users.length > 0,
      "No PostgreSQL User exists.",
    );

    const configuredPhone = process.env.V31_PHONE;

    let dbUser: any = null;

    if (configuredPhone) {
      const normalizedConfiguredPhone =
        normalizePhone(configuredPhone);

      dbUser = users.find((user: any) => {
        return (
          user.farmer?.phone === normalizedConfiguredPhone ||
          user.phoneNumber === normalizedConfiguredPhone ||
          user.phoneNumber === configuredPhone
        );
      });
    }

    if (!dbUser) {
      dbUser = users[0];
    }

    targetUserId = dbUser.id;

    console.log(`   User ID: ${dbUser.id}`);

    console.log(
      `   PostgreSQL Farmer: ${
        dbUser.farmer ? dbUser.farmer.id : "NONE"
      }`,
    );

    console.log("   PASS");
    console.log("");

    //
    // ========================================================
    // 4. RESOLVE FIREBASE UID
    // ========================================================
    //

    console.log("STEP 4/10 — Resolving Firebase UID");

    const firebaseUid =
      dbUser.firebaseUid ||
      dbUser.uid;

    assert(
      firebaseUid,
      "PostgreSQL User has no firebaseUid/uid.",
    );

    console.log("   Firebase UID resolved.");
    console.log("   PASS");
    console.log("");

    //
    // ========================================================
    // 5. CREATE FIREBASE CUSTOM TOKEN
    // ========================================================
    //

    console.log(
      "STEP 5/10 — Creating Firebase custom token",
    );

    const customToken =
      await auth.createCustomToken(firebaseUid);

    assert(
      customToken,
      "Firebase custom token was not created.",
    );

    console.log("   PASS");
    console.log("");

    //
    // ========================================================
    // 6. EXCHANGE CUSTOM TOKEN
    // ========================================================
    //

    console.log(
      "STEP 6/10 — Exchanging custom token for ID token",
    );

    const exchangeUrl =
      "https://identitytoolkit.googleapis.com/v1/" +
      "accounts:signInWithCustomToken" +
      `?key=${encodeURIComponent(apiKey)}`;

    const exchangeResponse = await fetch(
      exchangeUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    );

    const exchangeText =
      await exchangeResponse.text();

    let exchangeBody: any;

    try {
      exchangeBody =
        JSON.parse(exchangeText);
    } catch {
      exchangeBody = exchangeText;
    }

    assert(
      exchangeResponse.ok,
      `Firebase token exchange failed with HTTP ${exchangeResponse.status}: ${
        typeof exchangeBody === "string"
          ? exchangeBody
          : JSON.stringify(exchangeBody)
      }`,
    );

    assert(
      exchangeBody?.idToken,
      "Firebase did not return an ID token.",
    );

    const idToken =
      exchangeBody.idToken as string;

    console.log(
      "   PASS — Firebase ID token obtained.",
    );

    console.log("");

    //
    // ========================================================
    // 7. CREATE AND VERIFY SESSION COOKIE
    // ========================================================
    //

    console.log(
      "STEP 7/10 — Creating Firebase session cookie",
    );

    const sessionCookie =
      await auth.createSessionCookie(
        idToken,
        {
          expiresIn:
            60 * 60 * 24 * 7 * 1000,
        },
      );

    assert(
      sessionCookie,
      "Session cookie was not created.",
    );

    const decodedClaims =
      await auth.verifySessionCookie(
        sessionCookie,
        true,
      );

    assert(
      decodedClaims.uid === firebaseUid,
      "Session cookie UID does not match Firebase UID.",
    );

    console.log(
      "   PASS — Session cookie verified.",
    );

    console.log("");

    //
    // ========================================================
    // 8. SNAPSHOT CURRENT FARMER/FARM
    // ========================================================
    //

    console.log(
      "STEP 8/10 — Snapshotting Farmer/Farm",
    );

    beforeFarmer = dbUser.farmer
      ? {
          id: dbUser.farmer.id,

          // Snapshot for verification only.
          // We intentionally do NOT write userId during restoration.
          userId: dbUser.farmer.userId,

          phone: dbUser.farmer.phone,

          dateOfBirth:
            dbUser.farmer.dateOfBirth,

          farmingExperience:
            dbUser.farmer.farmingExperience,

          genderId:
            dbUser.farmer.genderId ?? null,

          educationLevelId:
            dbUser.farmer.educationLevelId ?? null,

          occupationId:
            dbUser.farmer.occupationId ?? null,

          maritalStatusId:
            dbUser.farmer.maritalStatusId ?? null,

          farmerTypeId:
            dbUser.farmer.farmerTypeId ?? null,

          farmingActivityId:
            dbUser.farmer.farmingActivityId ?? null,

          preferredLanguageId:
            dbUser.farmer.preferredLanguageId ?? null,

          communicationPreferenceId:
            dbUser.farmer.communicationPreferenceId ?? null,

          digitalLiteracyLevelId:
            dbUser.farmer.digitalLiteracyLevelId ?? null,

          hasLoan:
            dbUser.farmer.hasLoan ?? null,

          hasDefaultedLoan:
            dbUser.farmer.hasDefaultedLoan ?? null,

          receivesInputSubsidy:
            dbUser.farmer.receivesInputSubsidy ?? null,

          receivesCredit:
            dbUser.farmer.receivesCredit ?? null,

          householdSize:
            dbUser.farmer.householdSize ?? null,

          numberOfDependents:
            dbUser.farmer.numberOfDependents ?? null,

          numberOfFarmWorkers:
            dbUser.farmer.numberOfFarmWorkers ?? null,

          countyId:
            dbUser.farmer.countyId,

          subCountyId:
            dbUser.farmer.subCountyId,

          wardId:
            dbUser.farmer.wardId,

          villageId:
            dbUser.farmer.villageId ?? null,
        }
      : null;

    const existingFarm = beforeFarmer
      ? await prisma.farm.findFirst({
          where: {
            farmerId: beforeFarmer.id,
          },
          orderBy: {
            id: "asc",
          },
        })
      : null;

    beforeFarm = existingFarm
      ? {
          id: existingFarm.id,

          farmerId:
            existingFarm.farmerId,

          farmName:
            existingFarm.farmName,

          acreage:
            Number(existingFarm.acreage),

          countryId:
            existingFarm.countryId ?? null,

          countyId:
            existingFarm.countyId ?? null,

          subCountyId:
            existingFarm.subCountyId ?? null,

          wardId:
            existingFarm.wardId ?? null,

          villageId:
            existingFarm.villageId ?? null,

          soilTypeId:
            existingFarm.soilTypeId ?? null,

          waterSourceId:
            existingFarm.waterSourceId ?? null,
        }
      : null;

    console.log(
      `   Farmer snapshot: ${
        beforeFarmer ? "EXISTS" : "NONE"
      }`,
    );

    console.log(
      `   Farm snapshot: ${
        beforeFarm ? "EXISTS" : "NONE"
      }`,
    );

    console.log("   PASS");
    console.log("");

    //
    // ========================================================
    // 9. REAL HTTP E2E POST
    // ========================================================
    //

    console.log(
      "STEP 9/10 — Executing authenticated HTTP POST",
    );

    const ward = await prisma.ward.findFirst({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        countyId: true,
        subCountyId: true,
        constituencyId: true,
      },
    });

    assert(
      ward,
      "No Ward exists in the database.",
    );

    const county =
      await prisma.county.findUnique({
        where: {
          id: ward.countyId,
        },
        select: {
          id: true,
          name: true,
          countryId: true,
        },
      });

    assert(
      county,
      "Ward County does not exist.",
    );

    const subCounty =
      await prisma.subCounty.findUnique({
        where: {
          id: ward.subCountyId,
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      });

    assert(
      subCounty,
      "Ward SubCounty does not exist.",
    );

    const constituency =
      await prisma.constituency.findUnique({
        where: {
          id: ward.constituencyId,
        },
        select: {
          id: true,
          name: true,
          countyId: true,
        },
      });

    assert(
      constituency,
      "Ward Constituency does not exist.",
    );

    assert(
      subCounty.countyId === county.id,
      "SubCounty does not belong to County.",
    );

    assert(
      constituency.countyId === county.id,
      "Constituency does not belong to County.",
    );

    const testPhone =
      beforeFarmer?.phone ||
      configuredPhone;

    assert(
      testPhone,
      "No existing Farmer phone found and V31_PHONE is not set.",
    );

    const payload = {
      firstName:
        "V31 AuthenticatedTest",

      lastName:
        "Farmer",

      phoneNumber:
        testPhone,

      dateOfBirth:
        "1980-01-01",

      farmingExperience:
        10,

      householdSize:
        4,

      dependents:
        2,

      workers:
        2,

      genderId:
        null,

      educationLevelId:
        null,

      occupationId:
        null,

      maritalStatusId:
        null,

      farmerTypeId:
        null,

      farmingActivityId:
        null,

      preferredLanguageId:
        null,

      communicationPreferenceId:
        null,

      digitalLiteracyLevelId:
        null,

      countryId:
        county.countryId,

      countyId:
        county.id,

      subCountyId:
        subCounty.id,

      constituencyId:
        constituency.id,

      wardId:
        ward.id,

      villageId:
        null,

      farmName:
        "V31 E2E Test Farm",

      acreage:
        1.25,
    };

    console.log("");
    console.log("   Test geography:");

    console.log(
      `   County: ${county.name} (${county.id})`,
    );

    console.log(
      `   SubCounty: ${subCounty.name} (${subCounty.id})`,
    );

    console.log(
      `   Constituency: ${constituency.name} (${constituency.id})`,
    );

    console.log(
      `   Ward: ${ward.name} (${ward.id})`,
    );

    console.log("");

    console.log(
      "   Authentication:",
    );

    console.log(
      "   Session cookie: PRESENT",
    );

    console.log(
      "   Client userId: NOT SENT",
    );

    console.log(
      "   Client firebaseUid: NOT SENT",
    );

    console.log("");

    mutationAttempted = true;

    const postResponse =
      await fetch(
        `${baseUrl}/api/farmers`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Cookie:
              `session=${sessionCookie}`,
          },

          body:
            JSON.stringify(payload),
        },
      );

    const postText =
      await postResponse.text();

    let postBody: any;

    try {
      postBody =
        JSON.parse(postText);
    } catch {
      postBody = postText;
    }

    console.log(
      `   HTTP status: ${postResponse.status}`,
    );

    console.log(
      "   Response:",
      typeof postBody === "string"
        ? postBody
        : JSON.stringify(
            postBody,
            null,
            2,
          ),
    );

    assert(
      postResponse.ok,
      `Authenticated Farmer POST failed with HTTP ${postResponse.status}.`,
    );

    assert(
      postBody?.success === true,
      "Farmer API did not return success:true.",
    );

    console.log("");

    console.log(
      "   PASS — Real HTTP authenticated POST succeeded.",
    );

    console.log("");

    //
    // ========================================================
    // DATABASE VERIFICATION
    // ========================================================
    //

    console.log(
      "DATABASE VERIFICATION",
    );

    console.log(
      "---------------------",
    );

    const afterFarmer =
      await prisma.farmer.findUnique({
        where: {
          userId: targetUserId,
        },
      });

    assert(
      afterFarmer,
      "Farmer was not found after POST.",
    );

    assert(
      afterFarmer.countyId === county.id,
      "Persisted Farmer countyId is incorrect.",
    );

    assert(
      afterFarmer.subCountyId ===
        subCounty.id,
      "Persisted Farmer subCountyId is incorrect.",
    );

    assert(
      afterFarmer.wardId === ward.id,
      "Persisted Farmer wardId is incorrect.",
    );

    assert(
      afterFarmer.phone ===
        normalizePhone(testPhone),
      "Persisted Farmer phone is incorrect.",
    );

    const afterFarm =
      await prisma.farm.findFirst({
        where: {
          farmerId: afterFarmer.id,
        },
        orderBy: {
          id: "asc",
        },
      });

    assert(
      afterFarm,
      "Farm was not found after POST.",
    );

    assert(
      afterFarm.farmerId ===
        afterFarmer.id,
      "Farm farmerId is incorrect.",
    );

    assert(
      afterFarm.countyId === county.id,
      "Persisted Farm countyId is incorrect.",
    );

    assert(
      afterFarm.subCountyId ===
        subCounty.id,
      "Persisted Farm subCountyId is incorrect.",
    );

    assert(
      afterFarm.wardId === ward.id,
      "Persisted Farm wardId is incorrect.",
    );

    console.log(
      `   Farmer ID: ${afterFarmer.id}`,
    );

    console.log(
      `   Farm ID: ${afterFarm.id}`,
    );

    console.log(
      `   Farmer County: ${afterFarmer.countyId}`,
    );

    console.log(
      `   Farmer SubCounty: ${afterFarmer.subCountyId}`,
    );

    console.log(
      `   Farmer Ward: ${afterFarmer.wardId}`,
    );

    console.log("");

    console.log(
      "   PASS — Farmer persisted correctly.",
    );

    console.log(
      "   PASS — Farm persisted correctly.",
    );

    console.log("");

    //
    // ========================================================
    // 10. SUCCESS
    // ========================================================
    //

    console.log(
      "STEP 10/10 — E2E verification complete",
    );

    console.log(
      "   PASS — Firebase authentication",
    );

    console.log(
      "   PASS — Next.js session cookie",
    );

    console.log(
      "   PASS — getCurrentUser() authentication",
    );

    console.log(
      "   PASS — PostgreSQL User resolution",
    );

    console.log(
      "   PASS — Geography validation",
    );

    console.log(
      "   PASS — Farmer persistence",
    );

    console.log(
      "   PASS — Farm persistence",
    );

  } finally {
    //
    // ========================================================
    // ALWAYS RESTORE DATABASE STATE
    // ========================================================
    //

    if (
      mutationAttempted &&
      targetUserId !== null
    ) {
      console.log("");

      console.log(
        "============================================================",
      );

      console.log(
        "V31 RESTORATION",
      );

      console.log(
        "============================================================",
      );

      console.log("");

      try {
        await prisma.$transaction(
          async (tx: any) => {
            //
            // Existing Farmer
            //

            if (beforeFarmer) {
              await tx.farmer.update({
                where: {
                  id: beforeFarmer.id,
                },

                data: {
                  phone:
                    beforeFarmer.phone,

                  dateOfBirth:
                    beforeFarmer.dateOfBirth,

                  farmingExperience:
                    beforeFarmer.farmingExperience,

                  genderId:
                    beforeFarmer.genderId,

                  educationLevelId:
                    beforeFarmer.educationLevelId,

                  occupationId:
                    beforeFarmer.occupationId,

                  maritalStatusId:
                    beforeFarmer.maritalStatusId,

                  farmerTypeId:
                    beforeFarmer.farmerTypeId,

                  farmingActivityId:
                    beforeFarmer.farmingActivityId,

                  preferredLanguageId:
                    beforeFarmer.preferredLanguageId,

                  communicationPreferenceId:
                    beforeFarmer.communicationPreferenceId,

                  digitalLiteracyLevelId:
                    beforeFarmer.digitalLiteracyLevelId,

                  hasLoan:
                    beforeFarmer.hasLoan,

                  hasDefaultedLoan:
                    beforeFarmer.hasDefaultedLoan,

                  receivesInputSubsidy:
                    beforeFarmer.receivesInputSubsidy,

                  receivesCredit:
                    beforeFarmer.receivesCredit,

                  householdSize:
                    beforeFarmer.householdSize,

                  numberOfDependents:
                    beforeFarmer.numberOfDependents,

                  numberOfFarmWorkers:
                    beforeFarmer.numberOfFarmWorkers,

                  countyId:
                    beforeFarmer.countyId,

                  subCountyId:
                    beforeFarmer.subCountyId,

                  wardId:
                    beforeFarmer.wardId,

                  villageId:
                    beforeFarmer.villageId,
                },
              });
            }

            //
            // Existing Farm
            //

            if (
              beforeFarmer &&
              beforeFarm
            ) {
              await tx.farm.update({
                where: {
                  id: beforeFarm.id,
                },

                data: {
                  farmerId:
                    beforeFarm.farmerId,

                  farmName:
                    beforeFarm.farmName,

                  acreage:
                    beforeFarm.acreage,

                  countryId:
                    beforeFarm.countryId,

                  countyId:
                    beforeFarm.countyId,

                  subCountyId:
                    beforeFarm.subCountyId,

                  wardId:
                    beforeFarm.wardId,

                  villageId:
                    beforeFarm.villageId,

                  soilTypeId:
                    beforeFarm.soilTypeId,

                  waterSourceId:
                    beforeFarm.waterSourceId,
                },
              });
            }

            //
            // Existing Farmer but no Farm
            //

            if (
              beforeFarmer &&
              !beforeFarm
            ) {
              await tx.farm.deleteMany({
                where: {
                  farmerId:
                    beforeFarmer.id,
                },
              });
            }

            //
            // No Farmer existed before test
            //

            if (!beforeFarmer) {
              const createdFarmer =
                await tx.farmer.findUnique({
                  where: {
                    userId:
                      targetUserId,
                  },

                  select: {
                    id: true,
                  },
                });

              if (createdFarmer) {
                await tx.farm.deleteMany({
                  where: {
                    farmerId:
                      createdFarmer.id,
                  },
                });

                await tx.farmer.delete({
                  where: {
                    id:
                      createdFarmer.id,
                  },
                });
              }
            }
          },
        );

        console.log(
          "PASS — Original database state restored.",
        );

        console.log("");

        //
        // ----------------------------------------------------
        // RESTORATION VERIFICATION
        // ----------------------------------------------------
        //

        if (beforeFarmer) {
          const restoredFarmer =
            await prisma.farmer.findUnique({
              where: {
                id: beforeFarmer.id,
              },
            });

          assert(
            restoredFarmer,
            "Original Farmer missing after restoration.",
          );

          //
          // Identity relationship must remain unchanged.
          //

          assert(
            restoredFarmer.userId ===
              beforeFarmer.userId,
            "Farmer userId restoration mismatch.",
          );

          //
          // Core Farmer fields
          //

          assert(
            restoredFarmer.phone ===
              beforeFarmer.phone,
            "Farmer phone restoration mismatch.",
          );

          assert(
            restoredFarmer.dateOfBirth?.getTime() ===
              beforeFarmer.dateOfBirth?.getTime(),
            "Farmer dateOfBirth restoration mismatch.",
          );

          assert(
            restoredFarmer.farmingExperience ===
              beforeFarmer.farmingExperience,
            "Farmer farmingExperience restoration mismatch.",
          );

          //
          // Household fields
          //

          assert(
            restoredFarmer.householdSize ===
              beforeFarmer.householdSize,
            "Farmer householdSize restoration mismatch.",
          );

          assert(
            restoredFarmer.numberOfDependents ===
              beforeFarmer.numberOfDependents,
            "Farmer numberOfDependents restoration mismatch.",
          );

          assert(
            restoredFarmer.numberOfFarmWorkers ===
              beforeFarmer.numberOfFarmWorkers,
            "Farmer numberOfFarmWorkers restoration mismatch.",
          );

          //
          // Geography
          //

          assert(
            restoredFarmer.countyId ===
              beforeFarmer.countyId,
            "Farmer countyId restoration mismatch.",
          );

          assert(
            restoredFarmer.subCountyId ===
              beforeFarmer.subCountyId,
            "Farmer subCountyId restoration mismatch.",
          );

          assert(
            restoredFarmer.wardId ===
              beforeFarmer.wardId,
            "Farmer wardId restoration mismatch.",
          );

          assert(
            restoredFarmer.villageId ===
              beforeFarmer.villageId,
            "Farmer villageId restoration mismatch.",
          );

          //
          // Lookup relationships
          //

          assert(
            restoredFarmer.genderId ===
              beforeFarmer.genderId,
            "Farmer genderId restoration mismatch.",
          );

          assert(
            restoredFarmer.educationLevelId ===
              beforeFarmer.educationLevelId,
            "Farmer educationLevelId restoration mismatch.",
          );

          assert(
            restoredFarmer.occupationId ===
              beforeFarmer.occupationId,
            "Farmer occupationId restoration mismatch.",
          );

          assert(
            restoredFarmer.maritalStatusId ===
              beforeFarmer.maritalStatusId,
            "Farmer maritalStatusId restoration mismatch.",
          );

          assert(
            restoredFarmer.farmerTypeId ===
              beforeFarmer.farmerTypeId,
            "Farmer farmerTypeId restoration mismatch.",
          );

          assert(
            restoredFarmer.farmingActivityId ===
              beforeFarmer.farmingActivityId,
            "Farmer farmingActivityId restoration mismatch.",
          );

          assert(
            restoredFarmer.preferredLanguageId ===
              beforeFarmer.preferredLanguageId,
            "Farmer preferredLanguageId restoration mismatch.",
          );

          assert(
            restoredFarmer.communicationPreferenceId ===
              beforeFarmer.communicationPreferenceId,
            "Farmer communicationPreferenceId restoration mismatch.",
          );

          assert(
            restoredFarmer.digitalLiteracyLevelId ===
              beforeFarmer.digitalLiteracyLevelId,
            "Farmer digitalLiteracyLevelId restoration mismatch.",
          );

          //
          // Boolean fields
          //

          assert(
            restoredFarmer.hasLoan ===
              beforeFarmer.hasLoan,
            "Farmer hasLoan restoration mismatch.",
          );

          assert(
            restoredFarmer.hasDefaultedLoan ===
              beforeFarmer.hasDefaultedLoan,
            "Farmer hasDefaultedLoan restoration mismatch.",
          );

          assert(
            restoredFarmer.receivesInputSubsidy ===
              beforeFarmer.receivesInputSubsidy,
            "Farmer receivesInputSubsidy restoration mismatch.",
          );

          assert(
            restoredFarmer.receivesCredit ===
              beforeFarmer.receivesCredit,
            "Farmer receivesCredit restoration mismatch.",
          );
        }

        if (beforeFarm) {
          const restoredFarm =
            await prisma.farm.findUnique({
              where: {
                id: beforeFarm.id,
              },
            });

          assert(
            restoredFarm,
            "Original Farm missing after restoration.",
          );

          assert(
            restoredFarm.farmerId ===
              beforeFarm.farmerId,
            "Farm farmerId restoration mismatch.",
          );

          assert(
            restoredFarm.farmName ===
              beforeFarm.farmName,
            "Farm farmName restoration mismatch.",
          );

          assert(
            Number(restoredFarm.acreage) ===
              beforeFarm.acreage,
            "Farm acreage restoration mismatch.",
          );

          assert(
            restoredFarm.countryId ===
              beforeFarm.countryId,
            "Farm countryId restoration mismatch.",
          );

          assert(
            restoredFarm.countyId ===
              beforeFarm.countyId,
            "Farm countyId restoration mismatch.",
          );

          assert(
            restoredFarm.subCountyId ===
              beforeFarm.subCountyId,
            "Farm subCountyId restoration mismatch.",
          );

          assert(
            restoredFarm.wardId ===
              beforeFarm.wardId,
            "Farm wardId restoration mismatch.",
          );

          assert(
            restoredFarm.villageId ===
              beforeFarm.villageId,
            "Farm villageId restoration mismatch.",
          );

          assert(
            restoredFarm.soilTypeId ===
              beforeFarm.soilTypeId,
            "Farm soilTypeId restoration mismatch.",
          );

          assert(
            restoredFarm.waterSourceId ===
              beforeFarm.waterSourceId,
            "Farm waterSourceId restoration mismatch.",
          );
        }

        console.log(
          "PASS — Restoration verification passed.",
        );

      } catch (restoreError) {
        console.error("");

        console.error(
          "🚨 CRITICAL: DATABASE RESTORATION FAILED",
        );

        console.error("");

        if (restoreError instanceof Error) {
          console.error(
            restoreError.message,
          );
        } else {
          console.error(
            restoreError,
          );
        }

        console.error("");

        console.error(
          "STOP further mutation tests and inspect the database.",
        );
      }
    }

    await prisma.$disconnect();
  }

  console.log("");

  console.log(
    "============================================================",
  );

  console.log(
    "V31 COMPLETE",
  );

  console.log(
    "============================================================",
  );

  console.log("");
}

main().catch((error) => {
  console.error("");

  console.error(
    "============================================================",
  );

  console.error(
    "V31 UNHANDLED FAILURE",
  );

  console.error(
    "============================================================",
  );

  console.error("");

  if (error instanceof Error) {
    console.error(
      error.stack || error.message,
    );
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});