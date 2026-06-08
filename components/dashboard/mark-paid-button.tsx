'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface Props {
  jobId: string
  action: (id: string) => Promise<{ error?: string }>
}

export function MarkPaidButton({ jobId, action }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleClick = () => {
    startTransition(async () => {
      const result = await action(jobId)
      if (!result.error) {
        setDone(true)
        // Refresh the server component so revenue cards update instantly
        router.refresh()
      }
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <CheckCircle className="w-3.5 h-3.5" />
        Paid
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {isPending ? 'Saving…' : 'Mark paid'}
    </button>
  )
}
