import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getAuthorizedFarmerWhere,
} from "@/lib/authorization/farmer-collection-authorization";
import prisma from "@/lib/prisma";

async function getAuthenticatedDbUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const firebaseUid =
    currentUser.id ??
    (currentUser as { uid?: string }).uid;

  if (
    typeof firebaseUid !== "string" ||
    firebaseUid.trim().length === 0
  ) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Authenticated user ID not found.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      firebaseUid: firebaseUid.trim(),
    },
    include: {
      farmer: true,
    },
  });

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "PostgreSQL user account not found.",
        },
        {
          status: 404,
        },
      ),
    };
  }

  if (!user.active) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "User account is inactive.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

function parseOptionalPositiveInt(
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

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

async function validateFarmGeography(
  countryId: number | null,
  countyId: number | null,
  subCountyId: number | null,
  wardId: number | null,
  villageId: number | null,
): Promise<NextResponse | null> {
  /*
   * Geography integrity invariant:
   *
   * country
   *   -> county
   *      -> subCounty
   *         -> ward
   *            -> village
   *
   * A lower-level geographic entity must never be accepted
   * without its required parent chain.
   *
   * This is deliberately separate from farmer authorization.
   * A farmer may legitimately have a farm whose location differs
   * from the farmer's own registered geographic location.
   */

  if (countyId !== null && countryId === null) {
    return NextResponse.json(
      {
        error:
          "Country is required when county is selected.",
      },
      {
        status: 400,
      },
    );
  }

  if (subCountyId !== null && countyId === null) {
    return NextResponse.json(
      {
        error:
          "County is required when sub-county is selected.",
      },
      {
        status: 400,
      },
    );
  }

  if (wardId !== null && subCountyId === null) {
    return NextResponse.json(
      {
        error:
          "Sub-county is required when ward is selected.",
      },
      {
        status: 400,
      },
    );
  }

  if (villageId !== null && wardId === null) {
    return NextResponse.json(
      {
        error:
          "Ward is required when village is selected.",
      },
      {
        status: 400,
      },
    );
  }

  if (countryId !== null) {
    const country =
      await prisma.country.findUnique({
        where: {
          id: countryId,
        },
        select: {
          id: true,
        },
      });

    if (!country) {
      return NextResponse.json(
        {
          error: "Country not found.",
        },
        {
          status: 400,
        },
      );
    }
  }

  if (countyId !== null) {
    const county =
      await prisma.county.findUnique({
        where: {
          id: countyId,
        },
        select: {
          id: true,
          countryId: true,
        },
      });

    if (!county) {
      return NextResponse.json(
        {
          error: "County not found.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      countryId === null ||
      county.countryId !== countryId
    ) {
      return NextResponse.json(
        {
          error:
            "County does not belong to the selected country.",
        },
        {
          status: 400,
        },
      );
    }
  }

  if (subCountyId !== null) {
    const subCounty =
      await prisma.subCounty.findUnique({
        where: {
          id: subCountyId,
        },
        select: {
          id: true,
          countyId: true,
        },
      });

    if (!subCounty) {
      return NextResponse.json(
        {
          error:
            "Sub-county not found.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      countyId === null ||
      subCounty.countyId !== countyId
    ) {
      return NextResponse.json(
        {
          error:
            "Sub-county does not belong to the selected county.",
        },
        {
          status: 400,
        },
      );
    }
  }

  if (wardId !== null) {
    const ward =
      await prisma.ward.findUnique({
        where: {
          id: wardId,
        },
        select: {
          id: true,
          countyId: true,
          subCountyId: true,
        },
      });

    if (!ward) {
      return NextResponse.json(
        {
          error: "Ward not found.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      countyId === null ||
      ward.countyId !== countyId
    ) {
      return NextResponse.json(
        {
          error:
            "Ward does not belong to the selected county.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      subCountyId === null ||
      ward.subCountyId !== subCountyId
    ) {
      return NextResponse.json(
        {
          error:
            "Ward does not belong to the selected sub-county.",
        },
        {
          status: 400,
        },
      );
    }
  }

  if (villageId !== null) {
    const village =
      await prisma.village.findUnique({
        where: {
          id: villageId,
        },
        select: {
          id: true,
          wardId: true,
        },
      });

    if (!village) {
      return NextResponse.json(
        {
          error: "Village not found.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      wardId === null ||
      village.wardId !== wardId
    ) {
      return NextResponse.json(
        {
          error:
            "Village does not belong to the selected ward.",
        },
        {
          status: 400,
        },
      );
    }
  }

  return null;
}

export async function GET() {
  try {
    const {
      user,
      response,
    } = await getAuthenticatedDbUser();

    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const authorizedFarmerWhere =
      await getAuthorizedFarmerWhere(
        user.id,
      );

    if (!authorizedFarmerWhere) {
      return NextResponse.json(
        {
          error:
            "Forbidden: no valid farmer authorization scope.",
        },
        {
          status: 403,
        },
      );
    }

    const farms =
      await prisma.farm.findMany({
        where: {
          farmer: authorizedFarmerWhere,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          country: true,
          county: true,
          subCounty: true,
          ward: true,
          village: true,
          soilType: true,
          waterSource: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        farms,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/farms error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch farms.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const {
      user,
      response,
    } = await getAuthenticatedDbUser();

    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Collection authorization is established before the target
     * farmer is selected.
     *
     * This prevents a client-supplied farmerId from becoming an
     * authorization principal.
     */
    const authorizedFarmerWhere =
      await getAuthorizedFarmerWhere(
        user.id,
      );

    if (!authorizedFarmerWhere) {
      return NextResponse.json(
        {
          error:
            "Forbidden: no valid farmer authorization scope.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const requestedFarmerId =
      body.farmerId == null ||
      body.farmerId === ""
        ? null
        : Number(body.farmerId);

    if (
      requestedFarmerId !== null &&
      (!Number.isInteger(
        requestedFarmerId,
      ) ||
        requestedFarmerId <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "farmerId must be a valid positive integer.",
        },
        {
          status: 400,
        },
      );
    }

    let targetFarmer;

    if (requestedFarmerId !== null) {
      /*
       * SECURITY INVARIANT:
       *
       * farmerId supplied by the client is only a resource
       * selector. It is never an authorization decision.
       *
       * The farmer must simultaneously:
       *   1. have the requested ID, and
       *   2. satisfy the authenticated user's authorized scope.
       */
      targetFarmer =
        await prisma.farmer.findFirst({
          where: {
            AND: [
              {
                id: requestedFarmerId,
              },
              authorizedFarmerWhere,
            ],
          },
          select: {
            id: true,
          },
        });

      if (!targetFarmer) {
        return NextResponse.json(
          {
            error:
              "Farmer is not within your authorized scope.",
          },
          {
            status: 403,
          },
        );
      }
    } else {
      /*
       * No farmerId supplied:
       *
       * bind the operation to the authenticated PostgreSQL
       * User.id, then still require that farmer to be inside
       * the active officer authorization scope.
       */
      targetFarmer =
        await prisma.farmer.findFirst({
          where: {
            AND: [
              {
                userId: user.id,
              },
              authorizedFarmerWhere,
            ],
          },
          select: {
            id: true,
          },
        });

      if (!targetFarmer) {
        return NextResponse.json(
          {
            error:
              "Farmer profile is not within your authorized scope.",
          },
          {
            status: 403,
          },
        );
      }
    }

    const farmName =
      typeof body.farmName === "string"
        ? body.farmName.trim()
        : "";

    if (!farmName) {
      return NextResponse.json(
        {
          error: "Farm name is required.",
        },
        {
          status: 400,
        },
      );
    }

    const acreage =
      Number(body.acreage);

    if (
      !Number.isFinite(acreage) ||
      acreage <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Acreage must be greater than zero.",
        },
        {
          status: 400,
        },
      );
    }

    const countryId =
      parseOptionalPositiveInt(
        body.countryId,
      );

    const countyId =
      parseOptionalPositiveInt(
        body.countyId,
      );

    const subCountyId =
      parseOptionalPositiveInt(
        body.subCountyId,
      );

    const wardId =
      parseOptionalPositiveInt(
        body.wardId,
      );

    const villageId =
      parseOptionalPositiveInt(
        body.villageId,
      );

    const soilTypeId =
      parseOptionalPositiveInt(
        body.soilTypeId,
      );

    const waterSourceId =
      parseOptionalPositiveInt(
        body.waterSourceId,
      );

    const latitude =
      body.latitude == null ||
      body.latitude === ""
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude == null ||
      body.longitude === ""
        ? null
        : Number(body.longitude);

    const ownershipType =
      typeof body.ownershipType === "string" &&
      body.ownershipType.trim()
        ? body.ownershipType.trim()
        : null;

    const suppliedIdFields = [
      ["countryId", body.countryId, countryId],
      ["countyId", body.countyId, countyId],
      [
        "subCountyId",
        body.subCountyId,
        subCountyId,
      ],
      ["wardId", body.wardId, wardId],
      [
        "villageId",
        body.villageId,
        villageId,
      ],
      [
        "soilTypeId",
        body.soilTypeId,
        soilTypeId,
      ],
      [
        "waterSourceId",
        body.waterSourceId,
        waterSourceId,
      ],
    ] as const;

    for (
      const [
        field,
        suppliedValue,
        parsedValue,
      ] of suppliedIdFields
    ) {
      if (
        suppliedValue !== null &&
        suppliedValue !== undefined &&
        suppliedValue !== "" &&
        parsedValue === null
      ) {
        return NextResponse.json(
          {
            error: `${field} must be a valid positive integer.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      latitude !== null &&
      (!Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)
    ) {
      return NextResponse.json(
        {
          error:
            "Latitude must be between -90 and 90.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      longitude !== null &&
      (!Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      return NextResponse.json(
        {
          error:
            "Longitude must be between -180 and 180.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Geography validation is intentionally independent from
     * farmer authorization.
     *
     * We do NOT assume:
     *
     * farmer geography === farm geography
     *
     * because a farmer can potentially own/manage a farm in a
     * different location.
     *
     * Instead, we enforce referential integrity of the farm's
     * submitted geography chain.
     */
    const geographyError =
      await validateFarmGeography(
        countryId,
        countyId,
        subCountyId,
        wardId,
        villageId,
      );

    if (geographyError) {
      return geographyError;
    }

    if (soilTypeId !== null) {
      const soilType =
        await prisma.soilType.findUnique({
          where: {
            id: soilTypeId,
          },
          select: {
            id: true,
          },
        });

      if (!soilType) {
        return NextResponse.json(
          {
            error:
              "Soil type not found.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (waterSourceId !== null) {
      const waterSource =
        await prisma.waterSource.findUnique(
          {
            where: {
              id: waterSourceId,
            },
            select: {
              id: true,
            },
          },
        );

      if (!waterSource) {
        return NextResponse.json(
          {
            error:
              "Water source not found.",
          },
          {
            status: 400,
          },
        );
      }
    }

    /*
     * FINAL MUTATION BOUNDARY
     *
     * The only farmer identifier reaching the mutation is the
     * server-selected targetFarmer.id.
     *
     * The client cannot replace it with another farmer after
     * authorization has succeeded.
     */
    const farm =
      await prisma.farm.create({
        data: {
          farmerId: targetFarmer.id,
          farmName,
          acreage,
          latitude,
          longitude,
          ownershipType,
          countryId,
          countyId,
          subCountyId,
          wardId,
          villageId,
          soilTypeId,
          waterSourceId,
        },
        include: {
          country: true,
          county: true,
          subCounty: true,
          ward: true,
          village: true,
          soilType: true,
          waterSource: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        farm,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/farms error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to create farm.",
      },
      {
        status: 500,
      },
    );
  }
}