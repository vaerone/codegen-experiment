import dotenv from "dotenv";
const envPath = new URL("../.env", import.meta.url).pathname;
dotenv.config({ path: envPath });

import { migrateDirectory } from "./runner/migrateDirectory.js";

const args = process.argv.slice(2);

const target = args[0] || "src";

const options = {
  dry: args.includes("--dry"),
  onlyPlan: args.includes("--only-plan"),
  onlyTransform: args.includes("--only-transform"),
  debug: args.includes("--debug"),
};

console.log("Starting migration...", target);
await migrateDirectory(target, options);
console.log("✔ Migration Completed");
