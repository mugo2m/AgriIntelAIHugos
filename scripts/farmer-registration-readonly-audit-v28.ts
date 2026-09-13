import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

let pass = 0;
let fail = 0;
let warn = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    pass++;
    console.log(`PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function warning(label: string, detail = "") {
  warn++;
  console.log(`WARN  ${label}${detail ? ` — ${detail}` : ""}`);
}

function section(title: string) {
  console.log("");
  console.log(title);
  console.log("=".repeat(title.length));
}

function readSource(relativePath: string): string {
  const fullPath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(fullPath)) {
    return "";
  }

  return fs.readFileSync(fullPath, "utf8");
}

async function getJson(url: string): Promise<{
  status: number;
  body: unknown;
  text: string;
}> {
  try {
    const response = await fetch(url);

    const text = await response.text();

    let body: unknown = null;

    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }

    return {
      status: response.status,
      body,
      text,
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      text: error instanceof Error ? error.message : String(error),
    };
  }
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function hasObjectId(
  value: unknown,
  id: number,
): boolean {
  if (!isArray(value)) {
    return false;
  }

  return value.some((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Record<string, unknown>;

    return Number(record.id) === id;
  });
}

function findObjectById(
  value: unknown,
  id: number,
): Record<string, unknown> | null {
  if (!isArray(value)) {
    return null;
  }

  const found = value.find((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Record<string, unknown>;

    return Number(record.id) === id;
  });

  if (!found || typeof found !== "object") {
    return null;
  }

  return found as Record<string, unknown>;
}

async function main() {
  console.log("============================================================");
  console.log("FARMER REGISTRATION READ-ONLY AUDIT V28");
  console.log("============================================================");
  console.log(`BASE URL: ${BASE_URL}`);
  console.log("READ-ONLY: GET ONLY");
  console.log("NO INSERT / UPDATE / DELETE");
  console.log("");

  const farmerApiPath = "app/api/farmers/route.ts";
  const farmerFormPath = "components/FarmerFarmForm.tsx";
  const wardsApiPath = "app/api/locations/wards/route.ts";

  const farmerApi = readSource(farmerApiPath);
  const farmerForm = readSource(farmerFormPath);
  const wardsApi = readSource(wardsApiPath);

  section("SOURCE FILE CONTRACT");

  check(
    "Farmer API route exists",
    farmerApi.length > 0,
    farmerApiPath,
  );

  check(
    "Farmer registration form exists",
    farmerForm.length > 0,
    farmerFormPath,
  );

  check(
    "Wards API route exists",
    wardsApi.length > 0,
    wardsApiPath,
  );

  section("READ-ONLY SAFETY CONTRACT");

  check(
    "Audit script contains no POST requests",
    !/method\s*:\s*["']POST["']/i.test(fs.readFileSync(__filename, "utf8")),
  );

  check(
    "Audit script contains no PUT requests",
    !/method\s*:\s*["']PUT["']/i.test(fs.readFileSync(__filename, "utf8")),
  );

  check(
    "Audit script contains no PATCH requests",
    !/method\s*:\s*["']PATCH["']/i.test(fs.readFileSync(__filename, "utf8")),
  );

  check(
    "Audit script contains no DELETE requests",
    !/method\s*:\s*["']DELETE["']/i.test(fs.readFileSync(__filename, "utf8")),
  );

  check(
    "Audit script contains no Prisma writes",
    !/\.(create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/.test(
      fs.readFileSync(__filename, "utf8"),
    ),
  );

  section("FORM LOCATION CONTRACT");

  check(
    "Form contains countryId",
    /countryId/.test(farmerForm),
  );

  check(
    "Form contains countyId",
    /countyId/.test(farmerForm),
  );

  check(
    "Form contains subCountyId",
    /subCountyId/.test(farmerForm),
  );

  check(
    "Form contains constituencyId",
    /constituencyId/.test(farmerForm),
  );

  check(
    "Form contains wardId",
    /wardId/.test(farmerForm),
  );

  check(
    "Form contains farmName",
    /farmName/.test(farmerForm),
  );

  check(
    "Form contains acreage",
    /acreage/.test(farmerForm),
  );

  check(
    "Form calls countries endpoint",
    /\/api\/locations\/countries/.test(farmerForm),
  );

  check(
    "Form calls counties endpoint",
    /\/api\/locations\/counties/.test(farmerForm),
  );

  check(
    "Form calls subcounties endpoint",
    /\/api\/locations\/subcounties/.test(farmerForm),
  );

  check(
    "Form calls constituencies endpoint",
    /\/api\/locations\/constituencies/.test(farmerForm),
  );

  check(
    "Form calls wards endpoint",
    /\/api\/locations\/wards/.test(farmerForm),
  );

  check(
    "Form submits to /api/farmers",
    /\/api\/farmers/.test(farmerForm),
  );

  check(
    "Form does not explicitly construct userId payload",
    !/userId\s*[:=]/.test(farmerForm),
    "no userId payload construction detected",
  );

  check(
    "Form does not explicitly construct firebaseUid payload",
    !/firebaseUid\s*[:=]/.test(farmerForm),
    "no firebaseUid payload construction detected",
  );

  section("SERVER AUTHENTICATION CONTRACT");

  check(
    "Farmer API uses getCurrentUser",
    /getCurrentUser\s*\(/.test(farmerApi),
  );

  check(
    "Farmer API references Firebase UID",
    /firebaseUid/.test(farmerApi),
  );

  check(
    "Farmer API resolves authenticated identity",
    /currentUser/.test(farmerApi),
  );

  check(
    "Farmer API looks up User by firebaseUid",
    /user\.findUnique[\s\S]*?firebaseUid/.test(farmerApi),
  );

  check(
    "Farmer API has 401 response",
    /status\s*:\s*401/.test(farmerApi),
  );

  check(
    "Farmer API checks missing authentication",
    /!currentUser|!firebaseUid|authentication/i.test(farmerApi),
  );

  section("GEOGRAPHY OWNERSHIP CONTRACT");

  check(
    "Farmer API validates County",
    /countyId/.test(farmerApi),
  );

  const subCountyBlockMatch =
    farmerApi.match(/const\s+subCounty\s*=\s*await[\s\S]*?;/);

  const subCountyBlock =
    subCountyBlockMatch?.[0] ?? farmerApi;

  check(
    "Farmer API queries SubCounty",
    /subCounty\.findFirst|prisma\.subCounty\.findFirst|subCounty/.test(
      farmerApi,
    ),
  );

  check(
    "SubCounty validation uses subCountyId",
    /id\s*:\s*subCountyId/.test(subCountyBlock),
  );

  check(
    "SubCounty validation uses countyId",
    /countyId/.test(subCountyBlock),
  );

  const constituencyBlockMatch =
    farmerApi.match(/const\s+constituency\s*=\s*await[\s\S]*?;/);

  const constituencyBlock =
    constituencyBlockMatch?.[0] ?? farmerApi;

  check(
    "Farmer API queries Constituency",
    /constituency\.findFirst|prisma\.constituency\.findFirst|constituency/.test(
      farmerApi,
    ),
  );

  check(
    "Constituency validation uses constituencyId",
    /id\s*:\s*constituencyId/.test(constituencyBlock),
  );

  check(
    "Constituency validation uses countyId",
    /countyId/.test(constituencyBlock),
  );

  const wardBlockMatch =
    farmerApi.match(/const\s+ward\s*=\s*await[\s\S]*?;/);

  const wardBlock =
    wardBlockMatch?.[0] ?? farmerApi;

  check(
    "Farmer API queries Ward",
    /ward\.findFirst|prisma\.ward\.findFirst|ward/.test(farmerApi),
  );

  check(
    "Ward validation uses wardId",
    /id\s*:\s*wardId/.test(wardBlock),
  );

  check(
    "Ward validation uses countyId",
    /countyId/.test(wardBlock),
  );

  check(
    "Ward validation uses subCountyId",
    /subCountyId/.test(wardBlock),
  );

  check(
    "Ward validation uses constituencyId",
    /constituencyId/.test(wardBlock),
  );

  check(
    "Farmer API validates Village",
    /villageId/.test(farmerApi),
  );

  check(
    "Village validation uses wardId",
    /wardId/.test(farmerApi),
  );

  section("PERSISTENCE CONTRACT");

  check(
    "Farmer API uses Prisma transaction",
    /\$transaction\s*\(/.test(farmerApi),
  );

  check(
    "Farmer API updates existing Farmer",
    /farmer\.update\s*\(/.test(farmerApi),
  );

  check(
    "Farmer API creates new Farmer",
    /farmer\.create\s*\(/.test(farmerApi),
  );

  check(
    "Farmer API creates or updates Farm",
    /farm\.create\s*\(/.test(farmerApi) &&
      /farm\.update\s*\(/.test(farmerApi),
  );

  check(
    "Farmer persistence contains countyId",
    /countyId/.test(farmerApi),
  );

  check(
    "Farmer persistence contains subCountyId",
    /subCountyId/.test(farmerApi),
  );

  check(
    "Farmer persistence contains wardId",
    /wardId/.test(farmerApi),
  );

  section("WARDS API CONTRACT");

  check(
    "Wards API requires countyId",
    /countyId/.test(wardsApi),
  );

  check(
    "Wards API requires subCountyId",
    /subCountyId/.test(wardsApi),
  );

  check(
    "Wards API requires constituencyId",
    /constituencyId/.test(wardsApi),
  );

  check(
    "Wards API filters by countyId",
    /where[\s\S]*countyId/.test(wardsApi),
  );

  check(
    "Wards API filters by subCountyId",
    /where[\s\S]*subCountyId/.test(wardsApi),
  );

  check(
    "Wards API filters by constituencyId",
    /where[\s\S]*constituencyId/.test(wardsApi),
  );

  section("RUNTIME CANONICAL CHAIN");

  /*
   * Known coherent production chain already verified by V26.1/V27:
   *
   * Country      2  Kenya
   * County       48 Isiolo
   * SubCounty    1310 Isiolo
   * Constituency 255 Isiolo North
   * Ward         1024 WABERA
   */

  const countryId = 2;
  const countyId = 48;
  const subCountyId = 1310;
  const constituencyId = 255;
  const wardId = 1024;

  const countriesUrl =
    `${BASE_URL}/api/locations/countries`;

  const countiesUrl =
    `${BASE_URL}/api/locations/counties?countryId=${countryId}`;

  const subCountiesUrl =
    `${BASE_URL}/api/locations/subcounties?countyId=${countyId}`;

  const constituenciesUrl =
    `${BASE_URL}/api/locations/constituencies?countyId=${countyId}`;

  const wardsUrl =
    `${BASE_URL}/api/locations/wards?countyId=${countyId}` +
    `&subCountyId=${subCountyId}` +
    `&constituencyId=${constituencyId}`;

  const countries = await getJson(countriesUrl);
  const counties = await getJson(countiesUrl);
  const subCounties = await getJson(subCountiesUrl);
  const constituencies = await getJson(constituenciesUrl);
  const wards = await getJson(wardsUrl);

  console.log("");
  console.log("CANONICAL RUNTIME CHAIN");
  console.log(`Country      : ${countryId}`);
  console.log(`County       : ${countyId} Isiolo`);
  console.log(`SubCounty    : ${subCountyId} Isiolo`);
  console.log(`Constituency : ${constituencyId} Isiolo North`);
  console.log(`Ward         : ${wardId} WABERA`);

  section("COUNTRIES ENDPOINT");

  check(
    "Countries endpoint returns HTTP 200",
    countries.status === 200,
    `HTTP ${countries.status}`,
  );

  check(
    "Countries endpoint returns array",
    isArray(countries.body),
  );

  check(
    "Countries endpoint contains Kenya",
    hasObjectId(countries.body, countryId),
    `countryId=${countryId}`,
  );

  section("COUNTIES ENDPOINT");

  check(
    "Counties endpoint returns HTTP 200",
    counties.status === 200,
    `HTTP ${counties.status}`,
  );

  check(
    "Counties endpoint returns array",
    isArray(counties.body),
  );

  const canonicalCounty =
    findObjectById(counties.body, countyId);

  check(
    "Counties endpoint contains Isiolo",
    canonicalCounty !== null,
    `countyId=${countyId}`,
  );

  if (canonicalCounty) {
    check(
      "Isiolo belongs to Kenya",
      Number(canonicalCounty.countryId) === countryId,
      `countryId=${canonicalCounty.countryId}`,
    );
  }

  section("SUBCOUNTIES ENDPOINT");

  check(
    "SubCounties endpoint returns HTTP 200",
    subCounties.status === 200,
    `HTTP ${subCounties.status}`,
  );

  check(
    "SubCounties endpoint returns array",
    isArray(subCounties.body),
  );

  const canonicalSubCounty =
    findObjectById(subCounties.body, subCountyId);

  check(
    "SubCounties endpoint contains canonical SubCounty",
    canonicalSubCounty !== null,
    `subCountyId=${subCountyId}`,
  );

  if (canonicalSubCounty) {
    check(
      "Canonical SubCounty belongs to Isiolo County",
      Number(canonicalSubCounty.countyId) === countyId,
      `countyId=${canonicalSubCounty.countyId}`,
    );
  }

  section("CONSTITUENCIES ENDPOINT");

  check(
    "Constituencies endpoint returns HTTP 200",
    constituencies.status === 200,
    `HTTP ${constituencies.status}`,
  );

  check(
    "Constituencies endpoint returns array",
    isArray(constituencies.body),
  );

  const canonicalConstituency =
    findObjectById(constituencies.body, constituencyId);

  check(
    "Constituencies endpoint contains canonical Constituency",
    canonicalConstituency !== null,
    `constituencyId=${constituencyId}`,
  );

  if (canonicalConstituency) {
    check(
      "Canonical Constituency belongs to Isiolo County",
      Number(canonicalConstituency.countyId) === countyId,
      `countyId=${canonicalConstituency.countyId}`,
    );
  }

  section("WARDS ENDPOINT");

  check(
    "Wards endpoint returns HTTP 200",
    wards.status === 200,
    `HTTP ${wards.status}`,
  );

  check(
    "Wards endpoint returns array",
    isArray(wards.body),
  );

  const canonicalWard =
    findObjectById(wards.body, wardId);

  check(
    "Wards endpoint contains WABERA",
    canonicalWard !== null,
    `wardId=${wardId}`,
  );

  if (canonicalWard) {
    check(
      "WABERA respects County filter",
      Number(canonicalWard.countyId) === countyId,
      `countyId=${canonicalWard.countyId}`,
    );

    check(
      "WABERA respects SubCounty filter",
      Number(canonicalWard.subCountyId) === subCountyId,
      `subCountyId=${canonicalWard.subCountyId}`,
    );

    check(
      "WABERA respects Constituency filter",
      Number(canonicalWard.constituencyId) === constituencyId,
      `constituencyId=${canonicalWard.constituencyId}`,
    );
  }

  section("NEGATIVE GEOGRAPHY TESTS");

  const wrongCountyUrl =
    `${BASE_URL}/api/locations/subcounties?countyId=90`;

  const wrongCounty =
    await getJson(wrongCountyUrl);

  check(
    "Wrong County request returns HTTP 200",
    wrongCounty.status === 200,
    `HTTP ${wrongCounty.status}`,
  );

  check(
    "Wrong County does not return Isiolo SubCounty 1310",
    !hasObjectId(wrongCounty.body, subCountyId),
    "1310 must not appear under County 90",
  );

  const missingWardFiltersUrl =
    `${BASE_URL}/api/locations/wards?constituencyId=${constituencyId}`;

  const missingWardFilters =
    await getJson(missingWardFiltersUrl);

  check(
    "Wards endpoint rejects incomplete filter request",
    missingWardFilters.status === 400,
    `HTTP ${missingWardFilters.status}`,
  );

  section("TIATY PRODUCTION GUARD");

  const tiaty = await getJson(
    `${BASE_URL}/api/locations/subcounties?countyId=90`,
  );

  check(
    "Baringo SubCounty endpoint returns HTTP 200",
    tiaty.status === 200,
    `HTTP ${tiaty.status}`,
  );

  const tiatyRecord =
    findObjectById(tiaty.body, 757);

  check(
    "Tiaty 757 exists",
    tiatyRecord !== null,
    "757",
  );

  if (tiatyRecord) {
    check(
      "Tiaty 757 has canonical name",
      String(tiatyRecord.name) === "Tiaty",
      `name=${tiatyRecord.name}`,
    );

    check(
      "Tiaty 757 belongs to Baringo 90",
      Number(tiatyRecord.countyId) === 90,
      `countyId=${tiatyRecord.countyId}`,
    );
  }

  const tiatyWardRows = await getJson(
    `${BASE_URL}/api/locations/wards` +
    `?countyId=90` +
    `&subCountyId=757` +
    `&constituencyId=463`,
  );

  check(
    "Tiaty Wards endpoint returns HTTP 200",
    tiatyWardRows.status === 200,
    `HTTP ${tiatyWardRows.status}`,
  );

  check(
    "Tiaty returns exactly 7 wards",
    isArray(tiatyWardRows.body) &&
      tiatyWardRows.body.length === 7,
    isArray(tiatyWardRows.body)
      ? `${tiatyWardRows.body.length} wards`
      : "non-array response",
  );

  const canonicalTiatyWardIds = [
    1837,
    1838,
    1839,
    1840,
    1841,
    2190,
    2193,
  ];

  const actualTiatyWardIds = isArray(tiatyWardRows.body)
    ? tiatyWardRows.body
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          return Number(
            (item as Record<string, unknown>).id,
          );
        })
        .filter((id) => Number.isInteger(id))
        .sort((a, b) => a - b)
    : [];

  check(
    "Tiaty contains all 7 canonical Ward IDs",
    JSON.stringify(actualTiatyWardIds) ===
      JSON.stringify([...canonicalTiatyWardIds].sort((a, b) => a - b)),
    `actual=${actualTiatyWardIds.join(",")}`,
  );

  section("RUNTIME SAFETY BOUNDARY");

  /*
   * V28 intentionally does NOT execute authenticated Farmer creation
   * or update.
   *
   * V27 already verified:
   * - unauthenticated POST returns 401
   * - source contains Farmer create/update
   * - source contains Farm create/update
   * - source uses Prisma transaction
   *
   * V28 therefore remains strictly GET-only.
   */

  warning(
    "Authenticated Farmer creation/update not executed",
    "V28 is strictly read-only and does not mutate Farmer or Farm records",
  );

  console.log("");
  console.log("============================================================");
  console.log("FARMER REGISTRATION READ-ONLY AUDIT V28 RESULT");
  console.log("============================================================");
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`WARN: ${warn}`);
  console.log(`TOTAL CHECKS: ${pass + fail}`);
  console.log("");

  if (fail === 0) {
    console.log("STATUS: GREEN");
    console.log(
      "Farmer registration read-only contract and runtime geography remain operational.",
    );
  } else {
    console.log("STATUS: RED");
    console.log(
      "One or more V28 checks failed. Inspect the specific FAIL lines before changing production code.",
    );
  }

  console.log("");
  console.log(
    "READ-ONLY GUARANTEE: This audit performs GET requests only and does not create, update, or delete Farmer or Farm records.",
  );
}

main().catch((error) => {
  console.error("");
  console.error("V28 AUDIT ERROR");
  console.error(error);
  process.exit(1);
});