import { PrismaClient } from "../../../lib/generated/prisma/client";
import subcounties from "../../data/subcounties.json";

type SubCountySeed = {
  code?: string;
  countyCode: string;
  name: string;
  headquarters?: string | null;
};

export async function seedSubCounties(prisma: PrismaClient) {
  console.log("Seeding sub-counties...");

  let seeded = 0;
  let skipped = 0;

  for (const subcounty of subcounties as SubCountySeed[]) {
    // ---------------------------------------------------
    // Find the parent County using countyCode
    // ---------------------------------------------------

    const county = await prisma.county.findUnique({
      where: {
        code: subcounty.countyCode,
      },
    });

    if (!county) {
      console.warn(
        `County ${subcounty.countyCode} not found for subcounty "${subcounty.name}".`
      );

      skipped++;
      continue;
    }

    // ---------------------------------------------------
    // SubCounty is uniquely identified by:
    //
    // countyId + name
    //
    // We deliberately DO NOT use:
    // - subcounty.code
    // - subcounty.headquarters
    //
    // because those fields do not exist in the
    // current Prisma SubCounty model.
    // ---------------------------------------------------

    await prisma.subCounty.upsert({
      where: {
        countyId_name: {
          countyId: county.id,
          name: subcounty.name,
        },
      },

      update: {
        name: subcounty.name,
        countyId: county.id,
      },

      create: {
        name: subcounty.name,
        countyId: county.id,
      },
    });

    seeded++;
  }

  // ---------------------------------------------------
  // Summary
  // ---------------------------------------------------

  console.log("");
  console.log("-------------------------------------------");
  console.log(`Sub-counties processed: ${subcounties.length}`);
  console.log(`Sub-counties seeded:    ${seeded}`);
  console.log(`Sub-counties skipped:   ${skipped}`);
  console.log("-------------------------------------------");
  console.log("");
}




