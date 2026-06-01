import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { TaskActions } from '@/components/tasks/task-actions'
import { formatDate, formatRelativeDate, isOverdue } from '@/lib/utils'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const db = createServiceClient()
  const params = await searchParams
  const tab = params.tab ?? 'open'

  let query = db
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(id, full_name),
      customer:customers(id, name),
      lead:leads(id, name),
      job:jobs(id, job_number),
      quote:quotes(id, quote_number)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (profile.role === 'worker') {
    query = query.eq('assigned_to', user.id)
  }

  if (tab === 'open') {
    query = query.eq('status', 'open')
  } else {
    query = query.eq('status', 'completed')
  }

  const { data: tasks } = await query.limit(100)

  const isAdminOrManager = ['admin', 'manager'].includes(profile.role)

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks?.length ?? 0} {tab} tasks</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b">
        <Link
          href="/tasks?tab=open"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'open' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Open
        </Link>
        <Link
          href="/tasks?tab=completed"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'completed' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Completed
        </Link>
      </div>

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          title={tab === 'open' ? 'No open tasks' : 'No completed tasks'}
          description={tab === 'open' ? 'Tasks are created automatically when quotes are sent or jobs are completed.' : ''}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task: any) => {
            const overdue = tab === 'open' && task.due_date && isOverdue(task.due_date)
            const contact = task.customer ?? task.lead
            const contactType = task.customer_id ? 'customer' : 'lead'

            return (
              <div
                key={task.id}
                className={`bg-white rounded-lg border p-4 ${overdue ? 'border-red-200 bg-red-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-medium ${overdue ? 'text-red-700' : 'text-gray-900'}`}>{task.title}</p>
                      <StatusBadge status={task.priority} />
                      {task.task_type && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {task.task_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {task.due_date && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          Due {formatRelativeDate(task.due_date)}
                        </span>
                      )}
                      {task.assignee && isAdminOrManager && (
                        <span>{task.assignee.full_name}</span>
                      )}
                      {contact && (
                        <Link
                          href={`/${contactType === 'customer' ? 'customers' : 'leads'}/${contact.id}`}
                          className="hover:text-blue-600"
                        >
                          {contact.name}
                        </Link>
                      )}
                      {task.job && (
                        <Link href={`/jobs/${task.job.id}`} className="hover:text-blue-600">
                          {task.job.job_number}
                        </Link>
                      )}
                      {task.quote && (
                        <Link href={`/quotes/${task.quote.id}`} className="hover:text-blue-600">
                          {task.quote.quote_number}
                        </Link>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    )}
                  </div>

                  {tab === 'open' && (
                    <TaskActions taskId={task.id} isAdmin={profile.role === 'admin'} />
                  )}
                  {tab === 'completed' && task.completed_at && (
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(task.completed_at)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
