'use client'

import { useState, useTransition } from 'react'
import { updateJobStatus } from '@/lib/actions/jobs'

const OPTIONS = [
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'on_the_way',  label: 'On the Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
]

const COLOR: Record<string, string> = {
  scheduled:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  on_the_way:  'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  cancelled:   'bg-gray-50 text-gray-500 border-gray-200',
}

export function JobStatusSelect({
  jobId,
  currentStatus,
}: {
  jobId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    const old = status
    setStatus(newStatus)
    startTransition(async () => {
      await updateJobStatus(jobId, newStatus, old)
    })
  }

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={handleChange}
      className={`text-xs font-medium rounded-full border px-2 py-0.5 cursor-pointer transition-opacity ${COLOR[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'} ${isPending ? 'opacity-50' : ''}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
