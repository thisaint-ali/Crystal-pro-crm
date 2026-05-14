import { Activity } from 'lucide-react'
import { formatRelativeTime, toTitleCase } from '@/lib/utils'
import type { ActivityLogWithUser } from '@/types/crm'

interface ActivityLogSectionProps {
  activities: ActivityLogWithUser[]
}

const ACTION_COLORS: Record<string, string> = {
  lead_created: 'bg-blue-100 text-blue-700',
  lead_status_changed: 'bg-purple-100 text-purple-700',
  quote_created: 'bg-indigo-100 text-indigo-700',
  quote_sent: 'bg-blue-100 text-blue-700',
  quote_accepted: 'bg-green-100 text-green-700',
  quote_declined: 'bg-red-100 text-red-700',
  job_created: 'bg-blue-100 text-blue-700',
  job_assigned: 'bg-purple-100 text-purple-700',
  job_status_changed: 'bg-orange-100 text-orange-700',
  job_completed: 'bg-green-100 text-green-700',
  payment_added: 'bg-green-100 text-green-700',
  job_marked_paid: 'bg-green-100 text-green-700',
  photo_uploaded: 'bg-teal-100 text-teal-700',
  note_added: 'bg-gray-100 text-gray-700',
  review_requested: 'bg-yellow-100 text-yellow-700',
  task_created: 'bg-blue-100 text-blue-700',
  task_completed: 'bg-green-100 text-green-700',
  customer_created: 'bg-blue-100 text-blue-700',
  lead_converted: 'bg-green-100 text-green-700',
}

export function ActivityLogSection({ activities }: ActivityLogSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Activity</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${
                  ACTION_COLORS[activity.action] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {toTitleCase(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">
                  {activity.user?.full_name ?? 'System'} &bull;{' '}
                  {formatRelativeTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
