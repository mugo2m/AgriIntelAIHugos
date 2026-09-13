import prisma from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("V40.10 FARMER API 500 READ-ONLY DIAGNOSTIC");
  console.log("============================================================");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("");

  const userId = 1;

  console.log("------------------------------------------------------------");
  console.log("1. DATABASE USER");
  console.log("------------------------------------------------------------");

  try {
    const dbUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
        active: true,
        roleId: true,
      },
    });

    if (!dbUser) {
      console.log("FAIL   PostgreSQL User 1 does not exist");
    } else {
      console.log("PASS   PostgreSQL User 1 query succeeded");
      console.log(`User ID: ${dbUser.id}`);
      console.log(`Email: ${dbUser.email}`);
      console.log(`Firebase UID present: ${Boolean(dbUser.firebaseUid)}`);
      console.log(`Active: ${dbUser.active}`);
      console.log(`Role ID: ${dbUser.roleId}`);
    }
  } catch (error) {
    console.log("FAIL   PostgreSQL User query failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("2. DATABASE USER + ROLE");
  console.log("------------------------------------------------------------");

  try {
    const dbUserWithRole = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: true,
      },
    });

    if (!dbUserWithRole) {
      console.log("FAIL   User + role query returned no user");
    } else {
      console.log("PASS   User + role query succeeded");
      console.log(`Role: ${dbUserWithRole.role?.name ?? "NULL"}`);
    }
  } catch (error) {
    console.log("FAIL   User + role query failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("3. FARMER BASIC QUERY");
  console.log("------------------------------------------------------------");

  try {
    const farmer = await prisma.farmer.findFirst({
      select: {
        id: true,
        userId: true,
        phone: true,
        countyId: true,
        subCountyId: true,
        wardId: true,
      },
    });

    if (!farmer) {
      console.log("WARN   No Farmer record found");
    } else {
      console.log("PASS   Farmer basic query succeeded");
      console.log(`Farmer ID: ${farmer.id}`);
      console.log(`Farmer User ID: ${farmer.userId}`);
      console.log(`County ID: ${farmer.countyId}`);
      console.log(`SubCounty ID: ${farmer.subCountyId}`);
      console.log(`Ward ID: ${farmer.wardId}`);
    }
  } catch (error) {
    console.log("FAIL   Farmer basic query failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("4. FARMER + LOCATION RELATIONS");
  console.log("------------------------------------------------------------");

  try {
    const farmer = await prisma.farmer.findFirst({
      select: {
        id: true,
        userId: true,
        phone: true,
        county: {
          select: {
            id: true,
            name: true,
            countryId: true,
          },
        },
        subCounty: {
          select: {
            id: true,
            name: true,
            countyId: true,
          },
        },
        ward: {
          select: {
            id: true,
            name: true,
            countyId: true,
            subCountyId: true,
          },
        },
        village: {
          select: {
            id: true,
            name: true,
            wardId: true,
          },
        },
      },
    });

    if (!farmer) {
      console.log("WARN   No Farmer record found");
    } else {
      console.log("PASS   Farmer + geography relation query succeeded");
      console.log(`Farmer ID: ${farmer.id}`);
      console.log(`County: ${farmer.county.name}`);
      console.log(`SubCounty: ${farmer.subCounty.name}`);
      console.log(`Ward: ${farmer.ward.name}`);
      console.log(`Village: ${farmer.village?.name ?? "NULL"}`);
    }
  } catch (error) {
    console.log("FAIL   Farmer + geography relation query failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("5. FARMER + CURRENT API RELATIONS");
  console.log("------------------------------------------------------------");

  try {
    const farmers = await prisma.farmer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        county: true,
        subCounty: true,
        ward: true,
        village: true,
        gender: true,
        educationLevel: true,
        occupation: true,
        maritalStatus: true,
        farmerType: true,
        farmingActivity: true,
        preferredLanguage: true,
        communicationPreference: true,
        digitalLiteracyLevel: true,
      },
    });

    console.log("PASS   Full Farmer relation query succeeded");
    console.log(`Rows returned: ${farmers.length}`);
  } catch (error) {
    console.log("FAIL   Full Farmer relation query failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("6. INFORMATION_SCHEMA FARMER COLUMNS");
  console.log("------------------------------------------------------------");

  try {
    const columns = await prisma.$queryRaw<
      Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>
    >`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND LOWER(table_name) = LOWER('Farmer')
      ORDER BY ordinal_position
    `;

    if (columns.length === 0) {
      console.log("FAIL   No columns found for table Farmer");
    } else {
      console.log(`PASS   Farmer table has ${columns.length} database columns`);
      console.log("");

      for (const column of columns) {
        console.log(
          `${column.column_name} | ${column.data_type} | nullable=${column.is_nullable}`,
        );
      }
    }
  } catch (error) {
    console.log("FAIL   information_schema Farmer query failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("7. EXACT GENDER COLUMN CHECK");
  console.log("------------------------------------------------------------");

  try {
    const genderColumns = await prisma.$queryRaw<
      Array<{
        column_name: string;
      }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND LOWER(table_name) = LOWER('Farmer')
        AND LOWER(column_name) LIKE '%gender%'
      ORDER BY ordinal_position
    `;

    if (genderColumns.length === 0) {
      console.log("FAIL   No gender-related Farmer column exists");
    } else {
      console.log("PASS   Gender-related Farmer columns found");

      for (const column of genderColumns) {
        console.log(`Column: ${column.column_name}`);
      }
    }
  } catch (error) {
    console.log("FAIL   Gender column check failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("8. AUTHORIZATION HELPER");
  console.log("------------------------------------------------------------");

  try {
    const { getAuthorizedFarmerWhere } = await import(
      "../lib/authorization/farmer-collection-authorization"
    );

    const where = await getAuthorizedFarmerWhere(userId);

    if (!where) {
      console.log("FAIL   No authorized Farmer WHERE clause generated");
    } else {
      console.log("PASS   Authorized Farmer WHERE clause generated");
      console.log(JSON.stringify(where, null, 2));
    }
  } catch (error) {
    console.log("FAIL   Authorization helper failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("9. AUTHORIZED FARMER QUERY");
  console.log("------------------------------------------------------------");

  try {
    const { getAuthorizedFarmerWhere } = await import(
      "../lib/authorization/farmer-collection-authorization"
    );

    const where = await getAuthorizedFarmerWhere(userId);

    if (!where) {
      console.log("FAIL   Cannot test authorized Farmer query");
    } else {
      const farmers = await prisma.farmer.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          county: true,
          subCounty: true,
          ward: true,
          village: true,
        },
      });

      console.log("PASS   Authorized Farmer query succeeded");
      console.log(`Authorized rows: ${farmers.length}`);
    }
  } catch (error) {
    console.log("FAIL   Authorized Farmer query failed");
    console.error(error);
  }

  console.log("");
  console.log("============================================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("UNHANDLED DIAGNOSTIC ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });