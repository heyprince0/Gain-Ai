import { Navbar } from "@/components/navbar"
import { BottomNav } from "@/components/bottom-nav"
import { AiChat } from "@/components/ai-chat"
import { ProfileContent } from "@/components/profile-content"

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <Navbar />
      <main className="flex-1">
        <ProfileContent />
      </main>
      <BottomNav />
      <AiChat />
    </div>
  )
}
