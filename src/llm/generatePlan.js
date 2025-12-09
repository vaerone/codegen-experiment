import fs from "fs";
import path from "path";
import { cleanJSON } from "../utils/cleanJSON.js";
import { getProvider } from "./providers/index.js";

const migration = (strings, ...values) => {
  return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "");
}

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

  const prompt = migration`
                    Convert the following React class component into a JSON migration plan.

                    ${source}

                    Return ONLY valid JSON:
                    {
                      "name": "string",
                      "state": {},
                      "methods": {},
                      "lifecycle": {
                        "componentDidMount": null,
                        "componentDidUpdate": null,
                        "componentWillUnmount": null
                      },
                      "usesProps": boolean,
                      "jsx": "<raw jsx>"
                    }
                  `;

  const raw = await callLLM(prompt);
  const cleaned = cleanJSON(raw);
  const plan = JSON.parse(cleaned);

  plan.name = className;

  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

  return { plan, planPath };
}
