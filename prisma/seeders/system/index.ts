// prisma/seeders/system/index.ts

import { PrismaClient } from "../../../lib/generated/prisma/client";

import { seedRoles } from "./roles";
import { seedPermissions } from "./permissions";
import { seedRolePermissions } from "./role-permissions";

export async function seedSystem(prisma: PrismaClient) {
  console.log("");
  console.log("======================================");
  console.log("🌱 Seeding System Module");
  console.log("======================================");

  await seedRoles(prisma);

  await seedPermissions(prisma);

  await seedRolePermissions(prisma);

  console.log("✅ System Module completed.");
}