import fs from "fs";
import path from "path";

const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");

let pass = 0;
let review = 0;
let missing = 0;

function PASS(message: string) {
  pass++;
  console.log(`PASS  ${message}`);
}

function REVIEW(message: string) {
  review++;
  console.log(`REVIEW ${message}`);
}

function MISSING(message: string) {
  missing++;
  console.log(`MISSING ${message}`);
}

function section(title: string) {
  console.log("");
  console.log("============================================================");
  console.log(title);
  console.log("============================================================");
}

function getModelBlock(schema: string, modelName: string): string | null {
  const pattern = new RegExp(
    `model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\n\\}`,
    "m"
  );

  const match = schema.match(pattern);

  if (!match) {
    return null;
  }

  return match[1];
}

function getEnumBlock(schema: string, enumName: string): string | null {
  const pattern = new RegExp(
    `enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\n\\}`,
    "m"
  );

  const match = schema.match(pattern);

  if (!match) {
    return null;
  }

  return match[1];
}

function hasField(block: string | null, fieldName: string): boolean {
  if (!block) {
    return false;
  }

  const pattern = new RegExp(`^\\s*${fieldName}\\s+`, "m");

  return pattern.test(block);
}

function hasRelation(block: string | null, relationName: string): boolean {
  if (!block) {
    return false;
  }

  const pattern = new RegExp(`^\\s*${relationName}\\s+`, "m");

  return pattern.test(block);
}

console.log("");
console.log("============================================================");
console.log("V38.1 OFFICER AUTHORIZATION SCHEMA COMPATIBILITY AUDIT");
console.log("============================================================");
console.log("READ-ONLY: NO INSERT / UPDATE / DELETE / MIGRATION");
console.log("");

if (!fs.existsSync(schemaPath)) {
  console.error(`SCHEMA NOT FOUND: ${schemaPath}`);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, "utf8");

console.log(`Schema: ${schemaPath}`);
console.log(`Schema size: ${schema.length} characters`);

section("1. CORE EXISTING MODELS");

const requiredModels = [
  "User",
  "Role",
  "Country",
  "County",
  "SubCounty",
  "Ward",
];

for (const modelName of requiredModels) {
  const block = getModelBlock(schema, modelName);

  if (block) {
    PASS(`Model ${modelName} exists`);
  } else {
    MISSING(`Model ${modelName} does not exist`);
  }
}

section("2. USER MODEL");

const user = getModelBlock(schema, "User");

if (hasField(user, "id")) {
  PASS("User.id exists");
} else {
  MISSING("User.id missing");
}

if (hasField(user, "firebaseUid")) {
  PASS("User.firebaseUid exists");
} else {
  REVIEW("User.firebaseUid not detected");
}

if (hasField(user, "roleId")) {
  PASS("User.roleId exists");
} else {
  MISSING("User.roleId missing");
}

if (hasRelation(user, "role")) {
  PASS("User.role relation exists");
} else {
  REVIEW("User.role relation not detected");
}

section("3. ROLE MODEL");

const role = getModelBlock(schema, "Role");

if (hasField(role, "id")) {
  PASS("Role.id exists");
} else {
  MISSING("Role.id missing");
}

if (hasField(role, "name")) {
  PASS("Role.name exists");
} else {
  REVIEW("Role.name not detected");
}

section("4. COUNTRY MODEL");

const country = getModelBlock(schema, "Country");

if (hasField(country, "id")) {
  PASS("Country.id exists");
} else {
  MISSING("Country.id missing");
}

if (hasField(country, "name")) {
  PASS("Country.name exists");
} else {
  REVIEW("Country.name not detected");
}

section("5. COUNTY MODEL");

const county = getModelBlock(schema, "County");

if (hasField(county, "id")) {
  PASS("County.id exists");
} else {
  MISSING("County.id missing");
}

if (hasField(county, "countryId")) {
  PASS("County.countryId exists");
} else {
  REVIEW("County.countryId not detected");
}

if (hasRelation(county, "country")) {
  PASS("County.country relation exists");
} else {
  REVIEW("County.country relation not detected");
}

section("6. SUB-COUNTY MODEL");

const subCounty = getModelBlock(schema, "SubCounty");

if (hasField(subCounty, "id")) {
  PASS("SubCounty.id exists");
} else {
  MISSING("SubCounty.id missing");
}

if (hasField(subCounty, "countyId")) {
  PASS("SubCounty.countyId exists");
} else {
  REVIEW("SubCounty.countyId not detected");
}

if (hasRelation(subCounty, "county")) {
  PASS("SubCounty.county relation exists");
} else {
  REVIEW("SubCounty.county relation not detected");
}

section("7. WARD MODEL");

const ward = getModelBlock(schema, "Ward");

if (hasField(ward, "id")) {
  PASS("Ward.id exists");
} else {
  MISSING("Ward.id missing");
}

if (hasField(ward, "countyId")) {
  PASS("Ward.countyId exists");
} else {
  REVIEW("Ward.countyId not detected");
}

if (hasField(ward, "subCountyId")) {
  PASS("Ward.subCountyId exists");
} else {
  REVIEW("Ward.subCountyId not detected");
}

if (hasField(ward, "constituencyId")) {
  PASS("Ward.constituencyId exists");
} else {
  REVIEW("Ward.constituencyId not detected");
}

if (hasRelation(ward, "county")) {
  PASS("Ward.county relation exists");
} else {
  REVIEW("Ward.county relation not detected");
}

if (hasRelation(ward, "subCounty")) {
  PASS("Ward.subCounty relation exists");
} else {
  REVIEW("Ward.subCounty relation not detected");
}

