'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransition, useCallback } from 'react'
import { JOB_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'

export function JobsFilters({
  currentSearch,
  currentStatus,
  currentPayment,
  currentDate,
}: {
  currentSearch: string
  currentStatus: string
  currentPayment: string
  currentDate: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      value ? params.set(key, value) : params.delete(key)
      startTransition(() => router.push(`/jobs?${params.toString()}`))
    },
    [router, searchParams]
  )

  return (
    <div className="mb-4 flex gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search job #, service, address..."
          defaultValue={currentSearch}
          onChange={(e) => { const v = e.target.value; setTimeout(() => updateParam('search', v), 400) }}
          className="pl-9"
        />
      </div>
      <Select value={currentStatus || 'all'} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-40 h-10 text-sm">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {JOB_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={currentPayment || 'all'} onValueChange={(v) => updateParam('payment', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-36 h-10 text-sm">
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          {PAYMENT_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={currentDate}
        onChange={(e) => updateParam('date', e.target.value)}
        className="w-40 h-10 text-sm"
      />
    </div>
  )
}
