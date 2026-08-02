import { Navbar } from "@/components/navbar"
import { BottomNav } from "@/components/bottom-nav"
import { AiChat } from "@/components/ai-chat"
import { ProgressContent } from "@/components/progress-content"

export default function ProgressPage() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <Navbar />
      <main className="flex-1">
        <ProgressContent />
      </main>
      <BottomNav />
      <AiChat />
    </div>
  )
}
