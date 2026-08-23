'use client'
import { LayoutDashboard, TrendingUp, ScanLine, Activity, User, CreditCard, ShoppingBag } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useBottomNav } from '@/contexts/bottom-nav-context'   // <--- new import

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { showBottomNav } = useBottomNav()  // <--- get state

  const isActive = (path: string) => pathname === path

  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    setIsDark(
      typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')
    )
  }, [])

  const inactiveColor = isDark ? '#6b7280' : '#9ca3af'
  const activeColor = '#00ff88'

  const navItems = [
    { icon: LayoutDashboard, path: '/dashboard' },
    { icon: TrendingUp, path: '/progress' },
    { icon: Activity, path: '/body-scanner' },
    { icon: CreditCard, path: '/membership' },
    { icon: ShoppingBag, path: '/shop' },
    { icon: User, path: '/profile' },
  ]

  const leftItems = navItems.slice(0, 3)
  const rightItems = navItems.slice(3)

  // 👇 Hide the nav when cart is open
  if (!showBottomNav) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: '12px',
        paddingRight: '12px',
        pointerEvents: 'none',
      }}
    >
      <nav
        className="bottom-nav bg-white/90 dark:bg-[#0f1318]/90 border border-gray-200 dark:border-[#1a2028]"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '440px',
          height: '64px',
          borderRadius: '28px',
          padding: '0 12px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.4)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'auto',
        }}
      >
        {leftItems.map(({ icon: Icon, path }) => (
          <NavButton
            key={path}
            Icon={Icon}
            active={isActive(path)}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onClick={() => router.push(path)}
          />
        ))}

        {/* Spacer for the center FAB */}
        <div style={{ width: '48px', flexShrink: 0 }} />

        {rightItems.map(({ icon: Icon, path }) => (
          <NavButton
            key={path}
            Icon={Icon}
            active={isActive(path)}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onClick={() => router.push(path)}
          />
        ))}

        {/* Center FAB for Food Scanner */}
        <button
          type="button"
          onClick={() => router.push('/food-scanner')}
          style={{
            position: 'absolute',
            top: '-22px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            borderRadius: '50%',
            width: '58px',
            height: '58px',
            boxShadow: '0 8px 24px rgba(0,255,136,0.45), 0 0 0 6px rgba(0,255,136,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid var(--nav-fab-ring, #fff)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
          }}
          className="dark:!border-[#0f1318]"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)'
          }}
        >
          <ScanLine size={26} color="#000" strokeWidth={2.25} />
        </button>
      </nav>
    </div>
  )
}

function NavButton({
  Icon,
  active,
  activeColor,
  inactiveColor,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  active: boolean
  activeColor: string
  inactiveColor: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        transition: 'background 0.2s ease',
        background: active ? 'rgba(0,255,136,0.15)' : 'transparent',
      }}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? activeColor : inactiveColor} />
    </button>
  )
}
