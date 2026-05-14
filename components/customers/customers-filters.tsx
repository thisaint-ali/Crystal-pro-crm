'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransition, useCallback } from 'react'

interface CustomersFiltersProps {
  currentSearch: string
  currentType: string
  currentCity: string
}

export function CustomersFilters({ currentSearch, currentType, currentCity }: CustomersFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      value ? params.set(key, value) : params.delete(key)
      startTransition(() => router.push(`/customers?${params.toString()}`))
    },
    [router, searchParams]
  )

  return (
    <div className="mb-4 flex gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search name, phone, address..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const v = e.target.value
            setTimeout(() => updateParam('search', v), 400)
          }}
          className="pl-9"
        />
      </div>
      <Select value={currentType} onValueChange={(v) => updateParam('type', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-40 h-10 text-sm">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="residential">Residential</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Filter by city"
        defaultValue={currentCity}
        className="w-40"
        onChange={(e) => {
          const v = e.target.value
          setTimeout(() => updateParam('city', v), 400)
        }}
      />
    </div>
  )
}
