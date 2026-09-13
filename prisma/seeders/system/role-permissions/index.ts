import { PrismaClient } from "../../../../lib/generated/prisma/client";

import { seedAIRolePermissions } from "../role-permissions-ai";

export async function seedRolePermissions(prisma: PrismaClient) {
  console.log("");
  console.log("======================================");
  console.log("Seeding Role Permissions");
  console.log("======================================");

  await seedAIRolePermissions(prisma);

  console.log("✅ Role permissions seeded.");
}