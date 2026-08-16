'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Theme isn't known on the server, so wait for mount to avoid a
  // light/dark flash or hydration mismatch on first paint.
  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Switch between light and dark mode.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </div>
          <div>
            <p className="font-medium">{isDark ? 'Dark mode' : 'Light mode'}</p>
            <p className="text-xs text-muted-foreground">Applies across your owner panel.</p>
          </div>
        </div>
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          disabled={!mounted}
        />
      </CardContent>
    </Card>
  )
}
