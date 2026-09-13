import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const ROUTE_PATH = path.join(
  process.cwd(),
  "app",
  "api",
  "farmers",
  "route.ts",
);

function section(title: string) {
  console.log("\n" + "=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

function result(
  status: "PASS" | "REVIEW" | "MISSING",
  message: string,
) {
  const icon =
    status === "PASS" ? "[PASS]" :
    status === "REVIEW" ? "[REVIEW]" :
    "[MISSING]";

  console.log(`${icon} ${message}`);
}

function snippet(
  source: string,
  start: number,
  end: number,
  label: string,
) {
  console.log(`\n--- ${label} ---`);
  console.log(source.slice(start, end));
  console.log(`--- END ${label} ---`);
}

function extractHandler(source: string, method: string): string | null {
  const pattern = new RegExp(
    `export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)[^{]*\\{`,
    "m",
  );

  const match = pattern.exec(source);

  if (!match) {
    return null;
  }

  const start = match.index;

  let depth = 0;
  let entered = false;

  for (let i = start; i < source.length; i++) {
    const char = source[i];

    if (char === "{") {
      depth++;
      entered = true;
    } else if (char === "}") {
      depth--;

      if (entered && depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return source.slice(start);
}

function containsAny(
  source: string,
  patterns: string[],
): boolean {
  return patterns.some((pattern) => source.includes(pattern));
}

async function main() {
  section("V33 FARMER GET AUTHORIZATION & DATA EXPOSURE AUDIT");

  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log(`Route: ${ROUTE_PATH}`);

  if (!fs.existsSync(ROUTE_PATH)) {
    result("MISSING", "Farmer route file does not exist.");
    process.exitCode = 1;
    return;
  }

  const source = fs.readFileSync(ROUTE_PATH, "utf8");

  console.log(`\nRoute source size : ${source.length} characters`);
  console.log(
    `Route source lines: ${source.split(/\r?\n/).length}`,
  );

  const getBlock = extractHandler(source, "GET");
  const postBlock = extractHandler(source, "POST");

  section("1. HANDLER DISCOVERY");

  if (getBlock) {
    result("PASS", "GET handler found.");
  } else {
    result("MISSING", "GET handler not found.");
  }

  if (postBlock) {
    result("PASS", "POST handler found.");
  } else {
    result("REVIEW", "POST handler not found by source parser.");
  }

  if (!getBlock) {
    throw new Error("Cannot continue without GET handler.");
  }

  section("2. GET AUTHENTICATION CONTRACT");

  const getAuth = containsAny(getBlock, [
    "getCurrentUser(",
    "await getCurrentUser(",
    "isAuthenticated(",
    "await isAuthenticated(",
  ]);

  if (getAuth) {
    result(
      "PASS",
      "GET visibly performs an authentication check.",
    );
  } else {
    result(
      "REVIEW",
      "GET does not visibly call getCurrentUser() or isAuthenticated().",
    );
  }

  const getCurrentUserOccurrences =
    (getBlock.match(/getCurrentUser\s*\(/g) || []).length;

  console.log(
    `GET getCurrentUser() occurrences: ${getCurrentUserOccurrences}`,
  );

  section("3. GET AUTHORIZATION / ROLE CONTRACT");

  const rolePatterns = [
    "user.role",
    "currentUser.role",
    "dbUser.role",
    "role.name",
    "roleId",
    "ROLE",
    "ADMIN",
    "admin",
    "extension",
    "Extension",
    "officer",
    "Officer",
  ];

  const roleEvidence = rolePatterns.filter((pattern) =>
    getBlock.includes(pattern),
  );

  if (roleEvidence.length > 0) {
    result(
      "PASS",
      `GET contains possible authorization/role evidence: ${roleEvidence.join(
        ", ",
      )}`,
    );
  } else {
    result(
      "REVIEW",
      "No visible role/authorization check found inside GET.",
    );
  }

  console.log(
    `Authorization evidence count: ${roleEvidence.length}`,
  );

  section("4. GET FARMER COLLECTION ACCESS");

  const findMany = getBlock.includes("prisma.farmer.findMany");

  if (findMany) {
    result(
      "REVIEW",
      "GET directly reads the Farmer collection with findMany().",
    );
  } else {
    result(
      "PASS",
      "GET does not directly use prisma.farmer.findMany().",
    );
  }

  const farmerFindUnique =
    getBlock.includes("prisma.farmer.findUnique") ||
    getBlock.includes("tx.farmer.findUnique");

  if (farmerFindUnique) {
    result(
      "PASS",
      "GET contains Farmer findUnique() access.",
    );
  } else {
    result(
      "REVIEW",
      "GET does not visibly use Farmer findUnique(); inspect whether collection access is intentional.",
    );
  }

  section("5. GET FILTERING / OWNER SCOPING");

  const ownerPatterns = [
    "userId:",
    "farmerId:",
    "where: {",
    "where:",
    "dbUser.id",
    "currentUser.id",
    "firebaseUid",
    "user: {",
  ];

  const ownerEvidence = ownerPatterns.filter((pattern) =>
    getBlock.includes(pattern),
  );

  if (
    getBlock.includes("userId:") ||
    getBlock.includes("farmerId:") ||
    getBlock.includes("currentUser.id") ||
    getBlock.includes("dbUser.id")
  ) {
    result(
      "PASS",
      "GET contains evidence of owner/user-specific filtering.",
    );
  } else {
    result(
      "REVIEW",
      "GET does not visibly scope Farmer collection results to the authenticated user.",
    );
  }

  console.log(
    `Owner/filter evidence: ${
      ownerEvidence.length > 0
        ? ownerEvidence.join(", ")
        : "none"
    }`,
  );

  section("6. RELATED DATA EXPOSURE");

  const relationPatterns = [
    "include:",
    "user:",
    "role:",
    "county:",
    "subCounty:",
    "ward:",
    "village:",
    "farms:",
    "gender:",
    "educationLevel:",
    "occupation:",
    "maritalStatus:",
    "farmerType:",
    "farmingActivity:",
    "preferredLanguage:",
    "communicationPreference:",
    "digitalLiteracyLevel:",
  ];

  const relationEvidence = relationPatterns.filter((pattern) =>
    getBlock.includes(pattern),
  );

  if (relationEvidence.length > 0) {
    result(
      "REVIEW",
      "GET exposes related Farmer/User/geography/profile data.",
    );

    console.log(
      `Related-data evidence: ${relationEvidence.join(", ")}`,
    );
  } else {
    result(
      "PASS",
      "No obvious related-data include/select evidence found.",
    );
  }

  section("7. USER DATA EXPOSURE");

  const userExposurePatterns = [
    "user:",
    "role:",
    "firebaseUid",
    "email",
    "firstName",
    "lastName",
    "phoneNumber",
    "phone",
  ];

  const userExposure = userExposurePatterns.filter((pattern) =>
    getBlock.includes(pattern),
  );

  if (userExposure.length > 0) {
    result(
      "REVIEW",
      `GET contains possible user-identifying fields/relation evidence: ${userExposure.join(
        ", ",
      )}`,
    );
  } else {
    result(
      "PASS",
      "No obvious user-identifying fields detected in GET source.",
    );
  }

  section("8. GEOGRAPHY DATA EXPOSURE");

  const geographyPatterns = [
    "county:",
    "subCounty:",
    "ward:",
    "village:",
    "countyId",
    "subCountyId",
    "wardId",
    "villageId",
  ];

  const geographyEvidence = geographyPatterns.filter((pattern) =>
    getBlock.includes(pattern),
  );

  if (geographyEvidence.length > 0) {
    result(
      "REVIEW",
      `GET contains geography data/evidence: ${geographyEvidence.join(
        ", ",
      )}`,
    );
  } else {
    result(
      "PASS",
      "No obvious geography relation exposure detected.",
    );
  }

  section("9. FARM DATA EXPOSURE");

  const farmPatterns = [
    "farms:",
    "farm:",
    "farmName",
    "acreage",
    "latitude",
    "longitude",
    "soilType",
    "waterSource",
  ];

  const farmEvidence = farmPatterns.filter((pattern) =>
    getBlock.includes(pattern),
  );

  if (farmEvidence.length > 0) {
    result(
      "REVIEW",
      `GET contains Farmer/Farm data exposure evidence: ${farmEvidence.join(
        ", ",
      )}`,
    );
  } else {
    result(
      "PASS",
      "No obvious Farm data exposure detected.",
    );
  }

  section("10. RESPONSE CONTRACT");

  const jsonResponses =
    (getBlock.match(/NextResponse\.json/g) || []).length;

  console.log(`NextResponse.json occurrences in GET: ${jsonResponses}`);

  if (jsonResponses > 0) {
    result(
      "PASS",
      "GET returns JSON through NextResponse.json().",
    );
  } else {
    result(
      "REVIEW",
      "GET response contract was not detected through NextResponse.json().",
    );
  }

  if (getBlock.includes("status: 200")) {
    result("PASS", "GET contains explicit HTTP 200 response.");
  } else {
    result(
      "REVIEW",
      "GET does not visibly specify status 200.",
    );
  }

  if (getBlock.includes("status: 401")) {
    result(
      "PASS",
      "GET contains a 401 Unauthorized response path.",
    );
  } else {
    result(
      "REVIEW",
      "GET contains no visible 401 Unauthorized response.",
    );
  }

  if (getBlock.includes("status: 403")) {
    result(
      "PASS",
      "GET contains a 403 Forbidden response path.",
    );
  } else {
    result(
      "REVIEW",
      "GET contains no visible 403 Forbidden response.",
    );
  }

  section("11. ERROR HANDLING");

  if (getBlock.includes("catch")) {
    result("PASS", "GET has a catch/error-handling path.");
  } else {
    result(
      "REVIEW",
      "GET does not visibly contain a catch block.",
    );
  }

  if (getBlock.includes("500")) {
    result(
      "PASS",
      "GET contains a 500 error response path.",
    );
  } else {
    result(
      "REVIEW",
      "GET does not visibly contain a 500 error response.",
    );
  }

  section("12. MUTATION SAFETY");

  const getHasCreate =
    getBlock.includes(".create(") ||
    getBlock.includes(".createMany(");

  const getHasUpdate =
    getBlock.includes(".update(") ||
    getBlock.includes(".updateMany(");

  const getHasDelete =
    getBlock.includes(".delete(") ||
    getBlock.includes(".deleteMany(");

  if (!getHasCreate) {
    result("PASS", "GET contains no create/createMany mutation.");
  } else {
    result("REVIEW", "GET contains create mutation syntax.");
  }

  if (!getHasUpdate) {
    result("PASS", "GET contains no update/updateMany mutation.");
  } else {
    result("REVIEW", "GET contains update mutation syntax.");
  }

  if (!getHasDelete) {
    result("PASS", "GET contains no delete/deleteMany mutation.");
  } else {
    result("REVIEW", "GET contains delete mutation syntax.");
  }

  section("13. FULL GET SOURCE");

  console.log(getBlock);

  section("14. GET SOURCE — AUTH / QUERY / RESPONSE SNAPSHOT");

  const authIndex = getBlock.search(
    /getCurrentUser|isAuthenticated|role|authorization|session/i,
  );

  if (authIndex >= 0) {
    snippet(
      getBlock,
      Math.max(0, authIndex - 500),
      Math.min(getBlock.length, authIndex + 2500),
      "AUTHORIZATION AREA",
    );
  } else {
    console.log(
      "\nNo authentication/authorization keyword area found.",
    );
  }

  const queryIndex = getBlock.search(
    /findMany|findUnique|findFirst|select|include/i,
  );

  if (queryIndex >= 0) {
    snippet(
      getBlock,
      Math.max(0, queryIndex - 500),
      Math.min(getBlock.length, queryIndex + 3500),
      "DATABASE QUERY AREA",
    );
  }

  const responseIndex = getBlock.search(
    /NextResponse\.json|return/i,
  );

  if (responseIndex >= 0) {
    snippet(
      getBlock,
      Math.max(0, responseIndex - 500),
      Math.min(getBlock.length, responseIndex + 2500),
      "RESPONSE AREA",
    );
  }

  section("15. POST AUTHENTICATION CROSS-CHECK");

  if (!postBlock) {
    result(
      "REVIEW",
      "POST handler unavailable for comparison.",
    );
  } else {
    if (postBlock.includes("getCurrentUser(")) {
      result(
        "PASS",
        "POST visibly uses getCurrentUser().",
      );
    } else {
      result(
        "REVIEW",
        "POST does not visibly use getCurrentUser().",
      );
    }

    if (postBlock.includes("prisma.user.findUnique")) {
      result(
        "PASS",
        "POST resolves the authenticated DB User.",
      );
    } else {
      result(
        "REVIEW",
        "POST DB User resolution not detected.",
      );
    }
  }

  section("16. DATABASE SANITY COUNTS");

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

  if (countries === 8) {
    result("PASS", "Country count = 8.");
  } else {
    result(
      "REVIEW",
      `Country count expected 8 but found ${countries}.`,
    );
  }

  if (counties === 47) {
    result("PASS", "County count = 47.");
  } else {
    result(
      "REVIEW",
      `County count expected 47 but found ${counties}.`,
    );
  }

  if (subCounties === 301) {
    result("PASS", "SubCounty count = 301.");
  } else {
    result(
      "REVIEW",
      `SubCounty count expected 301 but found ${subCounties}.`,
    );
  }

  if (constituencies === 297) {
    result("PASS", "Constituency count = 297.");
  } else {
    result(
      "REVIEW",
      `Constituency count expected 297 but found ${constituencies}.`,
    );
  }

  if (wards === 1450) {
    result("PASS", "Ward count = 1450.");
  } else {
    result(
      "REVIEW",
      `Ward count expected 1450 but found ${wards}.`,
    );
  }

  section("17. TIATY SPOT CHECK");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    include: {
      county: true,
      wards: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          name: true,
          countyId: true,
          subCountyId: true,
          constituencyId: true,
        },
      },
    },
  });

  if (!tiaty) {
    result("REVIEW", "Tiaty SubCounty ID 757 was not found.");
  } else {
    console.log(
      `Tiaty: ID=${tiaty.id}, Name=${tiaty.name}, County=${tiaty.countyId} ${tiaty.county.name}`,
    );

    console.log(`Ward count: ${tiaty.wards.length}`);

    for (const ward of tiaty.wards) {
      console.log(
        `${ward.id} ${ward.name} | county=${ward.countyId} | subCounty=${ward.subCountyId} | constituency=${ward.constituencyId}`,
      );
    }

    if (tiaty.name === "Tiaty") {
      result("PASS", "Tiaty canonical name is correct.");
    } else {
      result(
        "REVIEW",
        `Tiaty ID 757 has unexpected name: ${tiaty.name}`,
      );
    }

    if (tiaty.countyId === 90) {
      result("PASS", "Tiaty belongs to Baringo County ID 90.");
    } else {
      result(
        "REVIEW",
        `Tiaty belongs to unexpected County ID ${tiaty.countyId}.`,
      );
    }

    if (tiaty.wards.length === 7) {
      result("PASS", "Tiaty has exactly 7 wards.");
    } else {
      result(
        "REVIEW",
        `Tiaty expected 7 wards but has ${tiaty.wards.length}.`,
      );
    }
  }

  section("18. LANG'ATA SPOT CHECK");

  const langata = await prisma.subCounty.findUnique({
    where: {
      id: 1577,
    },
    include: {
      county: true,
      wards: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          name: true,
          countyId: true,
          subCountyId: true,
          constituencyId: true,
        },
      },
    },
  });

  if (!langata) {
    result("REVIEW", "Lang'ata SubCounty ID 1577 was not found.");
  } else {
    console.log(
      `Lang'ata: ID=${langata.id}, Name=${langata.name}, County=${langata.countyId} ${langata.county.name}`,
    );

    console.log(`Ward count: ${langata.wards.length}`);

    for (const ward of langata.wards) {
      console.log(
        `${ward.id} ${ward.name} | county=${ward.countyId} | subCounty=${ward.subCountyId} | constituency=${ward.constituencyId}`,
      );
    }

    if (langata.wards.length === 5) {
      result("PASS", "Lang'ata has exactly 5 wards.");
    } else {
      result(
        "REVIEW",
        `Lang'ata expected 5 wards but has ${langata.wards.length}.`,
      );
    }

    if (langata.countyId === 79) {
      result(
        "PASS",
        "Lang'ata belongs to Nairobi City County ID 79.",
      );
    } else {
      result(
        "REVIEW",
        `Lang'ata belongs to unexpected County ID ${langata.countyId}.`,
      );
    }
  }

  section("19. FINAL V33 CLASSIFICATION");

  const findings: {
    status: "PASS" | "REVIEW" | "MISSING";
    message: string;
  }[] = [];

  findings.push({
    status: getAuth ? "PASS" : "REVIEW",
    message: getAuth
      ? "GET authentication evidence found."
      : "GET authentication is not visibly enforced.",
  });

  findings.push({
    status: findMany ? "REVIEW" : "PASS",
    message: findMany
      ? "GET performs Farmer collection access."
      : "GET does not perform Farmer collection access.",
  });

  findings.push({
    status:
      ownerEvidence.length > 0 &&
      (
        getBlock.includes("userId:") ||
        getBlock.includes("farmerId:") ||
        getBlock.includes("currentUser.id") ||
        getBlock.includes("dbUser.id")
      )
        ? "PASS"
        : "REVIEW",
    message:
      ownerEvidence.length > 0
        ? "GET contains filtering/ownership evidence."
        : "GET ownership scoping is not clearly visible.",
  });

  findings.push({
    status: relationEvidence.length > 0 ? "REVIEW" : "PASS",
    message:
      relationEvidence.length > 0
        ? "GET exposes related Farmer/User/geography/profile data."
        : "No related-data exposure detected.",
  });

  const passCount = findings.filter(
    (x) => x.status === "PASS",
  ).length;

  const reviewCount = findings.filter(
    (x) => x.status === "REVIEW",
  ).length;

  const missingCount = findings.filter(
    (x) => x.status === "MISSING",
  ).length;

  console.log(`PASS    : ${passCount}`);
  console.log(`REVIEW  : ${reviewCount}`);
  console.log(`MISSING : ${missingCount}`);

  console.log("\nFINAL FINDINGS:");

  for (const finding of findings) {
    result(finding.status, finding.message);
  }

  console.log("\nV33 interpretation:");
  console.log(
    "PASS    = evidence of the expected contract was found.",
  );
  console.log(
    "REVIEW  = potentially significant behavior requires architectural/security decision.",
  );
  console.log(
    "MISSING = expected contract could not be found.",
  );

  console.log("\nIMPORTANT:");
  console.log(
    "This audit performs NO INSERT, UPDATE, or DELETE operations.",
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\nV33 AUDIT ERROR");
  console.error(error);

  await prisma.$disconnect();

  process.exitCode = 1;
});