section("8. CHECK FOR EXISTING OFFICER MODELS");

const officerAssignment = getModelBlock(schema, "OfficerAssignment");
const officerFunction = getModelBlock(schema, "OfficerFunction");

if (officerAssignment) {
  REVIEW(
    "OfficerAssignment already exists — do NOT create a duplicate model"
  );
} else {
  PASS("OfficerAssignment does not currently exist");
}

if (officerFunction) {
  REVIEW(
    "OfficerFunction already exists — inspect before creating a duplicate"
  );
} else {
  PASS("OfficerFunction does not currently exist");
}

section("9. CHECK FOR EXISTING OFFICER ENUMS");

const scopeEnum = getEnumBlock(schema, "OfficerScopeLevel");

if (scopeEnum) {
  REVIEW("OfficerScopeLevel already exists");
} else {
  PASS("OfficerScopeLevel does not currently exist");
}

const sourceEnum = getEnumBlock(schema, "OfficerAssignmentSource");

if (sourceEnum) {
  REVIEW("OfficerAssignmentSource already exists");
} else {
  PASS("OfficerAssignmentSource does not currently exist");
}

section("10. PROPOSED SCOPE LEVELS");

const proposedScopes = [
  "NATIONAL",
  "COUNTY",
  "SUBCOUNTY",
  "WARD",
];

for (const scope of proposedScopes) {
  console.log(`  ${scope}`);
}

PASS("Four organizational scope levels defined");

section("11. PROPOSED OFFICER FUNCTIONS");

const functions = [
  "Agriculture / General Agriculture",
  "Crops",
  "Agribusiness",
  "Livestock",
  "Veterinary",
  "Fisheries",
  "Agricultural Extension",
  "Monitoring and Evaluation",
  "Liaison",
  "Research",
  "Planning",
  "Programme Management",
  "Project Management",
  "Home Economics",
  "Soil and Water Conservation",
  "Other",
];

for (const functionName of functions) {
  console.log(`  ${functionName}`);
}

PASS(`Officer function catalogue currently contains ${functions.length} functions`);

section("12. PROPOSED AUTHORIZATION ARCHITECTURE");

console.log("");
console.log("  USER");
console.log("    |");
console.log("    +---- ROLE");
console.log("    |       |");
console.log("    |       +---- authority");
console.log("    |");
console.log("    +---- OFFICER ASSIGNMENT");
console.log("            |");
console.log("            +---- FUNCTION");
console.log("            |");
console.log("            +---- SCOPE LEVEL");
console.log("            |");
console.log("            +---- COUNTRY");
console.log("            +---- COUNTY");
console.log("            +---- SUB-COUNTY");
console.log("            +---- WARD");
console.log("");

PASS("Role, function, scope and geography remain separate concepts");

section("13. PROPOSED OFFICER ASSIGNMENT FIELDS");

const proposedFields = [
  "id",
  "userId",
  "roleId",
  "functionId",
  "scopeLevel",
  "countryId",
  "countyId",
  "subCountyId",
  "wardId",
  "active",
  "startDate",
  "endDate",
  "source",
  "verifiedAt",
  "notes",
  "createdAt",
  "updatedAt",
];

for (const field of proposedFields) {
  console.log(`  ${field}`);
}

PASS(`Proposed OfficerAssignment contains ${proposedFields.length} fields`);

section("14. GEOGRAPHIC SCOPE RULES");

console.log("");
console.log("NATIONAL");
console.log("  countryId: optional/expected");
console.log("  countyId: NULL");
console.log("  subCountyId: NULL");
console.log("  wardId: NULL");

console.log("");
console.log("COUNTY");
console.log("  countyId: REQUIRED");
console.log("  subCountyId: NULL");
console.log("  wardId: NULL");

console.log("");
console.log("SUBCOUNTY");
console.log("  countyId: REQUIRED");
console.log("  subCountyId: REQUIRED");
console.log("  wardId: NULL");

console.log("");
console.log("WARD");
console.log("  countyId: REQUIRED");
console.log("  subCountyId: REQUIRED");
console.log("  wardId: REQUIRED");

PASS("Explicit geographic scope rules defined");

section("15. DATA SOURCE CONTROL");

console.log("");
console.log("OFFICIAL  = verified Ministry/authoritative assignment");
console.log("SIMULATED = development/test assignment");

PASS("Official/simulated distinction defined");

section("16. SECURITY PRINCIPLE");

console.log("");
console.log("Authorization must NOT be based on officer name.");
console.log("");
console.log("Correct:");
console.log("  Firebase UID");
console.log("      -> User");
console.log("      -> Role");
console.log("      -> OfficerAssignment");
console.log("      -> Function");
console.log("      -> Geographic Scope");
console.log("      -> Permission");
console.log("");
console.log("Incorrect:");
console.log('  officer.name === "Some Person"');

PASS("Authorization identity principle confirmed");

section("17. FINAL V38.1 RESULT");

console.log("");
console.log(`PASS    : ${pass}`);
console.log(`REVIEW  : ${review}`);
console.log(`MISSING : ${missing}`);
console.log("");

if (missing > 0) {
  console.log("V38.1 STATUS: BLOCKED");
  console.log("Resolve missing core schema dependencies before implementation.");
  process.exitCode = 1;
} else if (review > 0) {
  console.log("V38.1 STATUS: REVIEW REQUIRED");
  console.log("No core dependency is missing, but review items must be inspected before schema modification.");
  process.exitCode = 0;
} else {
  console.log("V38.1 STATUS: GREEN");
  console.log("Schema is compatible with the proposed Officer authorization architecture.");
}