import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
adapter: new PrismaPg({
connectionString: process.env.DATABASE_URL!,
}),
});

function normalizeName(value: string): string {
return value
.normalize("NFKD")
.replace(/[\u0300-\u036f]/g, "")
.toLowerCase()
.replace(/[^a-z0-9]+/g, "")
.trim();
}

type ConstituencyAudit = {
id: number;
name: string;
countyId: number;
countyName: string;
wardCount: number;
};

async function main() {
console.log("============================================================");
console.log("GLOBAL CONSTITUENCY AUDIT");
console.log("READ-ONLY — NO DATABASE CHANGES");
console.log("============================================================");
console.log();

const [countyCount, subCountyCount, constituencyCount, wardCount] =
await Promise.all([
prisma.county.count(),
prisma.subCounty.count(),
prisma.constituency.count(),
prisma.ward.count(),
]);

console.log(`Counties:        ${countyCount}`);
console.log(`SubCounties:     ${subCountyCount}`);
console.log(`Constituencies:  ${constituencyCount}`);
console.log(`Wards:           ${wardCount}`);
console.log();

// ------------------------------------------------------------
// 1. Load all constituencies with their county and wards
// ------------------------------------------------------------

const constituencies = await prisma.constituency.findMany({
orderBy: [
{
countyId: "asc",
},
{
id: "asc",
},
],
include: {
county: {
select: {
id: true,
name: true,
},
},
wards: {
select: {
id: true,
name: true,
countyId: true,
constituencyId: true,
subCountyId: true,
},
orderBy: {
id: "asc",
},
},
},
});

console.log(`Loaded ${constituencies.length} constituencies.`);
console.log();

// ------------------------------------------------------------
// 2. Build audit records
// ------------------------------------------------------------

const audits: ConstituencyAudit[] = constituencies.map((c) => ({
id: c.id,
name: c.name,
countyId: c.countyId,
countyName: c.county.name,
wardCount: c.wards.length,
}));

// ------------------------------------------------------------
// 3. Orphan constituencies
// ------------------------------------------------------------

const orphanConstituencies = audits.filter(
(c) => c.wardCount === 0
);

const populatedConstituencies = audits.filter(
(c) => c.wardCount > 0
);

console.log("------------------------------------------------------------");
console.log("1. CONSTITUENCY POPULATION");
console.log("------------------------------------------------------------");

console.log(
`Total Constituencies:      ${audits.length}`
);

console.log(
`Populated Constituencies:  ${populatedConstituencies.length}`
);

console.log(
`Orphan Constituencies:     ${orphanConstituencies.length}`
);

console.log();

if (orphanConstituencies.length > 0) {
console.log("ORPHAN CONSTITUENCIES:");
console.log();

for (const c of orphanConstituencies) {
  console.log(
    `ID ${c.id} | ${c.name} | County ${c.countyId} ${c.countyName}`
  );
}

console.log();

} else {
console.log("PASS: No orphan constituencies found.");
console.log();
}

// ------------------------------------------------------------
// 4. Detect normalized duplicate constituency names
// ------------------------------------------------------------

const duplicateGroups = new Map<
string,
ConstituencyAudit[]

> ();

for (const c of audits) {
const key = `${c.countyId}|${normalizeName(c.name)}`;

if (!duplicateGroups.has(key)) {
  duplicateGroups.set(key, []);
}

duplicateGroups.get(key)!.push(c);

}

const normalizedDuplicates = Array.from(
duplicateGroups.values()
).filter((group) => group.length > 1);

console.log("------------------------------------------------------------");
console.log("2. NORMALIZED DUPLICATE CHECK");
console.log("------------------------------------------------------------");

console.log(
`Normalized duplicate groups: ${normalizedDuplicates.length}`
);

console.log();

if (normalizedDuplicates.length > 0) {
for (const group of normalizedDuplicates) {
console.log(
`County ${group[0].countyId} | ${group[0].countyName}`
);

  for (const c of group) {
    console.log(
      `  ID ${c.id} | ${c.name} | Wards: ${c.wardCount}`
    );
  }

  console.log();
}

} else {
console.log("PASS: No normalized duplicate constituencies found.");
console.log();
}

// ------------------------------------------------------------
// 5. Validate Constituency -> County
// ------------------------------------------------------------

const invalidCountyAssignments: Array<{
id: number;
name: string;
countyId: number;
countyName: string;
}> = [];

for (const c of constituencies) {
if (!c.county) {
invalidCountyAssignments.push({
id: c.id,
name: c.name,
countyId: c.countyId,
countyName: "MISSING COUNTY",
});
}
}

console.log("------------------------------------------------------------");
console.log("3. CONSTITUENCY → COUNTY INTEGRITY");
console.log("------------------------------------------------------------");

console.log(
`Invalid Constituency→County assignments: ${invalidCountyAssignments.length}`
);

console.log();

if (invalidCountyAssignments.length === 0) {
console.log(
"PASS: Every constituency has a valid County relationship."
);
} else {
for (const c of invalidCountyAssignments) {
console.log(
`INVALID | ID ${c.id} | ${c.name} | County ID ${c.countyId}`
);
}
}

console.log();

// ------------------------------------------------------------
// 6. Load all wards for direct relationship validation
// ------------------------------------------------------------

const wards = await prisma.ward.findMany({
select: {
id: true,
name: true,
countyId: true,
constituencyId: true,
subCountyId: true,
constituency: {
select: {
id: true,
name: true,
countyId: true,
},
},
county: {
select: {
id: true,
name: true,
},
},
subCounty: {
select: {
id: true,
name: true,
countyId: true,
county: {
select: {
id: true,
name: true,
},
},
},
},
},
orderBy: {
id: "asc",
},
});

// ------------------------------------------------------------
// 7. Validate Ward -> Constituency
// ------------------------------------------------------------

const wardsWithInvalidConstituency =
wards.filter((w) => {
if (w.constituencyId === null) {
return true;
}

  if (!w.constituency) {
    return true;
  }

  return w.constituency.id !== w.constituencyId;
});

console.log("------------------------------------------------------------");
console.log("4. WARD → CONSTITUENCY INTEGRITY");
console.log("------------------------------------------------------------");

console.log(
`Wards with NULL/invalid Constituency: ${wardsWithInvalidConstituency.length}`
);

console.log();

if (wardsWithInvalidConstituency.length === 0) {
console.log(
"PASS: Every ward has a valid Constituency relationship."
);
} else {
for (const w of wardsWithInvalidConstituency) {
console.log(
`INVALID | Ward ${w.id} | ${w.name} | Constituency ID ${w.constituencyId}`
);
}
}

console.log();

// ------------------------------------------------------------
// 8. Validate Ward -> Constituency -> County
// ------------------------------------------------------------

const hierarchyMismatches = wards.filter((w) => {
if (!w.constituency) {
return true;
}

if (!w.county) {
  return true;
}

return (
  w.constituency.countyId !== w.countyId
);

});

console.log("------------------------------------------------------------");
console.log("5. WARD → CONSTITUENCY → COUNTY CONSISTENCY");
console.log("------------------------------------------------------------");

console.log(
`Ward/Constituency/County mismatches: ${hierarchyMismatches.length}`
);

console.log();

if (hierarchyMismatches.length === 0) {
console.log(
"PASS: Ward → Constituency → County hierarchy is consistent."
);
} else {
for (const w of hierarchyMismatches) {
console.log(
`MISMATCH | Ward ${w.id} ${w.name} | ` +
`Ward County ${w.countyId} | ` +
`Constituency ${w.constituency?.id ?? "NULL"} ` +
`${w.constituency?.name ?? ""} | ` +
`Constituency County ${w.constituency?.countyId ?? "NULL"}`
);
}
}

console.log();

// ------------------------------------------------------------
// 9. Validate Ward -> SubCounty -> County against Ward County
//    This is included as an additional hierarchy safety check.
// ------------------------------------------------------------

const subCountyCountyMismatches = wards.filter((w) => {
if (!w.subCounty) {
return false;
}

return w.subCounty.countyId !== w.countyId;

});

console.log("------------------------------------------------------------");
console.log("6. WARD → SUBCOUNTY → COUNTY CROSS-CHECK");
console.log("------------------------------------------------------------");

console.log(
`Ward/SubCounty/County mismatches: ${subCountyCountyMismatches.length}`
);

console.log();

if (subCountyCountyMismatches.length === 0) {
console.log(
"PASS: Ward → SubCounty → County relationships remain consistent."
);
} else {
for (const w of subCountyCountyMismatches) {
console.log(
`MISMATCH | Ward ${w.id} ${w.name} | ` +
`Ward County ${w.countyId} | ` +
`SubCounty ${w.subCounty?.id ?? "NULL"} ` +
`${w.subCounty?.name ?? ""} | ` +
`SubCounty County ${w.subCounty?.countyId ?? "NULL"}`
);
}
}

console.log();

// ------------------------------------------------------------
// 10. County-by-county summary
// ------------------------------------------------------------

const countySummary = new Map<
number,
{
countyName: string;
constituencyCount: number;
orphanCount: number;
wardCount: number;
}

> ();

for (const c of audits) {
if (!countySummary.has(c.countyId)) {
countySummary.set(c.countyId, {
countyName: c.countyName,
constituencyCount: 0,
orphanCount: 0,
wardCount: 0,
});
}

const summary = countySummary.get(c.countyId)!;

summary.constituencyCount += 1;
summary.wardCount += c.wardCount;

if (c.wardCount === 0) {
  summary.orphanCount += 1;
}

}

console.log("------------------------------------------------------------");
console.log("7. COUNTY-BY-COUNTY CONSTITUENCY SUMMARY");
console.log("------------------------------------------------------------");

const sortedCountySummary = Array.from(
countySummary.entries()
).sort((a, b) => a[0] - b[0]);

for (const [countyId, summary] of sortedCountySummary) {
console.log(
`County ${countyId} | ${summary.countyName} | ` +
`Constituencies: ${summary.constituencyCount} | ` +
`Orphans: ${summary.orphanCount} | ` +
`Wards: ${summary.wardCount}`
);
}

console.log();

// ------------------------------------------------------------
// 11. Final audit summary
// ------------------------------------------------------------

const passed =
invalidCountyAssignments.length === 0 &&
wardsWithInvalidConstituency.length === 0 &&
hierarchyMismatches.length === 0 &&
subCountyCountyMismatches.length === 0;

console.log("============================================================");
console.log("FINAL CONSTITUENCY AUDIT SUMMARY");
console.log("============================================================");

console.log(`Counties:                         ${countyCount}`);
console.log(`SubCounties:                      ${subCountyCount}`);
console.log(`Constituencies:                   ${constituencyCount}`);
console.log(`Wards:                            ${wardCount}`);
console.log(
`Orphan Constituencies:             ${orphanConstituencies.length}`
);
console.log(
`Normalized Duplicate Groups:      ${normalizedDuplicates.length}`
);
console.log(
`Invalid County Assignments:        ${invalidCountyAssignments.length}`
);
console.log(
`Invalid Ward Constituencies:       ${wardsWithInvalidConstituency.length}`
);
console.log(
`Hierarchy Mismatches:              ${hierarchyMismatches.length}`
);
console.log(
`SubCounty County Mismatches:       ${subCountyCountyMismatches.length}`
);
console.log();
console.log(
`DATABASE CHANGES DURING AUDIT:     0`
);
console.log(
`INSERT/UPDATE/DELETE OPERATIONS:   0`
);
console.log(
`SCHEMA CHANGES:                    0`
);
console.log();

if (passed) {
console.log("FINAL RESULT: PASS");
console.log(
"Constituency relationships and hierarchy integrity are valid."
);
} else {
console.log("FINAL RESULT: REVIEW REQUIRED");
console.log(
"One or more constituency hierarchy checks require investigation."
);
}

console.log("============================================================");
}

main()
.catch((error) => {
console.error();
console.error("AUDIT FAILED");
console.error(error);
process.exitCode = 1;
})
.finally(async () => {
await prisma.$disconnect();
});
