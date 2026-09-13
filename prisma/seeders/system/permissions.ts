
// prisma/seeders/system/permissions.ts

import { PrismaClient } from "../../../lib/generated/prisma/client";

import { userPermissions } from "./permissions/users";
import { farmPermissions } from "./permissions/farms";
import { cropPermissions } from "./permissions/crops";
import { livestockPermissions } from "./permissions/livestock";
import { financePermissions } from "./permissions/finance";
import { inventoryPermissions } from "./permissions/inventory";
import { marketplacePermissions } from "./permissions/marketplace";
import { reportPermissions } from "./permissions/reports";
import { aiPermissions } from "./permissions/ai";
import { analyticsPermissions } from "./permissions/analytics";
import { calendarPermissions } from "./permissions/calendar";
import { cooperativePermissions } from "./permissions/cooperative";
import { crmPermissions } from "./permissions/crm";
import { documentPermissions } from "./permissions/documents";
import { fertilizerPermissions } from "./permissions/fertilizer";
import { gisPermissions } from "./permissions/gis";
import { governmentPermissions } from "./permissions/government";
import { knowledgePermissions } from "./permissions/knowledge";
import { notificationPermissions } from "./permissions/notifications";
import { procurementPermissions } from "./permissions/procurement";
import { soilPermissions } from "./permissions/soil";
import { warehousePermissions } from "./permissions/warehouse";
import { settingPermissions } from "./permissions/settings";
import { weatherPermissions } from "./permissions/weather";

/*
|--------------------------------------------------------------------------
| Permission Type
|--------------------------------------------------------------------------
|
| Permission files in this project are not all identical.
|
| Some contain:
|
| {
|   name: "livestock.view",
|   description: "View livestock records"
| }
|
| Others contain:
|
| {
|   name: "users.view",
|   module: "Users",
|   description: "View users"
| }
|
| Some older permission files may also contain additional properties.
|
| The database requires:
|
|   id
|   name
|   module
|   description
|   createdAt
|   updatedAt
|
| This seeder normalizes all permission definitions before writing
| anything to PostgreSQL.
|
*/

type PermissionSeed = {
  id?: string | null;
  name: string;
  description?: string | null;
  module?: string | null;
  action?: string | null;
  [key: string]: unknown;
};

/*
|--------------------------------------------------------------------------
| Derive Module
|--------------------------------------------------------------------------
|
| Converts the first part of a permission name into a readable module.
|
| Examples:
|
| users.view
|       -> Users
|
| livestock.view
|       -> Livestock
|
| ai.dashboard.view
|       -> AI
|
| reports.generate
|       -> Reports
|
| soil.analysis
|       -> Soil
|
| farm.create
|       -> Farms
|
*/

