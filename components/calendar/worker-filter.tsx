'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface WorkerFilterProps {
  workers: { id: string; full_name: string }[]
  current: string
}

export function WorkerFilter({ workers, current }: WorkerFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('worker', e.target.value)
    } else {
      params.delete('worker')
    }
    router.push(`/calendar?${params.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="h-9 text-sm border rounded-md px-2 bg-white"
    >
      <option value="">All Workers</option>
      {workers.map((w) => (
        <option key={w.id} value={w.id}>{w.full_name}</option>
      ))}
    </select>
  )
}
