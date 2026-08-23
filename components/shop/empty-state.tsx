'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="rounded-xl border-border/50">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
