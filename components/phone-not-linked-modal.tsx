'use client'

import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface PhoneNotLinkedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhoneNotLinkedModal({ open, onOpenChange }: PhoneNotLinkedModalProps) {
  const handleOk = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Gym Access Required
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Your phone number is not yet linked to any gym. Please contact your gym
            administrator to get access to GainAi.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            If you already have a gym membership, make sure your gym has added your
            phone number to their system.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleOk} variant="destructive">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
