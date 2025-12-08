import fs from "fs";
import path from "path";
import { cleanJSON } from "../utils/cleanJSON.js";
import { getProvider } from "./providers/index.js";

function extractClassName(code) {
  const m = code.match(/class\s+([A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

export async function generatePlan(sourceCode, filePath, options) {
  const callLLM = getProvider();

  const className =
    extractClassName(sourceCode) ||
    path.basename(filePath).replace(/\.(jsx|js)$/, "");

  const planDir = path.resolve("plans");
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir);

  const planPath = path.join(planDir, `${className}.plan.json`);

  const prompt = `
Convert this React class component into a structured migration plan JSON:

Return ONLY raw JSON.
${sourceCode}
`;

  const raw = await callLLM(prompt);
  const cleaned = cleanJSON(raw);
  const plan = JSON.parse(cleaned);

  plan.name = className;

  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

  return { plan, planPath };
}
