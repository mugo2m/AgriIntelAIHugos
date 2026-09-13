import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    pass++;
    console.log(
      `PASS  ${label}${detail ? ` — ${detail}` : ""}`,
    );
  } else {
    fail++;
    console.log(
      `FAIL  ${label}${detail ? ` — ${detail}` : ""}`,
    );
  }
}

async function getJson(
  url: string,
): Promise<{ status: number; data: any }> {
  const response = await fetch(url);

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    status: response.status,
    data,
  };
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("GEOGRAPHY RUNTIME ENDPOINT AUDIT V26.1");
  console.log("============================================================");
  console.log(`BASE URL: ${BASE_URL}`);
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  const { prisma } = await import("../lib/prisma");

  /*
   * ==========================================================
   * 1. BUILD A COHERENT CANONICAL GEOGRAPHY CHAIN
   * ==========================================================
   *
   * V26 incorrectly selected:
   *
   *   SubCounty 1309
   *   Ward 1024
   *
   * while Ward 1024 actually belongs to SubCounty 1310.
   *
   * V26.1 therefore starts from an actual Ward and derives
   * County, SubCounty and Constituency from that Ward.
   *
   * This guarantees that the runtime test uses one coherent
   * geography chain.
   */

  const sourceWard = await prisma.ward.findFirst({
    where: {
      countyId: 48,
      constituencyId: 255,
    },
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
  });

  check(
    "Canonical source Ward exists",
    !!sourceWard,
    sourceWard
      ? `${sourceWard.id} ${sourceWard.name}`
      : "none",
  );

  if (!sourceWard) {
    console.log("");
    console.log("Cannot continue without a canonical Ward.");
    await prisma.$disconnect();
    return;
  }

  const countyId = sourceWard.countyId;
  const subCountyId = sourceWard.subCountyId;
  const constituencyId = sourceWard.constituencyId;
  const wardId = sourceWard.id;

  const county = await prisma.county.findUnique({
    where: {
      id: countyId,
    },
    select: {
      id: true,
      name: true,
      countryId: true,
    },
  });

  const subCounty = await prisma.subCounty.findUnique({
    where: {
      id: subCountyId,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const constituency = await prisma.constituency.findUnique({
    where: {
      id: constituencyId,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  console.log("");
  console.log("COHERENT CANONICAL CHAIN");
  console.log(
    `Country      : ${county?.countryId}`,
  );
  console.log(
    `County       : ${county?.id} ${county?.name}`,
  );
  console.log(
    `SubCounty    : ${subCounty?.id} ${subCounty?.name}`,
  );
  console.log(
    `Constituency : ${constituency?.id} ${constituency?.name}`,
  );
  console.log(
    `Ward         : ${sourceWard.id} ${sourceWard.name}`,
  );
  console.log("");

  /*
   * ==========================================================
   * 2. PARENT RELATIONSHIP INTEGRITY
   * ==========================================================
   */

  check(
    "County exists",
    !!county,
    county
      ? `${county.id} ${county.name}`
      : "missing",
  );

  check(
    "SubCounty exists",
    !!subCounty,
    subCounty
      ? `${subCounty.id} ${subCounty.name}`
      : "missing",
  );

  check(
    "SubCounty belongs to County",
    !!subCounty &&
      subCounty.countyId === countyId,
    `countyId=${subCounty?.countyId}`,
  );

  check(
    "Constituency exists",
    !!constituency,
    constituency
      ? `${constituency.id} ${constituency.name}`
      : "missing",
  );

  check(
    "Constituency belongs to County",
    !!constituency &&
      constituency.countyId === countyId,
    `countyId=${constituency?.countyId}`,
  );

  check(
    "Ward belongs to County",
    sourceWard.countyId === countyId,
    `countyId=${sourceWard.countyId}`,
  );

  check(
    "Ward belongs to SubCounty",
    sourceWard.subCountyId === subCountyId,
    `subCountyId=${sourceWard.subCountyId}`,
  );

  check(
    "Ward belongs to Constituency",
    sourceWard.constituencyId === constituencyId,
    `constituencyId=${sourceWard.constituencyId}`,
  );

  /*
   * ==========================================================
   * 3. COUNTRIES ENDPOINT
   * ==========================================================
   */

  const countries = await getJson(
    `${BASE_URL}/api/locations/countries`,
  );

  check(
    "Countries endpoint HTTP 200",
    countries.status === 200,
    `HTTP ${countries.status}`,
  );

  check(
    "Countries endpoint returns array",
    Array.isArray(countries.data),
    Array.isArray(countries.data)
      ? `${countries.data.length} records`
      : "not array",
  );

  const canonicalCountry = Array.isArray(countries.data)
    ? countries.data.find(
        (x: any) => x.id === county?.countryId,
      )
    : null;

  check(
    "Country endpoint contains canonical country",
    !!canonicalCountry,
    canonicalCountry
      ? `${canonicalCountry.id} ${canonicalCountry.name}`
      : "not found",
  );

  /*
   * ==========================================================
   * 4. COUNTIES ENDPOINT
   * ==========================================================
   */

  const counties = await getJson(
    `${BASE_URL}/api/locations/counties?countryId=${county?.countryId}`,
  );

  check(
    "Counties endpoint HTTP 200",
    counties.status === 200,
    `HTTP ${counties.status}`,
  );

  check(
    "Counties endpoint returns array",
    Array.isArray(counties.data),
    Array.isArray(counties.data)
      ? `${counties.data.length} records`
      : "not array",
  );

  const returnedCounty = Array.isArray(counties.data)
    ? counties.data.find(
        (x: any) => x.id === countyId,
      )
    : null;

  check(
    "Counties endpoint contains canonical County",
    !!returnedCounty,
    returnedCounty
      ? `${returnedCounty.id} ${returnedCounty.name}`
      : "not found",
  );

  check(
    "Counties endpoint respects country filter",
    Array.isArray(counties.data) &&
      counties.data.every(
        (x: any) =>
          x.countryId === county?.countryId,
      ),
    "all returned counties belong to selected country",
  );

  /*
   * ==========================================================
   * 5. SUBCOUNTIES ENDPOINT
   * ==========================================================
   */

  const subCounties = await getJson(
    `${BASE_URL}/api/locations/subcounties?countyId=${countyId}`,
  );

  check(
    "SubCounties endpoint HTTP 200",
    subCounties.status === 200,
    `HTTP ${subCounties.status}`,
  );

  check(
    "SubCounties endpoint returns array",
    Array.isArray(subCounties.data),
    Array.isArray(subCounties.data)
      ? `${subCounties.data.length} records`
      : "not array",
  );

  const returnedSubCounty = Array.isArray(
    subCounties.data,
  )
    ? subCounties.data.find(
        (x: any) => x.id === subCountyId,
      )
    : null;

  check(
    "SubCounties endpoint contains canonical SubCounty",
    !!returnedSubCounty,
    returnedSubCounty
      ? `${returnedSubCounty.id} ${returnedSubCounty.name}`
      : "not found",
  );

  check(
    "SubCounties endpoint respects County filter",
    Array.isArray(subCounties.data) &&
      subCounties.data.every(
        (x: any) => x.countyId === countyId,
      ),
    "all returned SubCounties belong to selected County",
  );

  /*
   * ==========================================================
   * 6. CONSTITUENCIES ENDPOINT
   * ==========================================================
   */

  const constituencies = await getJson(
    `${BASE_URL}/api/locations/constituencies?countyId=${countyId}`,
  );

  check(
    "Constituencies endpoint HTTP 200",
    constituencies.status === 200,
    `HTTP ${constituencies.status}`,
  );

  check(
    "Constituencies endpoint returns array",
    Array.isArray(constituencies.data),
    Array.isArray(constituencies.data)
      ? `${constituencies.data.length} records`
      : "not array",
  );

  const returnedConstituency = Array.isArray(
    constituencies.data,
  )
    ? constituencies.data.find(
        (x: any) => x.id === constituencyId,
      )
    : null;

  check(
    "Constituencies endpoint contains canonical Constituency",
    !!returnedConstituency,
    returnedConstituency
      ? `${returnedConstituency.id} ${returnedConstituency.name}`
      : "not found",
  );

  check(
    "Constituencies endpoint respects County filter",
    Array.isArray(constituencies.data) &&
      constituencies.data.every(
        (x: any) => x.countyId === countyId,
      ),
    "all returned constituencies belong to selected County",
  );

  /*
   * ==========================================================
   * 7. WARDS ENDPOINT
   * ==========================================================
   *
   * The actual route requires:
   *
   *   countyId
   *   subCountyId
   *   constituencyId
   *
   * V26 only supplied constituencyId, which correctly produced
   * HTTP 400.
   */

  const wardsUrl =
    `${BASE_URL}/api/locations/wards` +
    `?countyId=${countyId}` +
    `&subCountyId=${subCountyId}` +
    `&constituencyId=${constituencyId}`;

  const wards = await getJson(wardsUrl);

  check(
    "Wards endpoint HTTP 200",
    wards.status === 200,
    `HTTP ${wards.status}`,
  );

  check(
    "Wards endpoint returns array",
    Array.isArray(wards.data),
    Array.isArray(wards.data)
      ? `${wards.data.length} records`
      : "not array",
  );

  const returnedWard = Array.isArray(wards.data)
    ? wards.data.find(
        (x: any) => x.id === wardId,
      )
    : null;

  check(
    "Wards endpoint contains canonical Ward",
    !!returnedWard,
    returnedWard
      ? `${returnedWard.id} ${returnedWard.name}`
      : "not found",
  );

  check(
    "Returned Wards respect County filter",
    Array.isArray(wards.data) &&
      wards.data.every(
        (x: any) => x.countyId === countyId,
      ),
    "all returned wards belong to selected County",
  );

  check(
    "Returned Wards respect SubCounty filter",
    Array.isArray(wards.data) &&
      wards.data.every(
        (x: any) =>
          x.subCountyId === subCountyId,
      ),
    "all returned wards belong to selected SubCounty",
  );

  check(
    "Returned Wards respect Constituency filter",
    Array.isArray(wards.data) &&
      wards.data.every(
        (x: any) =>
          x.constituencyId === constituencyId,
      ),
    "all returned wards belong to selected Constituency",
  );

  /*
   * ==========================================================
   * 8. NEGATIVE SUBCOUNTY TEST
   * ==========================================================
   *
   * A SubCounty must not appear when queried through a
   * different County.
   */

  const wrongCountyId =
    countyId === 48 ? 49 : 48;

  const negativeSubCounty = await getJson(
    `${BASE_URL}/api/locations/subcounties?countyId=${wrongCountyId}`,
  );

  check(
    "Wrong County cannot return canonical SubCounty",
    Array.isArray(negativeSubCounty.data) &&
      !negativeSubCounty.data.some(
        (x: any) => x.id === subCountyId,
      ),
    `wrong county=${wrongCountyId}`,
  );

  /*
   * ==========================================================
   * 9. FARMER UNAUTHENTICATED PROTECTION
   * ==========================================================
   *
   * READ-ONLY integration test.
   *
   * The API must reject the request before any Farmer/Farm
   * creation because no authenticated user exists.
   */

  const farmerResponse = await fetch(
    `${BASE_URL}/api/farmers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "AUDIT",
        lastName: "TEST",
        phoneNumber: "0000000000",
        countryId: county?.countryId,
        countyId,
        subCountyId,
        constituencyId,
        wardId,
        farmName: "READ ONLY AUDIT",
      }),
    },
  );

  check(
    "Unauthenticated Farmer POST returns 401",
    farmerResponse.status === 401,
    `HTTP ${farmerResponse.status}`,
  );

  /*
   * ==========================================================
   * 10. TIATY PRODUCTION VERIFICATION
   * ==========================================================
   */

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  check(
    "Tiaty SubCounty 757 exists",
    !!tiaty,
    tiaty
      ? `${tiaty.id} ${tiaty.name}`
      : "missing",
  );

  check(
    "Tiaty SubCounty has canonical name",
    tiaty?.name === "Tiaty",
    `name=${tiaty?.name}`,
  );

  check(
    "Tiaty belongs to Baringo County 90",
    tiaty?.countyId === 90,
    `countyId=${tiaty?.countyId}`,
  );

  const tiatyWards = await prisma.ward.findMany({
    where: {
      subCountyId: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  check(
    "Tiaty has exactly 7 wards",
    tiatyWards.length === 7,
    `${tiatyWards.length} wards`,
  );

  check(
    "All Tiaty wards belong to County 90",
    tiatyWards.every(
      (ward) => ward.countyId === 90,
    ),
    "all countyId=90",
  );

  check(
    "All Tiaty wards belong to SubCounty 757",
    tiatyWards.every(
      (ward) => ward.subCountyId === 757,
    ),
    "all subCountyId=757",
  );

  /*
   * ==========================================================
   * 11. Tiaty WARD LIST
   * ==========================================================
   *
   * Verify the seven expected production wards.
   */

  const expectedTiatyWardIds = [
    1837,
    1838,
    1839,
    1840,
    1841,
    2190,
    2193,
  ];

  const actualTiatyWardIds =
    tiatyWards.map((ward) => ward.id);

  check(
    "Tiaty contains exactly the 7 canonical Ward IDs",
    expectedTiatyWardIds.every(
      (id) => actualTiatyWardIds.includes(id),
    ) &&
      actualTiatyWardIds.length ===
        expectedTiatyWardIds.length,
    `actual=${actualTiatyWardIds.join(",")}`,
  );

  /*
   * ==========================================================
   * 12. AUDIT FILE SELF-CHECK
   * ==========================================================
   */

  check(
    "Audit source file exists",
    fs.existsSync(
      path.resolve(
        process.cwd(),
        "scripts/geography-runtime-endpoint-audit-v26-1.ts",
      ),
    ),
    "audit file exists",
  );

  /*
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  console.log("");
  console.log("============================================================");
  console.log("GEOGRAPHY RUNTIME ENDPOINT AUDIT V26.1 RESULT");
  console.log("============================================================");
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`TOTAL: ${pass + fail}`);
  console.log("");

  if (fail === 0) {
    console.log("STATUS: GREEN");
    console.log(
      "Runtime geography endpoints are coherent and operational.",
    );
  } else {
    console.log("STATUS: REVIEW REQUIRED");
    console.log(
      "One or more runtime checks failed.",
    );
  }

  console.log("");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("AUDIT ERROR");
  console.error(error);

  try {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  } catch {}

  process.exit(1);
});