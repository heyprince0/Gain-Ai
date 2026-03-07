'use client'

import { LayoutDashboard, ScanLine, Activity } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string): boolean => pathname === path

  return (
    <nav className="bottom-nav">
      {/* Dashboard */}
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className={isActive('/dashboard') ? 'nav-btn active' : 'nav-btn'}
      >
        <LayoutDashboard size={24} />
        <span>Dashboard</span>
      </button>

      {/* Food Scanner - Center FAB */}
      <button
        type="button"
        onClick={() => router.push('/food-scanner')}
        className="nav-btn-fab"
      >
        <ScanLine size={26} color="#000" />
      </button>

      {/* Body Scanner */}
      <button
        type="button"
        onClick={() => router.push('/body-scanner')}
        className={isActive('/body-scanner') ? 'nav-btn active' : 'nav-btn'}
      >
        <Activity size={24} />
        <span>Body</span>
      </button>
    </nav>
  )
}
