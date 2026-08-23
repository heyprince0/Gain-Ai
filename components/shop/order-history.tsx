'use client'

import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Order, STATUS_COLORS } from './types'
import { EmptyState } from './empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface OrderHistoryProps {
  orders: Order[]
  isLoading?: boolean
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'N/A'
  }
}

export function OrderHistory({ orders, isLoading = false }: OrderHistoryProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-12 text-primary" />}
        title="No Orders Yet"
        description="You haven&apos;t placed any orders yet. Start shopping to see your order history here."
      />
    )
  }

  return (
    <Card className="rounded-xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Order History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => {
            const productName = order.gym_products?.name || 'Product'
            const price = order.gym_products?.price || 0
            const total = price * order.quantity

            return (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {productName}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Qty: {order.quantity}</span>
                    <span>₹{total}</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
                <Badge className={`flex-shrink-0 ml-2 ${STATUS_COLORS[order.status] ?? ''}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
