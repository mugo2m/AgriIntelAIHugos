import { prisma } from "../lib/prisma";

type CheckResult = {
  section: string;
  description: string;
  passed: boolean;
  detail?: string;
};

const results: CheckResult[] = [];

function pass(section: string, description: string, detail?: string) {
  results.push({
    section,
    description,
    passed: true,
    detail,
  });
  console.log(`PASS ${description}${detail ? ` — ${detail}` : ""}`);
}

function fail(section: string, description: string, detail?: string) {
  results.push({
    section,
    description,
    passed: false,
    detail,
  });
  console.log(`FAIL ${description}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("============================================================");
  console.log("V38.6 OFFICER AUTHORIZATION DATABASE AUDIT");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log();

  try {
    // --------------------------------------------------------
    // SECTION 1 — CORE COUNTS
    // --------------------------------------------------------

    console.log("------------------------------------------------------------");
    console.log("1. EXISTING GEOGRAPHY COUNTS");
    console.log("------------------------------------------------------------");

    const [
      countries,
      counties,
      subCounties,
      constituencies,
      wards,
      villages,
      users,
      farmers,
      farms,
    ] = await Promise.all([
      prisma.country.count(),
      prisma.county.count(),
      prisma.subCounty.count(),
      prisma.constituency.count(),
      prisma.ward.count(),
      prisma.village.count(),
      prisma.user.count(),
      prisma.farmer.count(),
      prisma.farm.count(),
    ]);

    console.log(`Countries      : ${countries}`);
    console.log(`Counties       : ${counties}`);
    console.log(`SubCounties    : ${subCounties}`);
    console.log(`Constituencies : ${constituencies}`);
    console.log(`Wards          : ${wards}`);
    console.log(`Villages       : ${villages}`);
    console.log(`Users          : ${users}`);
    console.log(`Farmers        : ${farmers}`);
    console.log(`Farms          : ${farms}`);
    console.log();

    if (countries === 8) {
      pass("GEOGRAPHY", "Country count remains 8");
    } else {
      fail("GEOGRAPHY", "Country count changed", `expected 8, found ${countries}`);
    }

    if (counties === 47) {
      pass("GEOGRAPHY", "County count remains 47");
    } else {
      fail("GEOGRAPHY", "County count changed", `expected 47, found ${counties}`);
    }

    if (subCounties === 301) {
      pass("GEOGRAPHY", "SubCounty count remains 301");
    } else {
      fail(
        "GEOGRAPHY",
        "SubCounty count changed",
        `expected 301, found ${subCounties}`,
      );
    }

    if (wards === 1450) {
      pass("GEOGRAPHY", "Ward count remains 1450");
    } else {
      fail("GEOGRAPHY", "Ward count changed", `expected 1450, found ${wards}`);
    }

    // --------------------------------------------------------
    // SECTION 2 — OFFICER TABLE COUNTS
    // --------------------------------------------------------

    console.log();
    console.log("------------------------------------------------------------");
    console.log("2. OFFICER AUTHORIZATION TABLES");
    console.log("------------------------------------------------------------");

    const officerFunctionCount = await prisma.officerFunction.count();
    const officerAssignmentCount = await prisma.officerAssignment.count();

    console.log(`OfficerFunction   : ${officerFunctionCount}`);
    console.log(`OfficerAssignment : ${officerAssignmentCount}`);
    console.log();

    if (officerFunctionCount === 0) {
      pass(
        "OFFICER TABLES",
        "OfficerFunction table exists and is currently empty",
      );
    } else {
      pass(
        "OFFICER TABLES",
        "OfficerFunction table exists",
        `${officerFunctionCount} records currently present`,
      );
    }

    if (officerAssignmentCount === 0) {
      pass(
        "OFFICER TABLES",
        "OfficerAssignment table exists and is currently empty",
      );
    } else {
      pass(
        "OFFICER TABLES",
        "OfficerAssignment table exists",
        `${officerAssignmentCount} records currently present`,
      );
    }

    // --------------------------------------------------------
    // SECTION 3 — OFFICER FUNCTION STRUCTURE
    // --------------------------------------------------------

    console.log();
    console.log("------------------------------------------------------------");
    console.log("3. OFFICER FUNCTION STRUCTURE");
    console.log("------------------------------------------------------------");

    const functions = await prisma.officerFunction.findMany({
      orderBy: {
        id: "asc",
      },
    });

    if (functions.length === 0) {
      pass(
        "FUNCTIONS",
        "OfficerFunction table is ready for catalogue seeding",
      );
    } else {
      for (const fn of functions) {
        console.log(
          `  ${fn.id} | ${fn.name} | active=${fn.active}`,
        );
      }

      pass(
        "FUNCTIONS",
        "OfficerFunction records are readable",
        `${functions.length} records`,
      );
    }

    // --------------------------------------------------------
    // SECTION 4 — ENUM / ASSIGNMENT STRUCTURE
    // --------------------------------------------------------

    console.log();
    console.log("------------------------------------------------------------");
    console.log("4. OFFICER ASSIGNMENT STRUCTURE");
    console.log("------------------------------------------------------------");

    const assignments = await prisma.officerAssignment.findMany({
      take: 10,
      orderBy: {
        id: "asc",
      },
      include: {
        user: true,
        role: true,
        function: true,
        country: true,
        county: true,
        subCounty: true,
        ward: true,
      },
    });

    if (assignments.length === 0) {
      pass(
        "ASSIGNMENTS",
        "OfficerAssignment relations are queryable",
        "table currently empty",
      );
    } else {
      for (const assignment of assignments) {
        console.log(
          `  Assignment ${assignment.id}: ` +
            `user=${assignment.userId}, ` +
            `role=${assignment.roleId}, ` +
            `function=${assignment.functionId}, ` +
            `scope=${assignment.scopeLevel}, ` +
            `active=${assignment.active}`,
        );
      }

      pass(
        "ASSIGNMENTS",
        "OfficerAssignment relations are queryable",
        `${assignments.length} records inspected`,
      );
    }

    // --------------------------------------------------------
    // SECTION 5 — GEOGRAPHIC REFERENTIAL INTEGRITY
    // --------------------------------------------------------

    console.log();
    console.log("------------------------------------------------------------");
    console.log("5. GEOGRAPHIC REFERENTIAL INTEGRITY");
    console.log("------------------------------------------------------------");

    const invalidCountyHierarchy = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "County" c
      LEFT JOIN "Country" co ON co.id = c."countryId"
      WHERE co.id IS NULL
    `;

    const invalidSubCountyHierarchy = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "SubCounty" s
      LEFT JOIN "County" c ON c.id = s."countyId"
      WHERE c.id IS NULL
    `;

    const invalidWardCounty = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Ward" w
      LEFT JOIN "County" c ON c.id = w."countyId"
      WHERE c.id IS NULL
    `;

    const invalidWardSubCounty = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Ward" w
      LEFT JOIN "SubCounty" s ON s.id = w."subCountyId"
      WHERE w."subCountyId" IS NOT NULL
        AND s.id IS NULL
    `;

    const countyHierarchyErrors = Number(
      invalidCountyHierarchy[0]?.count ?? 0n,
    );

    const subCountyHierarchyErrors = Number(
      invalidSubCountyHierarchy[0]?.count ?? 0n,
    );

    const wardCountyErrors = Number(
      invalidWardCounty[0]?.count ?? 0n,
    );

    const wardSubCountyErrors = Number(
      invalidWardSubCounty[0]?.count ?? 0n,
    );

    console.log(`Invalid County → Country       : ${countyHierarchyErrors}`);
    console.log(`Invalid SubCounty → County     : ${subCountyHierarchyErrors}`);
    console.log(`Invalid Ward → County          : ${wardCountyErrors}`);
    console.log(`Invalid Ward → SubCounty       : ${wardSubCountyErrors}`);

    if (countyHierarchyErrors === 0) {
      pass("GEOGRAPHY", "County → Country integrity");
    } else {
      fail(
        "GEOGRAPHY",
        "County → Country integrity",
        `${countyHierarchyErrors} invalid records`,
      );
    }

    if (subCountyHierarchyErrors === 0) {
      pass("GEOGRAPHY", "SubCounty → County integrity");
    } else {
      fail(
        "GEOGRAPHY",
        "SubCounty → County integrity",
        `${subCountyHierarchyErrors} invalid records`,
      );
    }

    if (wardCountyErrors === 0) {
      pass("GEOGRAPHY", "Ward → County integrity");
    } else {
      fail(
        "GEOGRAPHY",
        "Ward → County integrity",
        `${wardCountyErrors} invalid records`,
      );
    }

    if (wardSubCountyErrors === 0) {
      pass("GEOGRAPHY", "Ward → SubCounty integrity");
    } else {
      fail(
        "GEOGRAPHY",
        "Ward → SubCounty integrity",
        `${wardSubCountyErrors} invalid records`,
      );
    }

    // --------------------------------------------------------
    // SECTION 6 — OFFICER ASSIGNMENT REFERENTIAL INTEGRITY
    // --------------------------------------------------------

    console.log();
    console.log("------------------------------------------------------------");
    console.log("6. OFFICER ASSIGNMENT REFERENTIAL INTEGRITY");
    console.log("------------------------------------------------------------");

    const invalidOfficerUsers = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "User" u ON u.id = oa."userId"
      WHERE u.id IS NULL
    `;

    const invalidOfficerRoles = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "Role" r ON r.id = oa."roleId"
      WHERE r.id IS NULL
    `;

    const invalidOfficerFunctions = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "OfficerFunction" f ON f.id = oa."functionId"
      WHERE f.id IS NULL
    `;

    const invalidOfficerCountries = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "Country" c ON c.id = oa."countryId"
      WHERE oa."countryId" IS NOT NULL
        AND c.id IS NULL
    `;

    const invalidOfficerCounties = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "County" c ON c.id = oa."countyId"
      WHERE oa."countyId" IS NOT NULL
        AND c.id IS NULL
    `;

    const invalidOfficerSubCounties = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "SubCounty" s ON s.id = oa."subCountyId"
      WHERE oa."subCountyId" IS NOT NULL
        AND s.id IS NULL
    `;

    const invalidOfficerWards = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "OfficerAssignment" oa
      LEFT JOIN "Ward" w ON w.id = oa."wardId"
      WHERE oa."wardId" IS NOT NULL
        AND w.id IS NULL
    `;

    const officerIntegrity = {
      users: Number(invalidOfficerUsers[0]?.count ?? 0n),
      roles: Number(invalidOfficerRoles[0]?.count ?? 0n),
      functions: Number(invalidOfficerFunctions[0]?.count ?? 0n),
      countries: Number(invalidOfficerCountries[0]?.count ?? 0n),
      counties: Number(invalidOfficerCounties[0]?.count ?? 0n),
      subCounties: Number(invalidOfficerSubCounties[0]?.count ?? 0n),
      wards: Number(invalidOfficerWards[0]?.count ?? 0n),
    };

    console.log(`Invalid User references       : ${officerIntegrity.users}`);
    console.log(`Invalid Role references       : ${officerIntegrity.roles}`);
    console.log(
      `Invalid Function references   : ${officerIntegrity.functions}`,
    );
    console.log(
      `Invalid Country references    : ${officerIntegrity.countries}`,
    );
    console.log(
      `Invalid County references     : ${officerIntegrity.counties}`,
    );
    console.log(
      `Invalid SubCounty references  : ${officerIntegrity.subCounties}`,
    );
    console.log(`Invalid Ward references       : ${officerIntegrity.wards}`);

    for (const [key, value] of Object.entries(officerIntegrity)) {
      if (value === 0) {
        pass("OFFICER FK", `${key} references are valid`);
      } else {
        fail(
          "OFFICER FK",
          `${key} references contain invalid records`,
          `${value} invalid references`,
        );
      }
    }

    // --------------------------------------------------------
    // SECTION 7 — CURRENT USER / FARMER SAFETY
    // --------------------------------------------------------

    console.log();
    console.log("------------------------------------------------------------");
    console.log("7. EXISTING FARMER DATA SAFETY");
    console.log("------------------------------------------------------------");

    const farmerOrphans = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Farmer" f
      LEFT JOIN "User" u ON u.id = f."userId"
      WHERE u.id IS NULL
    `;

    const farmerGeographyErrors = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*)::bigint AS count
      FROM "Farmer" f
      LEFT JOIN "County" c ON c.id = f."countyId"
      LEFT JOIN "SubCounty" s ON s.id = f."subCountyId"
      LEFT JOIN "Ward" w ON w.id = f."wardId"
      WHERE c.id IS NULL
         OR s.id IS NULL
         OR w.id IS NULL
    `;

    const farmerUserErrors = Number(farmerOrphans[0]?.count ?? 0n);
    const farmerGeoErrors = Number(
      farmerGeographyErrors[0]?.count ?? 0n,
    );

    console.log(`Farmer → User errors           : ${farmerUserErrors}`);
    console.log(`Farmer geography errors        : ${farmerGeoErrors}`);

    if (farmerUserErrors === 0) {
      pass("FARMER SAFETY", "All Farmer → User references remain valid");
    } else {
      fail(
        "FARMER SAFETY",
        "Farmer → User integrity failure",
        `${farmerUserErrors} orphan records`,
      );
    }

    if (farmerGeoErrors === 0) {
      pass(
        "FARMER SAFETY",
        "All Farmer geography references remain valid",
      );
    } else {
      fail(
        "FARMER SAFETY",
        "Farmer geography integrity failure",
        `${farmerGeoErrors} invalid records`,
      );
    }

    // --------------------------------------------------------
    // SECTION 8 — FINAL
    // --------------------------------------------------------

    console.log();
    console.log("============================================================");
    console.log("V38.6 FINAL RESULT");
    console.log("============================================================");

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log(`PASS   : ${passed}`);
    console.log(`FAIL   : ${failed}`);

    if (failed === 0) {
      console.log();
      console.log("V38.6 STATUS: GREEN");
      console.log(
        "Officer authorization database layer is structurally ready.",
      );
    } else {
      console.log();
      console.log("V38.6 STATUS: RED");
      console.log("Database integrity issues require investigation.");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error();
    console.error("V38.6 AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();