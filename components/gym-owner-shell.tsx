'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, LayoutDashboard, RefreshCw, ShoppingBag, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser' // ← Changed!

const links = [
  { href: '/gym-owner/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/gym-owner/renewals', label: 'Renewals', icon: RefreshCw },
  { href: '/gym-owner/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/gym-owner/settings', label: 'Settings', icon: Settings },
]

export function GymOwnerShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const signOut = async () => {
    await supabase.auth.signOut()
    // Force a hard redirect to login after signOut
    window.location.href = '/gym-owner/login'
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card p-5 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between pb-8">
          <Link href="/gym-owner/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <span>
              GainAi <span className="text-primary">Owner</span>
            </span>
          </Link>
          <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Gym administration</p>
            <h1 className="font-semibold">{title ?? 'Owner workspace'}</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
