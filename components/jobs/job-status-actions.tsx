'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateJobStatus, cancelJob } from '@/lib/actions/jobs'

interface Props {
  jobId: string
  status: string
  role: string
}

export function JobStatusActions({ jobId, status, role }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handle(newStatus: string) {
    setLoading(newStatus)
    setError('')
    const result = await updateJobStatus(jobId, newStatus, status)
    if (result.error) setError(result.error)
    setLoading(null)
    router.refresh()
  }

  async function handleCancel() {
    setLoading('cancel')
    setError('')
    const result = await cancelJob(jobId)
    if (result.error) setError(result.error)
    setLoading(null)
    router.refresh()
  }

  const isWorker = role === 'worker'

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}

      {status === 'scheduled' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={loading === 'on_the_way'}
          onClick={() => handle('on_the_way')}
        >
          {loading === 'on_the_way' ? 'Updating...' : 'On the Way'}
        </Button>
      )}

      {status === 'on_the_way' && (
        <Button
          size="sm"
          className="w-full"
          disabled={loading === 'in_progress'}
          onClick={() => handle('in_progress')}
        >
          {loading === 'in_progress' ? 'Updating...' : 'Start Job'}
        </Button>
      )}

      {status === 'in_progress' && (
        <Button
          size="sm"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={loading === 'completed'}
          onClick={() => handle('completed')}
        >
          {loading === 'completed' ? 'Completing...' : 'Complete Job'}
        </Button>
      )}

      {!isWorker && status !== 'completed' && status !== 'cancelled' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          disabled={loading === 'cancel'}
          onClick={handleCancel}
        >
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel Job'}
        </Button>
      )}

      {(status === 'completed' || status === 'cancelled') && (
        <p className="text-xs text-gray-400 text-center py-1">
          {status === 'completed' ? 'Job completed.' : 'Job cancelled.'}
        </p>
      )}
    </div>
  )
}
