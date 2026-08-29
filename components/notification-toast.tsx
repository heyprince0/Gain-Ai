'use client'

export function NotificationToast({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return <div role="status" className="fixed right-4 top-4 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{body}</p></div><button type="button" aria-label="Dismiss notification" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Dismiss</button></div></div>
}
