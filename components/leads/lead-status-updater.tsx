'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { updateLeadStatus } from '@/lib/actions/leads'
import { LEAD_STATUSES } from '@/lib/constants'
import { StatusBadge } from '@/components/shared/status-badge'

interface LeadStatusUpdaterProps {
  leadId: string
  currentStatus: string
}

export function LeadStatusUpdater({ leadId, currentStatus }: LeadStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  const handleChange = (newStatus: string) => {
    const oldStatus = status
    setStatus(newStatus)
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus, oldStatus)
      if (result.error) {
        setStatus(oldStatus)
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Status updated' })
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        {isPending && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </div>
      <Select value={status} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