function deriveModule(permissionName: string): string {
  const firstSegment = permissionName
    .split(".")
    .filter(Boolean)[0]
    ?.trim();

  if (!firstSegment) {
    return "General";
  }

  const moduleMap: Record<string, string> = {
    /*
    |--------------------------------------------------------------------------
    | Users
    |--------------------------------------------------------------------------
    */

    user: "Users",
    users: "Users",

    /*
    |--------------------------------------------------------------------------
    | Farms
    |--------------------------------------------------------------------------
    */

    farm: "Farms",
    farms: "Farms",

    /*
    |--------------------------------------------------------------------------
    | Crops
    |--------------------------------------------------------------------------
    */

    crop: "Crops",
    crops: "Crops",

    /*
    |--------------------------------------------------------------------------
    | Livestock
    |--------------------------------------------------------------------------
    */

    livestock: "Livestock",

    /*
    |--------------------------------------------------------------------------
    | Finance
    |--------------------------------------------------------------------------
    */

    finance: "Finance",
    financial: "Finance",

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    inventory: "Inventory",

    /*
    |--------------------------------------------------------------------------
    | Marketplace
    |--------------------------------------------------------------------------
    */

    marketplace: "Marketplace",

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    report: "Reports",
    reports: "Reports",

    /*
    |--------------------------------------------------------------------------
    | AI
    |--------------------------------------------------------------------------
    */

    ai: "AI",

    /*
    |--------------------------------------------------------------------------
    | Analytics
    |--------------------------------------------------------------------------
    */

    analytics: "Analytics",

    /*
    |--------------------------------------------------------------------------
    | Calendar
    |--------------------------------------------------------------------------
    */

    calendar: "Calendar",

    /*
    |--------------------------------------------------------------------------
    | Cooperative
    |--------------------------------------------------------------------------
    */

    cooperative: "Cooperative",
    cooperatives: "Cooperative",

    /*
    |--------------------------------------------------------------------------
    | CRM
    |--------------------------------------------------------------------------
    */

    crm: "CRM",

    /*
    |--------------------------------------------------------------------------
    | Documents
    |--------------------------------------------------------------------------
    */

    document: "Documents",
    documents: "Documents",

    /*
    |--------------------------------------------------------------------------
    | Fertilizer
    |--------------------------------------------------------------------------
    */

    fertilizer: "Fertilizer",

    /*
    |--------------------------------------------------------------------------
    | GIS
    |--------------------------------------------------------------------------
    */

    gis: "GIS",

    /*
    |--------------------------------------------------------------------------
    | Government
    |--------------------------------------------------------------------------
    */

    government: "Government",

    /*
    |--------------------------------------------------------------------------
    | Knowledge
    |--------------------------------------------------------------------------
    */

    knowledge: "Knowledge",

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    notification: "Notifications",
    notifications: "Notifications",

    /*
    |--------------------------------------------------------------------------
    | Procurement
    |--------------------------------------------------------------------------
    */

    procurement: "Procurement",

    /*
    |--------------------------------------------------------------------------
    | Soil
    |--------------------------------------------------------------------------
    */

    soil: "Soil",

    /*
    |--------------------------------------------------------------------------
    | Warehouse
    |--------------------------------------------------------------------------
    */

    warehouse: "Warehouse",

    /*
    |--------------------------------------------------------------------------
    | Settings
    |--------------------------------------------------------------------------
    */

    setting: "Settings",
    settings: "Settings",

    /*
    |--------------------------------------------------------------------------
    | Weather
    |--------------------------------------------------------------------------
    */

    weather: "Weather",

    /*
    |--------------------------------------------------------------------------
    | IoT
    |--------------------------------------------------------------------------
    */

    iot: "IoT",

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    dashboard: "Dashboard",

    /*
    |--------------------------------------------------------------------------
    | Forecasting
    |--------------------------------------------------------------------------
    */

    forecast: "Forecasting",
    forecasting: "Forecasting",

    /*
    |--------------------------------------------------------------------------
    | Business Intelligence
    |--------------------------------------------------------------------------
    */

    bi: "Business Intelligence",

    /*
    |--------------------------------------------------------------------------
    | Business
    |--------------------------------------------------------------------------
    */

    business: "Business",

    /*
    |--------------------------------------------------------------------------
    | Pest
    |--------------------------------------------------------------------------
    */

    pest: "Pest",

    /*
    |--------------------------------------------------------------------------
    | Disease
    |--------------------------------------------------------------------------
    */

    disease: "Disease",

    /*
    |--------------------------------------------------------------------------
    | Treatment
    |--------------------------------------------------------------------------
    */

    treatment: "Treatment",

    /*
    |--------------------------------------------------------------------------
    | Satellite
    |--------------------------------------------------------------------------
    */

    satellite: "Satellite",

    /*
    |--------------------------------------------------------------------------
    | Drone
    |--------------------------------------------------------------------------
    */

    drone: "Drone",

    /*
    |--------------------------------------------------------------------------
    | Image / Computer Vision
    |--------------------------------------------------------------------------
    */

    image: "Computer Vision",

    /*
    |--------------------------------------------------------------------------
    | Livestock AI
    |--------------------------------------------------------------------------
    */

    livestock_ai: "Livestock AI",

    /*
    |--------------------------------------------------------------------------
    | Market
    |--------------------------------------------------------------------------
    */

    market: "Market",

    /*
    |--------------------------------------------------------------------------
    | Price
    |--------------------------------------------------------------------------
    */

    price: "Market",

    /*
    |--------------------------------------------------------------------------
    | Demand
    |--------------------------------------------------------------------------
    */

    demand: "Market",

    /*
    |--------------------------------------------------------------------------
    | Carbon
    |--------------------------------------------------------------------------
    */

    carbon: "Sustainability",

    /*
    |--------------------------------------------------------------------------
    | Sustainability
    |--------------------------------------------------------------------------
    */

    sustainability: "Sustainability",

    /*
    |--------------------------------------------------------------------------
    | Export
    |--------------------------------------------------------------------------
    */

    export: "Export",

    /*
    |--------------------------------------------------------------------------
    | Import
    |--------------------------------------------------------------------------
    */

    import: "Import",

    /*
    |--------------------------------------------------------------------------
    | Audit
    |--------------------------------------------------------------------------
    */

    audit: "Audit",

    /*
    |--------------------------------------------------------------------------
    | System
    |--------------------------------------------------------------------------
    */

    system: "System",
  };

  return (
    moduleMap[firstSegment.toLowerCase()] ??
    firstSegment.charAt(0).toUpperCase() +
      firstSegment.slice(1)
  );
}

