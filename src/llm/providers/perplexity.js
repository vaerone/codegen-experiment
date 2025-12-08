import OpenAI from "openai";

export async function callLLM(prompt) {
  const client = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
  });

  const response = await client.chat.completions.create({
    model: "sonar",
    temperature: 0,
    messages: [
      { role: "system", content: "You are a code migration planner." },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content;
}
