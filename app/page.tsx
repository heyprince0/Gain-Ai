'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { FeaturesSection } from "@/components/features-section"
import { ApkDownloadSection } from "@/components/apk-download-section"
import { FounderSection } from "@/components/founder-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading])

  // Show nothing while checking auth — prevents the flicker
  if (loading || user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ApkDownloadSection />
        <FounderSection />
      </main>
      <Footer />
    </div>
  )
}
