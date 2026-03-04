"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hey there! I'm your GainAi Coach. Ask me anything about nutrition or workouts.",
  },
]

export function AiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return

    setError(null)
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
    const nextMessages = [...messages, userMsg]

    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    const assistantId = `${Date.now()}-assistant`
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Chat is unavailable. Please try again.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })

        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, content: fullText } : msg)),
        )
      }
    } catch (chatError) {
      const message = chatError instanceof Error ? chatError.message : "Could not send your message."
      setError(message)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "Sorry, I couldn't respond right now. Please try again." }
            : msg,
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  return (
    <>
      <button onClick={() => setOpen(!open)} className={cn("fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg", open && "rotate-0")}>
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl sm:w-[380px]">
          <div className="border-b border-border/50 bg-card px-4 py-3 text-sm font-semibold">GainAi Coach</div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                    {msg.content || "..."}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {error && <p className="px-3 pb-1 text-xs text-destructive">{error}</p>}
          <div className="border-t border-border/50 bg-card p-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your AI coach..." className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm" />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="h-10 w-10 shrink-0 rounded-xl"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
