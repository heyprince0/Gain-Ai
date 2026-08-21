'use client'

import { ShoppingBag, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function ShopContent() {
  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplement Shop</h1>
        <p className="text-sm text-muted-foreground mt-1">Get your fitness supplements delivered</p>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Coming Soon!</h2>
            <p className="text-muted-foreground max-w-sm">
              We're working on bringing you the best supplements for your fitness journey.
              Stay tuned for exclusive deals and premium products.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Launching in early 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
