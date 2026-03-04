import { GEMINI_MODEL, getGeminiApiKey } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Please send a message first." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${getGeminiApiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "You are GainAi Coach, an expert fitness and nutrition coach. Give concise, practical, safe advice.",
              },
            ],
          },
          contents: messages.map((msg: { role: "user" | "assistant"; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
        }),
      },
    )

    if (!geminiResponse.ok || !geminiResponse.body) {
      const errorText = await geminiResponse.text()
      return new Response(JSON.stringify({ error: errorText || "Chat is unavailable right now." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiResponse.body!.getReader()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const events = buffer.split("\n\n")
          buffer = events.pop() ?? ""

          for (const event of events) {
            const line = event
              .split("\n")
              .find((part) => part.startsWith("data: "))

            if (!line) continue
            const payload = line.replace("data: ", "").trim()
            if (!payload || payload === "[DONE]") continue

            try {
              const json = JSON.parse(payload)
              const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              continue
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process chat request."
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
