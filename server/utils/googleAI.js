import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function askBot(msg) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: msg,
  });

  return response.text;
}

export default askBot;
