'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { NotificationPermission } from './notification-permission'

type Notification = {
  id: string
  title: string
  body: string
  url?: string
  is_read: boolean
  sent_at: string
  source: 'db' | 'computed' // db = from gym owner, computed = subscription alert
  type?: 'expired' | 'expiring-today' | 'expiring-soon' | 'general'
}

// Compute subscription alert from end_date — no DB write needed
function getSubscriptionAlert(endDate: string | null, planName: string): Notification | null {
  if (!endDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((end.getTime() - today.getTime()) / 86400000)

  if (daysLeft < 0) {
    return {
      id: 'subscription-expired',
      title: 'Subscription Expired',
      body: `Your ${planName} plan has expired. Contact your gym to renew.`,
      url: '/membership',
      is_read: false,
      sent_at: new Date().toISOString(),
      source: 'computed',
      type: 'expired',
    }
  }
  if (daysLeft === 0) {
    return {
      id: 'subscription-today',
      title: 'Subscription Expires Today',
      body: `Your ${planName} plan expires today. Renew now to keep access.`,
      url: '/membership',
      is_read: false,
      sent_at: new Date().toISOString(),
      source: 'computed',
      type: 'expiring-today',
    }
  }
  if (daysLeft <= 3) {
    return {
      id: 'subscription-soon',
      title: 'Subscription Expiring Soon',
      body: `Your ${planName} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now to keep access.`,
      url: '/membership',
      is_read: false,
      sent_at: new Date().toISOString(),
      source: 'computed',
      type: 'expiring-soon',
    }
  }
  return null
}

function getAlertColor(type?: string) {
  if (type === 'expired') return 'text-red-600 dark:text-red-400'
  if (type === 'expiring-today') return 'text-amber-600 dark:text-amber-400'
  if (type === 'expiring-soon') return 'text-orange-600 dark:text-orange-400'
  return 'text-foreground'
}

export function NotificationBell({ gymId }: { gymId: string }) {
  const [open, setOpen] = useState(false)
  const [dbItems, setDbItems] = useState<Notification[]>([])
  const [subscriptionAlert, setSubscriptionAlert] = useState<Notification | null>(null)
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission as 'default' | 'granted' | 'denied')
    }
  }, [])

  // ✅ Compute subscription alert from gym_members.end_date
  // No cron, no FCM, no DB write — just reads existing data
  useEffect(() => {
    async function loadSubscriptionStatus() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) return

      const { data: member } = await supabaseBrowser
        .from('gym_members')
        .select('end_date, gym_subscription_plans(plan_name)')
        .eq('linked_profile_id', user.id)
        .eq('gym_id', gymId)
        .is('deleted_at', null)
        .maybeSingle()

      if (!member) return

      // @ts-ignore
      const planName = member.gym_subscription_plans?.plan_name || 'subscription'
      const alert = getSubscriptionAlert(member.end_date, planName)
      setSubscriptionAlert(alert)
    }

    loadSubscriptionStatus()
  }, [gymId])

  // Load manual notifications from DB (sent by gym owner)
  async function loadDbNotifications() {
    const { data: { session } } = await supabaseBrowser.auth.getSession()
    if (!session) return
    try {
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        const json = await response.json()
        setDbItems(
          (json.notifications || []).map((n: any) => ({ ...n, source: 'db' }))
        )
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  // Load DB notifications on mount if permission granted
  useEffect(() => {
    if (permission === 'granted') loadDbNotifications()
  }, [permission])

  // Reload when dropdown opens
  useEffect(() => {
    if (open && permission === 'granted') loadDbNotifications()
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  async function markRead(id: string) {
    const { data: { session } } = await supabaseBrowser.auth.getSession()
    if (!session) return
    await fetch('/api/notifications/mark-read', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ notification_id: id })
    })
    setDbItems((current) =>
      current.map((item) => item.id === id ? { ...item, is_read: true } : item)
    )
  }

  // Combine: subscription alert first, then DB notifications
  const allItems: Notification[] = [
    ...(subscriptionAlert ? [subscriptionAlert] : []),
    ...dbItems,
  ]

  // Unread count: subscription alert (always unread if present) + unread DB items
  const unread =
    (subscriptionAlert ? 1 : 0) +
    dbItems.filter((item) => !item.is_read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2.5 hover:bg-muted active:scale-95 transition-transform touch-manipulation"
      >
        <Bell className="size-5" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-semibold leading-5 text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl"
          style={{ maxWidth: 'min(calc(100vw - 2rem), 320px)' }}
        >
          <h3 className="px-3 py-2 font-semibold text-foreground">Notifications</h3>

          {permission !== 'granted' ? (
            // Show subscription alert even without push permission
            <>
              {subscriptionAlert && (
                <button
                  type="button"
                  onClick={() => { if (subscriptionAlert.url) window.location.assign(subscriptionAlert.url) }}
                  className="w-full rounded-xl p-3 text-left hover:bg-muted transition-colors mb-1"
                >
                  <p className={`text-sm font-medium ${getAlertColor(subscriptionAlert.type)}`}>
                    {subscriptionAlert.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {subscriptionAlert.body}
                  </p>
                </button>
              )}
              <div className="px-3 py-2">
                <NotificationPermission
                  gymId={gymId}
                  onSuccess={() => {
                    setPermission('granted')
                    loadDbNotifications()
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {allItems.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  You are all caught up.
                </p>
              ) : (
                allItems.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.source === 'db') markRead(item.id)
                      if (item.url) window.location.assign(item.url)
                    }}
                    className={`w-full rounded-xl p-3 text-left hover:bg-muted active:bg-muted/80 transition-colors ${
                      item.source === 'db' && item.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    <p className={`text-sm font-medium ${getAlertColor(item.type)}`}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {item.body}
                    </p>
                    {item.source === 'db' && !item.is_read && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead(item.id)
                        }}
                        className="mt-2 inline-block text-xs font-medium text-primary hover:underline touch-manipulation"
                      >
                        Mark as read
                      </span>
                    )}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
