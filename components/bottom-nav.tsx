'use client'
import { LayoutDashboard, TrendingUp, ScanLine, Activity, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  // detect theme on client
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: TrendingUp, label: 'Progress', path: '/progress' },
    { icon: Activity, label: 'Body', path: '/body-scanner' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  // Split items so the center FAB sits between the 2nd and 3rd tab
  const leftItems = navItems.slice(0, 2)
  const rightItems = navItems.slice(2)

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
          height: '68px',
          borderRadius: '28px',
          padding: '0 10px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.4)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'auto',
        }}
      >
        {leftItems.map(({ icon: Icon, label, path }) => (
          <NavButton
            key={path}
            Icon={Icon}
            label={label}
            active={isActive(path)}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onClick={() => router.push(path)}
          />
        ))}

        {/* Spacer so the two side groups don't collide under the center FAB */}
        <div style={{ width: '60px', flexShrink: 0 }} />

        {rightItems.map(({ icon: Icon, label, path }) => (
          <NavButton
            key={path}
            Icon={Icon}
            label={label}
            active={isActive(path)}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onClick={() => router.push(path)}
          />
        ))}

        {/* Center FAB for Food Scanner */}
        <button
          type="button"
          onClick={() => router.push('/attendance/checkin')}
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
          <ScanLine size={24} color="#000" strokeWidth={2.25} />
        </button>
      </nav>
    </div>
  )
}

function NavButton({
  Icon,
  label,
  active,
  activeColor,
  inactiveColor,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  label: string
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        flex: 1,
        padding: '8px 4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '28px',
          borderRadius: '14px',
          background: active ? 'rgba(0,255,136,0.15)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} color={active ? activeColor : inactiveColor} />
      </div>
      <span
        style={{
          fontSize: '10px',
          fontWeight: active ? 600 : 500,
          color: active ? activeColor : inactiveColor,
          transition: 'color 0.2s ease',
        }}
      >
        {label}
      </span>
    </button>
  )
}
