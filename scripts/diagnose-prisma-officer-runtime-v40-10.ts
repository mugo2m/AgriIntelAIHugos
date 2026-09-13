import prisma from "../lib/prisma";

async function main() {
  console.log("PRISMA OFFICER ASSIGNMENT RUNTIME DIAGNOSTIC");
  console.log("============================================");

  console.log(
    "typeof prisma:",
    typeof prisma,
  );

  console.log(
    "typeof prisma.officerAssignment:",
    typeof (prisma as any).officerAssignment,
  );

  console.log(
    "officerAssignment in prisma:",
    "officerAssignment" in (prisma as any),
  );

  console.log(
    "typeof prisma.user:",
    typeof (prisma as any).user,
  );

  console.log(
    "typeof prisma.farmer:",
    typeof (prisma as any).farmer,
  );

  console.log(
    "typeof prisma.country:",
    typeof (prisma as any).country,
  );

  console.log("\nRUNTIME MODEL DELEGATES:");

  const expectedModels = [
    "user",
    "farmer",
    "country",
    "county",
    "subCounty",
    "ward",
    "officerFunction",
    "officerAssignment",
  ];

  for (const model of expectedModels) {
    console.log(
      `${model}:`,
      typeof (prisma as any)[model],
    );
  }

  console.log("\nOFFICER ASSIGNMENT QUERY TEST:");

  try {
    const rows = await (prisma as any).officerAssignment.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        userId: true,
        roleId: true,
        functionId: true,
        scopeLevel: true,
        active: true,
      },
      take: 5,
    });

    console.log("PASS officerAssignment.findMany executed");
    console.log("Rows returned:", rows.length);
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("FAIL officerAssignment.findMany failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("FATAL DIAGNOSTIC ERROR:");
  console.error(error);
  process.exit(1);
});