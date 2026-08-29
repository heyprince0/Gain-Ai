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
}

export function NotificationBell({ gymId }: { gymId: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync with actual browser permission state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission as 'default' | 'granted' | 'denied')
    }
  }, [])

  // ✅ FIX 2: Load notifications on mount (not just on dropdown open)
  // so the unread badge shows immediately on page load
  useEffect(() => {
    if (permission === 'granted') {
      loadNotifications()
    }
  }, [permission])

  // ✅ Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  async function loadNotifications() {
    // ✅ FIX 1: was `supabase` (undefined) — now correctly `supabaseBrowser`
    const { data: { session } } = await supabaseBrowser.auth.getSession()
    if (!session) return
    try {
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) setItems((await response.json()).notifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  // Reload when dropdown opens (to get fresh data)
  useEffect(() => {
    if (open && permission === 'granted') {
      loadNotifications()
    }
  }, [open, permission])

  async function markRead(id: string) {
    // ✅ FIX 1: was `supabase` (undefined) — now correctly `supabaseBrowser`
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
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    )
  }

  const unread = items.filter((item) => !item.is_read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2 hover:bg-muted"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-xs text-primary-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-border bg-card p-2 shadow-xl">
          <h3 className="px-3 py-2 font-semibold">Notifications</h3>

          {permission !== 'granted' ? (
            <div className="px-3 py-2">
              <NotificationPermission
                gymId={gymId}
                onSuccess={() => {
                  setPermission('granted')
                  loadNotifications()
                }}
              />
            </div>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  You are all caught up.
                </p>
              ) : (
                items.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markRead(item.id)
                      if (item.url) window.location.assign(item.url)
                    }}
                    className={`w-full rounded-xl p-3 text-left hover:bg-muted ${
                      item.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                    {!item.is_read && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead(item.id)
                        }}
                        className="mt-2 inline-block text-xs text-primary"
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
