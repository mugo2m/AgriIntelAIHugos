import prisma from "../lib/prisma";

const ids = [
  1179, 1180,
  1169, 1163, 1168, 1170, 1172, 1173, 1174, 1175,
  921, 924, 922, 926, 923, 925,
  1152, 1153,
  949, 946, 948,
  952, 956, 953, 951, 950, 954, 955,
  963, 964, 961, 960, 962, 958,
  1192, 1196, 1194, 1198, 1197, 1195,
  987, 986, 985, 984, 988, 991, 992,
  993, 996, 997,
  1039, 1042,
  1007, 1006,
  1046, 1050, 1048, 1047, 1049, 1053, 1052, 1051,
  1082, 1081, 1080, 1085, 1084, 1086, 1083,
  1089, 1090, 1088, 1091,
  1093, 1094, 1092,
  934, 936, 937, 940, 933, 938, 939,
  1034,
  1056, 1054, 1055,
  1063, 1064, 1060, 1061, 1065, 1066,
  1131, 1136, 1134, 1130, 1132, 1135, 1129, 1138, 1139, 1137, 1133,
  1105, 1104, 1102, 1103, 1100, 1101,
  1246, 1245, 1248, 1244, 1249, 882,
  1142, 1141, 1140, 1143, 1144, 1145,
  1098, 1097, 1099,
  1071, 1075, 1068, 1067, 1070, 1069, 1072, 1074, 1076, 1077,
  1203, 1202, 1201, 1200, 1204,
  927, 930, 929, 928,
  1106, 1109, 1108, 1107,
  1161, 1159, 1158, 1162, 1160,
  1115, 1110, 1112,
  1001, 1002,
  1121, 1120, 1119, 1117, 1116,
  1125, 1126, 1127,
  1148, 1150, 1147, 1149,
  1205, 1206, 1207, 1208, 1209,
  1237, 1240, 1239, 1238,
];

async function main() {
  console.log("");
  console.log(`Starting cleanup of ${ids.length} duplicate SubCounty records...`);
  console.log("");

  // Safety check 1: all 179 records must exist
  const before = await prisma.subCounty.count({
    where: {
      id: { in: ids },
    },
  });

  console.log(`Records found: ${before}`);

  if (before !== ids.length) {
    throw new Error(
      `SAFETY CHECK FAILED: expected ${ids.length} records, found ${before}.`,
    );
  }

  // Safety check 2: none may have wards, farmers, or farms
  const referenced = await prisma.subCounty.findMany({
    where: {
      id: { in: ids },
      OR: [
        { wards: { some: {} } },
        { farmers: { some: {} } },
        { farms: { some: {} } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (referenced.length > 0) {
    console.log("");
    console.error("SAFETY CHECK FAILED: some records have references.");
    console.table(referenced);
    throw new Error("Cleanup aborted.");
  }

  console.log("Safety checks passed.");
  console.log("");

  // Delete only the verified 179 records
  const result = await prisma.subCounty.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  console.log(`Deleted records: ${result.count}`);

  // Safety check 3
  if (result.count !== ids.length) {
    throw new Error(
      `DELETE COUNT MISMATCH: deleted ${result.count} of ${ids.length}.`,
    );
  }

  // Final verification
  const remaining = await prisma.subCounty.count({
    where: {
      id: { in: ids },
    },
  });

  if (remaining !== 0) {
    throw new Error(
      `FINAL CHECK FAILED: ${remaining} selected records still remain.`,
    );
  }

  console.log("");
  console.log("==========================================");
  console.log("SUCCESS");
  console.log("==========================================");
  console.log(`Deleted: ${result.count} duplicate SubCounty records`);
  console.log(`Remaining from selected IDs: ${remaining}`);
  console.log("All 179 verified duplicates were removed.");
  console.log("==========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("CLEANUP FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });