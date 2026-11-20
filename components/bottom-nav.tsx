'use client'

import {
  Activity,
  LayoutDashboard,
  ScanLine,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useBottomNav } from '@/contexts/bottom-nav-context'

type NavItem = {
  icon: LucideIcon
  path: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, path: '/dashboard', label: 'Home' },
  { icon: TrendingUp, path: '/progress', label: 'Progress' },
  { icon: Activity, path: '/body-scanner', label: 'Body' },
  { icon: User, path: '/profile', label: 'Profile' },
]

// Symmetric split around the center FAB (was 3 / 1 — visually lopsided)
const LEFT_ITEMS = NAV_ITEMS.slice(0, 2)
const RIGHT_ITEMS = NAV_ITEMS.slice(2)

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { showBottomNav } = useBottomNav()

  if (!showBottomNav) return null

  // Highlight parent route on child pages too (e.g. /progress/weekly)
  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary navigation"
        className="bottom-nav pointer-events-auto relative flex h-[68px] w-full max-w-[440px] items-center justify-between rounded-[28px] border border-gray-200 bg-white/90 px-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-[#1a2028] dark:bg-[#0f1318]/90 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      >
        {LEFT_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            {...item}
            active={isActive(item.path)}
            onClick={() => router.push(item.path)}
          />
        ))}

        {/* Reserve FAB space — width matches the FAB */}
        <div aria-hidden className="w-[60px] shrink-0" />

        {RIGHT_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            {...item}
            active={isActive(item.path)}
            onClick={() => router.push(item.path)}
          />
        ))}

        {/* Center FAB — Food scanner */}
        <button
          type="button"
          aria-label="Food scanner"
          aria-current={pathname === '/food-scanner' ? 'page' : undefined}
          onClick={() => router.push('/food-scanner')}
          className="absolute top-[-22px] left-1/2 z-10 flex h-[58px] w-[58px] -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#00ff88] to-[#00cc6a] shadow-[0_8px_24px_rgba(0,255,136,0.45),0_0_0_6px_rgba(0,255,136,0.12)] transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 dark:border-[#0f1318] dark:focus-visible:ring-offset-[#0f1318]"
        >
          <ScanLine size={26} color="#000" strokeWidth={2.25} />
        </button>
      </nav>
    </div>
  )
}

function NavButton({
  icon: Icon,
  active,
  label,
  onClick,
}: NavItem & { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={[
        'flex h-[52px] w-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl border-none transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f1318]',
        active
          ? 'bg-[#00ff88]/15 text-[#00ff88]'
          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
      ].join(' ')}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium leading-none tracking-tight">
        {label}
      </span>
    </button>
  )
}
