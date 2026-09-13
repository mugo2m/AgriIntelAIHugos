// prisma/seeders/system/roles.ts

import { PrismaClient } from "../../../lib/generated/prisma/client";
import { ROLES } from "../../../lib/constants/roles";

// =====================================================
// SEED SYSTEM ROLES
// =====================================================

export async function seedRoles(prisma: PrismaClient) {
  console.log("   → Seeding roles...");

  // -----------------------------------------------------
  // SYSTEM ROLES
  // -----------------------------------------------------
  //
  // IMPORTANT:
  // These roles MUST match the roles defined in:
  //
  // lib/constants/roles.ts
  //
  // Do not add a role here unless it also exists in ROLES.
  // -----------------------------------------------------

  const roles = [
    // ===================================================
    // PLATFORM
    // ===================================================

    {
      name: ROLES.SUPER_ADMIN,
      description: "Full platform administrator.",
    },

    // ===================================================
    // GOVERNMENT
    // ===================================================

    {
      name: ROLES.NATIONAL_ADMIN,
      description:
        "Manages the national agricultural system and coordinates national agricultural programs.",
    },

    {
      name: ROLES.COUNTY_DIRECTOR,
      description:
        "Heads agricultural operations and services within a county.",
    },

    {
      name: ROLES.SUB_COUNTY_OFFICER,
      description:
        "Coordinates agricultural services and extension activities at sub-county level.",
    },

    {
      name: ROLES.WARD_EXTENSION_OFFICER,
      description:
        "Supervises agricultural extension activities within a ward.",
    },

    {
      name: ROLES.EXTENSION_OFFICER,
      description:
        "Provides agricultural extension support and technical services to farmers.",
    },

    // ===================================================
    // FARM
    // ===================================================

    {
      name: ROLES.FARM_OWNER,
      description:
        "Owns and manages agricultural farm operations registered on the platform.",
    },

    {
      name: ROLES.FARM_MANAGER,
      description:
        "Manages day-to-day farm operations, resources, workers, and production activities.",
    },

    {
      name: ROLES.FARM_SUPERVISOR,
      description:
        "Supervises farm workers and coordinates assigned agricultural activities.",
    },

    {
      name: ROLES.FARM_WORKER,
      description:
        "Performs assigned agricultural and farm production activities.",
    },

    // ===================================================
    // FARMERS
    // ===================================================

    {
      name: ROLES.FARMER,
      description:
        "Registered agricultural producer using the AgriIntel AI Hugos platform.",
    },

    {
      name: ROLES.LEAD_FARMER,
      description:
        "Experienced farmer who supports other farmers and participates in agricultural extension activities.",
    },

    // ===================================================
    // LIVESTOCK
    // ===================================================

    {
      name: ROLES.VETERINARY_OFFICER,
      description:
        "Provides veterinary services, livestock health support, diagnosis, and animal health advisory services.",
    },

    // ===================================================
    // AGRIBUSINESS
    // ===================================================

    {
      name: ROLES.BUYER,
      description:
        "Purchases agricultural products and interacts with farmers and suppliers through the marketplace.",
    },

    {
      name: ROLES.CUSTOMER,
      description:
        "Registered customer who purchases agricultural products, services, or other offerings.",
    },

    {
      name: ROLES.SUPPLIER,
      description:
        "Supplies agricultural inputs, products, equipment, or services through the platform.",
    },

    {
      name: ROLES.AGROVET,
      description:
        "Provides agricultural inputs, veterinary products, and related advisory services.",
    },

    {
      name: ROLES.TRANSPORTER,
      description:
        "Provides transportation and logistics services for agricultural products and inputs.",
    },

    {
      name: ROLES.PROCESSOR,
      description:
        "Processes agricultural products into value-added products.",
    },

    {
      name: ROLES.EXPORTER,
      description:
        "Manages the export of agricultural products to external markets.",
    },

    // ===================================================
    // COOPERATIVES
    // ===================================================

    {
      name: ROLES.COOPERATIVE_MANAGER,
      description:
        "Manages cooperative operations, members, records, and agricultural activities.",
    },

    {
      name: ROLES.COOPERATIVE_MEMBER,
      description:
        "Registered member participating in cooperative agricultural activities and services.",
    },

    // ===================================================
    // FINANCE
    // ===================================================

    {
      name: ROLES.ACCOUNTANT,
      description:
        "Manages financial records, accounting transactions, and financial reporting.",
    },

    {
      name: ROLES.AUDITOR,
      description:
        "Reviews financial and operational records to support accountability, compliance, and transparency.",
    },
  ];

  // =====================================================
  // UPSERT ROLES
  // =====================================================

  const now = new Date();

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role.name,
      },

      update: {
        description: role.description,
        updatedAt: now,
      },

      create: {
        name: role.name,
        description: role.description,
        updatedAt: now,
      },
    });
  }

  // =====================================================
  // SUMMARY
  // =====================================================

  console.log(`   ✓ Roles seeded: ${roles.length}`);
}