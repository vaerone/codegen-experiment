import { callLLM as perplexity } from "./perplexity.js";
import { callLLM as openai } from "./openai.js";

export function getProvider() {
  const provider = process.env.LLM_PROVIDER || "perplexity";

  switch (provider) {
    case "openai":
      return openai;
    default:
      return perplexity;
  }
}
