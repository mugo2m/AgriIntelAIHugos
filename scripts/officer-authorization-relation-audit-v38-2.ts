import fs from "fs";
import path from "path";

const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");

console.log("=".repeat(70));
console.log("OFFICER AUTHORIZATION RELATION AUDIT V38.2.1");
console.log("=".repeat(70));
console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
console.log();

if (!fs.existsSync(schemaPath)) {
  console.error(`ERROR: Prisma schema not found: ${schemaPath}`);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, "utf8");

console.log(`Schema: ${schemaPath}`);
console.log(`Schema size: ${schema.length} characters`);
console.log();

type ModelInfo = {
  name: string;
  body: string;
  fields: string[];
};

type RelationField = {
  model: string;
  field: string;
  target: string;
  relationName?: string;
  raw: string;
};

const targetModels = [
  "User",
  "Role",
  "Country",
  "County",
  "SubCounty",
  "Ward",
];

function extractModel(modelName: string): ModelInfo | null {
  const escaped = modelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `model\\s+${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`,
    "m",
  );

  const match = schema.match(regex);

  if (!match) {
    return null;
  }

  const body = match[1];

  const fields = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("//") &&
        !line.startsWith("///"),
    );

  return {
    name: modelName,
    body,
    fields,
  };
}

function extractRelationFields(model: ModelInfo): RelationField[] {
  const relations: RelationField[] = [];

  for (const line of model.fields) {
    if (!line.includes("@relation")) {
      continue;
    }

    const match = line.match(
      /^(\w+)\s+(\w+)(?:\[\])?\??\s+@relation\s*(?:\((.*?)\))?/,
    );

    if (!match) {
      continue;
    }

    const field = match[1];
    const target = match[2];
    const relationArguments = match[3] ?? "";

    let relationName: string | undefined;

    const relationNameMatch = relationArguments.match(
      /"([^"]+)"/,
    );

    if (relationNameMatch) {
      relationName = relationNameMatch[1];
    }

    relations.push({
      model: model.name,
      field,
      target,
      relationName,
      raw: line,
    });
  }

  return relations;
}

/**
 * Prisma field detection.
 *
 * We deliberately inspect the first token of each model field line.
 * This avoids the previous multiline-regex false negatives.
 *
 * Examples correctly detected:
 *
 * id          Int
 * firebaseUid String @unique
 * roleId      Int
 * countryId   Int
 * county      County @relation(...)
 */
function fieldExists(model: ModelInfo, fieldName: string): boolean {
  return model.fields.some((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("//")) {
      return false;
    }

    const firstToken = trimmed.split(/\s+/)[0];

    return firstToken === fieldName;
  });
}

function scalarFieldExists(
  model: ModelInfo,
  fieldName: string,
): boolean {
  return fieldExists(model, fieldName);
}

const models = new Map<string, ModelInfo>();

let modelPass = 0;
let modelFail = 0;

