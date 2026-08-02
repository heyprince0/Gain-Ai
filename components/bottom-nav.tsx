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

  return (
    <nav
      className="bottom-nav bg-white dark:bg-[#0f1318] border-t border-gray-200 dark:border-[#1a2028]"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '72px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 9999,
      }}
    >
      {/* Regular nav items */}
      {navItems.map(({ icon: Icon, label, path }) => (
        <button
          key={path}
          type="button"
          onClick={() => router.push(path)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isActive(path) ? activeColor : inactiveColor,
            fontSize: '10px',
            fontWeight: 500,
            flex: 1,
            transition: 'color 0.2s ease',
          }}
        >
          <Icon size={24} strokeWidth={isActive(path) ? 2.5 : 2} />
          <span>{label}</span>
        </button>
      ))}

      {/* Center FAB for Food Scanner */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/food-scanner')}
          style={{
            background: '#00ff88',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            boxShadow: '0 8px 32px rgba(0,255,136,0.4), 0 0 0 12px rgba(0,255,136,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ScanLine size={28} color="#000" strokeWidth={2} />
        </button>
      </div>
    </nav>
  )
}
