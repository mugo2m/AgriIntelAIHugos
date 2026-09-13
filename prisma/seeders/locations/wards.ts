import { PrismaClient } from "../../../lib/generated/prisma/client";
import subcountyWardMap from "../../data/subcounty-ward-map.json";

// =======================================================
// TYPES
// =======================================================

type MappingWard = {
  id: number;
  name: string;
  code: string | null;
  sourceGid?: number;
  sourceUid?: string;
};

type MappingSubCounty = {
  subCountyId: number;
  subCountyName: string;
  countyId: number;
  countyName: string;
  wards: MappingWard[];
};

// =======================================================
// CONFIGURATION
// =======================================================

const EXPECTED_WARD_COUNT = 1450;
const EXPECTED_SUBCOUNTY_COUNT = 301;

// =======================================================
// SEED WARDS
// =======================================================

export async function seedWards(
  prisma: PrismaClient
): Promise<void> {
  console.log("");
  console.log("===========================================");
  console.log("Seeding Wards from verified mapping");
  console.log("===========================================");
  console.log("");

  const mappings = subcountyWardMap as MappingSubCounty[];

  // =====================================================
  // VALIDATE MAPPING
  // =====================================================

  if (!Array.isArray(mappings)) {
    throw new Error(
      "subcounty-ward-map.json must contain an array."
    );
  }

  if (mappings.length !== EXPECTED_SUBCOUNTY_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_SUBCOUNTY_COUNT} SubCounty mappings, ` +
        `but found ${mappings.length}.`
    );
  }

  const totalMappedWards = mappings.reduce(
    (total, mapping) =>
      total +
      (Array.isArray(mapping.wards)
        ? mapping.wards.length
        : 0),
    0
  );

  if (totalMappedWards !== EXPECTED_WARD_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_WARD_COUNT} mapped wards, ` +
        `but found ${totalMappedWards}.`
    );
  }

  console.log(
    `Verified SubCounty mappings: ${mappings.length}`
  );

  console.log(
    `Verified wards in mapping:   ${totalMappedWards}`
  );

  // =====================================================
  // LOAD DATABASE SUBCOUNTIES
  // =====================================================

  const subCounties =
    await prisma.subCounty.findMany({
      select: {
        id: true,
        name: true,
        countyId: true,
      },
    });

  console.log(
    `Database SubCounties:        ${subCounties.length}`
  );

  // =====================================================
  // BUILD SUBCOUNTY LOOKUP
  // =====================================================

  const subCountyById = new Map<
    number,
    {
      id: number;
      name: string;
      countyId: number;
    }
  >();

  for (const subCounty of subCounties) {
    subCountyById.set(
      subCounty.id,
      subCounty
    );
  }

  // =====================================================
  // VALIDATE ALL PARENTS BEFORE WRITING
  // =====================================================

  for (const mapping of mappings) {
    if (!Number.isInteger(mapping.subCountyId)) {
      throw new Error(
        `Invalid SubCounty ID in mapping: ${JSON.stringify(
          mapping
        )}`
      );
    }

    const subCounty =
      subCountyById.get(
        mapping.subCountyId
      );

    if (!subCounty) {
      throw new Error(
        `Mapped SubCounty does not exist in database: ` +
          `${mapping.subCountyName} ` +
          `(ID ${mapping.subCountyId})`
      );
    }

    if (
      subCounty.countyId !==
      mapping.countyId
    ) {
      throw new Error(
        `County mismatch for SubCounty ` +
          `${mapping.subCountyName} ` +
          `(ID ${mapping.subCountyId}). ` +
          `Database countyId=${subCounty.countyId}, ` +
          `mapping countyId=${mapping.countyId}.`
      );
    }

    if (!Array.isArray(mapping.wards)) {
      throw new Error(
        `Invalid wards array for SubCounty ` +
          `${mapping.subCountyName} ` +
          `(ID ${mapping.subCountyId}).`
      );
    }

    if (mapping.wards.length === 0) {
      throw new Error(
        `SubCounty has no mapped wards: ` +
          `${mapping.subCountyName} ` +
          `(ID ${mapping.subCountyId}).`
      );
    }
  }

  console.log(
    "All mapped SubCounty parents verified."
  );

  // =====================================================
  // LOAD EXISTING MAPPED WARDS
  //
  // IMPORTANT:
  // We do NOT assume that one SubCounty belongs to one
  // Constituency.
  //
  // A SubCounty can contain wards belonging to multiple
  // constituencies in the current database.
  //
  // Constituency resolution is performed PER MISSING
  // WARD below.
  // =====================================================

  const existingWards =
    await prisma.ward.findMany({
      where: {
        subCountyId: {
          in: mappings.map(
            (mapping) =>
              mapping.subCountyId
          ),
        },
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
        constituencyId: true,
        countyId: true,
        sourceGid: true,
        sourceUid: true,
        constituency: {
          select: {
            id: true,
            name: true,
            countyId: true,
          },
        },
      },
    });

  console.log(
    `Existing mapped wards found: ${existingWards.length}`
  );

  // =====================================================
  // BUILD AUTHORITATIVE SOURCE LOOKUPS
  //
  // This is the critical protection against creating
  // duplicate authoritative wards.
  //
  // sourceGid and sourceUid come from the verified
  // authoritative mapping.
  //
  // If a ward already exists anywhere in the database
  // with the same source identity, we must NOT create
  // another ward.
  // =====================================================

  const sourceGidValues = mappings.flatMap(
    (mapping) =>
      mapping.wards
        .map(
          (ward) =>
            ward.sourceGid
        )
        .filter(
          (
            value
          ): value is number =>
            Number.isInteger(value)
        )
  );

  const sourceUidValues = mappings.flatMap(
    (mapping) =>
      mapping.wards
        .map(
          (ward) =>
            ward.sourceUid
        )
        .filter(
          (
            value
          ): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
  );

  const existingSourceWards =
    await prisma.ward.findMany({
      where: {
        OR: [
          ...(sourceGidValues.length > 0
            ? [
                {
                  sourceGid: {
                    in: sourceGidValues,
                  },
                },
              ]
            : []),

          ...(sourceUidValues.length > 0
            ? [
                {
                  sourceUid: {
                    in: sourceUidValues,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        subCountyId: true,
        countyId: true,
        constituencyId: true,
        sourceGid: true,
        sourceUid: true,
      },
    });

  console.log(
    `Existing authoritative wards found: ${existingSourceWards.length}`
  );

  // =====================================================
  // BUILD SOURCE LOOKUPS
  // =====================================================

  const existingBySourceGid =
    new Map<
      number,
      {
        id: number;
        name: string;
        subCountyId: number | null;
        countyId: number;
        constituencyId: number;
        sourceGid: number | null;
        sourceUid: string | null;
      }
    >();

  const existingBySourceUid =
    new Map<
      string,
      {
        id: number;
        name: string;
        subCountyId: number | null;
        countyId: number;
        constituencyId: number;
        sourceGid: number | null;
        sourceUid: string | null;
      }
    >();

  for (const ward of existingSourceWards) {
    if (ward.sourceGid !== null) {
      const existing =
        existingBySourceGid.get(
          ward.sourceGid
        );

      if (
        existing &&
        existing.id !== ward.id
      ) {
        throw new Error(
          `Duplicate sourceGid ${ward.sourceGid} ` +
            `found in database for Ward IDs ` +
            `${existing.id} and ${ward.id}.`
        );
      }

      existingBySourceGid.set(
        ward.sourceGid,
        ward
      );
    }

    if (
      ward.sourceUid !== null &&
      ward.sourceUid.trim() !== ""
    ) {
      const existing =
        existingBySourceUid.get(
          ward.sourceUid
        );

      if (
        existing &&
        existing.id !== ward.id
      ) {
        throw new Error(
          `Duplicate sourceUid ${ward.sourceUid} ` +
            `found in database for Ward IDs ` +
            `${existing.id} and ${ward.id}.`
        );
      }

      existingBySourceUid.set(
        ward.sourceUid,
        ward
      );
    }
  }

  // =====================================================
  // SEED
  // =====================================================

  let created = 0;
  let existing = 0;
  let existingBySource = 0;
  let existingByLocation = 0;

  for (const mapping of mappings) {
    for (const ward of mapping.wards) {
      const wardName =
        ward.name?.trim();

      if (!wardName) {
        throw new Error(
          `Empty ward name under SubCounty ` +
            `${mapping.subCountyName} ` +
            `(ID ${mapping.subCountyId}).`
        );
      }

      // =================================================
      // NORMALIZE SOURCE IDENTIFIERS
      // =================================================

      const sourceGid =
        Number.isInteger(
          ward.sourceGid
        )
          ? ward.sourceGid
          : null;

      const sourceUid =
        typeof ward.sourceUid ===
          "string" &&
        ward.sourceUid.trim() !== ""
          ? ward.sourceUid.trim()
          : null;

      // =================================================
      // AUTHORITATIVE SOURCE CHECK
      //
      // FIRST PRIORITY:
      // Find the ward by sourceGid/sourceUid anywhere
      // in the database.
      //
      // This prevents the Tiaty duplicate problem from
      // happening again.
      // =================================================

      let sourceMatch:
        | (typeof existingSourceWards)[number]
        | undefined;

      if (
        sourceGid !== null
      ) {
        sourceMatch =
          existingBySourceGid.get(
            sourceGid
          );
      }

      if (
        sourceUid !== null
      ) {
        const uidMatch =
          existingBySourceUid.get(
            sourceUid
          );

        if (
          sourceMatch &&
          uidMatch &&
          sourceMatch.id !==
            uidMatch.id
        ) {
          throw new Error(
            `Source identity conflict for mapped Ward ` +
              `${wardName}. ` +
              `sourceGid=${sourceGid} points to Ward ` +
              `${sourceMatch.id}, while sourceUid=${sourceUid} ` +
              `points to Ward ${uidMatch.id}.`
          );
        }

        if (!sourceMatch) {
          sourceMatch = uidMatch;
        }
      }

      if (sourceMatch) {
        // -----------------------------------------------
        // VERIFY AUTHORITATIVE IDENTITY
        // -----------------------------------------------

        if (
          sourceGid !== null &&
          sourceMatch.sourceGid !== null &&
          sourceMatch.sourceGid !==
            sourceGid
        ) {
          throw new Error(
            `sourceGid mismatch for Ward ` +
              `${wardName}. ` +
              `Mapping=${sourceGid}, ` +
              `Database=${sourceMatch.sourceGid}.`
          );
        }

        if (
          sourceUid !== null &&
          sourceMatch.sourceUid !== null &&
          sourceMatch.sourceUid.trim() !==
            sourceUid
        ) {
          throw new Error(
            `sourceUid mismatch for Ward ` +
              `${wardName}. ` +
              `Mapping=${sourceUid}, ` +
              `Database=${sourceMatch.sourceUid}.`
          );
        }

        // -----------------------------------------------
        // VERIFY NAME
        // -----------------------------------------------

        if (
          sourceMatch.name.trim() !==
          wardName
        ) {
          throw new Error(
            `Ward name mismatch for authoritative source ` +
              `sourceGid=${sourceGid}, ` +
              `sourceUid=${sourceUid}. ` +
              `Database=${sourceMatch.name}, ` +
              `Mapping=${wardName}.`
          );
        }

        // -----------------------------------------------
        // VERIFY COUNTY
        // -----------------------------------------------

        if (
          sourceMatch.countyId !==
          mapping.countyId
        ) {
          throw new Error(
            `County mismatch for authoritative Ward ` +
              `${wardName}. ` +
              `Database countyId=${sourceMatch.countyId}, ` +
              `mapping countyId=${mapping.countyId}.`
          );
        }

        // -----------------------------------------------
        // IMPORTANT:
        //
        // DO NOT CREATE ANOTHER WARD.
        //
        // The authoritative record already exists.
        // We deliberately do not move it here because
        // the seeder must not silently rewrite geography.
        // -----------------------------------------------

        existing++;
        existingBySource++;

        continue;
      }

      // =================================================
      // SECONDARY CHECK:
      //
      // CHECK WHETHER WARD ALREADY EXISTS UNDER THE
      // MAPPED SUBCOUNTY.
      // =================================================

      const existingWard =
        await prisma.ward.findFirst({
          where: {
            subCountyId:
              mapping.subCountyId,
            name: wardName,
          },
          select: {
            id: true,
            name: true,
            subCountyId: true,
            countyId: true,
            constituencyId: true,
            sourceGid: true,
            sourceUid: true,
          },
        });

      if (existingWard) {
        // -----------------------------------------------
        // IF THE DATABASE RECORD HAS SOURCE IDENTIFIERS,
        // THEY MUST AGREE WITH THE MAPPING.
        // -----------------------------------------------

        if (
          sourceGid !== null &&
          existingWard.sourceGid !== null &&
          existingWard.sourceGid !==
            sourceGid
        ) {
          throw new Error(
            `sourceGid mismatch for existing Ward ` +
              `${wardName} under SubCounty ` +
              `${mapping.subCountyId}. ` +
              `Database=${existingWard.sourceGid}, ` +
              `mapping=${sourceGid}.`
          );
        }

        if (
          sourceUid !== null &&
          existingWard.sourceUid !== null &&
          existingWard.sourceUid.trim() !==
            sourceUid
        ) {
          throw new Error(
            `sourceUid mismatch for existing Ward ` +
              `${wardName} under SubCounty ` +
              `${mapping.subCountyId}. ` +
              `Database=${existingWard.sourceUid}, ` +
              `mapping=${sourceUid}.`
          );
        }

        existing++;
        existingByLocation++;

        continue;
      }

      // =================================================
      // RESOLVE CONSTITUENCY FOR THIS SPECIFIC WARD
      //
      // We use an existing ward with the SAME NAME in
      // the SAME COUNTY as evidence.
      //
      // This is intentionally per-WARD rather than
      // per-SubCounty.
      // =================================================

      const sameNameWards =
        await prisma.ward.findMany({
          where: {
            name: wardName,
            countyId:
              mapping.countyId,
          },
          select: {
            id: true,
            constituencyId: true,
            constituency: {
              select: {
                id: true,
                name: true,
                countyId: true,
              },
            },
          },
        });

      // =================================================
      // BUILD UNIQUE CONSTITUENCY CANDIDATES
      // =================================================

      const constituencyMap =
        new Map<
          number,
          {
            id: number;
            name: string;
            countyId: number;
          }
        >();

      for (const sameNameWard of sameNameWards) {
        constituencyMap.set(
          sameNameWard.constituency.id,
          sameNameWard.constituency
        );
      }

      // =================================================
      // NO CONSTITUENCY EVIDENCE
      // =================================================

      if (
        constituencyMap.size ===
        0
      ) {
        throw new Error(
          `Cannot determine constituency for missing Ward ` +
            `${wardName} under SubCounty ` +
            `${mapping.subCountyName} ` +
            `(ID ${mapping.subCountyId}). ` +
            `No existing same-name ward was found in county ` +
            `${mapping.countyId}.`
        );
      }

      // =================================================
      // AMBIGUOUS CONSTITUENCY
      //
      // NEVER GUESS WHEN THE SAME WARD NAME EXISTS IN
      // MORE THAN ONE CONSTITUENCY IN THE SAME COUNTY.
      // =================================================

      if (
        constituencyMap.size >
        1
      ) {
        const candidates = [
          ...constituencyMap.values(),
        ]
          .map(
            (c) =>
              `${c.name} (ID ${c.id})`
          )
          .join(", ");

        throw new Error(
          `Ambiguous constituency for missing Ward ` +
            `${wardName} under SubCounty ` +
            `${mapping.subCountyName} ` +
            `(ID ${mapping.subCountyId}). ` +
            `Possible constituencies: ${candidates}`
        );
      }

      // =================================================
      // EXACTLY ONE CONSTITUENCY FOUND
      // =================================================

      const constituency =
        [...constituencyMap.values()][0];

      // =================================================
      // VERIFY CONSTITUENCY COUNTY
      // =================================================

      if (
        constituency.countyId !==
        mapping.countyId
      ) {
        throw new Error(
          `Constituency county mismatch for Ward ` +
            `${wardName}. ` +
            `Constituency ${constituency.id} belongs to county ` +
            `${constituency.countyId}, but mapping county is ` +
            `${mapping.countyId}.`
        );
      }

      // =================================================
      // CREATE MISSING WARD
      // =================================================

      const createdWard =
        await prisma.ward.create({
          data: {
            name: wardName,
            subCountyId:
              mapping.subCountyId,
            constituencyId:
              constituency.id,
            countyId:
              mapping.countyId,
            code:
              ward.code ?? null,
            sourceGid:
              sourceGid,
            sourceUid:
              sourceUid,
          },
          select: {
            id: true,
            name: true,
            subCountyId: true,
            countyId: true,
            constituencyId: true,
            sourceGid: true,
            sourceUid: true,
          },
        });

      // =================================================
      // ADD NEW RECORD TO SOURCE LOOKUPS
      //
      // This prevents another mapping record from
      // creating the same authoritative source during
      // the same seed operation.
      // =================================================

      if (
        createdWard.sourceGid !== null
      ) {
        existingBySourceGid.set(
          createdWard.sourceGid,
          createdWard
        );
      }

      if (
        createdWard.sourceUid !== null &&
        createdWard.sourceUid.trim() !== ""
      ) {
        existingBySourceUid.set(
          createdWard.sourceUid,
          createdWard
        );
      }

      created++;
    }
  }

  // =====================================================
  // FINAL VALIDATION
  // =====================================================

  const finalWardCount =
    await prisma.ward.count();

  if (
    finalWardCount !==
    EXPECTED_WARD_COUNT
  ) {
    throw new Error(
      `Ward count validation failed. ` +
        `Expected ${EXPECTED_WARD_COUNT}, ` +
        `but database contains ${finalWardCount}.`
    );
  }

  // =====================================================
  // FINAL LOG
  // =====================================================

  console.log("");
  console.log(
    `Existing wards:              ${existing}`
  );

  console.log(
    `Existing by source identity: ${existingBySource}`
  );

  console.log(
    `Existing by location:        ${existingByLocation}`
  );

  console.log(
    `Created wards:               ${created}`
  );

  console.log(
    `Final wards:                 ${finalWardCount}`
  );

  console.log("");

  console.log(
    "✅ Ward seeding completed successfully."
  );

  console.log("");
}