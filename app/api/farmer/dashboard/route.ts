import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    /*
     * AUTHENTICATION BOUNDARY
     *
     * The Firebase session is resolved exclusively on the server.
     * No request body, query parameter, route parameter, or client-
     * supplied user identifier participates in authentication.
     */
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * IDENTITY PROVENANCE
     *
     * getCurrentUser() derives the application identity from the
     * verified Firebase session cookie.
     *
     * Firebase UID
     *      ↓
     * PostgreSQL User.firebaseUid
     */
    const firebaseUid =
      typeof currentUser.id === "string"
        ? currentUser.id.trim()
        : typeof (
              currentUser as {
                uid?: unknown;
              }
            ).uid === "string"
          ? (
              currentUser as {
                uid: string;
              }
            ).uid.trim()
          : null;

    if (
      !firebaseUid ||
      firebaseUid.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authenticated user does not have a valid Firebase UID.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * DATABASE IDENTITY BOUNDARY
     *
     * Firebase UID
     *      ↓
     * User.firebaseUid
     *      ↓
     * User.id
     *      ↓
     * Farmer.userId
     *
     * User.id is the internal PostgreSQL ownership principal.
     */
    const user = await prisma.user.findUnique({
      where: {
        firebaseUid,
      },
      include: {
        role: true,
        farmer: {
          include: {
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
              orderBy: {
                createdAt: "asc",
              },
              include: {
                soilType: true,
                waterSource: true,
                country: true,
                county: true,
                subCounty: true,
                ward: true,
                village: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account is not synchronized with the application database.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * ACTIVE-ACCOUNT INVARIANT
     *
     * Firebase authentication alone does not grant application
     * access. The corresponding PostgreSQL account must remain
     * active.
     */
    if (!user.active) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User account is inactive.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * SELF-SERVICE ROLE BOUNDARY
     *
     * This dashboard is deliberately a self-service resource.
     *
     * It does NOT use OfficerAssignment because the intended
     * authorization model is:
     *
     * Firebase UID
     *      ↓
     * User.id
     *      ↓
     * Farmer.userId
     *      ↓
     * Own farmer dashboard
     */
    const roleName = user.role?.name;

    const allowedSelfServiceRoles = new Set([
      "Farmer",
      "Lead Farmer",
    ]);

    if (
      !roleName ||
      !allowedSelfServiceRoles.has(roleName)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * RESOURCE OWNERSHIP INVARIANT
     *
     * Because the farmer is loaded through the authenticated
     * PostgreSQL User relation, the dashboard cannot select an
     * arbitrary farmer by client-supplied ID.
     *
     * The effective ownership relationship is:
     *
     * user.id === farmer.userId
     */
    if (!user.farmer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your farmer profile has not been registered yet.",
        },
        {
          status: 404,
        },
      );
    }

    const farmer = user.farmer;

    /*
     * DATA ACCESS OCCURS ONLY AFTER:
     *
     * 1. Firebase session authentication
     * 2. Firebase UID validation
     * 3. PostgreSQL User resolution
     * 4. PostgreSQL active-account validation
     * 5. Self-service role validation
     * 6. Farmer relationship resolution from authenticated User
     *
     * No client-controlled identity is used in this response.
     */
    return NextResponse.json(
      {
        success: true,
        farmer: {
          id: farmer.id,

          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
          },

          profile: {
            phone: farmer.phone,
            nationalId: farmer.nationalId,
            dateOfBirth: farmer.dateOfBirth,
            farmingExperience:
              farmer.farmingExperience,
            gender: farmer.gender,
            educationLevel:
              farmer.educationLevel,
            occupation: farmer.occupation,
            maritalStatus:
              farmer.maritalStatus,
            farmerType: farmer.farmerType,
            farmingActivity:
              farmer.farmingActivity,
            preferredLanguage:
              farmer.preferredLanguage,
            communicationPreference:
              farmer.communicationPreference,
            digitalLiteracyLevel:
              farmer.digitalLiteracyLevel,
            householdSize:
              farmer.householdSize,
            numberOfDependents:
              farmer.numberOfDependents,
            numberOfFarmWorkers:
              farmer.numberOfFarmWorkers,
            hasLoan: farmer.hasLoan,
            hasDefaultedLoan:
              farmer.hasDefaultedLoan,
            receivesInputSubsidy:
              farmer.receivesInputSubsidy,
            receivesCredit:
              farmer.receivesCredit,
          },

          location: {
            county: farmer.county,
            subCounty: farmer.subCounty,
            ward: farmer.ward,
            village: farmer.village,
          },

          farms: farmer.farms,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/farmer/dashboard error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load farmer dashboard.",
      },
      {
        status: 500,
      },
    );
  }
}