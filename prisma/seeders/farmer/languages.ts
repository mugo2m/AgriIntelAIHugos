import { PrismaClient } from "../../../lib/generated/prisma/client";

export async function seedLanguages(prisma: PrismaClient) {
  const languages = [
    { name: "English", code: "en" },
    { name: "Kiswahili", code: "sw" },
    { name: "Kikuyu", code: "ki" },
    { name: "Kalenjin", code: "kln" },
    { name: "Luo", code: "luo" },
    { name: "Luhya", code: "luy" },
    { name: "Kamba", code: "kam" },
    { name: "Kisii", code: "guz" },
    { name: "Somali", code: "so" },
    { name: "Maasai", code: "mas" },
  ];

  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
      },
      create: language,
    });
  }

  console.log(`   ✓ Languages: ${languages.length}`);
}