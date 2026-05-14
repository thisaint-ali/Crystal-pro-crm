'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { markQuoteSent, markQuoteAccepted, markQuoteDeclined, convertQuoteToJob } from '@/lib/actions/quotes'

export function QuoteActions({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handle(action: string) {
    setLoading(action)
    setError('')
    let result: { error?: string; jobId?: string } = {}

    if (action === 'sent') result = await markQuoteSent(quoteId)
    else if (action === 'accepted') result = await markQuoteAccepted(quoteId)
    else if (action === 'declined') result = await markQuoteDeclined(quoteId)
    else if (action === 'convert') {
      result = await convertQuoteToJob(quoteId)
      if (!result.error && result.jobId) {
        router.push(`/jobs/${result.jobId}`)
        return
      }
    }

    if (result.error) setError(result.error)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}

      {status === 'draft' && (
        <Button
          size="sm"
          className="w-full"
          disabled={loading === 'sent'}
          onClick={() => handle('sent')}
        >
          {loading === 'sent' ? 'Marking...' : 'Mark as Sent'}
        </Button>
      )}

      {status === 'sent' && (
        <>
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading === 'accepted'}
            onClick={() => handle('accepted')}
          >
            {loading === 'accepted' ? 'Saving...' : 'Mark Accepted'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            disabled={loading === 'declined'}
            onClick={() => handle('declined')}
          >
            {loading === 'declined' ? 'Saving...' : 'Mark Declined'}
          </Button>
        </>
      )}

      {status === 'accepted' && (
        <Button
          size="sm"
          className="w-full"
          disabled={loading === 'convert'}
          onClick={() => handle('convert')}
        >
          {loading === 'convert' ? 'Converting...' : 'Convert to Job'}
        </Button>
      )}

      {(status === 'declined' || status === 'expired') && (
        <p className="text-xs text-gray-400 text-center py-1">No further actions available.</p>
      )}
    </div>
  )
}
