import { Navbar } from "@/components/navbar"
import { FoodScanner } from "@/components/food-scanner"
import { BottomNav } from "@/components/bottom-nav"
import { AiChat } from "@/components/ai-chat"

export default function FoodScannerPage() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <Navbar />
      <main className="flex-1">
        <FoodScanner />
      </main>
      <BottomNav />
      <AiChat />
    </div>
  )
}