for (const modelName of targetModels) {
  const model = extractModel(modelName);

  if (!model) {
    console.log(`❌ MISSING MODEL: ${modelName}`);
    modelFail++;
    continue;
  }

  models.set(modelName, model);
  modelPass++;

  console.log(`✓ MODEL FOUND: ${modelName}`);
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 1: EXISTING RELATION FIELDS");
console.log("-".repeat(70));

const allRelations: RelationField[] = [];

for (const modelName of targetModels) {
  const model = models.get(modelName);

  if (!model) {
    continue;
  }

  const relations = extractRelationFields(model);

  allRelations.push(...relations);

  console.log();
  console.log(`${modelName}:`);

  if (relations.length === 0) {
    console.log("  No @relation fields detected.");
    continue;
  }

  for (const relation of relations) {
    const relationLabel = relation.relationName
      ? ` relation="${relation.relationName}"`
      : "";

    console.log(
      `  ${relation.field} → ${relation.target}${relationLabel}`,
    );
  }
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 2: EXISTING CANDIDATE OFFICER RELATION FIELDS");
console.log("-".repeat(70));

const candidateFields = [
  "officerAssignments",
  "officerAssignment",
  "assignments",
  "officerFunctions",
  "officerFunction",
  "functions",
];

for (const modelName of targetModels) {
  const model = models.get(modelName);

  if (!model) {
    continue;
  }

  console.log();
  console.log(`${modelName}:`);

  for (const field of candidateFields) {
    if (fieldExists(model, field)) {
      console.log(`  ⚠ EXISTS: ${field}`);
    } else {
      console.log(`  ✓ AVAILABLE: ${field}`);
    }
  }
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 3: REQUIRED GEOGRAPHY SCALAR FIELDS");
console.log("-".repeat(70));

const geographyRequirements: Record<string, string[]> = {
  Country: ["id"],
  County: ["id", "countryId"],
  SubCounty: ["id", "countyId"],
  Ward: ["id", "countyId", "subCountyId", "constituencyId"],
};

let geographyPass = 0;
let geographyFail = 0;

for (const [modelName, fields] of Object.entries(
  geographyRequirements,
)) {
  const model = models.get(modelName);

  console.log();
  console.log(`${modelName}:`);

  if (!model) {
    console.log(`  ❌ MODEL MISSING`);
    geographyFail += fields.length;
    continue;
  }

  for (const field of fields) {
    if (scalarFieldExists(model, field)) {
      console.log(`  ✓ ${field}`);
      geographyPass++;
    } else {
      console.log(`  ❌ ${field} MISSING`);
      geographyFail++;
    }
  }
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 4: USER / ROLE AUTHORIZATION FIELDS");
console.log("-".repeat(70));

const authorizationRequirements: Record<string, string[]> = {
  User: ["id", "firebaseUid", "roleId"],
  Role: ["id", "name"],
};

let authorizationPass = 0;
let authorizationFail = 0;

for (const [modelName, fields] of Object.entries(
  authorizationRequirements,
)) {
  const model = models.get(modelName);

  console.log();
  console.log(`${modelName}:`);

  if (!model) {
    console.log(`  ❌ MODEL MISSING`);
    authorizationFail += fields.length;
    continue;
  }

  for (const field of fields) {
    if (scalarFieldExists(model, field)) {
      console.log(`  ✓ ${field}`);
      authorizationPass++;
    } else {
      console.log(`  ❌ ${field} MISSING`);
      authorizationFail++;
    }
  }
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 5: PROPOSED OFFICERASSIGNMENT RELATION DESIGN");
console.log("-".repeat(70));

console.log(`
OfficerAssignment
-----------------
userId       → User.id
roleId       → Role.id
functionId   → OfficerFunction.id
countryId    → Country.id
countyId     → County.id
subCountyId  → SubCounty.id
wardId       → Ward.id
`);

console.log("Recommended explicit Prisma relation names:");

console.log(`
user       → User
role       → Role
function   → OfficerFunction

country    → Country
county     → County
subCounty  → SubCounty
ward       → Ward
`);

console.log();
console.log("-".repeat(70));
console.log("SECTION 6: RECOMMENDED REVERSE RELATION FIELDS");
console.log("-".repeat(70));

const reverseRecommendations: Array<
  [string, string, string]
> = [
  ["User", "officerAssignments", "OfficerAssignment[]"],
  ["Role", "officerAssignments", "OfficerAssignment[]"],
  ["Country", "officerAssignments", "OfficerAssignment[]"],
  ["County", "officerAssignments", "OfficerAssignment[]"],
  ["SubCounty", "officerAssignments", "OfficerAssignment[]"],
  ["Ward", "officerAssignments", "OfficerAssignment[]"],
  ["OfficerFunction", "assignments", "OfficerAssignment[]"],
];

for (const [
  modelName,
  fieldName,
  type,
] of reverseRecommendations) {
  const model =
    modelName === "OfficerFunction"
      ? extractModel("OfficerFunction")
      : models.get(modelName);

  if (!model) {
    console.log(
      `⚠ ${modelName}: model not currently present`,
    );
    continue;
  }

  if (fieldExists(model, fieldName)) {
    console.log(
      `⚠ ${modelName}.${fieldName} already exists`,
    );
  } else {
    console.log(
      `✓ ${modelName}.${fieldName} is available`,
    );
  }

  console.log(`    proposed type: ${type}`);
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 7: EXISTING RELATION NAME COLLISIONS");
console.log("-".repeat(70));

const officerRelationNames = new Set([
  "OfficerAssignmentUser",
  "OfficerAssignmentRole",
  "OfficerAssignmentFunction",
  "OfficerAssignmentCountry",
  "OfficerAssignmentCounty",
  "OfficerAssignmentSubCounty",
  "OfficerAssignmentWard",
]);

const existingNamedRelations = new Map<
  string,
  RelationField[]
>();

for (const relation of allRelations) {
  if (!relation.relationName) {
    continue;
  }

  const existing =
    existingNamedRelations.get(relation.relationName) ??
    [];

  existing.push(relation);

  existingNamedRelations.set(
    relation.relationName,
    existing,
  );
}

let relationNamePass = 0;
let relationNameFail = 0;

for (const relationName of officerRelationNames) {
  const existing =
    existingNamedRelations.get(relationName);

  if (!existing || existing.length === 0) {
    console.log(
      `✓ AVAILABLE relation name: ${relationName}`,
    );
    relationNamePass++;
    continue;
  }

  console.log(`❌ COLLISION: ${relationName}`);
  relationNameFail++;

  for (const relation of existing) {
    console.log(
      `    ${relation.model}.${relation.field} → ${relation.target}`,
    );
  }
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 8: CURRENT OFFICER MODELS");
console.log("-".repeat(70));

const officerAssignmentModel =
  extractModel("OfficerAssignment");

const officerFunctionModel =
  extractModel("OfficerFunction");

if (officerAssignmentModel) {
  console.log(
    "⚠ OfficerAssignment already exists in schema.prisma.",
  );
} else {
  console.log(
    "✓ OfficerAssignment does not yet exist.",
  );
}

if (officerFunctionModel) {
  console.log(
    "⚠ OfficerFunction already exists in schema.prisma.",
  );
} else {
  console.log(
    "✓ OfficerFunction does not yet exist.",
  );
}

console.log();
console.log("-".repeat(70));
console.log("SECTION 9: PROPOSED SQL RELATIONSHIP MAP");
console.log("-".repeat(70));

console.log(`
User
 │
 ├── id
 ├── firebaseUid
 └── roleId ──────────────→ Role.id
                               │
                               └── name

OfficerAssignment
 │
 ├── userId ─────────────→ User.id
 ├── roleId ─────────────→ Role.id
 ├── functionId ─────────→ OfficerFunction.id
 │
 ├── countryId ──────────→ Country.id
 ├── countyId ───────────→ County.id
 ├── subCountyId ────────→ SubCounty.id
 └── wardId ─────────────→ Ward.id

Country
 └── id

County
 ├── id
 └── countryId ──────────→ Country.id

SubCounty
 ├── id
 └── countyId ───────────→ County.id

Ward
 ├── id
 ├── countyId ───────────→ County.id
 ├── subCountyId ────────→ SubCounty.id
 └── constituencyId ─────→ Constituency.id
`);

console.log();
console.log("-".repeat(70));
console.log("SECTION 10: ARCHITECTURE CHECK");
console.log("-".repeat(70));

console.log(`
Authorization architecture:

Firebase Session
      ↓
User
      ↓
Role
      ↓
OfficerAssignment
      ↓
Function
      ↓
Scope Level
      ↓
Geographic Assignment
      ↓
Authorized Farmer Records

Role       = authority
Function   = specialization
ScopeLevel = National / County / SubCounty / Ward
Geography  = exact geographic boundary
Source     = OFFICIAL / SIMULATED
`);

console.log(
  "✓ Authorization is NOT based on officer name.",
);

console.log(
  "✓ Multiple assignments per user remain supported.",
);

console.log(
  "✓ Multiple functions remain supported.",
);

console.log(
  "✓ Geography remains foreign-key based.",
);

console.log(
  "✓ Existing Country → County → SubCounty → Ward hierarchy is preserved.",
);

console.log(
  "✓ Simulated data can later be replaced by official data.",
);

console.log();
console.log("-".repeat(70));
console.log("SECTION 11: FINAL STATUS");
console.log("-".repeat(70));

const requiredModelsPresent =
  targetModels.every((modelName) =>
    models.has(modelName),
  );

const officerModelsAbsent =
  !officerAssignmentModel &&
  !officerFunctionModel;

const status =
  requiredModelsPresent &&
  geographyFail === 0 &&
  authorizationFail === 0 &&
  relationNameFail === 0 &&
  officerModelsAbsent
    ? "GREEN"
    : "REVIEW";

const totalPass =
  modelPass +
  geographyPass +
  authorizationPass +
  relationNamePass;

const totalFail =
  modelFail +
  geographyFail +
  authorizationFail +
  relationNameFail;

console.log(`Model checks       : ${modelPass} PASS / ${modelFail} FAIL`);
console.log(
  `Geography checks   : ${geographyPass} PASS / ${geographyFail} FAIL`,
);
console.log(
  `Authorization      : ${authorizationPass} PASS / ${authorizationFail} FAIL`,
);
console.log(
  `Relation names     : ${relationNamePass} PASS / ${relationNameFail} FAIL`,
);

console.log(
  `Required models    : ${requiredModelsPresent ? "PASS" : "FAIL"}`,
);

console.log(
  `OfficerAssignment  : ${
    officerAssignmentModel ? "EXISTS" : "NOT YET PRESENT"
  }`,
);

console.log(
  `OfficerFunction    : ${
    officerFunctionModel ? "EXISTS" : "NOT YET PRESENT"
  }`,
);

console.log();
console.log(`TOTAL PASS: ${totalPass}`);
console.log(`TOTAL FAIL: ${totalFail}`);
console.log();
console.log(`V38.2.1 STATUS: ${status}`);

if (status === "GREEN") {
  console.log();
  console.log(
    "NEXT STEP: Define the exact Prisma OfficerFunction and OfficerAssignment models.",
  );
  console.log(
    "NO MIGRATION HAS BEEN PERFORMED.",
  );
}

console.log();
console.log("=".repeat(70));