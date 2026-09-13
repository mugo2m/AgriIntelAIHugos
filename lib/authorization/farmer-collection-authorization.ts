import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

export type FarmerCollectionAuthorizationScope =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

export type FarmerCollectionAuthorizationResult = {
  allowed: boolean;
  reason:
    | "ALLOWED"
    | "NO_ACTIVE_ASSIGNMENT"
    | "NO_VALID_SCOPE"
    | "INVALID_ASSIGNMENT";
  userId: number;
  scopes: FarmerCollectionAuthorizationScope[];
  assignmentIds: number[];
};

type AssignmentForCollectionAuthorization = {
  id: number;
  userId: number;
  active: boolean;
  scopeLevel: FarmerCollectionAuthorizationScope;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;

  role: {
    name: string;
  };

  function: {
    name: string;
    active: boolean;
  };

  country: {
    id: number;
  } | null;

  county: {
    id: number;
    countryId: number;
  } | null;

  subCounty: {
    id: number;
    countyId: number;
  } | null;

  ward: {
    id: number;
    countyId: number;
    subCountyId: number | null;
  } | null;
};

function hasValidScopeShape(
  assignment: AssignmentForCollectionAuthorization,
): boolean {
  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return (
        assignment.countryId !== null &&
        assignment.countyId === null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      );

    case "COUNTY":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId === null &&
        assignment.wardId === null
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId === null
      );

    case "WARD":
      return (
        assignment.countryId !== null &&
        assignment.countyId !== null &&
        assignment.subCountyId !== null &&
        assignment.wardId !== null
      );

    default:
      return false;
  }
}

function hasValidGeographyChain(
  assignment: AssignmentForCollectionAuthorization,
): boolean {
  if (!hasValidScopeShape(assignment)) {
    return false;
  }

  const countryId = assignment.countryId;
  const countyId = assignment.countyId;
  const subCountyId = assignment.subCountyId;
  const wardId = assignment.wardId;

  if (countryId === null) {
    return false;
  }

  if (assignment.scopeLevel === "NATIONAL") {
    return assignment.country?.id === countryId;
  }

  if (
    countyId === null ||
    assignment.county === null ||
    assignment.county.id !== countyId ||
    assignment.county.countryId !== countryId
  ) {
    return false;
  }

  if (assignment.scopeLevel === "COUNTY") {
    return true;
  }

  if (
    subCountyId === null ||
    assignment.subCounty === null ||
    assignment.subCounty.id !== subCountyId ||
    assignment.subCounty.countyId !== countyId
  ) {
    return false;
  }

  if (assignment.scopeLevel === "SUBCOUNTY") {
    return true;
  }

  if (
    wardId === null ||
    assignment.ward === null ||
    assignment.ward.id !== wardId ||
    assignment.ward.countyId !== countyId ||
    assignment.ward.subCountyId !== subCountyId
  ) {
    return false;
  }

  return assignment.scopeLevel === "WARD";
}

function buildScopeWhere(
  assignment: AssignmentForCollectionAuthorization,
): Prisma.FarmerWhereInput | null {
  if (!hasValidGeographyChain(assignment)) {
    return null;
  }

  const countryId = assignment.countryId;
  const countyId = assignment.countyId;
  const subCountyId = assignment.subCountyId;
  const wardId = assignment.wardId;

  if (countryId === null) {
    return null;
  }

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return {
        county: {
          countryId,
        },
      };

    case "COUNTY":
      if (countyId === null) {
        return null;
      }

      return {
        county: {
          id: countyId,
          countryId,
        },
      };

    case "SUBCOUNTY":
      if (countyId === null || subCountyId === null) {
        return null;
      }

      return {
        county: {
          id: countyId,
          countryId,
        },
        subCountyId,
      };

    case "WARD":
      if (
        countyId === null ||
        subCountyId === null ||
        wardId === null
      ) {
        return null;
      }

      return {
        county: {
          id: countyId,
          countryId,
        },
        subCountyId,
        wardId,
      };

    default:
      return null;
  }
}

async function getActiveAssignments(
  userId: number,
): Promise<AssignmentForCollectionAuthorization[]> {
  const assignments = await prisma.officerAssignment.findMany({
    where: {
      userId,
      active: true,
    },
    select: {
      id: true,
      userId: true,
      active: true,
      scopeLevel: true,
      countryId: true,
      countyId: true,
      subCountyId: true,
      wardId: true,

      role: {
        select: {
          name: true,
        },
      },

      function: {
        select: {
          name: true,
          active: true,
        },
      },

      country: {
        select: {
          id: true,
        },
      },

      county: {
        select: {
          id: true,
          countryId: true,
        },
      },

      subCounty: {
        select: {
          id: true,
          countyId: true,
        },
      },

      ward: {
        select: {
          id: true,
          countyId: true,
          subCountyId: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  return assignments as AssignmentForCollectionAuthorization[];
}

export async function getFarmerCollectionAuthorization(
  userId: number,
): Promise<FarmerCollectionAuthorizationResult> {
  const assignments = await getActiveAssignments(userId);

  if (assignments.length === 0) {
    return {
      allowed: false,
      reason: "NO_ACTIVE_ASSIGNMENT",
      userId,
      scopes: [],
      assignmentIds: [],
    };
  }

  const validAssignments = assignments.filter(
    (assignment) =>
      assignment.active &&
      assignment.function.active &&
      hasValidGeographyChain(assignment),
  );

  if (validAssignments.length === 0) {
    const hasInvalidAssignment = assignments.some(
      (assignment) =>
        assignment.active &&
        assignment.function.active &&
        !hasValidGeographyChain(assignment),
    );

    return {
      allowed: false,
      reason: hasInvalidAssignment
        ? "INVALID_ASSIGNMENT"
        : "NO_VALID_SCOPE",
      userId,
      scopes: [],
      assignmentIds: [],
    };
  }

  const scopes = Array.from(
    new Set(
      validAssignments.map(
        (assignment) => assignment.scopeLevel,
      ),
    ),
  );

  return {
    allowed: true,
    reason: "ALLOWED",
    userId,
    scopes,
    assignmentIds: validAssignments.map(
      (assignment) => assignment.id,
    ),
  };
}

export async function getAuthorizedFarmerWhere(
  userId: number,
): Promise<Prisma.FarmerWhereInput | null> {
  const assignments = await getActiveAssignments(userId);

  const validAssignments = assignments.filter(
    (assignment) =>
      assignment.active &&
      assignment.function.active &&
      hasValidGeographyChain(assignment),
  );

  const scopeWhere = validAssignments
    .map((assignment) => buildScopeWhere(assignment))
    .filter(
      (where): where is Prisma.FarmerWhereInput =>
        where !== null,
    );

  if (scopeWhere.length === 0) {
    return null;
  }

  return {
    OR: scopeWhere,
  };
}

export async function getAuthorizedFarmerWhereOrThrow(
  userId: number,
): Promise<Prisma.FarmerWhereInput> {
  const where = await getAuthorizedFarmerWhere(userId);

  if (!where) {
    throw new Error(
      `No valid farmer authorization scope exists for user ${userId}`,
    );
  }

  return where;
}

export async function canAccessFarmerCollection(
  userId: number,
): Promise<boolean> {
  const where = await getAuthorizedFarmerWhere(userId);

  return where !== null;
}