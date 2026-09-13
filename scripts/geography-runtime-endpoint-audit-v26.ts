import { prisma } from "../lib/prisma";

const BASE_URL = process.env.RUNTIME_BASE_URL || "http://localhost:3000";

type Result = {
  name: string;
  pass: boolean;
  detail: string;
};

const results: Result[] = [];

function check(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(
    `${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`
  );
}

async function getJson(
  url: string,
  options?: RequestInit,
) {
  try {
    const response = await fetch(url, options);

    let body: unknown = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return {
      ok: true,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function main() {
  console.log("");
  console.log("GEOGRAPHY RUNTIME ENDPOINT AUDIT V26");
  console.log("------------------------------------------------------------");
  console.log("READ-ONLY RUNTIME TEST");
  console.log(`BASE URL: ${BASE_URL}`);
  console.log("NO INSERT / UPDATE / DELETE");

  console.log("");
  console.log("============================================================");
  console.log("1. LOAD CANONICAL DATABASE RECORDS");
  console.log("============================================================");

  const country = await prisma.country.findFirst({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const county = await prisma.county.findFirst({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countryId: true,
    },
  });

  const subCounty = await prisma.subCounty.findFirst({
    where: {
      countyId: county?.id,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const constituency = await prisma.constituency.findFirst({
    where: {
      countyId: county?.id,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countyId: true,
    },
  });

  const ward = await prisma.ward.findFirst({
    where: {
      constituencyId: constituency?.id,
      countyId: county?.id,
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
    "Canonical Country available",
    !!country,
    country
      ? `${country.id} | ${country.name}`
      : "No country found",
  );

  check(
    "Canonical County available",
    !!county,
    county
      ? `${county.id} | ${county.name} | country=${county.countryId}`
      : "No county found",
  );

  check(
    "Canonical SubCounty available",
    !!subCounty,
    subCounty
      ? `${subCounty.id} | ${subCounty.name} | county=${subCounty.countyId}`
      : "No SubCounty found",
  );

  check(
    "Canonical Constituency available",
    !!constituency,
    constituency
      ? `${constituency.id} | ${constituency.name} | county=${constituency.countyId}`
      : "No Constituency found",
  );

  check(
    "Canonical Ward available",
    !!ward,
    ward
      ? `${ward.id} | ${ward.name} | county=${ward.countyId} | subCounty=${ward.subCountyId} | constituency=${ward.constituencyId}`
      : "No Ward found",
  );

  if (
    !country ||
    !county ||
    !subCounty ||
    !constituency ||
    !ward
  ) {
    throw new Error(
      "Required canonical geography records could not be loaded.",
    );
  }

  console.log("");
  console.log("Canonical test chain:");
  console.log(
    `Country ${country.id} → County ${county.id} → SubCounty ${subCounty.id} → Constituency ${constituency.id} → Ward ${ward.id}`,
  );

  console.log("");
  console.log("============================================================");
  console.log("2. COUNTRIES ENDPOINT");
  console.log("============================================================");

  const countries = await getJson(
    `${BASE_URL}/api/locations/countries`,
  );

  check(
    "GET /api/locations/countries responds",
    countries.ok,
    countries.ok
      ? `HTTP ${countries.status}`
      : countries.error || "Request failed",
  );

  check(
    "Countries endpoint returns HTTP 200",
    countries.status === 200,
    `HTTP ${countries.status}`,
  );

  const countryArray = Array.isArray(countries.body)
    ? countries.body
    : null;

  check(
    "Countries endpoint returns array",
    !!countryArray,
    countryArray
      ? `Array length ${countryArray.length}`
      : "Response is not an array",
  );

  if (countryArray) {
    const foundCountry = countryArray.some(
      (item: any) => Number(item.id) === country.id,
    );

    check(
      "Countries endpoint contains canonical Country",
      foundCountry,
      foundCountry
        ? `${country.name} (${country.id}) found`
        : `${country.name} (${country.id}) not found`,
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("3. COUNTIES ENDPOINT");
  console.log("============================================================");

  const counties = await getJson(
    `${BASE_URL}/api/locations/counties?countryId=${country.id}`,
  );

  check(
    "GET /api/locations/counties responds",
    counties.ok,
    counties.ok
      ? `HTTP ${counties.status}`
      : counties.error || "Request failed",
  );

  check(
    "Counties endpoint returns HTTP 200",
    counties.status === 200,
    `HTTP ${counties.status}`,
  );

  const countyArray = Array.isArray(counties.body)
    ? counties.body
    : null;

  check(
    "Counties endpoint returns array",
    !!countyArray,
    countyArray
      ? `Array length ${countyArray.length}`
      : "Response is not an array",
  );

  if (countyArray) {
    const foundCounty = countyArray.some(
      (item: any) => Number(item.id) === county.id,
    );

    check(
      "Counties endpoint contains canonical County",
      foundCounty,
      foundCounty
        ? `${county.name} (${county.id}) found`
        : `${county.name} (${county.id}) not found`,
    );

    const wrongCountryCounty = countyArray.some(
      (item: any) =>
        item.countryId !== undefined &&
        Number(item.countryId) !== country.id,
    );

    check(
      "Counties endpoint respects country filter",
      !wrongCountryCounty,
      !wrongCountryCounty
        ? "No returned county belongs to another country"
        : "Returned county has a different countryId",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("4. SUBCOUNTIES ENDPOINT");
  console.log("============================================================");

  const subCounties = await getJson(
    `${BASE_URL}/api/locations/subcounties?countyId=${county.id}`,
  );

  check(
    "GET /api/locations/subcounties responds",
    subCounties.ok,
    subCounties.ok
      ? `HTTP ${subCounties.status}`
      : subCounties.error || "Request failed",
  );

  check(
    "SubCounties endpoint returns HTTP 200",
    subCounties.status === 200,
    `HTTP ${subCounties.status}`,
  );

  const subCountyArray = Array.isArray(subCounties.body)
    ? subCounties.body
    : null;

  check(
    "SubCounties endpoint returns array",
    !!subCountyArray,
    subCountyArray
      ? `Array length ${subCountyArray.length}`
      : "Response is not an array",
  );

  if (subCountyArray) {
    const foundSubCounty = subCountyArray.some(
      (item: any) => Number(item.id) === subCounty.id,
    );

    check(
      "SubCounties endpoint contains canonical SubCounty",
      foundSubCounty,
      foundSubCounty
        ? `${subCounty.name} (${subCounty.id}) found`
        : `${subCounty.name} (${subCounty.id}) not found`,
    );

    const wrongCountySubCounty = subCountyArray.some(
      (item: any) =>
        item.countyId !== undefined &&
        Number(item.countyId) !== county.id,
    );

    check(
      "SubCounties endpoint respects county filter",
      !wrongCountySubCounty,
      !wrongCountySubCounty
        ? "No returned SubCounty belongs to another county"
        : "Returned SubCounty has a different countyId",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("5. CONSTITUENCIES ENDPOINT");
  console.log("============================================================");

  const constituencies = await getJson(
    `${BASE_URL}/api/locations/constituencies?countyId=${county.id}`,
  );

  check(
    "GET /api/locations/constituencies responds",
    constituencies.ok,
    constituencies.ok
      ? `HTTP ${constituencies.status}`
      : constituencies.error || "Request failed",
  );

  check(
    "Constituencies endpoint returns HTTP 200",
    constituencies.status === 200,
    `HTTP ${constituencies.status}`,
  );

  const constituencyArray = Array.isArray(
    constituencies.body,
  )
    ? constituencies.body
    : null;

  check(
    "Constituencies endpoint returns array",
    !!constituencyArray,
    constituencyArray
      ? `Array length ${constituencyArray.length}`
      : "Response is not an array",
  );

  if (constituencyArray) {
    const foundConstituency = constituencyArray.some(
      (item: any) =>
        Number(item.id) === constituency.id,
    );

    check(
      "Constituencies endpoint contains canonical Constituency",
      foundConstituency,
      foundConstituency
        ? `${constituency.name} (${constituency.id}) found`
        : `${constituency.name} (${constituency.id}) not found`,
    );

    const wrongCountyConstituency =
      constituencyArray.some(
        (item: any) =>
          item.countyId !== undefined &&
          Number(item.countyId) !== county.id,
      );

    check(
      "Constituencies endpoint respects county filter",
      !wrongCountyConstituency,
      !wrongCountyConstituency
        ? "No returned Constituency belongs to another county"
        : "Returned Constituency has a different countyId",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("6. WARDS ENDPOINT");
  console.log("============================================================");

  const wards = await getJson(
    `${BASE_URL}/api/locations/wards?constituencyId=${constituency.id}`,
  );

  check(
    "GET /api/locations/wards responds",
    wards.ok,
    wards.ok
      ? `HTTP ${wards.status}`
      : wards.error || "Request failed",
  );

  check(
    "Wards endpoint returns HTTP 200",
    wards.status === 200,
    `HTTP ${wards.status}`,
  );

  const wardArray = Array.isArray(wards.body)
    ? wards.body
    : null;

  check(
    "Wards endpoint returns array",
    !!wardArray,
    wardArray
      ? `Array length ${wardArray.length}`
      : "Response is not an array",
  );

  if (wardArray) {
    const foundWard = wardArray.some(
      (item: any) => Number(item.id) === ward.id,
    );

    check(
      "Wards endpoint contains canonical Ward",
      foundWard,
      foundWard
        ? `${ward.name} (${ward.id}) found`
        : `${ward.name} (${ward.id}) not found`,
    );

    const wrongConstituencyWard = wardArray.some(
      (item: any) =>
        item.constituencyId !== undefined &&
        Number(item.constituencyId) !== constituency.id,
    );

    check(
      "Wards endpoint respects constituency filter",
      !wrongConstituencyWard,
      !wrongConstituencyWard
        ? "No returned Ward belongs to another Constituency"
        : "Returned Ward has a different constituencyId",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log("7. TIATY RUNTIME ENDPOINT TEST");
  console.log("============================================================");

  const tiaty = await prisma.subCounty.findUnique({
    where: {
      id: 757,
    },
    select: {
      id: true,
      name: true,
      countyId: true,
      wards: {
        select: {
          id: true,
          name: true,
          constituencyId: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  check(
    "Tiaty 757 exists",
    !!tiaty &&
      tiaty.id === 757 &&
      tiaty.name === "Tiaty" &&
      tiaty.countyId === 90,
    tiaty
      ? `${tiaty.id} | ${tiaty.name} | county=${tiaty.countyId}`
      : "Tiaty 757 not found",
  );

  check(
    "Tiaty has exactly 7 DB wards",
    !!tiaty && tiaty.wards.length === 7,
    tiaty
      ? `${tiaty.wards.length} wards`
      : "Tiaty not found",
  );

  if (tiaty && tiaty.wards.length > 0) {
    const tiatyConstituencyId =
      tiaty.wards[0].constituencyId;

    const tiatyWardsResponse = await getJson(
      `${BASE_URL}/api/locations/wards?constituencyId=${tiatyConstituencyId}`,
    );

    check(
      "Tiaty Ward endpoint responds",
      tiatyWardsResponse.ok,
      tiatyWardsResponse.ok
        ? `HTTP ${tiatyWardsResponse.status}`
        : tiatyWardsResponse.error || "Request failed",
    );

    const tiatyWardArray = Array.isArray(
      tiatyWardsResponse.body,
    )
      ? tiatyWardsResponse.body
      : null;

    check(
      "Tiaty Ward endpoint returns 7 wards",
      !!tiatyWardArray &&
        tiatyWardArray.length === 7,
      tiatyWardArray
        ? `${tiatyWardArray.length} wards returned`
        : "Response is not an array",
    );

    if (tiatyWardArray) {
      const dbWardIds = tiaty.wards
        .map((item) => item.id)
        .sort((a, b) => a - b);

      const apiWardIds = tiatyWardArray
        .map((item: any) => Number(item.id))
        .sort((a, b) => a - b);

      const same =
        JSON.stringify(dbWardIds) ===
        JSON.stringify(apiWardIds);

      check(
        "Tiaty API wards match DB wards",
        same,
        same
          ? "All 7 Ward IDs match"
          : `DB=${dbWardIds.join(",")} API=${apiWardIds.join(",")}`,
      );

      console.log("");
      console.log("Tiaty API wards:");

      for (const item of tiatyWardArray) {
        console.log(
          `  ${item.id} | ${item.name} | constituency=${item.constituencyId ?? "n/a"}`,
        );
      }
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("8. NEGATIVE LOCATION ENDPOINT TEST");
  console.log("============================================================");

  const otherCounty = await prisma.county.findFirst({
    where: {
      id: {
        not: county.id,
      },
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      countryId: true,
    },
  });

  if (otherCounty) {
    const wrongCountySubCounties =
      await getJson(
        `${BASE_URL}/api/locations/subcounties?countyId=${otherCounty.id}`,
      );

    check(
      "Negative SubCounty endpoint responds",
      wrongCountySubCounties.ok,
      wrongCountySubCounties.ok
        ? `HTTP ${wrongCountySubCounties.status}`
        : wrongCountySubCounties.error || "Request failed",
    );

    const negativeArray =
      Array.isArray(wrongCountySubCounties.body)
        ? wrongCountySubCounties.body
        : null;

    if (negativeArray) {
      const containsCanonicalSubCounty =
        negativeArray.some(
          (item: any) =>
            Number(item.id) === subCounty.id,
        );

      check(
        "Wrong county cannot return canonical SubCounty",
        !containsCanonicalSubCounty,
        !containsCanonicalSubCounty
          ? `SubCounty ${subCounty.id} correctly absent`
          : `SECURITY/OWNERSHIP ISSUE: SubCounty ${subCounty.id} returned`,
      );
    } else {
      check(
        "Wrong county response is valid JSON array",
        false,
        "Expected an array",
      );
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("9. FARMER API AUTHENTICATION RUNTIME TEST");
  console.log("============================================================");

  const unauthenticatedFarmerRequest =
    await getJson(
      `${BASE_URL}/api/farmers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

  check(
    "Unauthenticated Farmer POST responds",
    unauthenticatedFarmerRequest.ok,
    unauthenticatedFarmerRequest.ok
      ? `HTTP ${unauthenticatedFarmerRequest.status}`
      : unauthenticatedFarmerRequest.error || "Request failed",
  );

  check(
    "Unauthenticated Farmer POST returns 401",
    unauthenticatedFarmerRequest.status === 401,
    `HTTP ${unauthenticatedFarmerRequest.status}`,
  );

  console.log("");
  console.log("============================================================");
  console.log("10. FINAL V26 SUMMARY");
  console.log("============================================================");

  const passCount = results.filter(
    (result) => result.pass,
  ).length;

  const failCount = results.filter(
    (result) => !result.pass,
  ).length;

  console.log(`Checks : ${results.length}`);
  console.log(`PASS   : ${passCount}`);
  console.log(`FAIL   : ${failCount}`);

  if (failCount === 0) {
    console.log("");
    console.log("STATUS: PASS");
    console.log("RUNTIME GEOGRAPHY INTEGRATION IS GREEN");
  } else {
    console.log("");
    console.log("STATUS: REVIEW REQUIRED");
    console.log(
      "One or more runtime endpoint checks failed.",
    );
  }

  console.log("");
  console.log("IMPORTANT:");
  console.log("This audit performed no database mutations.");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("V26 AUDIT ERROR");
  console.error(error);

  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect failure.
  }

  process.exit(1);
});
