import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { GEMINI_API_KEY, GEMINI_BASE_URL, GEMINI_MODEL } from "@/lib/env";

export function getGeminiModel(
  model: string = GEMINI_MODEL,
  apiKey: string = GEMINI_API_KEY,
): GenerativeModel {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel(
    { model },
    GEMINI_BASE_URL ? { baseUrl: GEMINI_BASE_URL } : undefined,
  );
}
