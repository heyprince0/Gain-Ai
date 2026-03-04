import { NextResponse } from "next/server"
import { extractJsonFromText, GEMINI_MODEL, getGeminiApiKey } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "Please upload a food image first." }, { status: 400 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${getGeminiApiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
                {
                  text: "Analyze this food image and return JSON only as {\"foods\":[{\"name\":string,\"calories\":number,\"protein\":number,\"carbs\":number,\"fats\":number}],\"healthScore\":number}. Health score is 1-100.",
                },
              ],
            },
          ],
        }),
      },
    )

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!response.ok || !text) {
      throw new Error(data?.error?.message || "Could not analyze this food image right now.")
    }

    const parsed = extractJsonFromText(text)
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong while scanning your food image."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
