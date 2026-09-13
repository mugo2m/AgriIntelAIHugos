// prisma/seeders/farmer-options.ts

import prisma from "../../lib/prisma";

async function main() {
  console.log("🌱 Seeding farmer registration lookup options...");

  // ---------------------------------------------------------
  // Gender
  // ---------------------------------------------------------
  const genders = [
    "Female",
    "Male",
    "Other",
    "Prefer not to say",
  ];

  for (const name of genders) {
    await prisma.gender.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Education Level
  // ---------------------------------------------------------
  const educationLevels = [
    "No formal education",
    "Primary",
    "Secondary",
    "Certificate",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate",
  ];

  for (const name of educationLevels) {
    await prisma.educationLevel.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Occupation
  // ---------------------------------------------------------
  const occupations = [
    "Farmer",
    "Agricultural Worker",
    "Business Owner",
    "Salaried Employee",
    "Government Employee",
    "Student",
    "Unemployed",
    "Other",
  ];

  for (const name of occupations) {
    await prisma.occupation.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Marital Status
  // ---------------------------------------------------------
  const maritalStatuses = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
  ];

  for (const name of maritalStatuses) {
    await prisma.maritalStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Farmer Type
  // ---------------------------------------------------------
  const farmerTypes = [
    "Smallholder Farmer",
    "Commercial Farmer",
    "Cooperative Farmer",
    "Contract Farmer",
    "Subsistence Farmer",
    "Emerging Farmer",
  ];

  for (const name of farmerTypes) {
    await prisma.farmerType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Farming Activity
  // ---------------------------------------------------------
  const farmingActivities = [
    "Crop Farming",
    "Livestock Farming",
    "Poultry Farming",
    "Dairy Farming",
    "Horticulture",
    "Aquaculture",
    "Mixed Farming",
    "Agroforestry",
  ];

  for (const name of farmingActivities) {
    await prisma.farmingActivity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Languages
  // ---------------------------------------------------------
  const languages = [
    { name: "English", code: "en" },
    { name: "Kiswahili", code: "sw" },
    { name: "Kikuyu", code: "ki" },
    { name: "Kalenjin", code: "kln" },
    { name: "Dholuo", code: "luo" },
    { name: "Luhya", code: "luy" },
    { name: "Kamba", code: "kam" },
    { name: "Ekegusii", code: "guz" },
    { name: "Kimeru", code: "mer" },
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

  // ---------------------------------------------------------
  // Communication Preference
  // ---------------------------------------------------------
  const communicationPreferences = [
    "SMS",
    "Phone Call",
    "WhatsApp",
    "Email",
    "In-App Notification",
  ];

  for (const name of communicationPreferences) {
    await prisma.communicationPreference.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Digital Literacy Level
  // ---------------------------------------------------------
  const digitalLiteracyLevels = [
    "None",
    "Basic",
    "Intermediate",
    "Advanced",
  ];

  for (const name of digitalLiteracyLevels) {
    await prisma.digitalLiteracyLevel.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------
  console.log("");
  console.log("✅ Farmer registration lookup options seeded successfully.");
  console.log("");
  console.log(`Gender:                    ${genders.length}`);
  console.log(`Education levels:          ${educationLevels.length}`);
  console.log(`Occupations:               ${occupations.length}`);
  console.log(`Marital statuses:          ${maritalStatuses.length}`);
  console.log(`Farmer types:              ${farmerTypes.length}`);
  console.log(`Farming activities:        ${farmingActivities.length}`);
  console.log(`Languages:                 ${languages.length}`);
  console.log(
    `Communication preferences: ${communicationPreferences.length}`
  );
  console.log(
    `Digital literacy levels:   ${digitalLiteracyLevels.length}`
  );
  console.log("");
}

main().catch((error) => {
  console.error("❌ Farmer options seeding failed:");
  console.error(error);
  process.exit(1);
});