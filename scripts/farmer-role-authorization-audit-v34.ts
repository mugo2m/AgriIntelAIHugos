import { prisma } from "../lib/prisma";

type RoleRow = {
  id: number;
  name: string;
  description: string | null;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  active: boolean;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
};

type RolePermissionScalarRow = {
  roleId: number;
  permissionId: string;
};

type PermissionRow = {
  id: string;
  name: string;
  module: string;
  description: string | null;
};

function section(title: string) {
  console.log("");
  console.log("======================================================================");
  console.log(title);
  console.log("======================================================================");
}

function pass(message: string) {
  console.log(`[PASS] ${message}`);
}

function review(message: string) {
  console.log(`[REVIEW] ${message}`);
}

function missing(message: string) {
  console.log(`[MISSING] ${message}`);
}

function printRole(role: RoleRow) {
  console.log(
    `ID=${role.id} | name="${role.name}" | description=${role.description ?? "null"}`
  );
}

async function main() {
  console.log("");
  console.log("======================================================================");
  console.log("V34 FARMER ROLE & AUTHORIZATION CONTRACT AUDIT");
  console.log("======================================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");

  try {
    // ------------------------------------------------------------------
    // 1. ROLE TABLE
    // ------------------------------------------------------------------

    section("1. ROLE TABLE");

    const roles: RoleRow[] = await prisma.role.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    console.log(`Role count: ${roles.length}`);

    if (roles.length > 0) {
      pass("Role table contains configured roles.");

      for (const role of roles) {
        printRole(role);
      }
    } else {
      missing("Role table contains no roles.");
    }

    // ------------------------------------------------------------------
    // 2. ROLE NAME ANALYSIS
    // ------------------------------------------------------------------

    section("2. ROLE NAME ANALYSIS");

    const expectedConcepts = [
      "ADMIN",
      "ADMINISTRATOR",
      "SUPER_ADMIN",
      "EXTENSION_OFFICER",
      "AGRICULTURAL_OFFICER",
      "FARMER",
      "STAFF",
      "MANAGER",
      "VIEWER",
    ];

    let matchedConcepts = 0;

    for (const concept of expectedConcepts) {
      const matches = roles.filter((role) =>
        role.name.toUpperCase().includes(concept)
      );

      if (matches.length > 0) {
        console.log(
          `[FOUND] ${concept}: ${matches
            .map((role) => role.name)
            .join(", ")}`
        );

        matchedConcepts++;
      }
    }

    if (matchedConcepts === 0) {
      review(
        "No conventional Farmer/admin/extension role names were detected. Authorization must use the actual configured role names."
      );
    } else {
      pass(
        `${matchedConcepts} conventional authorization role concepts were detected.`
      );
    }

    // ------------------------------------------------------------------
    // 3. USER TABLE
    // ------------------------------------------------------------------

    section("3. USER TABLE / CURRENT DATABASE USERS");

    const users: UserRow[] = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        active: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    console.log(`User count: ${users.length}`);

    if (users.length === 0) {
      review("No database users currently exist.");
    } else {
      pass("Database users have role relationships.");

      for (const user of users) {
        console.log(
          `User ID=${user.id} | name="${user.name}" | email="${user.email}" | active=${user.active} | roleId=${user.roleId} | role="${user.role.name}"`
        );
      }
    }

    // ------------------------------------------------------------------
    // 4. CURRENT USER ROLE
    // ------------------------------------------------------------------

    section("4. CURRENT DATABASE USER ROLE");

    const currentUser = users.length > 0 ? users[0] : null;

    if (!currentUser) {
      review("No current database user is available for role analysis.");
    } else {
      console.log(`Current test user ID : ${currentUser.id}`);
      console.log(`Current test user    : ${currentUser.name}`);
      console.log(`Current test role ID : ${currentUser.roleId}`);
      console.log(`Current test role    : ${currentUser.role.name}`);

      if (currentUser.active) {
        pass("Current database user is active.");
      } else {
        review("Current database user is inactive.");
      }

      if (currentUser.role) {
        pass("Current database user has a valid Role relation.");
      } else {
        missing("Current database user has no Role relation.");
      }
    }

    // ------------------------------------------------------------------
    // 5. ROLE-PERMISSION STRUCTURE
    // ------------------------------------------------------------------

    section("5. ROLE-PERMISSION STRUCTURE");

    /*
     * IMPORTANT:
     *
     * The generated Prisma client exposes:
     *
     *     prisma.role_permissions
     *
     * but its generated relation names do not match the conventional
     * lowercase Prisma names used elsewhere in this schema.
     *
     * Instead of guessing relation names, retrieve the RolePermission
     * scalar rows first and resolve Role/Permission records separately.
     *
     * This makes the audit robust against generated relation-name changes.
     */

    const rolePermissionScalars: RolePermissionScalarRow[] =
      await prisma.role_permissions.findMany({
        orderBy: [
          {
            roleId: "asc",
          },
          {
            permissionId: "asc",
          },
        ],
        select: {
          roleId: true,
          permissionId: true,
        },
      });

    console.log(
      `RolePermission count: ${rolePermissionScalars.length}`
    );

    if (rolePermissionScalars.length > 0) {
      pass("RBAC role-permission relationships exist.");
    } else {
      review(
        "No RolePermission records exist. Authorization may currently depend only on role names."
      );
    }

    // ------------------------------------------------------------------
    // 5A. RESOLVE ROLE RECORDS
    // ------------------------------------------------------------------

    const roleIds = [
      ...new Set(rolePermissionScalars.map((row) => row.roleId)),
    ];

    const permissionIds = [
      ...new Set(
        rolePermissionScalars.map((row) => row.permissionId)
      ),
    ];

    const referencedRoles =
      roleIds.length > 0
        ? await prisma.role.findMany({
            where: {
              id: {
                in: roleIds,
              },
            },
            select: {
              id: true,
              name: true,
              description: true,
            },
          })
        : [];

    // ------------------------------------------------------------------
    // 5B. RESOLVE PERMISSION RECORDS
    // ------------------------------------------------------------------

    /*
     * Permission IDs are strings. The Permission model itself is queried
     * directly, avoiding any dependency on the generated relation name
     * inside role_permissions.
     */

    const referencedPermissions: PermissionRow[] =
      permissionIds.length > 0
        ? await prisma.permissions.findMany({
            where: {
              id: {
                in: permissionIds,
              },
            },
            select: {
              id: true,
              name: true,
              module: true,
              description: true,
            },
          })
        : [];

    const roleById = new Map<number, RoleRow>();

    for (const role of referencedRoles) {
      roleById.set(role.id, role);
    }

    const permissionById = new Map<string, PermissionRow>();

    for (const permission of referencedPermissions) {
      permissionById.set(permission.id, permission);
    }

    // ------------------------------------------------------------------
    // 5C. PRINT RESOLVED ROLE-PERMISSION RELATIONSHIPS
    // ------------------------------------------------------------------

    if (rolePermissionScalars.length > 0) {
      for (const rp of rolePermissionScalars) {
        const role = roleById.get(rp.roleId);
        const permission = permissionById.get(rp.permissionId);

        console.log(
          `Role="${role?.name ?? `UNKNOWN_ROLE_${rp.roleId}`}" | Permission="${permission?.name ?? `UNKNOWN_PERMISSION_${rp.permissionId}`}" | Module="${permission?.module ?? "unknown"}"`
        );
      }
    }

    // ------------------------------------------------------------------
    // 6. FARMER-RELATED PERMISSIONS
    // ------------------------------------------------------------------

    section("6. FARMER-RELATED PERMISSIONS");

    const farmerPermissionMatches = rolePermissionScalars.filter(
      (rp) => {
        const permission = permissionById.get(rp.permissionId);

        if (!permission) {
          return false;
        }

        const text = [
          permission.name,
          permission.module,
          permission.description ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          text.includes("farmer") ||
          text.includes("farm") ||
          text.includes("agriculture") ||
          text.includes("extension")
        );
      }
    );

    if (farmerPermissionMatches.length > 0) {
      pass(
        `${farmerPermissionMatches.length} Farmer/agriculture-related permission relationships found.`
      );

      for (const rp of farmerPermissionMatches) {
        const role = roleById.get(rp.roleId);
        const permission = permissionById.get(rp.permissionId);

        console.log(
          `Role="${role?.name ?? `UNKNOWN_ROLE_${rp.roleId}`}" | Permission="${permission?.name ?? `UNKNOWN_PERMISSION_${rp.permissionId}`}" | Module="${permission?.module ?? "unknown"}" | Description="${permission?.description ?? "null"}"`
        );
      }
    } else {
      review(
        "No explicitly Farmer/agriculture-related permissions were detected."
      );
    }

    // ------------------------------------------------------------------
    // 7. COLLECTION ACCESS CANDIDATES
    // ------------------------------------------------------------------

    section("7. POTENTIAL FARMER COLLECTION ACCESS ROLES");

    const collectionCandidates = roles.filter((role) => {
      const name = role.name.toUpperCase();

      return (
        name.includes("ADMIN") ||
        name.includes("EXTENSION") ||
        name.includes("AGRICULT") ||
        name.includes("MANAGER") ||
        name === "STAFF"
      );
    });

    if (collectionCandidates.length > 0) {
      pass("Potential Farmer collection-access roles were identified.");

      for (const role of collectionCandidates) {
        printRole(role);
      }
    } else {
      review(
        "No obvious Farmer collection-access role was identified from role names."
      );
    }

    // ------------------------------------------------------------------
    // 8. FARMER ROLE CANDIDATES
    // ------------------------------------------------------------------

    section("8. POTENTIAL FARMER SELF-SERVICE ROLES");

    const farmerRoles = roles.filter((role) => {
      const name = role.name.toUpperCase();

      return name.includes("FARMER");
    });

    if (farmerRoles.length > 0) {
      pass("Farmer-specific role(s) exist.");

      for (const role of farmerRoles) {
        printRole(role);
      }
    } else {
      review(
        "No role explicitly named Farmer was detected. Self-service authorization may use another role."
      );
    }

    // ------------------------------------------------------------------
    // 9. FARMER OWNERSHIP / USER RELATIONSHIP
    // ------------------------------------------------------------------

    section("9. FARMER OWNERSHIP / USER RELATIONSHIP");

    const farmers = await prisma.farmer.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        userId: true,
        phone: true,
        countyId: true,
        subCountyId: true,
        wardId: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roleId: true,

            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`Farmer count: ${farmers.length}`);

    if (farmers.length > 0) {
      pass("Farmer records have User ownership relationships.");

      for (const farmer of farmers) {
        console.log(
          `Farmer ID=${farmer.id} | userId=${farmer.userId} | user="${farmer.user.name}" | role="${farmer.user.role.name}" | countyId=${farmer.countyId} | subCountyId=${farmer.subCountyId} | wardId=${farmer.wardId}`
        );
      }
    } else {
      review("No Farmer records currently exist.");
    }

    // ------------------------------------------------------------------
    // 10. SQL AUTHORIZATION MODEL
    // ------------------------------------------------------------------

    section("10. SQL AUTHORIZATION MODEL");

    console.log(`
CURRENT GET /api/farmers CONCEPTUALLY:

SELECT
    f.*,
    u.*,
    r.*,
    geography.*,
    farm.*
FROM "Farmer" f
JOIN "User" u
    ON u.id = f."userId"
JOIN "Role" r
    ON r.id = u."roleId"
LEFT JOIN ...
ORDER BY f."createdAt" DESC;


RECOMMENDED COLLECTION MODEL:

SELECT
    f.*,
    ...
FROM "Farmer" f
JOIN "User" u
    ON u.id = f."userId"
JOIN "Role" r
    ON r.id = u."roleId"
WHERE :currentUserRole IN (
    '<AUTHORIZED_ROLE_1>',
    '<AUTHORIZED_ROLE_2>'
)
ORDER BY f."createdAt" DESC;


RECOMMENDED SELF-SERVICE MODEL:

SELECT
    f.*,
    ...
FROM "Farmer" f
WHERE f."userId" = :currentUserId;


IMPORTANT:

The application should NOT use the farmer's submitted userId
to establish authorization.

The authenticated Firebase session establishes identity.

The database User.firebaseUid establishes the database user.

The User.role establishes authorization.

The Farmer.userId establishes ownership.
`);

    // ------------------------------------------------------------------
    // 11. ARCHITECTURAL CLASSIFICATION
    // ------------------------------------------------------------------

    section("11. ARCHITECTURAL CLASSIFICATION");

    let reviewCount = 0;

    if (roles.length === 0) {
      missing("No roles configured.");
      reviewCount++;
    }

    if (users.length === 0) {
      review("No users available to verify role assignment.");
      reviewCount++;
    }

    if (rolePermissionScalars.length === 0) {
      review(
        "RBAC permission records are absent; verify whether role-name authorization is the intended design."
      );
      reviewCount++;
    }

    if (collectionCandidates.length === 0) {
      review(
        "No obvious administrative/extension collection-access role exists."
      );
      reviewCount++;
    }

    if (farmerRoles.length === 0) {
      review(
        "No explicit Farmer role exists; determine the intended self-service role."
      );
      reviewCount++;
    }

    console.log("");
    console.log(`PASS    : ${roles.length > 0 ? 1 : 0}`);
    console.log(`REVIEW  : ${reviewCount}`);
    console.log(`MISSING : ${roles.length === 0 ? 1 : 0}`);

    // ------------------------------------------------------------------
    // 12. FINAL DECISION GUIDANCE
    // ------------------------------------------------------------------

    section("12. FINAL DECISION GUIDANCE");

    console.log(`
V34 does NOT modify the application.

The result should be used to select the actual authorization contract.

If an ADMIN / AGRICULTURAL / EXTENSION role exists:

    GET /api/farmers
        -> authenticated + authorized staff/admin collection endpoint

If a FARMER role exists:

    GET /api/farmers/me
        -> authenticated farmer self-service endpoint
        -> WHERE Farmer.userId = authenticated DB User.id

If role permissions exist for Farmer read access:

    Prefer permission-based authorization over hard-coded role names.

For example:

    farmer:read

or:

    farmers.read

The final implementation must use the actual role/permission names
found in this audit rather than invented names.
`);

    console.log("");
    console.log("======================================================================");
    console.log("V34 COMPLETE");
    console.log("======================================================================");
    console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  } catch (error) {
    console.error("");
    console.error("V34 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
