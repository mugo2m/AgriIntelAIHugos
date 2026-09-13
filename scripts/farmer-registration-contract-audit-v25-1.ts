import fs from "fs";
import path from "path";

import { prisma } from "../lib/prisma";

const ROOT = process.cwd();

const API = path.join(
ROOT,
"app",
"api",
"farmers",
"route.ts",
);

const TARGET_SUBCOUNTY_ID = 757;
const TARGET_COUNTY_ID = 90;

const TARGET_WARD_IDS = [
1837,
1838,
1839,
1840,
1841,
2190,
2193,
];

type CheckResult = {
name: string;
pass: boolean;
detail: string;
};

const checks: CheckResult[] = [];

function pass(name: string, detail: string) {
checks.push({
name,
pass: true,
detail,
});

console.log(`PASS | ${name} | ${detail}`);
}

function fail(name: string, detail: string) {
checks.push({
name,
pass: false,
detail,
});

console.log(`FAIL | ${name} | ${detail}`);
}

function section(title: string) {
console.log("");
console.log(
"============================================================",
);
console.log(title);
console.log(
"============================================================",
);
}

function read(file: string): string {
if (!fs.existsSync(file)) {
return "";
}

return fs.readFileSync(file, "utf8");
}

function normalize(source: string): string {
return source
.toLowerCase()
.replace(/\s+/g, " ");
}

function contains(source: string, value: string): boolean {
return normalize(source).includes(
normalize(value),
);
}

function hasAny(
source: string,
values: string[],
): boolean {
return values.some((value) =>
contains(source, value),
);
}

