'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { completeTask, deleteTask } from '@/lib/actions/tasks'

export function TaskActions({ taskId, isAdmin }: { taskId: string; isAdmin: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleComplete() {
    setLoading('complete')
    await completeTask(taskId)
    setLoading(null)
    router.refresh()
  }

  async function handleDelete() {
    setLoading('delete')
    await deleteTask(taskId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
        disabled={loading === 'complete'}
        onClick={handleComplete}
        title="Mark complete"
      >
        <Check className="w-4 h-4 text-green-600" />
      </Button>
      {isAdmin && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          disabled={loading === 'delete'}
          onClick={handleDelete}
          title="Delete task"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
      )}
    </div>
  )
}
