import fs from "fs";
import path from "path";
import { migrateFile } from "./migrateFile.js";

export async function migrateDirectory(dir, options) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (full.includes("__test__")) continue;
      await migrateDirectory(full, options);
      continue;
    }

    if (!full.endsWith(".js") && !full.endsWith(".jsx")) continue;
    if (
      full.includes(".test.") ||
      full.includes(".spec.") ||
      full.includes("__test__")
    ) {
      console.log("Skipping test file:", full);
      continue;
    }

    await migrateFile(full, options);
  }
}
