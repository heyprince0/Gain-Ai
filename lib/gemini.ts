export const GEMINI_MODEL = "gemini-1.5-flash"

export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error(
      "Gemini is not configured. Please set GEMINI_API_KEY in your .env file.",
    )
  }
  return key
}

export function extractJsonFromText(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  return JSON.parse(cleaned)
}
