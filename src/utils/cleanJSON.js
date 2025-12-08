export function cleanJSON(raw) {
  let txt = raw.trim();

  txt = txt.replace(/```json/gi, "");
  txt = txt.replace(/```/g, "");

  const first = txt.indexOf("{");
  const last = txt.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("No JSON found in LLM output.");
  }

  return txt.substring(first, last + 1);
}