/*
|--------------------------------------------------------------------------
| Generate Permission ID
|--------------------------------------------------------------------------
|
| Permission IDs must be stable.
|
| Example:
|
| users.view
|   -> permission_users_view
|
| ai.dashboard.view
|   -> permission_ai_dashboard_view
|
| livestock.view
|   -> permission_livestock_view
|
*/

function generatePermissionId(name: string): string {
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `permission_${normalizedName}`;
}

/*
|--------------------------------------------------------------------------
| Normalize Permission
|--------------------------------------------------------------------------
|
| Guarantees every permission has:
|
|   id
|   name
|   module
|   description
|
*/

function normalizePermission(permission: PermissionSeed) {
  /*
  |--------------------------------------------------------------------------
  | Name
  |--------------------------------------------------------------------------
  */

  const name = String(permission.name ?? "").trim();

  if (!name) {
    throw new Error(
      "A permission is missing its name."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Description
  |--------------------------------------------------------------------------
  */

  const description =
    typeof permission.description === "string" &&
    permission.description.trim().length > 0
      ? permission.description.trim()
      : `Permission: ${name}`;

  /*
  |--------------------------------------------------------------------------
  | Module
  |--------------------------------------------------------------------------
  |
  | If module exists, use it.
  |
  | If module is missing, derive it from permission name.
  |
  */

  const module =
    typeof permission.module === "string" &&
    permission.module.trim().length > 0
      ? permission.module.trim()
      : deriveModule(name);

  /*
  |--------------------------------------------------------------------------
  | ID
  |--------------------------------------------------------------------------
  |
  | If a valid ID already exists, preserve it.
  |
  | Otherwise generate a deterministic ID.
  |
  */

  const id =
    typeof permission.id === "string" &&
    permission.id.trim().length > 0
      ? permission.id.trim()
      : generatePermissionId(name);

  return {
    id,
    name,
    module,
    description,
  };
}

/*
|--------------------------------------------------------------------------
| Safely Convert Permission Collection to Array
|--------------------------------------------------------------------------
|
| This protects the master seeder from malformed imports.
|
| Every permission file is expected to export an array.
|
| If a module accidentally exports undefined/null, this function
| returns an empty array rather than crashing with:
|
|   TypeError: ... is not iterable
|
*/

function normalizePermissionCollection(
  collection: unknown,
  collectionName: string
): PermissionSeed[] {
  if (!Array.isArray(collection)) {
    throw new Error(
      `Permission collection "${collectionName}" is not an array. ` +
        `Expected an exported array such as "${collectionName} = [...]".`
    );
  }

  return collection as PermissionSeed[];
}

/*
|--------------------------------------------------------------------------
| Seed Permissions
|--------------------------------------------------------------------------
*/

export async function seedPermissions(
  prisma: PrismaClient
) {
  console.log("");
  console.log("======================================");
  console.log("   → Seeding permissions...");
  console.log("======================================");

  /*
  |--------------------------------------------------------------------------
  | Build Permission Groups
  |--------------------------------------------------------------------------
  */

  const permissionGroups: Array<{
    name: string;
    permissions: PermissionSeed[];
  }> = [
    {
      name: "Users",
      permissions: normalizePermissionCollection(
        userPermissions,
        "userPermissions"
      ),
    },

    {
      name: "Farms",
      permissions: normalizePermissionCollection(
        farmPermissions,
        "farmPermissions"
      ),
    },

    {
      name: "Crops",
      permissions: normalizePermissionCollection(
        cropPermissions,
        "cropPermissions"
      ),
    },

    {
      name: "Livestock",
      permissions: normalizePermissionCollection(
        livestockPermissions,
        "livestockPermissions"
      ),
    },

    {
      name: "Finance",
      permissions: normalizePermissionCollection(
        financePermissions,
        "financePermissions"
      ),
    },

    {
      name: "Inventory",
      permissions: normalizePermissionCollection(
        inventoryPermissions,
        "inventoryPermissions"
      ),
    },

    {
      name: "Marketplace",
      permissions: normalizePermissionCollection(
        marketplacePermissions,
        "marketplacePermissions"
      ),
    },

    {
      name: "Reports",
      permissions: normalizePermissionCollection(
        reportPermissions,
        "reportPermissions"
      ),
    },

    {
      name: "AI",
      permissions: normalizePermissionCollection(
        aiPermissions,
        "aiPermissions"
      ),
    },

    {
      name: "Analytics",
      permissions: normalizePermissionCollection(
        analyticsPermissions,
        "analyticsPermissions"
      ),
    },

    {
      name: "Calendar",
      permissions: normalizePermissionCollection(
        calendarPermissions,
        "calendarPermissions"
      ),
    },

    {
      name: "Cooperative",
      permissions: normalizePermissionCollection(
        cooperativePermissions,
        "cooperativePermissions"
      ),
    },

    {
      name: "CRM",
      permissions: normalizePermissionCollection(
        crmPermissions,
        "crmPermissions"
      ),
    },

    {
      name: "Documents",
      permissions: normalizePermissionCollection(
        documentPermissions,
        "documentPermissions"
      ),
    },

    {
      name: "Fertilizer",
      permissions: normalizePermissionCollection(
        fertilizerPermissions,
        "fertilizerPermissions"
      ),
    },

    {
      name: "GIS",
      permissions: normalizePermissionCollection(
        gisPermissions,
        "gisPermissions"
      ),
    },

    {
      name: "Government",
      permissions: normalizePermissionCollection(
        governmentPermissions,
        "governmentPermissions"
      ),
    },

    {
      name: "Knowledge",
      permissions: normalizePermissionCollection(
        knowledgePermissions,
        "knowledgePermissions"
      ),
    },

    {
      name: "Notifications",
      permissions: normalizePermissionCollection(
        notificationPermissions,
        "notificationPermissions"
      ),
    },

    {
      name: "Procurement",
      permissions: normalizePermissionCollection(
        procurementPermissions,
        "procurementPermissions"
      ),
    },

    {
      name: "Soil",
      permissions: normalizePermissionCollection(
        soilPermissions,
        "soilPermissions"
      ),
    },

    {
      name: "Warehouse",
      permissions: normalizePermissionCollection(
        warehousePermissions,
        "warehousePermissions"
      ),
    },

    {
      name: "Settings",
      permissions: normalizePermissionCollection(
        settingPermissions,
        "settingPermissions"
      ),
    },

    {
      name: "Weather",
      permissions: normalizePermissionCollection(
        weatherPermissions,
        "weatherPermissions"
      ),
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Flatten Permission Groups
  |--------------------------------------------------------------------------
  */

  const permissions: PermissionSeed[] =
    permissionGroups.flatMap(
      (group) => group.permissions
    );

  console.log(
    `   → Found ${permissions.length} permissions`
  );

  /*
  |--------------------------------------------------------------------------
  | Normalize Permissions
  |--------------------------------------------------------------------------
  */

  const normalizedPermissions =
    permissions.map(normalizePermission);

  /*
  |--------------------------------------------------------------------------
  | Detect Duplicate Permission Names
  |--------------------------------------------------------------------------
  */

  const permissionNames = new Set<string>();

  const duplicateNames = new Set<string>();

  for (const permission of normalizedPermissions) {
    if (permissionNames.has(permission.name)) {
      duplicateNames.add(permission.name);
    }

    permissionNames.add(permission.name);
  }

  if (duplicateNames.size > 0) {
    console.warn("");
    console.warn(
      "⚠ Duplicate permission names detected:"
    );

    for (const name of duplicateNames) {
      console.warn(`   - ${name}`);
    }

    console.warn("");
  }

  /*
  |--------------------------------------------------------------------------
  | Detect Duplicate Permission IDs
  |--------------------------------------------------------------------------
  */

  const permissionIds = new Set<string>();

  const duplicateIds = new Set<string>();

  for (const permission of normalizedPermissions) {
    if (permissionIds.has(permission.id)) {
      duplicateIds.add(permission.id);
    }

    permissionIds.add(permission.id);
  }

  if (duplicateIds.size > 0) {
    console.warn("");
    console.warn(
      "⚠ Duplicate permission IDs detected:"
    );

    for (const id of duplicateIds) {
      console.warn(`   - ${id}`);
    }

    console.warn("");
  }

  /*
  |--------------------------------------------------------------------------
  | Stop Before Database Write if Duplicates Exist
  |--------------------------------------------------------------------------
  |
  | Duplicate names would violate:
  |
  |   name String @unique
  |
  | Duplicate IDs would violate:
  |
  |   id String @id
  |
  | It is safer to stop here than partially seed the database.
  |
  */

  if (
    duplicateNames.size > 0 ||
    duplicateIds.size > 0
  ) {
    throw new Error(
      "Duplicate permission names or IDs detected. " +
        "Fix the permission definition files before seeding."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Detect Derived Modules
  |--------------------------------------------------------------------------
  */

  const derivedModules = normalizedPermissions.filter(
    (permission) => {
      const original = permissions.find(
        (item) => item.name === permission.name
      );

      return (
        !original ||
        typeof original.module !== "string" ||
        original.module.trim().length === 0
      );
    }
  );

  if (derivedModules.length > 0) {
    console.log(
      `   → Derived missing modules for ${derivedModules.length} permissions`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Current Timestamp
  |--------------------------------------------------------------------------
  */

  const now = new Date();

  /*
  |--------------------------------------------------------------------------
  | Counters
  |--------------------------------------------------------------------------
  */

  let created = 0;
  let updated = 0;

  /*
  |--------------------------------------------------------------------------
  | Seed Permissions
  |--------------------------------------------------------------------------
  |
  | We intentionally use:
  |
  |   findUnique
  |   update
  |   create
  |
  | instead of upsert().
  |
  | This gives us complete control over:
  |
  |   id
  |   name
  |   module
  |   description
  |   createdAt
  |   updatedAt
  |
  */

  for (const permission of normalizedPermissions) {
    /*
    |--------------------------------------------------------------------------
    | Find Existing Permission
    |--------------------------------------------------------------------------
    */

    const existing =
      await prisma.permissions.findUnique({
        where: {
          name: permission.name,
        },

        select: {
          id: true,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Existing Permission
    |--------------------------------------------------------------------------
    */

    if (existing) {
      await prisma.permissions.update({
        where: {
          name: permission.name,
        },

        data: {
          module: permission.module,
          description: permission.description,
          updatedAt: now,
        },
      });

      updated++;

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | New Permission
    |--------------------------------------------------------------------------
    */

    await prisma.permissions.create({
      data: {
        id: permission.id,
        name: permission.name,
        module: permission.module,
        description: permission.description,
        createdAt: now,
        updatedAt: now,
      },
    });

    created++;
  }

  /*
  |--------------------------------------------------------------------------
  | Final Report
  |--------------------------------------------------------------------------
  */

  console.log("");
  console.log("======================================");
  console.log(
    "   ✓ Permissions seeded successfully"
  );
  console.log("======================================");

  console.log(
    `   → Total permissions: ${normalizedPermissions.length}`
  );

  console.log(
    `   → Created: ${created}`
  );

  console.log(
    `   → Updated: ${updated}`
  );

  if (derivedModules.length > 0) {
    console.log(
      `   → Missing modules automatically fixed: ${derivedModules.length}`
    );
  }

  if (duplicateNames.size === 0) {
    console.log(
      "   → Duplicate permission names: 0"
    );
  }

  if (duplicateIds.size === 0) {
    console.log(
      "   → Duplicate permission IDs: 0"
    );
  }

  console.log("======================================");
}

