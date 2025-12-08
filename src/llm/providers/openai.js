import OpenAI from "openai";

export async function callLLM(prompt) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: "gpt-5.1",
    temperature: 0,
    messages: [
      { role: "system", content: "You are a code migration planner." },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content;
}
