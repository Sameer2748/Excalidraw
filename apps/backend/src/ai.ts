import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createUserPrompt, system_prompt } from "./prompt";

const genAI = new GoogleGenerativeAI(process.env.API_KEY!);

// Create a single model instance
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Add delay between requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Keep track of requests
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 60;
const COOLDOWN_PERIOD = 60000; // 1 minute in milliseconds

export default async function run(prompt: string) {
  try {
    // Check if we've hit the rate limit
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      console.log("Rate limit reached, waiting for cooldown...");
      await delay(COOLDOWN_PERIOD);
      requestCount = 0;
    }

    console.log("Starting model generation...");

    // Create a new chat session
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.75,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    // Count this as two requests (system prompt + user prompt)
    requestCount += 2;

    // Send system prompt and user prompt as a single message
    const combinedPrompt = `${system_prompt}\n\n${createUserPrompt(prompt)}`;
    const result = await chat.sendMessage(combinedPrompt);

    if (!result.response) {
      throw new Error("No response received from Gemini");
    }

    const responseText = await result.response.text();
    return responseText;
  } catch (error: any) {
    if (error.message?.includes("RATE_LIMIT_EXCEEDED")) {
      console.log("Rate limit exceeded, retrying after delay...");
      await delay(COOLDOWN_PERIOD);
      requestCount = 0;
      return run(prompt); // Retry the request
    }
    throw error;
  }
}
