"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import Image from "next/image"
import { NotificationBell } from "@/components/notification-bell"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, gymBranding, gymId } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="top-navbar sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
        {/* 🔹 Left: Logo / Gym Branding */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          {gymBranding ? (
            <>
              {gymBranding.logo_url ? (
                <img
                  src={gymBranding.logo_url}
                  alt={gymBranding.gym_name}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-xs sm:text-sm font-bold text-black"
                  style={{ backgroundColor: gymBranding.primary_color || "#00ff88" }}
                >
                  {gymBranding.gym_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                {gymBranding.gym_name}
              </span>
            </>
          ) : (
            <>
              <Image src="/logo.png" alt="GainAi Logo" width={32} height={32} className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Gain<span className="text-primary">Ai</span>
              </span>
            </>
          )}
        </Link>

        {/* 🔹 Right: Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-1 sm:gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg h-8 w-8 sm:h-9 sm:w-9"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          )}

          {user && gymId && <NotificationBell gymId={gymId} />}
        </div>
      </nav>
    </header>
  )
}
