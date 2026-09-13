import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedCommunicationPreferences(
  prisma: PrismaClient,
) {
  const preferences = [
    "SMS",
    "Phone Call",
    "WhatsApp",
    "Voice",
    "Email",
    "App Notification",
  ];

  for (const name of preferences) {
    await prisma.communicationPreference.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✓ Communication preferences: ${preferences.length}`);
}