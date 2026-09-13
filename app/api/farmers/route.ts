import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getAuthorizedFarmerWhere,
} from "@/lib/authorization/farmer-collection-authorization";

function normalizePhoneNumber(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, "");
}

function parseOptionalInteger(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function parseOptionalFloat(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parseOptionalDate(
  value: unknown,
): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseOptionalBoolean(
  value: unknown,
): boolean | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

async function validateLookupId(
  id: number | null,
  label: string,
  exists: () => Promise<unknown>,
): Promise<NextResponse | null> {
  if (id === null) {
    return null;
  }

  const record = await exists();

  if (!record) {
    return NextResponse.json(
      {
        error: `${label} not found.`,
      },
      { status: 400 },
    );
  }

  return null;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const firebaseUid =
      typeof currentUser.id === "string"
        ? currentUser.id
        : typeof (currentUser as { uid?: unknown }).uid ===
            "string"
          ? (currentUser as { uid: string }).uid
          : null;

    if (!firebaseUid) {
      return NextResponse.json(
        {
          error:
            "Authenticated user does not have a valid Firebase UID.",
        },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        firebaseUid,
      },
      include: {
        role: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "Your account is not synchronized with the application database.",
        },
        { status: 403 },
      );
    }

    if (!dbUser.active) {
      return NextResponse.json(
        {
          error: "User account is inactive.",
        },
        { status: 403 },
      );
    }

    /*
     * V40.7 COLLECTION AUTHORIZATION
     *
     * Authorization is based on active OfficerAssignment records
     * and their geographic scope:
     *
     * NATIONAL
     * COUNTY
     * SUBCOUNTY
     * WARD
     *
     * The helper builds one Prisma FarmerWhereInput.
     * PostgreSQL performs the collection filtering.
     *
     * No officer-name authorization.
     * No hardcoded primary-role collection gate.
     * No N+1 per-Farmer authorization calls.
     */
    const authorizedWhere =
      await getAuthorizedFarmerWhere(dbUser.id);

    if (!authorizedWhere) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const farmers = await prisma.farmer.findMany({
      where: authorizedWhere,
      orderBy: {
        createdAt: "desc",
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
        farms: {
          include: {
            soilType: true,
            waterSource: true,
          },
        },
      },
    });

    return NextResponse.json(
      farmers,
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET /api/farmers error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch farmers",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    const firebaseUid =
      typeof currentUser.id === "string"
        ? currentUser.id
        : typeof (currentUser as { uid?: unknown }).uid ===
            "string"
          ? (currentUser as { uid: string }).uid
          : null;

    if (!firebaseUid) {
      return NextResponse.json(
        {
          error:
            "Authenticated user does not have a valid Firebase UID.",
        },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        firebaseUid,
      },
      include: {
        farmer: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "Your account is not synchronized with the application database.",
        },
        { status: 404 },
      );
    }

    if (!dbUser.active) {
      return NextResponse.json(
        {
          error: "User account is inactive.",
        },
        { status: 403 },
      );
    }

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim()
        : "";

    const farmName =
      typeof body.farmName === "string"
        ? body.farmName.trim()
        : "";

    if (!firstName) {
      return NextResponse.json(
        {
          error: "First name is required.",
        },
        { status: 400 },
      );
    }

    if (!lastName) {
      return NextResponse.json(
        {
          error: "Last name is required.",
        },
        { status: 400 },
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        {
          error: "Phone number is required.",
        },
        { status: 400 },
      );
    }

    if (!farmName) {
      return NextResponse.json(
        {
          error: "Farm name is required.",
        },
        { status: 400 },
      );
    }

    const normalizedPhone =
      normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error: "A valid phone number is required.",
        },
        { status: 400 },
      );
    }

    const countryId = parseOptionalInteger(
      body.countryId,
    );

    const countyId = parseOptionalInteger(
      body.countyId,
    );

    const subCountyId = parseOptionalInteger(
      body.subCountyId,
    );

    const constituencyId = parseOptionalInteger(
      body.constituencyId,
    );

    const wardId = parseOptionalInteger(
      body.wardId,
    );

    const villageId = parseOptionalInteger(
      body.villageId,
    );

    if (countryId === null) {
      return NextResponse.json(
        {
          error: "Country is required.",
        },
        { status: 400 },
      );
    }

    if (countyId === null) {
      return NextResponse.json(
        {
          error: "County is required.",
        },
        { status: 400 },
      );
    }

    if (subCountyId === null) {
      return NextResponse.json(
        {
          error: "Sub-county is required.",
        },
        { status: 400 },
      );
    }

    if (constituencyId === null) {
      return NextResponse.json(
        {
          error: "Constituency is required.",
        },
        { status: 400 },
      );
    }

    if (wardId === null) {
      return NextResponse.json(
        {
          error: "Ward is required.",
        },
        { status: 400 },
      );
    }

    const acreage = parseOptionalFloat(
      body.acreage,
    );

    if (
      acreage !== null &&
      acreage <= 0
    ) {
      return NextResponse.json(
        {
          error: "Acreage must be greater than zero.",
        },
        { status: 400 },
      );
    }

    const dateOfBirth = parseOptionalDate(
      body.dateOfBirth,
    );

    if (
      body.dateOfBirth !== null &&
      body.dateOfBirth !== undefined &&
      body.dateOfBirth !== "" &&
      dateOfBirth === null
    ) {
      return NextResponse.json(
        {
          error: "Invalid date of birth.",
        },
        { status: 400 },
      );
    }

    const genderId = parseOptionalInteger(
      body.genderId,
    );

    const educationLevelId =
      parseOptionalInteger(
        body.educationLevelId,
      );

    const occupationId = parseOptionalInteger(
      body.occupationId,
    );

    const maritalStatusId =
      parseOptionalInteger(
        body.maritalStatusId,
      );

    const farmerTypeId =
      parseOptionalInteger(
        body.farmerTypeId,
      );

    const farmingActivityId =
      parseOptionalInteger(
        body.farmingActivityId,
      );

    const preferredLanguageId =
      parseOptionalInteger(
        body.preferredLanguageId,
      );

    const communicationPreferenceId =
      parseOptionalInteger(
        body.communicationPreferenceId,
      );

    const digitalLiteracyLevelId =
      parseOptionalInteger(
        body.digitalLiteracyLevelId,
      );

    const farmingExperience =
      parseOptionalInteger(
        body.farmingExperience,
      );

    const householdSize =
      parseOptionalInteger(
        body.householdSize,
      );

    const numberOfDependents =
      parseOptionalInteger(
        body.numberOfDependents,
      );

    const numberOfFarmWorkers =
      parseOptionalInteger(
        body.numberOfFarmWorkers,
      );

    if (
      farmingExperience !== null &&
      farmingExperience < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Farming experience cannot be negative.",
        },
        { status: 400 },
      );
    }

    if (
      householdSize !== null &&
      householdSize < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Household size cannot be negative.",
        },
        { status: 400 },
      );
    }

    if (
      numberOfDependents !== null &&
      numberOfDependents < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Number of dependents cannot be negative.",
        },
        { status: 400 },
      );
    }

    if (
      numberOfFarmWorkers !== null &&
      numberOfFarmWorkers < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Number of farm workers cannot be negative.",
        },
        { status: 400 },
      );
    }

    if (
      householdSize !== null &&
      numberOfDependents !== null &&
      numberOfDependents > householdSize
    ) {
      return NextResponse.json(
        {
          error:
            "Number of dependents cannot exceed household size.",
        },
        { status: 400 },
      );
    }

    const hasLoan =
      parseOptionalBoolean(
        body.hasLoan,
      );

    const hasDefaultedLoan =
      parseOptionalBoolean(
        body.hasDefaultedLoan,
      );

    const receivesInputSubsidy =
      parseOptionalBoolean(
        body.receivesInputSubsidy,
      );

    const receivesCredit =
      parseOptionalBoolean(
        body.receivesCredit,
      );

    if (
      body.hasLoan !== null &&
      body.hasLoan !== undefined &&
      body.hasLoan !== "" &&
      hasLoan === null
    ) {
      return NextResponse.json(
        {
          error: "Invalid hasLoan value.",
        },
        { status: 400 },
      );
    }

    if (
      body.hasDefaultedLoan !== null &&
      body.hasDefaultedLoan !== undefined &&
      body.hasDefaultedLoan !== "" &&
      hasDefaultedLoan === null
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid hasDefaultedLoan value.",
        },
        { status: 400 },
      );
    }

    if (
      body.receivesInputSubsidy !== null &&
      body.receivesInputSubsidy !== undefined &&
      body.receivesInputSubsidy !== "" &&
      receivesInputSubsidy === null
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid receivesInputSubsidy value.",
        },
        { status: 400 },
      );
    }

    if (
      body.receivesCredit !== null &&
      body.receivesCredit !== undefined &&
      body.receivesCredit !== "" &&
      receivesCredit === null
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid receivesCredit value.",
        },
        { status: 400 },
      );
    }

    const lookupValidationResults =
      await Promise.all([
        validateLookupId(
          genderId,
          "Gender",
          () =>
            prisma.gender.findUnique({
              where: {
                id: genderId as number,
              },
            }),
        ),

        validateLookupId(
          educationLevelId,
          "Education level",
          () =>
            prisma.educationLevel.findUnique({
              where: {
                id: educationLevelId as number,
              },
            }),
        ),

        validateLookupId(
          occupationId,
          "Occupation",
          () =>
            prisma.occupation.findUnique({
              where: {
                id: occupationId as number,
              },
            }),
        ),

        validateLookupId(
          maritalStatusId,
          "Marital status",
          () =>
            prisma.maritalStatus.findUnique({
              where: {
                id: maritalStatusId as number,
              },
            }),
        ),

        validateLookupId(
          farmerTypeId,
          "Farmer type",
          () =>
            prisma.farmerType.findUnique({
              where: {
                id: farmerTypeId as number,
              },
            }),
        ),

        validateLookupId(
          farmingActivityId,
          "Farming activity",
          () =>
            prisma.farmingActivity.findUnique({
              where: {
                id: farmingActivityId as number,
              },
            }),
        ),

        validateLookupId(
          preferredLanguageId,
          "Preferred language",
          () =>
            prisma.language.findUnique({
              where: {
                id: preferredLanguageId as number,
              },
            }),
        ),

        validateLookupId(
          communicationPreferenceId,
          "Communication preference",
          () =>
            prisma.communicationPreference.findUnique({
              where: {
                id: communicationPreferenceId as number,
              },
            }),
        ),

        validateLookupId(
          digitalLiteracyLevelId,
          "Digital literacy level",
          () =>
            prisma.digitalLiteracyLevel.findUnique({
              where: {
                id: digitalLiteracyLevelId as number,
              },
            }),
        ),
      ]);

    const firstLookupError =
      lookupValidationResults.find(
        (result) => result !== null,
      );

    if (firstLookupError) {
      return firstLookupError;
    }

    const country =
      await prisma.country.findUnique({
        where: {
          id: countryId,
        },
      });

    if (!country) {
      return NextResponse.json(
        {
          error: "Country not found.",
        },
        { status: 400 },
      );
    }

    const county =
      await prisma.county.findUnique({
        where: {
          id: countyId,
        },
      });

    if (!county) {
      return NextResponse.json(
        {
          error: "County not found.",
        },
        { status: 400 },
      );
    }

    if (
      county.countryId !== countryId
    ) {
      return NextResponse.json(
        {
          error:
            "County does not belong to the selected country.",
        },
        { status: 400 },
      );
    }

    const subCounty =
      await prisma.subCounty.findUnique({
        where: {
          id: subCountyId,
        },
      });

    if (!subCounty) {
      return NextResponse.json(
        {
          error: "Sub-county not found.",
        },
        { status: 400 },
      );
    }

    if (
      subCounty.countyId !== countyId
    ) {
      return NextResponse.json(
        {
          error:
            "Sub-county does not belong to the selected county.",
        },
        { status: 400 },
      );
    }

    const constituency =
      await prisma.constituency.findUnique({
        where: {
          id: constituencyId,
        },
      });

    if (!constituency) {
      return NextResponse.json(
        {
          error: "Constituency not found.",
        },
        { status: 400 },
      );
    }

    if (
      constituency.countyId !== countyId
    ) {
      return NextResponse.json(
        {
          error:
            "Constituency does not belong to the selected county.",
        },
        { status: 400 },
      );
    }

    const ward =
      await prisma.ward.findUnique({
        where: {
          id: wardId,
        },
      });

    if (!ward) {
      return NextResponse.json(
        {
          error: "Ward not found.",
        },
        { status: 400 },
      );
    }

    if (
      ward.countyId !== countyId
    ) {
      return NextResponse.json(
        {
          error:
            "Ward does not belong to the selected county.",
        },
        { status: 400 },
      );
    }

    if (
      ward.subCountyId !== subCountyId
    ) {
      return NextResponse.json(
        {
          error:
            "Ward does not belong to the selected sub-county.",
        },
        { status: 400 },
      );
    }

    if (
      ward.constituencyId !== constituencyId
    ) {
      return NextResponse.json(
        {
          error:
            "Ward does not belong to the selected constituency.",
        },
        { status: 400 },
      );
    }

    if (villageId !== null) {
      const village =
        await prisma.village.findUnique({
          where: {
            id: villageId,
          },
        });

      if (!village) {
        return NextResponse.json(
          {
            error: "Village not found.",
          },
          { status: 400 },
        );
      }

      if (
        village.wardId !== wardId
      ) {
        return NextResponse.json(
          {
            error:
              "Village does not belong to the selected ward.",
          },
          { status: 400 },
        );
      }
    }

    const existingFarmer =
      await prisma.farmer.findUnique({
        where: {
          phone: normalizedPhone,
        },
      });

    if (
      existingFarmer &&
      existingFarmer.userId !== dbUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "A farmer with this phone number already exists.",
        },
        { status: 409 },
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: dbUser.id,
            },
            data: {
              firstName,
              lastName,
              phoneNumber: normalizedPhone,
            },
          });

          let farmer;

          if (dbUser.farmer) {
            farmer =
              await tx.farmer.update({
                where: {
                  id: dbUser.farmer.id,
                },
                data: {
                  phone: normalizedPhone,
                  dateOfBirth,
                  farmingExperience,
                  genderId,
                  educationLevelId,
                  occupationId,
                  maritalStatusId,
                  farmerTypeId,
                  farmingActivityId,
                  preferredLanguageId,
                  communicationPreferenceId,
                  digitalLiteracyLevelId,
                  hasLoan,
                  hasDefaultedLoan,
                  receivesInputSubsidy,
                  receivesCredit,
                  householdSize,
                  numberOfDependents,
                  numberOfFarmWorkers,
                  countyId,
                  subCountyId,
                  wardId,
                  villageId,
                },
              });
          } else {
            farmer =
              await tx.farmer.create({
                data: {
                  user: {
                    connect: {
                      id: dbUser.id,
                    },
                  },
                  phone: normalizedPhone,
                  dateOfBirth,
                  farmingExperience,
                  genderId,
                  educationLevelId,
                  occupationId,
                  maritalStatusId,
                  farmerTypeId,
                  farmingActivityId,
                  preferredLanguageId,
                  communicationPreferenceId,
                  digitalLiteracyLevelId,
                  hasLoan,
                  hasDefaultedLoan,
                  receivesInputSubsidy,
                  receivesCredit,
                  householdSize,
                  numberOfDependents,
                  numberOfFarmWorkers,
                  countyId,
                  subCountyId,
                  wardId,
                  villageId,
                },
              });
          }

          const existingFarm =
            await tx.farm.findFirst({
              where: {
                farmerId: farmer.id,
              },
              orderBy: {
                id: "asc",
              },
            });

          let farm;

          if (existingFarm) {
            farm =
              await tx.farm.update({
                where: {
                  id: existingFarm.id,
                },
                data: {
                  farmName,
                  ...(acreage !== null
                    ? {
                        acreage,
                      }
                    : {}),
                  countryId,
                  countyId,
                  subCountyId,
                  wardId,
                  villageId,
                },
              });
          } else {
            farm =
              await tx.farm.create({
                data: {
                  farmerId: farmer.id,
                  farmName,
                  acreage:
                    acreage ?? 0,
                  countryId,
                  countyId,
                  subCountyId,
                  wardId,
                  villageId,
                },
              });
          }

          return {
            farmer,
            farm,
          };
        },
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Farmer registration completed successfully.",
        farmer: result.farmer,
        farm: result.farm,
        phone: normalizedPhone,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      "POST /api/farmers error:",
      error,
    );

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      const prismaError =
        error as {
          code?: string;
        };

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "A record with one of these unique values already exists.",
          },
          { status: 409 },
        );
      }

      if (prismaError.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "One or more selected references are invalid.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to register farmer.",
      },
      { status: 500 },
    );
  }
}