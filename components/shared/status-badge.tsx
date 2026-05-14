import { cn } from '@/lib/utils'
import type {
  LeadStatus,
  JobStatus,
  PaymentStatus,
  ReviewStatus,
  QuoteStatus,
  TaskStatus,
  Priority,
} from '@/types/crm'

type StatusType =
  | LeadStatus
  | JobStatus
  | PaymentStatus
  | ReviewStatus
  | QuoteStatus
  | TaskStatus
  | Priority
  | string

const STATUS_COLORS: Record<string, string> = {
  // Lead statuses
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-gray-100 text-gray-700 border-gray-200',
  waiting_on_photos: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  estimate_needed: 'bg-orange-100 text-orange-800 border-orange-200',
  quote_sent: 'bg-purple-100 text-purple-800 border-purple-200',
  follow_up_needed: 'bg-red-100 text-red-700 border-red-200',
  booked: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-gray-100 text-gray-500 border-gray-200',

  // Job statuses
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  on_the_way: 'bg-purple-100 text-purple-800 border-purple-200',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',

  // Payment statuses
  unpaid: 'bg-red-100 text-red-700 border-red-200',
  deposit_paid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  refunded: 'bg-gray-100 text-gray-500 border-gray-200',

  // Quote statuses
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-500 border-gray-200',

  // Review statuses
  not_requested: 'bg-gray-100 text-gray-500 border-gray-200',
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',

  // Task statuses
  open: 'bg-blue-100 text-blue-800 border-blue-200',

  // Priority
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  waiting_on_photos: 'Waiting on Photos',
  estimate_needed: 'Estimate Needed',
  quote_sent: 'Quote Sent',
  follow_up_needed: 'Follow Up Needed',
  booked: 'Booked',
  lost: 'Lost',
  scheduled: 'Scheduled',
  on_the_way: 'On the Way',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  unpaid: 'Unpaid',
  deposit_paid: 'Deposit Paid',
  paid: 'Paid',
  refunded: 'Refunded',
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  not_requested: 'Not Requested',
  requested: 'Requested',
  open: 'Open',
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
