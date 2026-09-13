import prisma from "../lib/prisma";

function findBigInts(
  value: unknown,
  path = "$",
  results: string[] = [],
): string[] {
  if (typeof value === "bigint") {
    results.push(`${path} = BigInt(${value.toString()})`);
    return results;
  }

  if (value === null || value === undefined) {
    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findBigInts(item, `${path}[${index}]`, results);
    });

    return results;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      findBigInts(child, `${path}.${key}`, results);
    }
  }

  return results;
}

async function main() {
  console.log("============================================================");
  console.log("V40.10 FARMER API SERIALIZATION DIAGNOSTIC");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  const userId = 1;

  console.log("------------------------------------------------------------");
  console.log("1. AUTHORIZED WHERE CLAUSE");
  console.log("------------------------------------------------------------");

  const { getAuthorizedFarmerWhere } = await import(
    "../lib/authorization/farmer-collection-authorization"
  );

  const authorizedWhere =
    await getAuthorizedFarmerWhere(userId);

  if (!authorizedWhere) {
    console.log("FAIL   No authorized Farmer WHERE clause");
    return;
  }

  console.log("PASS   Authorized WHERE clause generated");

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("2. EXACT GET /api/farmers PRISMA QUERY");
  console.log("------------------------------------------------------------");

  let farmers: unknown;

  try {
    farmers = await prisma.farmer.findMany({
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

    console.log("PASS   Exact GET Farmer Prisma query succeeded");
    console.log(
      `Rows returned: ${
        Array.isArray(farmers)
          ? farmers.length
          : "NOT ARRAY"
      }`,
    );
  } catch (error) {
    console.log("FAIL   Exact GET Farmer Prisma query failed");
    console.error(error);
    return;
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("3. BIGINT DETECTION");
  console.log("------------------------------------------------------------");

  const bigintPaths = findBigInts(farmers);

  if (bigintPaths.length === 0) {
    console.log("PASS   No BigInt values found in Farmer response");
  } else {
    console.log(
      `FAIL   Found ${bigintPaths.length} BigInt value(s)`,
    );

    for (const item of bigintPaths) {
      console.log(`BIGINT   ${item}`);
    }
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("4. NATIVE JSON.STRINGIFY TEST");
  console.log("------------------------------------------------------------");

  try {
    const json = JSON.stringify(farmers);

    console.log("PASS   JSON.stringify(farmers) succeeded");
    console.log(`JSON length: ${json.length}`);
  } catch (error) {
    console.log("FAIL   JSON.stringify(farmers) failed");
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("5. JSON SERIALIZATION WITH BIGINT REPLACEMENT");
  console.log("------------------------------------------------------------");

  try {
    const serialized = JSON.stringify(
      farmers,
      (_key, value) =>
        typeof value === "bigint"
          ? value.toString()
          : value,
    );

    console.log(
      "PASS   Farmer result serializes when BigInt values are converted",
    );
    console.log(
      `Serialized JSON length: ${serialized.length}`,
    );
  } catch (error) {
    console.log(
      "FAIL   Serialization with BigInt replacement failed",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("6. NEXTRESPONSE.JSON COMPATIBILITY TEST");
  console.log("------------------------------------------------------------");

  try {
    const response = new Response(
      JSON.stringify(farmers),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      "PASS   Standard Response construction succeeded",
    );
    console.log(
      `Status: ${response.status}`,
    );
  } catch (error) {
    console.log(
      "FAIL   Standard Response construction failed",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("7. RESULT SUMMARY");
  console.log("------------------------------------------------------------");

  if (bigintPaths.length > 0) {
    console.log(
      "DIAGNOSIS: BigInt exists in the GET /api/farmers response.",
    );
    console.log(
      "The HTTP 500 is therefore consistent with JSON serialization failure.",
    );
    console.log(
      "The database query and authorization layer are NOT the problem.",
    );
  } else {
    console.log(
      "No BigInt values were found.",
    );
    console.log(
      "The 500 requires further route-level investigation.",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("SERIALIZATION DIAGNOSTIC COMPLETE");
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