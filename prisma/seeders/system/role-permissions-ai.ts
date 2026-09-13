// prisma/seeders/system/role-permissions-ai.ts

import { PrismaClient } from "../../../lib/generated/prisma/client";
import { ROLES } from "../../../lib/constants/roles";

export async function seedAIRolePermissions(prisma: PrismaClient) {
  console.log("🤖 Assigning AI permissions to roles...");

  const rolePermissions: Record<string, string[]> = {
    [ROLES.SUPER_ADMIN]: [
      "ai.admin",
      "ai.dashboard.view",
      "ai.assistant.use",
      "ai.chat.use",
      "ai.voice.use",
      "ai.decision.view",
      "ai.decision.generate",
      "ai.recommendations.view",
      "ai.recommendations.generate",
      "ai.recommendations.approve",
      "ai.recommendations.reject",
      "ai.crop.predict",
      "ai.crop.yield",
      "ai.crop.risk",
      "ai.soil.analysis",
      "ai.soil.recommendation",
      "ai.fertilizer.recommend",
      "ai.weather.forecast",
      "ai.weather.analysis",
      "ai.pest.detect",
      "ai.disease.detect",
      "ai.treatment.recommend",
      "ai.image.analyze",
      "ai.drone.analyze",
      "ai.satellite.analyze",
      "ai.livestock.health",
      "ai.livestock.production",
      "ai.market.forecast",
      "ai.price.predict",
      "ai.demand.predict",
      "ai.carbon.analysis",
      "ai.sustainability.score",
      "ai.models.view",
      "ai.models.train",
      "ai.models.deploy",
      "ai.models.monitor",
      "ai.llm.use",
      "ai.llm.configure",
    ],

    [ROLES.NATIONAL_ADMIN]: [
      "ai.dashboard.view",
      "ai.assistant.use",
      "ai.decision.view",
      "ai.decision.generate",
      "ai.recommendations.view",
      "ai.recommendations.generate",
      "ai.crop.predict",
      "ai.crop.yield",
      "ai.weather.forecast",
      "ai.market.forecast",
      "ai.price.predict",
      "ai.image.analyze",
      "ai.satellite.analyze",
      "ai.llm.use",
    ],

    [ROLES.COUNTY_DIRECTOR]: [
      "ai.dashboard.view",
      "ai.assistant.use",
      "ai.decision.view",
      "ai.recommendations.view",
      "ai.crop.predict",
      "ai.crop.yield",
      "ai.weather.forecast",
      "ai.price.predict",
      "ai.image.analyze",
      "ai.llm.use",
    ],

    [ROLES.SUB_COUNTY_OFFICER]: [
      "ai.assistant.use",
      "ai.decision.view",
      "ai.recommendations.view",
      "ai.crop.predict",
      "ai.weather.forecast",
      "ai.image.analyze",
      "ai.llm.use",
    ],

    [ROLES.WARD_EXTENSION_OFFICER]: [
      "ai.assistant.use",
      "ai.chat.use",
      "ai.recommendations.view",
      "ai.crop.predict",
      "ai.soil.analysis",
      "ai.weather.forecast",
      "ai.pest.detect",
      "ai.disease.detect",
      "ai.image.analyze",
      "ai.llm.use",
    ],

    [ROLES.EXTENSION_OFFICER]: [
      "ai.assistant.use",
      "ai.chat.use",
      "ai.crop.predict",
      "ai.soil.analysis",
      "ai.weather.forecast",
      "ai.image.analyze",
      "ai.disease.detect",
      "ai.pest.detect",
      "ai.llm.use",
    ],

    [ROLES.FARM_OWNER]: [
      "ai.assistant.use",
      "ai.chat.use",
      "ai.crop.predict",
      "ai.crop.yield",
      "ai.weather.forecast",
      "ai.soil.analysis",
      "ai.fertilizer.recommend",
      "ai.image.analyze",
      "ai.market.forecast",
      "ai.price.predict",
    ],

    [ROLES.FARM_MANAGER]: [
      "ai.assistant.use",
      "ai.crop.predict",
      "ai.weather.forecast",
      "ai.soil.analysis",
      "ai.image.analyze",
      "ai.market.forecast",
    ],

    [ROLES.FARMER]: [
      "ai.assistant.use",
      "ai.chat.use",
      "ai.crop.predict",
      "ai.weather.forecast",
      "ai.image.analyze",
      "ai.pest.detect",
      "ai.disease.detect",
    ],

    [ROLES.LEAD_FARMER]: [
      "ai.assistant.use",
      "ai.chat.use",
      "ai.crop.predict",
      "ai.weather.forecast",
      "ai.image.analyze",
      "ai.pest.detect",
      "ai.disease.detect",
      "ai.market.forecast",
    ],
  };

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findFirst({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      console.warn(`⚠️ Role not found: ${roleName}`);
      continue;
    }

    for (const permissionName of permissions) {
      const permission = await prisma.permissions.findFirst({
        where: {
          name: permissionName,
        },
      });

      if (!permission) {
        console.warn(
          `⚠️ AI permission not found: ${permissionName} for role ${roleName}`,
        );
        continue;
      }

      await prisma.role_permissions.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          id: `role-permission-${role.id}-${permission.id}`,
  roleId: role.id,
  permissionId: permission.id,
        },
      });
    }
  }

  console.log("✅ AI role permissions assigned");
}
