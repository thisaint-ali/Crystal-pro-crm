'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { requestReview, markReviewCompleted } from '@/lib/actions/payments'

export function ReviewActions({
  jobId,
  reviewId,
  mode,
}: {
  jobId?: string
  reviewId?: string
  mode: 'request' | 'complete'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handle() {
    setLoading(true)
    setError('')
    let result: { error?: string } = {}

    if (mode === 'request' && jobId) {
      result = await requestReview(jobId)
    } else if (mode === 'complete' && reviewId) {
      result = await markReviewCompleted(reviewId)
    }

    if (result.error) setError(result.error)
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <Button size="sm" variant="outline" disabled={loading} onClick={handle}>
        {loading ? '...' : mode === 'request' ? 'Send Review Request' : 'Mark Reviewed'}
      </Button>
    </div>
  )
}
