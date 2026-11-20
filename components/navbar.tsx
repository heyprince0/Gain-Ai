'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3" aria-label="GainAI dashboard">
          <Image src="/logo.png" alt="GainAI" width={32} height={32} className="size-8 sm:size-10" />
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">Gain<span className="text-primary">AI</span></span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {mounted && <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="size-9 rounded-lg" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>}
        </div>
      </nav>
    </header>
  )
}
