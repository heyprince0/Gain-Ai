'use client'

import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

export function AccessRevokedModal({ open }: { open: boolean }) {
  async function handleOk() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm rounded-2xl [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="size-7 text-red-500" />
            </span>
            Access Removed
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground">
          Your gym has removed your access to GainAi. Please contact your gym if you think this is a mistake.
        </p>
        <button
          onClick={handleOk}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] py-2.5 text-sm font-semibold text-black"
        >
          OK
        </button>
      </DialogContent>
    </Dialog>
  )
}
