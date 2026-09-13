import { prisma } from "../lib/prisma";

const FUNCTIONS = [
  {
    name: "Agriculture / General Agriculture",
    description:
      "General agriculture functions covering broad agricultural production, coordination, and technical support.",
  },
  {
    name: "Crops",
    description:
      "Crop production, crop protection, agronomy, seed systems, and related technical services.",
  },
  {
    name: "Agribusiness",
    description:
      "Agricultural markets, value chains, enterprise development, commercialization, and agribusiness services.",
  },
  {
    name: "Livestock",
    description:
      "Livestock production, husbandry, breeding, nutrition, and livestock development services.",
  },
  {
    name: "Veterinary",
    description:
      "Animal health, disease prevention and control, veterinary public health, and veterinary services.",
  },
  {
    name: "Fisheries",
    description:
      "Fisheries, aquaculture, aquatic resources, production, conservation, and related services.",
  },
  {
    name: "Agricultural Extension",
    description:
      "Farmer advisory services, extension delivery, technology dissemination, demonstrations, and farmer capacity development.",
  },
  {
    name: "Monitoring and Evaluation",
    description:
      "Programme and project monitoring, evaluation, reporting, indicators, performance tracking, and learning.",
  },
  {
    name: "Liaison",
    description:
      "Institutional coordination, stakeholder engagement, interdepartmental communication, and liaison functions.",
  },
  {
    name: "Research",
    description:
      "Agricultural research coordination, evidence generation, trials, innovation, and research dissemination.",
  },
  {
    name: "Planning",
    description:
      "Agricultural planning, work planning, budgeting support, strategic planning, and resource coordination.",
  },
  {
    name: "Programme Management",
    description:
      "Management and coordination of agricultural programmes, programme implementation, reporting, and performance.",
  },
  {
    name: "Project Management",
    description:
      "Management and coordination of agricultural projects, implementation, reporting, risk management, and delivery.",
  },
  {
    name: "Home Economics",
    description:
      "Household nutrition, food utilization, household livelihoods, home economics, and related community services.",
  },
  {
    name: "Soil and Water Conservation",
    description:
      "Soil conservation, water management, land management, erosion control, and climate-resilient agricultural practices.",
  },
  {
    name: "Other",
    description:
      "Other agricultural or institutional specialization not represented by the standard officer function catalogue.",
  },
] as const;

async function main() {
  console.log("============================================================");
  console.log("V39 OFFICER FUNCTION CATALOGUE SEED");
  console.log("============================================================");
  console.log("IDEMPOTENT: SAFE TO RUN MULTIPLE TIMES");
  console.log();

  console.log(`Expected functions: ${FUNCTIONS.length}`);
  console.log();

  for (const item of FUNCTIONS) {
    const existing = await prisma.officerFunction.findUnique({
      where: {
        name: item.name,
      },
    });

    if (existing) {
      const updated = await prisma.officerFunction.update({
        where: {
          id: existing.id,
        },
        data: {
          description: item.description,
          active: true,
        },
      });

      console.log(
        `UPDATED  ${updated.id.toString().padStart(2, " ")} | ${updated.name}`,
      );
    } else {
      const created = await prisma.officerFunction.create({
        data: {
          name: item.name,
          description: item.description,
          active: true,
        },
      });

      console.log(
        `CREATED  ${created.id.toString().padStart(2, " ")} | ${created.name}`,
      );
    }
  }

  console.log();
  console.log("------------------------------------------------------------");
  console.log("FINAL FUNCTION COUNT");
  console.log("------------------------------------------------------------");

  const total = await prisma.officerFunction.count({
    where: {
      active: true,
    },
  });

  console.log(`Active OfficerFunctions: ${total}`);

  if (total !== FUNCTIONS.length) {
    throw new Error(
      `Expected ${FUNCTIONS.length} active OfficerFunctions but found ${total}.`,
    );
  }

  const allFunctions = await prisma.officerFunction.findMany({
    orderBy: {
      id: "asc",
    },
  });

  console.log();
  console.log("------------------------------------------------------------");
  console.log("CURRENT OFFICER FUNCTION CATALOGUE");
  console.log("------------------------------------------------------------");

  for (const item of allFunctions) {
    console.log(
      `${item.id.toString().padStart(2, " ")} | ${item.name} | active=${item.active}`,
    );
  }

  console.log();
  console.log("============================================================");
  console.log("V39 STATUS: GREEN");
  console.log("============================================================");
  console.log("Officer function catalogue seeded successfully.");
}

main()
  .catch((error) => {
    console.error();
    console.error("V39 SEED FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });