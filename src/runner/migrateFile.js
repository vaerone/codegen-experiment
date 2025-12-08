import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { generatePlan } from "../llm/generatePlan.js";

function extractClassName(source) {
  const match = source.match(/class\s+([A-Za-z0-9_]+)/);
  return match ? match[1] : null;
}

export async function migrateFile(filePath, options) {
  const source = fs.readFileSync(filePath, "utf8");

  const className = extractClassName(source);
  if (!className) {
    console.log("⏭ No class component in:", filePath);
    return;
  }

  console.log(`🔍 Component found: ${className}`);

  // plan folder
  const planDir = path.resolve("plans");
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir);

  // attempt to load pre-existing plan
  const planPath = path.join(planDir, `${className}.plan.json`);
  let plan;

  if (fs.existsSync(planPath) && !options.onlyPlan) {
    console.log(`📄 Using existing plan: ${planPath}`);
    plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  } else {
    console.log(`⚠️ No plan found for ${className}. Generating...`);
    const result = await generatePlan(source, filePath, options);
    plan = result.plan;
    // ensure planPath is correct even if generatePlan returned different path
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    console.log(`📄 Saved new plan: ${planPath}`);
  }

  // transform
  const transformPath = new URL("../codemods/applyPlan.js", import.meta.url)
    .pathname;

  const cmd = [
    "npx jscodeshift",
    `"${filePath}"`,
    `-t "${transformPath}"`,
    "--parser=babel",
    `--planPath=${JSON.stringify(planPath)}`,
  ];

  if (options.dry) {
    cmd.push("--dry", "--print");
    console.log("📝 Output preview:\n");
  }

  execSync(cmd.join(" "), { stdio: "inherit" });
}
