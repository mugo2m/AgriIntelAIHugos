import prisma from "@/lib/prisma";

export type FarmerAuthorizationScope =
  | "NATIONAL"
  | "COUNTY"
  | "SUBCOUNTY"
  | "WARD";

export type FarmerAuthorizationReason =
  | "ALLOWED"
  | "NO_FARMER"
  | "NO_ACTIVE_ASSIGNMENT"
  | "NO_MATCHING_SCOPE"
  | "INVALID_ASSIGNMENT";

export type FarmerAuthorizationResult = {
  allowed: boolean;
  reason: FarmerAuthorizationReason;
  farmerId: number;
  userId: number;
  assignmentId: number | null;
  roleName: string | null;
  functionName: string | null;
  scopeLevel: FarmerAuthorizationScope | null;
};

type AssignmentForAuthorization = {
  id: number;
  userId: number;
  active: boolean;
  scopeLevel: FarmerAuthorizationScope;
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
};

type FarmerForAuthorization = {
  id: number;
  countyId: number;
  subCountyId: number;
  wardId: number;
  county: {
    countryId: number;
  };
};

function isValidScopeConfiguration(
  assignment: AssignmentForAuthorization,
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

function assignmentMatchesFarmer(
  assignment: AssignmentForAuthorization,
  farmer: FarmerForAuthorization,
): boolean {
  if (!assignment.active) {
    return false;
  }

  if (!assignment.function.active) {
    return false;
  }

  if (!isValidScopeConfiguration(assignment)) {
    return false;
  }

  const farmerCountryId = farmer.county.countryId;

  switch (assignment.scopeLevel) {
    case "NATIONAL":
      return assignment.countryId === farmerCountryId;

    case "COUNTY":
      return (
        assignment.countryId === farmerCountryId &&
        assignment.countyId === farmer.countyId
      );

    case "SUBCOUNTY":
      return (
        assignment.countryId === farmerCountryId &&
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId
      );

    case "WARD":
      return (
        assignment.countryId === farmerCountryId &&
        assignment.countyId === farmer.countyId &&
        assignment.subCountyId === farmer.subCountyId &&
        assignment.wardId === farmer.wardId
      );

    default:
      return false;
  }
}

export async function authorizeFarmerAccess(
  userId: number,
  farmerId: number,
): Promise<FarmerAuthorizationResult> {
  const baseResult = {
    farmerId,
    userId,
  };

  const farmer = (await prisma.farmer.findUnique({
    where: {
      id: farmerId,
    },
    select: {
      id: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      county: {
        select: {
          countryId: true,
        },
      },
    },
  })) as FarmerForAuthorization | null;

  if (!farmer) {
    return {
      ...baseResult,
      allowed: false,
      reason: "NO_FARMER",
      assignmentId: null,
      roleName: null,
      functionName: null,
      scopeLevel: null,
    };
  }

  const assignments =
    (await prisma.officerAssignment.findMany({
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
      },
      orderBy: {
        id: "asc",
      },
    })) as AssignmentForAuthorization[];

  if (assignments.length === 0) {
    return {
      ...baseResult,
      allowed: false,
      reason: "NO_ACTIVE_ASSIGNMENT",
      assignmentId: null,
      roleName: null,
      functionName: null,
      scopeLevel: null,
    };
  }

  for (const assignment of assignments) {
    if (!assignmentMatchesFarmer(assignment, farmer)) {
      continue;
    }

    return {
      ...baseResult,
      allowed: true,
      reason: "ALLOWED",
      assignmentId: assignment.id,
      roleName: assignment.role.name,
      functionName: assignment.function.name,
      scopeLevel: assignment.scopeLevel,
    };
  }

  const hasInvalidAssignment = assignments.some(
    (assignment) =>
      assignment.active &&
      assignment.function.active &&
      !isValidScopeConfiguration(assignment),
  );

  if (hasInvalidAssignment) {
    return {
      ...baseResult,
      allowed: false,
      reason: "INVALID_ASSIGNMENT",
      assignmentId: null,
      roleName: null,
      functionName: null,
      scopeLevel: null,
    };
  }

  return {
    ...baseResult,
    allowed: false,
    reason: "NO_MATCHING_SCOPE",
    assignmentId: null,
    roleName: null,
    functionName: null,
    scopeLevel: null,
  };
}

export async function getFarmerAuthorizationContext(
  userId: number,
): Promise<AssignmentForAuthorization[]> {
  const assignments =
    (await prisma.officerAssignment.findMany({
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
      },
      orderBy: {
        id: "asc",
      },
    })) as AssignmentForAuthorization[];

  return assignments.filter(
    (assignment) =>
      assignment.active &&
      assignment.function.active &&
      isValidScopeConfiguration(assignment),
  );
}

export async function canAccessFarmer(
  userId: number,
  farmerId: number,
): Promise<boolean> {
  const result = await authorizeFarmerAccess(userId, farmerId);

  return result.allowed;
}
