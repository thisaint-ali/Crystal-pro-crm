'use client'

import { useState, useTransition } from 'react'
import { updatePaymentStatus } from '@/lib/actions/jobs'

const OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
]

const COLOR: Record<string, string> = {
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  deposit_paid: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  refunded: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function PaymentStatusSelect({
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
    setStatus(newStatus)
    startTransition(async () => {
      await updatePaymentStatus(jobId, newStatus)
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