function extractPostMethod(
source: string,
): string {
const start = source.search(
/export\s+async\s+function\s+POST\s*(/i,
);

if (start < 0) {
return "";
}

const remaining = source.slice(start + 1);

const nextMethod = remaining.search(
/export\s+async\s+function\s+(GET|PUT|PATCH|DELETE)\s*(/i,
);

if (nextMethod >= 0) {
return source.slice(
start,
start + 1 + nextMethod,
);
}

return source.slice(start);
}

function extractSection(
source: string,
startPatterns: RegExp[],
endPatterns: RegExp[] = [],
maxLength = 30000,
): string {
let start = -1;

for (const pattern of startPatterns) {
const match = pattern.exec(source);

```
if (
  match &&
  match.index >= 0
) {
  start = match.index;
  break;
}
```

}

if (start < 0) {
return "";
}

let end = Math.min(
source.length,
start + maxLength,
);

for (const pattern of endPatterns) {
const sliced = source.slice(start + 1);
const match = pattern.exec(sliced);

```
if (
  match &&
  match.index >= 0
) {
  const candidate =
    start +
    1 +
    match.index;

  if (
    candidate > start &&
    candidate < end
  ) {
    end = candidate;
  }
}
```

}

return source.slice(
start,
end,
);
}

function printSource(
title: string,
source: string,
maxLength = 30000,
) {
console.log("");
console.log(
"------------------------------------------------------------",
);
console.log(title);
console.log(
"------------------------------------------------------------",
);

if (!source) {
console.log("NOT FOUND");
return;
}

console.log(
source.slice(
0,
Math.min(
source.length,
maxLength,
),
),
);
}

async function main() {
console.log("");
console.log(
"============================================================",
);
console.log(
"FARMER REGISTRATION CONTRACT AUDIT V25.2",
);
console.log(
"============================================================",
);
console.log(
"READ-ONLY: NO INSERT / UPDATE / DELETE",
);
console.log(`Project root: ${ROOT}`);

// ==========================================================
// 1. FARMER API
// ==========================================================

section("1. FARMER API");

if (fs.existsSync(API)) {
pass(
"Farmer API exists",
"app/api/farmers/route.ts",
);
} else {
fail(
"Farmer API exists",
"app/api/farmers/route.ts missing",
);

```
return;
```

}

const api = read(API);

const post = extractPostMethod(api);

if (post) {
pass(
"POST method detected",
"Farmer registration POST handler found",
);
} else {
fail(
"POST method detected",
"Could not locate Farmer POST handler",
);
}

// ==========================================================
// 2. SERVER AUTHENTICATION
// ==========================================================

section("2. SERVER AUTHENTICATION");

if (
hasAny(post, [
"getCurrentUser()",
"getCurrentUser",
])
) {
pass(
"getCurrentUser detected",
"POST handler obtains authenticated identity",
);
} else {
fail(
"getCurrentUser detected",
"getCurrentUser not detected in POST handler",
);
}

if (
contains(post, "if (!currentUser)") &&
contains(post, "status: 401")
) {
pass(
"Unauthenticated request rejected",
"currentUser guard returns HTTP 401",
);
} else {
fail(
"Unauthenticated request rejected",
"Could not prove HTTP 401 authentication guard",
);
}

// ==========================================================
// 3. FIREBASE UID
// ==========================================================

section("3. FIREBASE UID → DATABASE USER");

const firebaseUidSource =
extractSection(
post,
[
/firebaseUid\s*=/i,
/const\s+firebaseUid/i,
],
[
/prisma.user.findUnique/i,
],
8000,
);

if (
hasAny(post, [
"currentUser.id",
"currentUser.uid",
"firebaseUid",
])
) {
pass(
"Firebase UID extraction",
"Authenticated identity is converted to firebaseUid",
);
} else {
fail(
"Firebase UID extraction",
"Could not detect authenticated Firebase UID mapping",
);
}

if (
contains(post, "prisma.user.findUnique") &&
contains(post, "firebaseUid")
) {
pass(
"Database User lookup",
"User is resolved using firebaseUid",
);
} else {
fail(
"Database User lookup",
"Firebase UID database lookup not detected",
);
}

if (
contains(post, "if (!dbUser)")
) {
pass(
"Database synchronization guard",
"Missing database User is rejected",
);
} else {
fail(
"Database synchronization guard",
"Missing dbUser guard not detected",
);
}

printSource(
"FIREBASE UID SOURCE",
firebaseUidSource,
8000,
);

// ==========================================================
// 4. REQUEST BODY
// ==========================================================

section("4. REQUEST BODY");

if (
contains(post, "await request.json()")
) {
pass(
"Request JSON parsing",
"POST handler parses request JSON",
);
} else {
fail(
"Request JSON parsing",
"request.json() not detected",
);
}

// ==========================================================
// 5. LOCATION VALIDATION SOURCE
// ==========================================================

section("5. LOCATION VALIDATION SOURCE");

const locationValidation =
extractSection(
post,
[
/const\s+country\s*=/i,
/const\s+county\s*=/i,
/const\s+subCounty\s*=/i,
/const\s+constituency\s*=/i,
/const\s+ward\s*=/i,
/countryId/i,
],
[
/prisma.$transaction/i,
],
30000,
);

if (locationValidation) {
pass(
"Location validation source found",
"Validation source located before Farmer transaction",
);
} else {
fail(
"Location validation source found",
"Could not locate location validation source",
);
}

printSource(
"EXACT LOCATION VALIDATION SOURCE",
locationValidation,
30000,
);

// ==========================================================
// 6. COUNTRY VALIDATION
// ==========================================================

section("6. COUNTRY VALIDATION");

if (
hasAny(locationValidation, [
"prisma.country.findUnique",
"prisma.country.findFirst",
"country.findUnique",
"country.findFirst",
]) &&
contains(
locationValidation,
"countryId",
)
) {
pass(
"Country validation",
"Country is resolved using countryId",
);
} else {
fail(
"Country validation",
"Country lookup using countryId not detected",
);
}

// ==========================================================
// 7. COUNTY → COUNTRY
// ==========================================================

section("7. COUNTY → COUNTRY VALIDATION");

const countyLookup =
extractSection(
locationValidation,
[
/prisma.county.(findUnique|findFirst)/i,
],
[
/prisma.subCounty./i,
],
10000,
);

if (
hasAny(countyLookup, [
"prisma.county.findUnique",
"prisma.county.findFirst",
]) &&
contains(
countyLookup,
"id: countyId",
) &&
contains(
countyLookup,
"countryId",
)
) {
pass(
"County → Country validation",
"County is scoped by countyId + countryId",
);
} else {
fail(
"County → Country validation",
"Could not prove county-country ownership validation",
);
}

printSource(
"COUNTY LOOKUP SOURCE",
countyLookup,
10000,
);

// ==========================================================
// 8. SUBCOUNTY → COUNTY
// ==========================================================

section("8. SUBCOUNTY → COUNTY VALIDATION");

const subCountyLookup =
extractSection(
locationValidation,
[
/prisma.subCounty.(findUnique|findFirst)/i,
],
[
/prisma.constituency./i,
],
10000,
);

if (
hasAny(subCountyLookup, [
"prisma.subCounty.findUnique",
"prisma.subCounty.findFirst",
]) &&
contains(
subCountyLookup,
"id: subCountyId",
) &&
contains(
subCountyLookup,
"countyId",
)
) {
pass(
"SubCounty → County validation",
"SubCounty is scoped by subCountyId + countyId",
);
} else {
fail(
"SubCounty → County validation",
"Could not prove SubCounty-county ownership validation",
);
}

printSource(
"SUBCOUNTY LOOKUP SOURCE",
subCountyLookup,
10000,
);

// ==========================================================
// 9. CONSTITUENCY → COUNTY
// ==========================================================

section("9. CONSTITUENCY → COUNTY VALIDATION");

const constituencyLookup =
extractSection(
locationValidation,
[
/prisma.constituency.(findUnique|findFirst)/i,
],
[
/prisma.ward./i,
],
10000,
);

if (
hasAny(constituencyLookup, [
"prisma.constituency.findUnique",
"prisma.constituency.findFirst",
]) &&
contains(
constituencyLookup,
"id: constituencyId",
) &&
contains(
constituencyLookup,
"countyId",
)
) {
pass(
"Constituency → County validation",
"Constituency is scoped by constituencyId + countyId",
);
} else {
fail(
"Constituency → County validation",
"Could not prove constituency-county ownership validation",
);
}

printSource(
"CONSTITUENCY LOOKUP SOURCE",
constituencyLookup,
10000,
);

// ==========================================================
// 10. WARD LOOKUP
// ==========================================================

section("10. WARD LOOKUP");

const wardLookup =
extractSection(
locationValidation,
[
/prisma.ward.(findUnique|findFirst)/i,
],
[],
12000,
);

if (
hasAny(wardLookup, [
"prisma.ward.findUnique",
"prisma.ward.findFirst",
]) &&
contains(
wardLookup,
"id: wardId",
)
) {
pass(
"Ward lookup",
"Ward is resolved using wardId",
);
} else {
fail(
"Ward lookup",
"Ward lookup using wardId not detected",
);
}

// ==========================================================
// 11. WARD → CONSTITUENCY
// ==========================================================

section("11. WARD → CONSTITUENCY");

if (
contains(
wardLookup,
"constituencyId",
)
) {
pass(
"Ward → Constituency relationship",
"Ward lookup/validation references constituencyId",
);
} else {
fail(
"Ward → Constituency relationship",
"Ward constituencyId relationship not detected",
);
}

// ==========================================================
// 12. WARD → COUNTY
// ==========================================================

section("12. WARD → COUNTY");

if (
contains(
wardLookup,
"countyId",
)
) {
pass(
"Ward → County relationship",
"Ward lookup/validation references countyId",
);
} else {
fail(
"Ward → County relationship",
"Ward countyId relationship not detected",
);
}

// ==========================================================
// 13. WARD → SUBCOUNTY
// ==========================================================

section("13. WARD → SUBCOUNTY");

if (
contains(
wardLookup,
"subCountyId",
)
) {
pass(
"Ward → SubCounty relationship",
"Ward lookup/validation references subCountyId",
);
} else {
fail(
"Ward → SubCounty relationship",
"Ward subCountyId relationship not detected",
);
}

// ==========================================================
// 14. EXPLICIT WARD OWNERSHIP
// ==========================================================

section("14. EXPLICIT WARD OWNERSHIP CONTRACT");

const ownershipPatterns = [
"ward.constituencyId",
"ward.countyId",
"ward.subCountyId",
"ward.constituencyId !==",
"ward.countyId !==",
"ward.subCountyId !==",
"ward.constituencyId ===",
"ward.countyId ===",
"ward.subCountyId ===",
];

const ownershipEvidence =
ownershipPatterns.filter(
(pattern) =>
contains(
locationValidation,
pattern,
),
);

if (
ownershipEvidence.length > 0
) {
pass(
"Ward ownership fields",
`Detected: ${ownershipEvidence.join(", ")}`,
);
} else {
fail(
"Ward ownership fields",
"No explicit ward ownership fields detected",
);
}

// ==========================================================
// 15. LOCATION ERROR GUARDS
// ==========================================================

section("15. LOCATION ERROR GUARDS");

const locationErrorTerms = [
"not found",
"invalid",
"does not belong",
"must belong",
"mismatch",
"status: 400",
];

const locationGuardEvidence =
locationErrorTerms.filter(
(term) =>
contains(
locationValidation,
term,
),
);

if (
locationGuardEvidence.length >= 2
) {
pass(
"Location validation error guards",
`Detected: ${locationGuardEvidence.join(", ")}`,
);
} else {
fail(
"Location validation error guards",
`Weak evidence: ${
        locationGuardEvidence.length > 0
          ? locationGuardEvidence.join(", ")
          : "none"
      }`,
);
}

// ==========================================================
// 16. PRISMA TRANSACTION
// ==========================================================

section("16. FARMER TRANSACTION");

const transactionMatch =
/prisma.$transaction\s*(/i.exec(
post,
);

if (transactionMatch) {
pass(
"Prisma transaction exists",
"prisma.$transaction detected",
);
} else {
fail(
"Prisma transaction exists",
"Prisma transaction not detected",
);
}

const transactionBlock =
transactionMatch
? post.slice(
transactionMatch.index,
Math.min(
post.length,
transactionMatch.index + 35000,
),
)
: "";

printSource(
"TRANSACTION SOURCE",
transactionBlock,
35000,
);

// ==========================================================
// 17. EXISTING FARMER UPDATE
// ==========================================================

section("17. EXISTING FARMER UPDATE");

if (
contains(
transactionBlock,
"tx.farmer.update",
)
) {
pass(
"Existing Farmer update path",
"tx.farmer.update detected inside transaction",
);
} else {
fail(
"Existing Farmer update path",
"tx.farmer.update not detected",
);
}

if (
contains(
transactionBlock,
"dbUser.farmer",
)
) {
pass(
"Existing Farmer selected from authenticated User",
"dbUser.farmer detected",
);
} else {
fail(
"Existing Farmer selected from authenticated User",
"dbUser.farmer not detected",
);
}

// ==========================================================
// 18. NEW FARMER CREATE
// ==========================================================

section("18. NEW FARMER CREATE");

if (
contains(
transactionBlock,
"tx.farmer.create",
)
) {
pass(
"New Farmer create path",
"tx.farmer.create detected inside transaction",
);
} else {
fail(
"New Farmer create path",
"tx.farmer.create not detected",
);
}

// ==========================================================
// 19. FARMER USER OWNERSHIP
// ==========================================================

section("19. FARMER USER OWNERSHIP");

if (
contains(
transactionBlock,
"userId",
) &&
contains(
transactionBlock,
"dbUser.id",
)
) {
pass(
"Farmer.userId ownership",
"New Farmer userId derives from dbUser.id",
);
} else {
fail(
"Farmer.userId ownership",
"Could not prove Farmer.userId derives from dbUser.id",
);
}

// ==========================================================
// 20. PHONE OWNERSHIP
// ==========================================================

section("20. PHONE OWNERSHIP");

if (
contains(
post,
"prisma.farmer.findUnique",
) &&
contains(
post,
"phone",
)
) {
pass(
"Phone uniqueness lookup",
"Existing Farmer is checked by normalized phone",
);
} else {
fail(
"Phone uniqueness lookup",
"Phone lookup not detected",
);
}

if (
contains(
post,
"existingFarmer.userId",
) &&
contains(
post,
"dbUser.id",
)
) {
pass(
"Phone ownership protection",
"Phone belonging to another User is rejected",
);
} else {
fail(
"Phone ownership protection",
"Could not prove phone ownership protection",
);
}

// ==========================================================
// 21. FARM CREATE / UPDATE
// ==========================================================

section("21. FARM CREATE / UPDATE");

if (
contains(
transactionBlock,
"tx.farm.update",
)
) {
pass(
"Existing Farm update path",
"tx.farm.update detected",
);
} else {
fail(
"Existing Farm update path",
"tx.farm.update not detected",
);
}

if (
contains(
transactionBlock,
"tx.farm.create",
)
) {
pass(
"New Farm create path",
"tx.farm.create detected",
);
} else {
fail(
"New Farm create path",
"tx.farm.create not detected",
);
}

if (
contains(
transactionBlock,
"farmerId",
) &&
contains(
transactionBlock,
"farmer.id",
)
) {
pass(
"Farm → Farmer ownership",
"Farm farmerId derives from farmer.id",
);
} else {
fail(
"Farm → Farmer ownership",
"Could not prove Farm farmerId ownership",
);
}

// ==========================================================
// 22. DATABASE TIATY
// ==========================================================

section("22. TIATY DATABASE VERIFICATION");

const tiaty =
await prisma.subCounty.findUnique({
where: {
id: TARGET_SUBCOUNTY_ID,
},
select: {
id: true,
name: true,
countyId: true,
},
});

if (
tiaty &&
tiaty.id === TARGET_SUBCOUNTY_ID &&
tiaty.name === "Tiaty" &&
tiaty.countyId === TARGET_COUNTY_ID
) {
pass(
"Tiaty identity",
"757 | Tiaty | county 90",
);
} else {
fail(
"Tiaty identity",
tiaty
? `${tiaty.id} | ${tiaty.name} | county ${tiaty.countyId}`
: "Tiaty 757 not found",
);
}

// ==========================================================
// 23. TIATY WARDS
// ==========================================================

section("23. TIATY WARDS");

const tiatyWards =
await prisma.ward.findMany({
where: {
subCountyId:
TARGET_SUBCOUNTY_ID,
},
orderBy: {
id: "asc",
},
select: {
id: true,
name: true,
subCountyId: true,
constituencyId: true,
countyId: true,
},
});

if (
tiatyWards.length === 7
) {
pass(
"Tiaty ward count",
"Exactly 7 wards",
);
} else {
fail(
"Tiaty ward count",
`Expected 7, found ${tiatyWards.length}`,
);
}

const actualWardIds =
tiatyWards.map(
(ward) => ward.id,
);

const missing =
TARGET_WARD_IDS.filter(
(id) =>
!actualWardIds.includes(id),
);

if (
missing.length === 0
) {
pass(
"Tiaty ward IDs",
TARGET_WARD_IDS.join(", "),
);
} else {
fail(
"Tiaty ward IDs",
`Missing: ${missing.join(", ")}`,
);
}

const wrongCounty =
tiatyWards.filter(
(ward) =>
ward.countyId !==
TARGET_COUNTY_ID,
);

if (
wrongCounty.length === 0
) {
pass(
"Tiaty ward county ownership",
"All Tiaty wards belong to county 90",
);
} else {
fail(
"Tiaty ward county ownership",
`${wrongCounty.length} wrong county ward(s)`,
);
}

const wrongSubCounty =
tiatyWards.filter(
(ward) =>
ward.subCountyId !==
TARGET_SUBCOUNTY_ID,
);

if (
wrongSubCounty.length === 0
) {
pass(
"Tiaty ward SubCounty ownership",
"All 7 wards belong to SubCounty 757",
);
} else {
fail(
"Tiaty ward SubCounty ownership",
`${wrongSubCounty.length} wrong SubCounty ward(s)`,
);
}

// ==========================================================
// 24. HISTORICAL IDS
// ==========================================================

section("24. HISTORICAL GEOGRAPHY IDs");

const historicalSubCounty =
await prisma.subCounty.findUnique({
where: {
id: 463,
},
select: {
id: true,
},
});

if (!historicalSubCounty) {
pass(
"Historical SubCounty 463 absent",
"ID 463 does not exist",
);
} else {
fail(
"Historical SubCounty 463 absent",
"ID 463 still exists",
);
}

const historicalWardIds = [
2629,
2630,
2631,
2632,
];

const historicalWards =
await prisma.ward.findMany({
where: {
id: {
in: historicalWardIds,
},
},
select: {
id: true,
},
});

if (
historicalWards.length === 0
) {
pass(
"Historical Tiaty duplicate Ward IDs absent",
"2629–2632 do not exist",
);
} else {
fail(
"Historical Tiaty duplicate Ward IDs absent",
`Still present: ${historicalWards
        .map((ward) => ward.id)
        .join(", ")}`,
);
}

// ==========================================================
// 25. NATIONAL COUNTS
// ==========================================================

section("25. NATIONAL GEOGRAPHY COUNTS");

const counties =
await prisma.county.count();

const subCounties =
await prisma.subCounty.count();

const wards =
await prisma.ward.count();

if (
counties === 47
) {
pass(
"County count",
"47",
);
} else {
fail(
"County count",
`Expected 47, found ${counties}`,
);
}

if (
subCounties === 301
) {
pass(
"SubCounty count",
"301",
);
} else {
fail(
"SubCounty count",
`Expected 301, found ${subCounties}`,
);
}

if (
wards === 1450
) {
pass(
"Ward count",
"1450",
);
} else {
fail(
"Ward count",
`Expected 1450, found ${wards}`,
);
}

// ==========================================================
// 26. FINAL SUMMARY
// ==========================================================

section("26. V25.2 SUMMARY");

const total =
checks.length;

const passed =
checks.filter(
(check) => check.pass,
).length;

const failed =
checks.filter(
(check) => !check.pass,
).length;

console.log(
`TOTAL CHECKS : ${total}`,
);
console.log(
`PASS         : ${passed}`,
);
console.log(
`FAIL         : ${failed}`,
);
console.log("");

if (
failed === 0
) {
console.log(
"============================================================",
);
console.log(
"V25.2 STATUS: PASS",
);
console.log(
"============================================================",
);
console.log("");
console.log(
"FARMER REGISTRATION CONTRACT IS GREEN.",
);
} else {
console.log(
"============================================================",
);
console.log(
"V25.2 STATUS: REVIEW REQUIRED",
);
console.log(
"============================================================",
);
console.log("");
console.log(
"One or more source/database contract checks failed.",
);
console.log(
"NO DATABASE MUTATION WAS PERFORMED.",
);
console.log("");
console.log(
"Review the exact source printed above.",
);
}

console.log("");
console.log(
"READ-ONLY AUDIT COMPLETE.",
);
console.log(
"NO INSERT / UPDATE / DELETE PERFORMED.",
);
}

main()
.catch((error) => {
console.error("");
console.error(
"V25.2 AUDIT ERROR:",
);
console.error(error);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});
}
