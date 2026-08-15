import { Badge } from '@/components/ui/badge'

const STYLES: Record<string, string> = {
  Active: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
  'Expiring soon': 'border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  Expired: 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={STYLES[status] ?? ''}>{status}</Badge>
}
