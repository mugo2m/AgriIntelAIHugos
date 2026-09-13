import "dotenv/config";
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const data = JSON.parse(
  fs.readFileSync("./prisma/data/kenya-wards-1450.geojson", "utf8")
);

const features = data.features;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("POST-REPAIR WARD RECONCILIATION");
  console.log("==============================================");
  console.log("");

  console.log("GeoJSON features:", features.length);

  const db = await prisma.ward.findMany({
    select: {
      id: true,
      name: true,
      sourceGid: true,
      sourceUid: true,
      countyId: true,
      subCountyId: true,
      constituencyId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("Database wards:", db.length);

  const sourceGids = features
    .map((f: any) => f.properties?.gid)
    .filter(
      (x: any) =>
        x !== undefined &&
        x !== null
    );

  const dbGids = db
    .map((w: any) => w.sourceGid)
    .filter(
      (x: any) =>
        x !== undefined &&
        x !== null
    );

  const sourceSet = new Set(sourceGids);
  const dbSet = new Set(dbGids);

  const missing = features.filter((f: any) => {
    const gid = f.properties?.gid;

    return (
      gid !== undefined &&
      gid !== null &&
      !dbSet.has(gid)
    );
  });

  const extra = db.filter(
    (w: any) =>
      w.sourceGid !== null &&
      !sourceSet.has(w.sourceGid)
  );

  const sourceDup = [
    ...new Set(
      sourceGids.filter(
        (gid: any, i: number) =>
          sourceGids.indexOf(gid) !== i
      )
    ),
  ];

  const dbDup = [
    ...new Set(
      dbGids.filter(
        (gid: any, i: number) =>
          dbGids.indexOf(gid) !== i
      )
    ),
  ];

  console.log("");
  console.log("SOURCE/DB RECONCILIATION");
  console.log("----------------------------------------------");
  console.log("Unique source gids:", sourceSet.size);
  console.log("Unique DB sourceGids:", dbSet.size);
  console.log("Missing source records:", missing.length);
  console.log(
    "DB records with unknown sourceGid:",
    extra.length
  );
  console.log(
    "Duplicate source gids:",
    sourceDup.length
  );
  console.log(
    "Duplicate DB sourceGids:",
    dbDup.length
  );

  if (missing.length > 0) {
    console.log("");
    console.log("*** MISSING SOURCE WARD(S) ***");

    for (const f of missing) {
      const p = f.properties || {};

      console.log(
        JSON.stringify(
          {
            gid: p.gid,
            uid: p.uid,
            county:
              p.county ??
              p.county_name,
            subcounty:
              p.subcounty ??
              p.subcounty_name,
            constituency:
              p.constituency ??
              p.constituency_name,
            ward:
              p.ward ??
              p.ward_name ??
              p.name,
            code:
              p.ward_code ??
              p.code,
          },
          null,
          2
        )
      );
    }
  }

  if (extra.length > 0) {
    console.log("");
    console.log("*** EXTRA DB WARD(S) ***");

    console.table(
      extra.map((w: any) => ({
        id: w.id,
        name: w.name,
        sourceGid: w.sourceGid,
        sourceUid: w.sourceUid,
        countyId: w.countyId,
        subCountyId: w.subCountyId,
        constituencyId: w.constituencyId,
      }))
    );
  }

  if (sourceDup.length > 0) {
    console.log("");
    console.log("*** DUPLICATE SOURCE GIDS ***");
    console.log(sourceDup);
  }

  if (dbDup.length > 0) {
    console.log("");
    console.log("*** DUPLICATE DB SOURCE GIDS ***");
    console.log(dbDup);
  }

  console.log("");
  console.log("==============================================");
  console.log("BUNGOMA MT ELGON CHECK");
  console.log("==============================================");

  const bungoma = await prisma.county.findFirst({
    where: {
      name: {
        equals: "Bungoma",
        mode: "insensitive",
      },
    },
  });

  if (!bungoma) {
    console.log("Bungoma county not found.");
  } else {
    const constituencies =
      await prisma.constituency.findMany({
        where: {
          countyId: bungoma.id,
        },
        include: {
          wards: {
            select: {
              id: true,
              name: true,
              sourceGid: true,
              sourceUid: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

    const mtElgon = constituencies.filter(
      (c: any) =>
        c.name
          .toLowerCase()
          .replace(/\./g, "") ===
        "mt elgon"
    );

    console.log(
      `Found ${mtElgon.length} Mt Elgon constituency record(s).`
    );

    for (const c of mtElgon) {
      console.log("");
      console.log(
        `Constituency ${c.id}: ${c.name}`
      );
      console.log(
        `Ward count: ${c.wards.length}`
      );

      console.table(c.wards);
    }
  }

  console.log("");
  console.log("==============================================");
  console.log("FINAL READ-ONLY RESULT");
  console.log("==============================================");

  if (
    missing.length === 0 &&
    extra.length === 0 &&
    sourceDup.length === 0 &&
    dbDup.length === 0
  ) {
    console.log(
      "WARD SOURCE RECONCILIATION PASSED."
    );
    console.log(
      "All 1,450 authoritative source wards are present."
    );
    console.log(
      "There are no extra DB sourceGids."
    );
    console.log(
      "There are no duplicate sourceGids."
    );
    console.log(
      "There are no duplicate DB sourceGids."
    );
  } else {
    console.log(
      "Further reconciliation is required."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("RECONCILIATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });