import { Navbar } from "@/components/navbar"
import { Dashboard } from "@/components/dashboard"
import { BottomNav } from "@/components/bottom-nav"
import { AiChat } from "@/components/ai-chat"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <Navbar />
      <main className="flex-1">
        <Dashboard />
      </main>
      <BottomNav />
      <AiChat />
    </div>
  )
}
