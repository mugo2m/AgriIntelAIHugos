import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const FORM = path.join(ROOT, "components", "FarmerFarmForm.tsx");
const API = path.join(ROOT, "app", "api", "farmers", "route.ts");

function read(file: string): string {
  if (!fs.existsSync(file)) {
    return "";
  }

  return fs.readFileSync(file, "utf8");
}

function section(title: string) {
  console.log("");
  console.log("============================================================");
  console.log(title);
  console.log("============================================================");
}

function printMatches(source: string, pattern: RegExp, label: string) {
  const matches = source.match(pattern);

  if (!matches || matches.length === 0) {
    console.log(`NOT FOUND | ${label}`);
    return;
  }

  console.log(`FOUND | ${label}`);

  for (const match of matches) {
    const index = source.indexOf(match);
    const start = Math.max(0, index - 300);
    const end = Math.min(source.length, index + match.length + 500);

    console.log("");
    console.log(source.slice(start, end));
    console.log("");
  }
}

function normalized(source: string): string {
  return source.toLowerCase().replace(/\s+/g, " ");
}

section("GEOGRAPHY RUNTIME PAYLOAD AUDIT V24.1");
console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
console.log(`Project root: ${ROOT}`);

section("1. FILE EXISTENCE");

console.log(
  fs.existsSync(FORM)
    ? "PASS | FarmerFarmForm.tsx exists"
    : "FAIL | FarmerFarmForm.tsx missing"
);

console.log(
  fs.existsSync(API)
    ? "PASS | farmers/route.ts exists"
    : "FAIL | farmers/route.ts missing"
);

const form = read(FORM);
const api = read(API);

section("2. FORM AUTHENTICATION REFERENCES");

const authPatterns = [
  /currentUser/gi,
  /user\.uid/gi,
  /firebase/gi,
  /auth/gi,
  /getAuth/gi,
  /onAuthStateChanged/gi,
  /userId/gi,
  /firebaseUid/gi,
];

for (const pattern of authPatterns) {
  printMatches(form, pattern, `Form reference ${pattern.source}`);
}

section("3. FORM POST REQUEST");

printMatches(
  form,
  /fetch\s*\(\s*["'`]\/api\/farmers["'`][\s\S]{0,5000}/gi,
  "POST /api/farmers block"
);

printMatches(
  form,
  /JSON\.stringify\s*\([\s\S]{0,5000}/gi,
  "JSON.stringify payload"
);

section("4. FORM PAYLOAD FIELD REFERENCES");

const payloadFields = [
  "userId",
  "firebaseUid",
  "firstName",
  "lastName",
  "phoneNumber",
  "farmName",
  "countryId",
  "countyId",
  "subCountyId",
  "constituencyId",
  "wardId",
];

for (const field of payloadFields) {
  const regex = new RegExp(`\\b${field}\\b`, "gi");
  const matches = form.match(regex);

  console.log(
    `${matches && matches.length > 0 ? "FOUND" : "NOT FOUND"} | ${field} | ${
      matches?.length ?? 0
    } occurrence(s)`
  );
}

section("5. FARMER API REQUEST BODY");

printMatches(
  api,
  /request\.json\s*\(\s*\)[\s\S]{0,6000}/gi,
  "Farmer API request.json block"
);

section("6. FARMER API USER REFERENCES");

const apiUserPatterns = [
  /userId/gi,
  /firebaseUid/gi,
  /prisma\.user/gi,
  /findUnique/gi,
  /findFirst/gi,
  /create/gi,
];

for (const pattern of apiUserPatterns) {
  printMatches(api, pattern, `API reference ${pattern.source}`);
}

section("7. FARMER API LOCATION REFERENCES");

const locationFields = [
  "countryId",
  "countyId",
  "subCountyId",
  "constituencyId",
  "wardId",
];

for (const field of locationFields) {
  const regex = new RegExp(`\\b${field}\\b`, "gi");
  const matches = api.match(regex);

  console.log(
    `${matches && matches.length > 0 ? "FOUND" : "NOT FOUND"} | API ${field} | ${
      matches?.length ?? 0
    } occurrence(s)`
  );
}

section("8. SQL-STYLE CONTRACT ANALYSIS");

const formNormalized = normalized(form);
const apiNormalized = normalized(api);

const formHasUserIdentity =
  formNormalized.includes("userid") ||
  formNormalized.includes("firebaseuid") ||
  formNormalized.includes("currentuser") ||
  formNormalized.includes("user.uid");

const apiHasUserIdentity =
  apiNormalized.includes("userid") ||
  apiNormalized.includes("firebaseuid") ||
  apiNormalized.includes("prisma.user");

console.log(
  `FORM USER IDENTITY: ${
    formHasUserIdentity ? "FOUND" : "NOT FOUND"
  }`
);

console.log(
  `API USER IDENTITY: ${
    apiHasUserIdentity ? "FOUND" : "NOT FOUND"
  }`
);

section("9. INTERPRETATION");

if (formHasUserIdentity && apiHasUserIdentity) {
  console.log("RESULT: USER IDENTITY CONTRACT EXISTS");
  console.log("");
  console.log(
    "The V24 failure was likely a false negative caused by the audit"
  );
  console.log(
    "looking only for the literal userId payload field."
  );
} else if (!formHasUserIdentity && apiHasUserIdentity) {
  console.log("RESULT: FORM-TO-API USER IDENTITY GAP");
  console.log("");
  console.log(
    "The API expects user identity, but the form does not visibly"
  );
  console.log(
    "provide or derive it."
  );
} else if (formHasUserIdentity && !apiHasUserIdentity) {
  console.log("RESULT: API USER IDENTITY GAP");
  console.log("");
  console.log(
    "The form provides user identity, but the Farmer API does not"
  );
  console.log(
    "appear to consume it."
  );
} else {
  console.log("RESULT: USER IDENTITY CONTRACT REQUIRES MANUAL REVIEW");
  console.log("");
  console.log(
    "Neither side contains an obvious user identity contract."
  );
}

section("10. V24.1 SUMMARY");

console.log("V24.1 is READ-ONLY.");
console.log("NO DATABASE MUTATION PERFORMED.");
console.log("");
console.log("Next decision depends on the exact form/API payload shown above.");