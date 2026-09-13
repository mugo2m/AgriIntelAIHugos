import fs from "fs";
import path from "path";

const filePath = path.join(
process.cwd(),
"prisma",
"data",
"kenya-wards-1450.geojson"
);

const targetGids = [484, 479, 1750, 1790, 2006, 1994];

console.log("");
console.log("==============================================");
console.log("INSPECT DUPLICATE WARD GEOJSON PROPERTIES");
console.log("==============================================");
console.log("");

const raw = fs.readFileSync(filePath, "utf8");
const geojson = JSON.parse(raw);

console.log("Total GeoJSON features:", geojson.features.length);
console.log("");

const targets = geojson.features.filter((feature: any) => {
const gid = Number(feature.properties?.gid);
return targetGids.includes(gid);
});

console.log("Target GIDs found:", targets.length, "/ 6");
console.log("");

targets.forEach((feature: any) => {
const properties = feature.properties || {};
const gid = properties.gid;

console.log("----------------------------------------------");
console.log("GID:", gid);
console.log("----------------------------------------------");

Object.keys(properties).forEach((key) => {
console.log(key, "=", properties[key]);
});

console.log("");
});

console.log("==============================================");
console.log("INSPECTION COMPLETE");
console.log("==============================================");
console.log("");
