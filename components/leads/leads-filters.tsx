'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/constants'
import type { Profile } from '@/types/crm'
import { useCallback, useTransition } from 'react'

interface LeadsFiltersProps {
  teamMembers: Pick<Profile, 'id' | 'full_name' | 'role'>[]
  currentSearch: string
  currentStatus: string
  currentSource: string
  currentAssigned: string
  currentSort: string
}

export function LeadsFilters({
  teamMembers,
  currentSearch,
  currentStatus,
  currentSource,
  currentAssigned,
  currentSort,
}: LeadsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`/leads?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const clearAll = () => {
    startTransition(() => {
      router.push('/leads')
    })
  }

  const hasFilters = currentSearch || currentStatus || currentSource || currentAssigned

  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search name, phone, city..."
            defaultValue={currentSearch}
            onChange={(e) => {
              const v = e.target.value
              const handler = setTimeout(() => updateParam('search', v), 400)
              return () => clearTimeout(handler)
            }}
            className="pl-9"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <Select value={currentStatus} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentSource} onValueChange={(v) => updateParam('source', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentAssigned} onValueChange={(v) => updateParam('assigned', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentSort} onValueChange={(v) => updateParam('sort', v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest First</SelectItem>
            <SelectItem value="follow_up">Follow-up Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
