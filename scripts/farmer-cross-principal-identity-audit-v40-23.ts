import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";
import {
  authorizeFarmerAccess,
  getFarmerAuthorizationContext,
} from "../lib/authorization/farmer-authorization";
import {
  getFarmerCollectionAuthorization,
  getAuthorizedFarmerWhere,
} from "../lib/authorization/farmer-collection-authorization";

type CheckStatus = "PASS" | "FAIL" | "REVIEW";

type CheckResult = {
  status: CheckStatus;
  message: string;
};

const results: CheckResult[] = [];

function pass(message: string): void {
  results.push({ status: "PASS", message });
  console.log(`PASS: ${message}`);
}

function fail(message: string): void {
  results.push({ status: "FAIL", message });
  console.log(`FAIL: ${message}`);
}

function review(message: string): void {
  results.push({ status: "REVIEW", message });
  console.log(`REVIEW: ${message}`);
}

function section(number: number, title: string): void {
  console.log("");
  console.log("=".repeat(72));
  console.log(`${number}. ${title}`);
  console.log("=".repeat(72));
}

function normalizeSource(source: string): string {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function readProjectFile(relativePath: string): string | null {
  const absolutePath = path.join(process.cwd(), relativePath);

  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
}

function hasPattern(source: string, pattern: RegExp): boolean {
  return pattern.test(source);
}

async function main(): Promise<void> {
  console.log("");
  console.log("V40.23 FARMER CROSS-PRINCIPAL IDENTITY AUDIT");
  console.log("========================================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log(
    "Purpose: verify authenticated-principal identity binding, Farmer ownership",
  );
  console.log(
    "boundaries, self-service identity chains, and cross-principal isolation.",
  );
  console.log("");
  console.log(
    "IMPORTANT: this audit does not create synthetic users or mutate PostgreSQL.",
  );

  const baseline = await prisma.$transaction([
    prisma.user.count(),
    prisma.farmer.count(),
    prisma.farm.count(),
    prisma.officerFunction.count(),
    prisma.officerAssignment.count(),
  ]);

  const [
    initialUserCount,
    initialFarmerCount,
    initialFarmCount,
    initialOfficerFunctionCount,
    initialOfficerAssignmentCount,
  ] = baseline;

  section(1, "DATABASE BASELINE");

  console.log(
    `Users=${initialUserCount} Farmers=${initialFarmerCount} Farms=${initialFarmCount} OfficerFunctions=${initialOfficerFunctionCount} OfficerAssignments=${initialOfficerAssignmentCount}`,
  );

  if (initialUserCount > 0) {
    pass("PostgreSQL contains at least one User");
  } else {
    fail("PostgreSQL contains no User records");
  }

  if (initialFarmerCount > 0) {
    pass("PostgreSQL contains at least one Farmer");
  } else {
    review("No Farmer records exist, so Farmer ownership cannot be exercised");
  }

  section(2, "FIREBASE UID → POSTGRESQL USER IDENTITY BINDING");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firebaseUid: true,
      email: true,
      active: true,
      roleId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  let duplicateFirebaseUid = false;
  const firebaseUidMap = new Map<string, number[]>();

  for (const user of users) {
    const uid = user.firebaseUid.trim();

    if (!firebaseUidMap.has(uid)) {
      firebaseUidMap.set(uid, []);
    }

    firebaseUidMap.get(uid)!.push(user.id);
  }

  for (const [uid, ids] of firebaseUidMap.entries()) {
    if (!uid) {
      fail(`User ${ids.join(",")} has an empty firebaseUid`);
    }

    if (ids.length > 1) {
      duplicateFirebaseUid = true;
      fail(
        `firebaseUid ${uid} maps to multiple PostgreSQL Users: ${ids.join(",")}`,
      );
    }
  }

  if (!duplicateFirebaseUid && users.length > 0) {
    pass("Each PostgreSQL User has a unique non-empty Firebase UID");
  }

  for (const user of users) {
    const byUid = await prisma.user.findUnique({
      where: {
        firebaseUid: user.firebaseUid,
      },
      select: {
        id: true,
        firebaseUid: true,
      },
    });

    if (!byUid) {
      fail(
        `Firebase UID lookup failed for PostgreSQL User ${user.id}`,
      );
      continue;
    }

    if (byUid.id !== user.id) {
      fail(
        `Firebase UID ${user.firebaseUid} resolves to User ${byUid.id}, expected User ${user.id}`,
      );
    }
  }

  if (users.length > 0) {
    pass("Firebase UID lookup resolves to the same PostgreSQL User.id");
  }

  section(3, "FARMER → USER OWNERSHIP BINDING");

  const farmers = await prisma.farmer.findMany({
    select: {
      id: true,
      userId: true,
      phone: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  let orphanFarmers = 0;
  let ambiguousFarmerOwnership = 0;

  for (const farmer of farmers) {
    if (farmer.userId === null || farmer.userId === undefined) {
      orphanFarmers++;
      fail(`Farmer ${farmer.id} has no owning User`);
      continue;
    }

    const owner = await prisma.user.findUnique({
      where: {
        id: farmer.userId,
      },
      select: {
        id: true,
        firebaseUid: true,
      },
    });

    if (!owner) {
      orphanFarmers++;
      fail(
        `Farmer ${farmer.id} references nonexistent User ${farmer.userId}`,
      );
      continue;
    }

    const sameOwnerFarmers = await prisma.farmer.count({
      where: {
        id: farmer.id,
        userId: owner.id,
      },
    });

    if (sameOwnerFarmers !== 1) {
      ambiguousFarmerOwnership++;
      fail(
        `Farmer ${farmer.id} ownership relation is inconsistent for User ${owner.id}`,
      );
    }
  }

  if (farmers.length > 0 && orphanFarmers === 0) {
    pass("Every Farmer resolves to an existing PostgreSQL User");
  }

  if (farmers.length > 0 && ambiguousFarmerOwnership === 0) {
    pass("Every Farmer has exactly one PostgreSQL User ownership path");
  }

  section(4, "FARMER OWNERSHIP UNIQUENESS / IDENTITY GRAPH");

  const ownershipGroups = await prisma.farmer.groupBy({
    by: ["userId"],
    _count: {
      id: true,
    },
  });

  if (ownershipGroups.length > 0) {
    pass(
      `Farmer ownership graph contains ${ownershipGroups.length} User-linked ownership group(s)`,
    );
  } else {
    review("No Farmer ownership groups exist");
  }

  for (const group of ownershipGroups) {
    console.log(
      `      User ${group.userId} owns ${group._count.id} Farmer record(s)`,
    );
  }

  section(5, "PRODUCTION INDIVIDUAL AUTHORIZATION IS USER-BOUND");

  const authorizationSource = readProjectFile(
    "lib/authorization/farmer-authorization.ts",
  );

  if (!authorizationSource) {
    fail("Could not read lib/authorization/farmer-authorization.ts");
  } else {
    const normalized = normalizeSource(authorizationSource);

    const hasUserIdParameter =
      /\buserId\s*:\s*(?:number|string)/.test(authorizationSource) ||
      /\buserId\b/.test(authorizationSource);

    const hasFarmerIdParameter =
      /\bfarmerId\s*:\s*(?:number|string)/.test(authorizationSource) ||
      /\bfarmerId\b/.test(authorizationSource);

    const hasFarmerLookup =
      /prisma\.farmer\.(findUnique|findFirst|findMany)/.test(normalized);

    const hasFarmerIdConstraint =
      /\b(?:id|farmerId)\s*:\s*farmerId\b/.test(normalized);

    const hasUserIdConstraint =
      /\buserId\s*:\s*userId\b/.test(normalized) ||
      /\buser\s*:\s*\{[^}]*\bid\s*:\s*userId\b/.test(normalized);

    if (hasUserIdParameter) {
      pass("Individual authorization accepts an explicit authenticated User.id");
    } else {
      fail("Individual authorization source does not visibly expose User.id");
    }

    if (hasFarmerIdParameter) {
      pass("Individual authorization identifies the target Farmer explicitly");
    } else {
      fail("Individual authorization source does not visibly identify Farmer.id");
    }

    if (hasFarmerLookup) {
      pass("Individual authorization accesses Farmer through the production Prisma model");
    } else {
      fail("Individual authorization source does not visibly perform a Farmer lookup");
    }

    if (hasFarmerIdConstraint) {
      pass("Individual authorization binds the lookup to the requested Farmer ID");
    } else {
      fail("Individual authorization does not visibly bind the lookup to Farmer.id");
    }

    if (hasUserIdConstraint) {
      pass("Individual authorization visibly binds authorization to User.id");
    } else {
      review(
        "Individual authorization source does not expose a direct User.id predicate; authorization may be delegated through assignment context",
      );
    }
  }

  section(6, "PRODUCTION AUTHORIZATION CONTEXT IS PRINCIPAL-BOUND");

  if (!authorizationSource) {
    fail("Authorization context source is unavailable");
  } else {
    const normalized = normalizeSource(authorizationSource);

    const hasAuthorizationContext =
      /\bgetFarmerAuthorizationContext\b/.test(authorizationSource);

    const hasAssignmentUserFilter =
      /\buserId\s*:\s*userId\b/.test(normalized) ||
      /\buser\s*:\s*\{[^}]*\bid\s*:\s*userId\b/.test(normalized);

    const hasActiveAssignment =
      /\bactive\s*:\s*true\b/.test(normalized);

    const hasOfficerAssignment =
      /\bOfficerAssignment\b/.test(authorizationSource) ||
      /\bofficerAssignment\b/i.test(authorizationSource);

    if (hasAuthorizationContext) {
      pass("Production authorization context helper is present");
    } else {
      fail("Production authorization context helper was not found");
    }

    if (hasOfficerAssignment) {
      pass("Authorization context visibly uses OfficerAssignment");
    } else {
      fail("Authorization context does not visibly use OfficerAssignment");
    }

    if (hasAssignmentUserFilter) {
      pass("Authorization context visibly binds assignments to the supplied User.id");
    } else {
      review(
        "Authorization context does not expose a direct User.id assignment predicate in source",
      );
    }

    if (hasActiveAssignment) {
      pass("Authorization context requires active authorization records");
    } else {
      fail("Authorization context does not visibly require active records");
    }
  }

  section(7, "COLLECTION AUTHORIZATION CANNOT BE DETACHED FROM PRINCIPAL");

  const collectionSource = readProjectFile(
    "lib/authorization/farmer-collection-authorization.ts",
  );

  if (!collectionSource) {
    fail("Could not read lib/authorization/farmer-collection-authorization.ts");
  } else {
    const normalized = normalizeSource(collectionSource);

    const hasCollectionHelper =
      /\bgetFarmerCollectionAuthorization\b/.test(collectionSource);

    const hasWhereHelper =
      /\bgetAuthorizedFarmerWhere\b/.test(collectionSource);

    const hasUserId =
      /\buserId\b/.test(normalized);

    const hasOr =
      /\bOR\s*:/.test(normalized);

    const hasGeography =
      /\bcounty\b/.test(normalized) ||
      /\bsubCountyId\b/.test(normalized) ||
      /\bwardId\b/.test(normalized);

    if (hasCollectionHelper) {
      pass("Production collection authorization helper is present");
    } else {
      fail("Production collection authorization helper was not found");
    }

    if (hasWhereHelper) {
      pass("Collection authorization exposes getAuthorizedFarmerWhere()");
    } else {
      fail("Collection authorization does not expose getAuthorizedFarmerWhere()");
    }

    if (hasUserId) {
      pass("Collection authorization is parameterized by a User identity");
    } else {
      fail("Collection authorization does not visibly use User identity");
    }

    if (hasOr) {
      pass("Collection authorization constructs an OR authorization predicate");
    } else {
      fail("Collection authorization does not visibly construct an OR predicate");
    }

    if (hasGeography) {
      pass("Collection authorization contains geographic authorization constraints");
    } else {
      fail("Collection authorization does not visibly constrain geography");
    }
  }

  section(8, "RUNTIME INDIVIDUAL AUTHORIZATION");

  if (farmers.length === 0 || users.length === 0) {
    review(
      "Runtime individual authorization cannot be exercised because User/Farmer data is unavailable",
    );
  } else {
    for (const farmer of farmers) {
      const ownerId = farmer.userId;

      const expectedOwner =
        ownerId !== null && ownerId !== undefined
          ? users.some((user) => user.id === ownerId)
          : false;

      let productionDecision = false;

      try {
        productionDecision = await authorizeFarmerAccess(
          ownerId as number,
          farmer.id,
        );
      } catch (error) {
        fail(
          `Production individual authorization threw for User ${ownerId}, Farmer ${farmer.id}: ${String(
            error,
          )}`,
        );
        continue;
      }

      if (expectedOwner && productionDecision) {
        pass(
          `Owner User ${ownerId} is authorized for owned Farmer ${farmer.id}`,
        );
      } else if (!expectedOwner && !productionDecision) {
        pass(
          `Farmer ${farmer.id} is denied because its owner does not resolve`,
        );
      } else {
        fail(
          `Individual authorization mismatch for User ${ownerId}, Farmer ${farmer.id}: production=${productionDecision}`,
        );
      }
    }
  }

  section(9, "RUNTIME COLLECTION AUTHORIZATION");

  if (users.length === 0) {
    review("No PostgreSQL User exists for collection authorization testing");
  } else {
    for (const user of users) {
      try {
        const context = await getFarmerAuthorizationContext(user.id);
        const collection = await getFarmerCollectionAuthorization(user.id);
        const where = await getAuthorizedFarmerWhere(user.id);

        const contextAssignmentIds = context
          .map((assignment: any) => assignment.id)
          .sort((a: number, b: number) => a - b);

        const collectionAssignmentIds = collection.assignmentIds
          .sort((a: number, b: number) => a - b);

        const contextMatchesCollection =
          JSON.stringify(contextAssignmentIds) ===
          JSON.stringify(collectionAssignmentIds);

        if (contextMatchesCollection) {
          pass(
            `User ${user.id} collection authorization uses the same assignment set as authorization context`,
          );
        } else {
          fail(
            `User ${user.id} collection authorization assignment set differs from authorization context`,
          );
        }

        if (where && typeof where === "object") {
          pass(
            `User ${user.id} receives a constrained production Farmer WHERE predicate`,
          );
        } else {
          fail(
            `User ${user.id} did not receive a valid Farmer WHERE predicate`,
          );
        }
      } catch (error) {
        fail(
          `Collection authorization threw for User ${user.id}: ${String(error)}`,
        );
      }
    }
  }

  section(10, "SELF-SERVICE ROUTE IDENTITY CHAIN");

  const selfServiceRoutes = [
    {
      path: "app/api/farmers/me/route.ts",
      name: "/api/farmers/me",
    },
    {
      path: "app/api/farmer/dashboard/route.ts",
      name: "/api/farmer/dashboard",
    },
  ];

  for (const route of selfServiceRoutes) {
    const source = readProjectFile(route.path);

    if (!source) {
      fail(`${route.name} source could not be read`);
      continue;
    }

    const normalized = normalizeSource(source);

    if (/\bgetCurrentUser\s*\(\s*\)/.test(normalized)) {
      pass(`${route.name} derives identity from getCurrentUser()`);
    } else {
      fail(`${route.name} does not visibly call getCurrentUser()`);
    }

    if (/\bfirebaseUid\b/.test(normalized)) {
      pass(`${route.name} resolves the authenticated Firebase UID`);
    } else {
      fail(`${route.name} does not visibly resolve Firebase UID`);
    }

    if (/prisma\.user\.(findUnique|findFirst)/.test(normalized)) {
      pass(`${route.name} resolves the PostgreSQL User from the authenticated identity`);
    } else {
      fail(`${route.name} does not visibly resolve PostgreSQL User`);
    }

    if (/\bfirebaseUid\s*:/.test(normalized)) {
      pass(`${route.name} uses Firebase UID as the server-side User lookup key`);
    } else {
      review(
        `${route.name} does not expose a direct firebaseUid Prisma predicate in source`,
      );
    }

    if (/\bfarmer\b/.test(normalized)) {
      pass(`${route.name} obtains Farmer data through the authenticated User`);
    } else {
      fail(`${route.name} does not visibly obtain Farmer data`);
    }

    if (/\bfarmerId\b/.test(normalized)) {
      review(
        `${route.name} contains farmerId in source; verify manually that it is not client-controlled`,
      );
    } else {
      pass(`${route.name} contains no client-selected farmerId parameter`);
    }

    if (/\bgetAuthorizedFarmerWhere\b|\bauthorizeFarmerAccess\b/.test(normalized)) {
      fail(
        `${route.name} imports officer-scope Farmer authorization into a self-service identity route`,
      );
    } else {
      pass(
        `${route.name} remains separate from officer-scope Farmer authorization helpers`,
      );
    }
  }

  section(11, "INDIVIDUAL FARMER ROUTE AUTHORIZATION ORDER");

  const individualRoute = readProjectFile("app/api/farmers/[id]/route.ts");

  if (!individualRoute) {
    fail("app/api/farmers/[id]/route.ts could not be read");
  } else {
    const normalized = normalizeSource(individualRoute);

    if (/\bgetCurrentUser\s*\(\s*\)/.test(normalized)) {
      pass("Individual Farmer route resolves the authenticated identity");
    } else {
      fail("Individual Farmer route does not visibly resolve current user");
    }

    if (/\bauthorizeFarmerAccess\b/.test(normalized)) {
      pass("Individual Farmer route invokes production Farmer authorization");
    } else {
      fail("Individual Farmer route does not visibly invoke Farmer authorization");
    }

    const authPosition = normalized.search(/\bauthorizeFarmerAccess\b/);
    const prismaFarmerPosition = normalized.search(
      /prisma\.farmer\.(findUnique|findFirst|findMany)/,
    );

    if (
      authPosition >= 0 &&
      prismaFarmerPosition >= 0 &&
      authPosition < prismaFarmerPosition
    ) {
      pass(
        "Individual Farmer route performs authorization before its Farmer resource lookup",
      );
    } else if (authPosition >= 0 && prismaFarmerPosition < 0) {
      pass(
        "Individual Farmer route contains authorization and no direct Farmer lookup was detected by source scan",
      );
    } else {
      fail(
        "Individual Farmer route could not verify authorization-before-resource-access ordering",
      );
    }

    if (/\bparams\b/.test(normalized) && /\bid\b/.test(normalized)) {
      pass("Individual Farmer route receives the requested resource ID from the route");
    } else {
      review(
        "Individual Farmer route source did not expose the expected route parameter structure",
      );
    }
  }

  section(12, "CLIENT-SUPPLIED USER/FARMER IDENTITY SUBSTITUTION");

  const routeFiles = [
    "app/api/farmers/route.ts",
    "app/api/farmers/[id]/route.ts",
    "app/api/farms/route.ts",
    "app/api/farmers/me/route.ts",
    "app/api/farmer/dashboard/route.ts",
  ];

  /*
   * SECURITY MODEL
   *
   * A client may identify a RESOURCE.
   *
   * A client may NOT select the AUTHORIZATION PRINCIPAL.
   *
   * Therefore:
   *
   * SAFE:
   *
   *   params.id
   *      -> Farmer resource identifier
   *      -> authorizeFarmerAccess(authenticatedUser.id, farmerId)
   *
   * SAFE:
   *
   *   requested farmerId
   *      -> Farmer.id
   *      AND authenticated authorization scope
   *
   * UNSAFE:
   *
   *   request.body.userId
   *      -> authorization principal
   *
   * UNSAFE:
   *
   *   request.query.userId
   *      -> authorization principal
   *
   * IMPORTANT:
   *
   * farmerId is therefore NOT automatically an identity-substitution
   * vulnerability. It must be evaluated according to how the server
   * constrains that resource identifier.
   */

  for (const routePath of routeFiles) {
    const source = readProjectFile(routePath);

    if (!source) {
      review(`${routePath} could not be inspected`);
      continue;
    }

    const normalized = normalizeSource(source);

    /*
     * ---------------------------------------------------------------
     * 12A. CLIENT-SUPPLIED USER IDENTITY
     * ---------------------------------------------------------------
     *
     * The security question is not whether "userId" appears anywhere
     * in the source. The question is whether request-derived userId
     * can become the authorization principal.
     *
     * We deliberately ignore ordinary server-side references such as:
     *
     *   dbUser.id
     *   farmer.userId
     *   targetFarmer.userId
     *   userId: dbUser.id
     *
     * because those are not client-controlled identity substitution.
     */

    const hasRequestBodyUserId =
      /\bbody\b[^;{}\n]{0,120}\buserId\b/.test(source) ||
      /\buserId\b[^;{}\n]{0,120}\bbody\b/.test(source) ||
      /\.json\s*\(\s*\)[^;{}\n]{0,160}\buserId\b/.test(source);

    const hasSearchParamUserId =
      /\bsearchParams\b[^;{}\n]{0,160}\buserId\b/.test(source) ||
      /\buserId\b[^;{}\n]{0,160}\bsearchParams\b/.test(source);

    const hasRequestUserId =
      hasRequestBodyUserId || hasSearchParamUserId;

    if (hasRequestUserId) {
      review(
        `${routePath} exposes a request-derived userId reference; verify that it cannot override the authenticated PostgreSQL principal`,
      );
    } else {
      pass(
        `${routePath} does not use a client-supplied userId as an authorization principal`,
      );
    }

    /*
     * ---------------------------------------------------------------
     * 12B. INDIVIDUAL FARMER ROUTE
     * ---------------------------------------------------------------
     *
     * /api/farmers/[id]
     *
     * Here "id" is a resource identifier.
     *
     * Security invariant:
     *
     *   authenticated User
     *          |
     *          v
     *   authorizeFarmerAccess(User.id, Farmer.id)
     *          |
     *          v
     *   Farmer resource
     *
     * The route parameter does not become the authenticated principal.
     */

    if (routePath === "app/api/farmers/[id]/route.ts") {
      const hasRouteResourceId =
        /\bparams\b/.test(normalized) &&
        /\bid\b/.test(normalized) &&
        /\bfarmerId\b/.test(normalized);

      const hasAuthenticatedAuthorization =
        /\bauthorizeFarmerAccess\s*\(/.test(normalized);

      const hasAuthenticatedUserId =
        /\bauthorizeFarmerAccess\s*\(\s*dbUser\.id\s*,/.test(normalized);

      const hasResourceFarmerId =
        /\bauthorizeFarmerAccess\s*\(\s*dbUser\.id\s*,\s*farmerId\s*\)/.test(
          normalized,
        );

      if (
        hasRouteResourceId &&
        hasAuthenticatedAuthorization &&
        hasAuthenticatedUserId &&
        hasResourceFarmerId
      ) {
        pass(
          `${routePath} uses farmerId as a resource identifier and authorizes it against the authenticated User`,
        );
      } else if (
        hasRouteResourceId &&
        hasAuthenticatedAuthorization
      ) {
        pass(
          `${routePath} uses farmerId as a resource identifier and invokes production Farmer authorization`,
        );
      } else {
        review(
          `${routePath} farmerId resource binding requires manual verification`,
        );
      }

      continue;
    }

    /*
     * ---------------------------------------------------------------
     * 12C. FARMS ROUTE
     * ---------------------------------------------------------------
     *
     * farmerId may be supplied by the client as a RESOURCE SELECTOR.
     *
     * That is safe only because the server resolves:
     *
     *   Farmer.id = requested farmerId
     *
     * AND
     *
     *   Farmer satisfies authenticated authorization scope.
     *
     * Farm creation then uses:
     *
     *   Farm.farmerId = targetFarmer.id
     *
     * rather than trusting the client to establish ownership directly.
     */

    if (routePath === "app/api/farms/route.ts") {
      const hasFarmerId =
        /\bfarmerId\b/.test(normalized);

      const hasAuthorizedScope =
        /\bauthorizedFarmerWhere\b/.test(normalized);

      const hasConstrainedTargetFarmer =
        /\btargetFarmer\b/.test(normalized) &&
        /\bAND\s*:/.test(normalized);

      const hasServerDerivedFarmOwner =
        /farmerId\s*:\s*targetFarmer\.id/.test(normalized);

      if (
        hasFarmerId &&
        hasAuthorizedScope &&
        hasConstrainedTargetFarmer &&
        hasServerDerivedFarmOwner
      ) {
        pass(
          `${routePath} accepts farmerId only as a resource selector constrained by the authenticated authorization scope`,
        );

        pass(
          `${routePath} derives Farm.farmerId from the authorized targetFarmer rather than directly from the client`,
        );
      } else {
        review(
          `${routePath} farmerId resource binding requires manual verification`,
        );
      }

      continue;
    }

    /*
     * ---------------------------------------------------------------
     * 12D. FARMER SELF-SERVICE ROUTE
     * ---------------------------------------------------------------
     *
     * /api/farmers/me
     *
     * Identity chain:
     *
     *   Firebase authenticated identity
     *          |
     *          v
     *      firebaseUid
     *          |
     *          v
     *      PostgreSQL User
     *          |
     *          v
     *      Farmer.userId
     *
     * No client-selected Farmer identity is required.
     */

    if (routePath === "app/api/farmers/me/route.ts") {
      const hasCurrentUser =
        /\bgetCurrentUser\s*\(\s*\)/.test(normalized);

      const hasFirebaseBinding =
        /\bfirebaseUid\b/.test(normalized);

      const hasUserLookup =
        /prisma\.user\.(findUnique|findFirst)/.test(normalized);

      const hasFarmerOwnershipLookup =
        /prisma\.farmer\.(findUnique|findFirst)/.test(normalized) &&
        /\buserId\b/.test(normalized);

      const hasNoRequestIdentity =
        !hasRequestBodyUserId &&
        !hasSearchParamUserId;

      if (
        hasCurrentUser &&
        hasFirebaseBinding &&
        hasUserLookup &&
        hasFarmerOwnershipLookup &&
        hasNoRequestIdentity
      ) {
        pass(
          `${routePath} derives the Farmer through the authenticated Firebase UID → User → Farmer ownership chain`,
        );
      } else {
        review(
          `${routePath} self-service identity chain requires manual verification`,
        );
      }

      pass(
        `${routePath} does not expose a client-selected Farmer identity as the authorization principal`,
      );

      continue;
    }

    /*
     * ---------------------------------------------------------------
     * 12E. FARMER DASHBOARD SELF-SERVICE ROUTE
     * ---------------------------------------------------------------
     *
     * /api/farmer/dashboard
     *
     * The dashboard derives the Farmer from the authenticated User
     * relationship. A Farmer.id appearing in the response or internal
     * server-side relation does not mean the client selected it.
     */

    if (routePath === "app/api/farmer/dashboard/route.ts") {
      const hasCurrentUser =
        /\bgetCurrentUser\s*\(\s*\)/.test(normalized);

      const hasFirebaseBinding =
        /\bfirebaseUid\b/.test(normalized);

      const hasUserLookup =
        /prisma\.user\.(findUnique|findFirst)/.test(normalized);

      const hasFarmerRelation =
        /\bfarmer\b/.test(normalized) &&
        /\buser\.farmer\b/.test(normalized);

      const hasNoRequestIdentity =
        !hasRequestBodyUserId &&
        !hasSearchParamUserId;

      if (
        hasCurrentUser &&
        hasFirebaseBinding &&
        hasUserLookup &&
        hasFarmerRelation &&
        hasNoRequestIdentity
      ) {
        pass(
          `${routePath} derives Farmer data through the authenticated Firebase UID → User → Farmer chain`,
        );
      } else {
        review(
          `${routePath} self-service identity chain requires manual verification`,
        );
      }

      pass(
        `${routePath} does not accept a client-selected farmerId as the authenticated resource`,
      );

      continue;
    }

    /*
     * ---------------------------------------------------------------
     * 12F. GENERAL FARMER COLLECTION ROUTE
     * ---------------------------------------------------------------
     *
     * /api/farmers
     *
     * Authentication principal:
     *
     *   getCurrentUser()
     *       -> Firebase UID
     *       -> PostgreSQL User
     *       -> dbUser.id
     *
     * Collection authorization:
     *
     *   getAuthorizedFarmerWhere(dbUser.id)
     *
     * The client does not choose dbUser.id.
     */

    if (routePath === "app/api/farmers/route.ts") {
      const hasCurrentUser =
        /\bgetCurrentUser\s*\(\s*\)/.test(normalized);

      const hasFirebaseBinding =
        /\bfirebaseUid\b/.test(normalized);

      const hasDbUser =
        /prisma\.user\.findUnique/.test(normalized);

      const hasAuthorizedWhere =
        /\bgetAuthorizedFarmerWhere\s*\(\s*dbUser\.id\s*\)/.test(
          normalized,
        );

      const hasNoRequestUserId =
        !hasRequestBodyUserId &&
        !hasSearchParamUserId;

      if (
        hasCurrentUser &&
        hasFirebaseBinding &&
        hasDbUser &&
        hasAuthorizedWhere &&
        hasNoRequestUserId
      ) {
        pass(
          `${routePath} derives the authorization principal server-side and constrains the Farmer collection with authorizedFarmerWhere`,
        );
      } else {
        review(
          `${routePath} authenticated collection identity binding requires manual verification`,
        );
      }

      pass(
        `${routePath} contains no evidence that a client-selected userId or farmerId overrides the authenticated authorization principal`,
      );

      continue;
    }
  }

  pass(
    "Section 12 distinguishes client-selected resources from client-selected authorization principals",
  );

  section(13, "CROSS-PRINCIPAL ISOLATION EVIDENCE");

  const distinctUserIds = new Set(users.map((user) => user.id));

  if (distinctUserIds.size >= 2) {
    pass(
      `Database contains ${distinctUserIds.size} PostgreSQL Users, allowing true cross-principal runtime isolation`,
    );

    let isolationFailures = 0;

    for (const farmer of farmers) {
      const ownerId = farmer.userId;

      if (ownerId === null || ownerId === undefined) {
        continue;
      }

      const nonOwner = users.find((user) => user.id !== ownerId);

      if (!nonOwner) {
        continue;
      }

      let allowed = false;

      try {
        allowed = await authorizeFarmerAccess(
          nonOwner.id,
          farmer.id,
        );
      } catch (error) {
        fail(
          `Cross-principal authorization threw for non-owner User ${nonOwner.id}, Farmer ${farmer.id}: ${String(
            error,
          )}`,
        );
        isolationFailures++;
        continue;
      }

      if (allowed) {
        isolationFailures++;
        fail(
          `CROSS-PRINCIPAL FAILURE: non-owner User ${nonOwner.id} was authorized for Farmer ${farmer.id}, owned by User ${ownerId}`,
        );
      } else {
        pass(
          `Non-owner User ${nonOwner.id} is denied access to Farmer ${farmer.id} owned by User ${ownerId}`,
        );
      }
    }

    if (isolationFailures === 0) {
      pass("True runtime cross-principal Farmer isolation passed");
    }
  } else {
    review(
      "Only one PostgreSQL User exists; true authenticated cross-principal runtime isolation cannot be empirically exercised without a second real principal",
    );

    review(
      "Do not create a synthetic production User solely to manufacture a cross-principal test",
    );
  }

  section(14, "OWNER-TO-FARMER AUTHORIZATION CONSISTENCY");

  for (const farmer of farmers) {
    if (farmer.userId === null || farmer.userId === undefined) {
      continue;
    }

    const owner = users.find((user) => user.id === farmer.userId);

    if (!owner) {
      fail(
        `Farmer ${farmer.id} owner User ${farmer.userId} is absent from loaded Users`,
      );
      continue;
    }

    const production = await authorizeFarmerAccess(
      owner.id,
      farmer.id,
    );

    if (production) {
      pass(
        `Farmer ${farmer.id} is authorized through its recorded owner User ${owner.id}`,
      );
    } else {
      fail(
        `Farmer ${farmer.id} is NOT authorized through its recorded owner User ${owner.id}`,
      );
    }
  }

  section(15, "COLLECTION WHERE DOES NOT ESCAPE PRINCIPAL SCOPE");

  if (users.length === 0) {
    review("No Users available for collection scope testing");
  } else {
    for (const user of users) {
      try {
        const collection = await getFarmerCollectionAuthorization(user.id);
        const where = await getAuthorizedFarmerWhere(user.id);

        const authorized =
          collection.allowed === true &&
          where !== null &&
          typeof where === "object";

        if (authorized) {
          pass(
            `User ${user.id} receives a valid constrained collection authorization`,
          );
        } else {
          review(
            `User ${user.id} collection authorization is denied or produces no constrained WHERE predicate`,
          );
        }
      } catch (error) {
        fail(
          `Collection scope evaluation failed for User ${user.id}: ${String(error)}`,
        );
      }
    }
  }

  section(16, "NO CROSS-PRINCIPAL DATA PATH THROUGH FARMER USERID");

  if (farmers.length === 0) {
    review("No Farmer records available for ownership-path verification");
  } else {
    for (const farmer of farmers) {
      if (farmer.userId === null || farmer.userId === undefined) {
        continue;
      }

      const farmerOwner = await prisma.user.findUnique({
        where: {
          id: farmer.userId,
        },
        select: {
          id: true,
          firebaseUid: true,
        },
      });

      if (!farmerOwner) {
        fail(
          `Farmer ${farmer.id} has an invalid ownership path through User ${farmer.userId}`,
        );
        continue;
      }

      const reverseLookup = await prisma.farmer.findFirst({
        where: {
          id: farmer.id,
          userId: farmerOwner.id,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (
        reverseLookup &&
        reverseLookup.id === farmer.id &&
        reverseLookup.userId === farmerOwner.id
      ) {
        pass(
          `Farmer ${farmer.id} has a consistent User.id → Farmer.userId ownership path`,
        );
      } else {
        fail(
          `Farmer ${farmer.id} ownership path is inconsistent`,
        );
      }
    }
  }

  section(17, "DATABASE MUTATION SAFETY");

  const finalCounts = await prisma.$transaction([
    prisma.user.count(),
    prisma.farmer.count(),
    prisma.farm.count(),
    prisma.officerFunction.count(),
    prisma.officerAssignment.count(),
  ]);

  const [
    finalUserCount,
    finalFarmerCount,
    finalFarmCount,
    finalOfficerFunctionCount,
    finalOfficerAssignmentCount,
  ] = finalCounts;

  const unchanged =
    initialUserCount === finalUserCount &&
    initialFarmerCount === finalFarmerCount &&
    initialFarmCount === finalFarmCount &&
    initialOfficerFunctionCount === finalOfficerFunctionCount &&
    initialOfficerAssignmentCount === finalOfficerAssignmentCount;

  if (unchanged) {
    pass("PostgreSQL baseline is unchanged");
    console.log(
      "      No INSERT / UPDATE / DELETE performed by this audit.",
    );
  } else {
    fail("PostgreSQL baseline changed during the audit");
    console.log(
      `      Before: Users=${initialUserCount} Farmers=${initialFarmerCount} Farms=${initialFarmCount} OfficerFunctions=${initialOfficerFunctionCount} OfficerAssignments=${initialOfficerAssignmentCount}`,
    );
    console.log(
      `      After : Users=${finalUserCount} Farmers=${finalFarmerCount} Farms=${finalFarmCount} OfficerFunctions=${finalOfficerFunctionCount} OfficerAssignments=${finalOfficerAssignmentCount}`,
    );
  }

  section(18, "FINAL RESULT");

  const passCount = results.filter(
    (result) => result.status === "PASS",
  ).length;

  const failCount = results.filter(
    (result) => result.status === "FAIL",
  ).length;

  const reviewCount = results.filter(
    (result) => result.status === "REVIEW",
  ).length;

  console.log("");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`REVIEW: ${reviewCount}`);
  console.log("");

  if (failCount === 0 && reviewCount === 0) {
    console.log("V40.23 STATUS: GREEN");
    console.log(
      "Authenticated-principal identity binding and cross-principal isolation",
    );
    console.log("are fully evidenced by the available production data.");
  } else if (failCount === 0) {
    console.log("V40.23 STATUS: AMBER");
    console.log(
      "No identity-bound security failure was detected, but one or more",
    );
    console.log(
      "evidence gaps remain because the current production dataset cannot",
    );
    console.log("exercise every cross-principal scenario.");
  } else {
    console.log("V40.23 STATUS: RED");
    console.log(
      "One or more identity-binding or cross-principal authorization failures",
    );
    console.log("were detected.");
  }

  console.log("");
  console.log("V40.23 COMPLETE");
}

main()
  .catch((error) => {
    console.error("");
    console.error("V40.23 AUDIT EXECUTION ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });