import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatTime } from '@/lib/utils'
import { addDays, startOfWeek, format, parseISO, isSameDay } from 'date-fns'
import { WorkerFilter } from '@/components/calendar/worker-filter'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id, role, active').eq('id', user.id).single() as { data: { id: string; role: string; active: boolean } | null }
  if (!profile) redirect('/login')

  const params = await searchParams
  const weekParam = params.week
  const workerFilter = params.worker ?? ''

  // Determine week start
  const weekStart = weekParam
    ? parseISO(weekParam)
    : startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)
  const prevWeek = format(addDays(weekStart, -7), 'yyyy-MM-dd')
  const nextWeek = format(addDays(weekStart, 7), 'yyyy-MM-dd')

  let jobQuery = supabase
    .from('jobs')
    .select(`
      id, job_number, service_type, scheduled_date, start_time, status, payment_status, price,
      customer:customers(id, name),
      lead:leads(id, name),
      assignee:profiles!jobs_assigned_to_fkey(id, full_name)
    `)
    .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
    .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true, nullsFirst: true })

  if (profile.role === 'worker') {
    jobQuery = jobQuery.eq('assigned_to', user.id)
  } else if (workerFilter) {
    jobQuery = jobQuery.eq('assigned_to', workerFilter)
  }

  const { data: jobs } = await jobQuery.limit(200)

  // Workers for filter
  const { data: workers } = profile.role !== 'worker'
    ? await supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name')
    : { data: null }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getJobsForDay(date: Date) {
    return (jobs ?? []).filter((job: any) =>
      isSameDay(parseISO(job.scheduled_date), date)
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-2">
          {workers && workers.length > 0 && (
            <WorkerFilter
              workers={workers as { id: string; full_name: string }[]}
              current={workerFilter}
            />
          )}
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/calendar?week=${prevWeek}${workerFilter ? `&worker=${workerFilter}` : ''}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </Link>
        <p className="font-semibold text-gray-900">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
        <Link
          href={`/calendar?week=${nextWeek}${workerFilter ? `&worker=${workerFilter}` : ''}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayJobs = getJobsForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`bg-white rounded-lg border ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`p-2 border-b text-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">{format(day, 'EEE')}</p>
                <p className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="p-2 space-y-1.5 min-h-[80px]">
                {dayJobs.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center mt-3">—</p>
                ) : (
                  dayJobs.map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-1.5 rounded text-xs bg-blue-50 hover:bg-blue-100 border border-blue-100"
                    >
                      <p className="font-medium text-blue-700 truncate">{job.job_number}</p>
                      <p className="text-gray-600 truncate">{job.customer?.name ?? job.lead?.name ?? '—'}</p>
                      <p className="text-gray-500 truncate">{job.service_type}</p>
                      {job.start_time && <p className="text-gray-400">{formatTime(job.start_time)}</p>}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
