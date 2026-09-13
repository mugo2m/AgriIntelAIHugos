import fs from "fs";
import path from "path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
connectionString: databaseUrl,
});

const prisma = new PrismaClient({
adapter,
});

const geojsonPath = path.join(
process.cwd(),
"prisma",
"data",
"kenya-wards-1450.geojson"
);

const targetGids = [484, 479, 1750, 1790, 2006, 1994];

const targetGroups = [
{
county: "Nyeri",
names: ["Iria-ini Ward", "Iriaini Ward"],
},
{
county: "Nakuru",
names: ["Biashara Ward"],
},
{
county: "Kisii",
names: ["Kisii Central Ward"],
},
];

function normalize(value: unknown): string {
return String(value ?? "")
.normalize("NFKD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[’'`]/g, "")
.replace(/[^a-zA-Z0-9]/g, "")
.toLowerCase();
}

function loadGeoJSON(): any {
if (!fs.existsSync(geojsonPath)) {
throw new Error(
"GeoJSON file not found: " + geojsonPath
);
}

const raw = fs.readFileSync(geojsonPath, "utf8");
const data = JSON.parse(raw);

if (!Array.isArray(data.features)) {
throw new Error(
"GeoJSON does not contain a valid features array."
);
}

return data;
}

function findSourceByGid(
features: any[],
gid: number | null
): any | null {
if (gid === null) {
return null;
}

for (const feature of features) {
const sourceGid = Number(
feature.properties?.gid
);

if (sourceGid === gid) {
  return feature.properties;
}

}

return null;
}

async function main() {
console.log("");
console.log(
"======================================================"
);
console.log(
"AUTHORITATIVE DUPLICATE WARD AUDIT"
);
console.log(
"======================================================"
);
console.log("");

console.log(
"READ-ONLY AUDIT - NO DATABASE CHANGES"
);
console.log("");

const geojson = loadGeoJSON();
const features = geojson.features;

console.log(
"Authoritative GeoJSON features:",
features.length
);

if (features.length === 1450) {
console.log(
"Authoritative feature count: PASS"
);
} else {
console.log(
"Authoritative feature count: REVIEW REQUIRED"
);
}

console.log("");

const dbWards = await prisma.ward.findMany({
where: {
OR: targetGids.map((gid) => ({
sourceGid: gid,
})),
},
include: {
county: true,
subCounty: true,
constituency: true,
},
orderBy: {
sourceGid: "asc",
},
});

console.log(
"Database target wards:",
dbWards.length,
"/ 6"
);

console.log("");

let fieldFailures = 0;

for (const ward of dbWards) {
const source = findSourceByGid(
features,
ward.sourceGid
);

console.log(
  "--------------------------------------------------"
);
console.log(
  "DB Ward ID:",
  ward.id
);
console.log(
  "--------------------------------------------------"
);

console.log(
  "Database Ward:",
  ward.name
);

console.log(
  "Database County:",
  ward.county?.name ?? "NULL"
);

console.log(
  "Database SubCounty:",
  ward.subCounty?.name ?? "NULL"
);

console.log(
  "Database Constituency:",
  ward.constituency?.name ?? "NULL"
);

console.log(
  "Database sourceGid:",
  ward.sourceGid ?? "NULL"
);

console.log(
  "Database sourceUid:",
  ward.sourceUid ?? "NULL"
);

if (!source) {
  console.log("");
  console.log(
    "AUTHORITATIVE RECORD: NOT FOUND"
  );
  fieldFailures++;
  continue;
}

console.log("");
console.log(
  "AUTHORITATIVE GEOJSON"
);

console.log(
  "gid:",
  source.gid
);

console.log(
  "county:",
  source.county
);

console.log(
  "subcounty:",
  source.subcounty
);

console.log(
  "ward:",
  source.ward
);

console.log(
  "uid:",
  source.uid
);

console.log(
  "scuid:",
  source.scuid
);

console.log(
  "cuid:",
  source.cuid
);

console.log("");
console.log(
  "FIELD COMPARISON"
);

const gidPass =
  Number(source.gid) === ward.sourceGid;

const uidPass =
  source.uid === ward.sourceUid;

const wardNamePass =
  normalize(source.ward) ===
  normalize(ward.name);

const countyPass =
  normalize(source.county) ===
  normalize(ward.county?.name);

const subCountyPass =
  normalize(source.subcounty) ===
  normalize(ward.subCounty?.name);

console.log(
  "sourceGid:",
  gidPass ? "PASS" : "MISMATCH"
);

console.log(
  "sourceUid:",
  uidPass ? "PASS" : "MISMATCH"
);

console.log(
  "Ward Name:",
  wardNamePass ? "PASS" : "MISMATCH"
);

console.log(
  "County:",
  countyPass ? "PASS" : "MISMATCH"
);

console.log(
  "SubCounty:",
  subCountyPass ? "PASS" : "MISMATCH"
);

console.log(
  "Constituency:",
  "NOT COMPARED"
);

console.log(
  "Reason: authoritative GeoJSON does not expose a reliable constituency field."
);

if (
  !gidPass ||
  !uidPass ||
  !wardNamePass ||
  !countyPass ||
  !subCountyPass
) {
  fieldFailures++;
}

}

console.log("");
console.log(
"======================================================"
);
console.log(
"DUPLICATE NAME GROUP ANALYSIS"
);
console.log(
"======================================================"
);

let legitimateGroups = 0;
let reviewGroups = 0;

for (const groupDefinition of targetGroups) {
const group = dbWards.filter((ward) => {
const countyMatch =
normalize(ward.county?.name) ===
normalize(groupDefinition.county);

  const nameMatch =
    groupDefinition.names.some(
      (name) =>
        normalize(name) ===
        normalize(ward.name)
    );

  return countyMatch && nameMatch;
});

console.log("");
console.log(
  groupDefinition.county +
    " duplicate-name group:"
);

console.log(
  "Database records:",
  group.length
);

const authoritative = group
  .map((ward) => {
    return {
      ward,
      source: findSourceByGid(
        features,
        ward.sourceGid
      ),
    };
  })
  .filter((item) => item.source !== null);

const gids = new Set(
  authoritative.map((item) =>
    Number(item.source.gid)
  )
);

const wardUids = new Set(
  authoritative
    .map((item) => item.source.uid)
    .filter(Boolean)
);

const subCountyUids = new Set(
  authoritative
    .map((item) => item.source.scuid)
    .filter(Boolean)
);

console.log(
  "Authoritative records matched:",
  authoritative.length
);

console.log(
  "Unique authoritative GIDs:",
  gids.size
);

console.log(
  "Unique authoritative Ward UIDs:",
  wardUids.size
);

console.log(
  "Unique authoritative SubCounty UIDs:",
  subCountyUids.size
);

if (
  group.length > 1 &&
  authoritative.length === group.length &&
  gids.size === group.length &&
  wardUids.size === group.length
) {
  console.log("");
  console.log(
    "RESULT: LEGITIMATE SAME-NAME WARDS"
  );

  console.log(
    "The records represent distinct authoritative wards."
  );

  console.log(
    "DO NOT merge or delete these wards."
  );

  legitimateGroups++;
} else {
  console.log("");
  console.log(
    "RESULT: REVIEW REQUIRED"
  );

  reviewGroups++;
}

}

console.log("");
console.log(
"======================================================"
);
console.log(
"FINAL RESULT"
);
console.log(
"======================================================"
);

console.log(
"Target wards found:",
dbWards.length === 6
? "PASS"
: "REVIEW REQUIRED"
);

console.log(
"Target field checks:",
fieldFailures === 0
? "PASS"
: "REVIEW REQUIRED"
);

console.log(
"Legitimate same-name groups:",
legitimateGroups
);

console.log(
"Groups requiring review:",
reviewGroups
);

console.log("");

if (
dbWards.length === 6 &&
fieldFailures === 0 &&
reviewGroups === 0 &&
legitimateGroups === 3
) {
console.log(
"FINAL RESULT: PASS"
);

console.log(
  "All three duplicate-name groups are legitimate distinct wards."
);

console.log(
  "No ward repair is recommended."
);

} else {
console.log(
"FINAL RESULT: REVIEW REQUIRED"
);
}

console.log("");
console.log(
"DATABASE CHANGES: 0"
);
console.log("");
}

main().catch((error) => {
console.error("");
console.error(
"AUDIT FAILED"
);
console.error(error);
process.exitCode = 1;
});

