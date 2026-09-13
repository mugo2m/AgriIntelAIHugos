import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    /*
     * AUTHENTICATION BOUNDARY
     *
     * Firebase session identity is resolved server-side.
     * No client-supplied userId or farmerId participates in
     * determining the authenticated principal.
     */
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
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
     * getCurrentUser() ultimately derives the Firebase identity
     * from the verified Firebase session cookie.
     *
     * The resulting Firebase UID is then used only to resolve
     * the PostgreSQL User record.
     */
    const firebaseUid =
      typeof currentUser.id === "string"
        ? currentUser.id.trim()
        : typeof currentUser.uid === "string"
          ? currentUser.uid.trim()
          : null;

    if (
      !firebaseUid ||
      firebaseUid.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
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
     * PostgreSQL User.firebaseUid
     *      ↓
     * PostgreSQL User.id
     *
     * User.id becomes the internal authorization principal.
     */
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
            "Authenticated database user not found",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * ACTIVE-ACCOUNT INVARIANT
     *
     * A valid Firebase identity is not sufficient by itself.
     * The corresponding PostgreSQL account must also be active.
     */
    if (!dbUser.active) {
      return NextResponse.json(
        {
          error:
            "User account is inactive",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * SELF-SERVICE ROLE BOUNDARY
     *
     * This endpoint is intentionally NOT officer-assignment based.
     *
     * It serves the authenticated farmer's own profile:
     *
     * Firebase UID
     *      ↓
     * User.id
     *      ↓
     * Farmer.userId
     *
     * OfficerAssignment is therefore not required here.
     */
    const roleName = dbUser.role?.name;

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
          error: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * RESOURCE OWNERSHIP BOUNDARY
     *
     * CRITICAL:
     *
     * The farmer is resolved exclusively through the
     * authenticated PostgreSQL User.id.
     *
     * There is deliberately no:
     *
     *   farmerId from request
     *   userId from request
     *   Firebase UID from request
     *
     * Therefore the caller cannot substitute another farmer ID
     * to retrieve another farmer's profile.
     */
    const farmer = await prisma.farmer.findUnique({
      where: {
        userId: dbUser.id,
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

    if (!farmer) {
      return NextResponse.json(
        {
          error: "Farmer profile not found",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * DATA ACCESS OCCURS ONLY AFTER:
     *
     * 1. Firebase authentication
     * 2. Firebase UID validation
     * 3. PostgreSQL User resolution
     * 4. PostgreSQL active-account validation
     * 5. Self-service role validation
     * 6. Farmer ownership binding through User.id
     *
     * This preserves V41.02 invariants I1, I2, I3, I4,
     * I10 and I12 for the self-service boundary.
     */
    return NextResponse.json(
      farmer,
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/farmers/me error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch farmer profile",
      },
      {
        status: 500,
      },
    );
  }
}