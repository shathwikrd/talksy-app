import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function askBot(msg) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:
      "ALWAYS USE PLAIN TEXT AND YOU ARE INTEGRATED IN A CHAT SO KEEP REPLIES SHORT AND CASUAL LIKE YOU ARE CHATTING NEVER ASK REVERSE QUESTIONS STRICTLY TEXT ONLY NO MARKDOWN NO FORMATTING NO EXTRA FLUFF\n" +
      msg,
  });

  return response.text;
}

export default askBot;
