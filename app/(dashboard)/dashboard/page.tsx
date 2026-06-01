import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  UserPlus,
  Briefcase,
  DollarSign,
  CheckSquare,
  AlertCircle,
  Star,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils'
import { isAdmin, isManager } from '@/lib/auth/permissions'
import { startOfDay, startOfWeek, startOfMonth, endOfDay, format } from 'date-fns'
import type { Profile, Job, Lead, Task } from '@/types/crm'

async function getDashboardData(profile: Profile) {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekStartDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const todayDate = format(now, 'yyyy-MM-dd')
  const monthStart = startOfMonth(now).toISOString()

  if (profile.role === 'worker') {
    // Worker sees only assigned jobs/tasks
    const [jobsToday, upcomingJobs, openTasks, completedThisWeek] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, service_type, address, city, status, scheduled_date, start_time, customer_id')
        .eq('scheduled_date', todayDate)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true }),
      supabase
        .from('jobs')
        .select('id, service_type, address, city, status, scheduled_date, start_time, customer_id')
        .gt('scheduled_date', todayDate)
        .neq('status', 'cancelled')
        .order('scheduled_date', { ascending: true })
        .limit(5),
      supabase
        .from('tasks')
        .select('id, title, due_date, priority, task_type')
        .eq('assigned_to', profile.id)
        .eq('status', 'open')
        .order('due_date', { ascending: true })
        .limit(10),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', weekStart),
    ])

    return {
      role: 'worker' as const,
      jobsToday: jobsToday.data ?? [],
      upcomingJobs: upcomingJobs.data ?? [],
      openTasks: openTasks.data ?? [],
      completedThisWeek: completedThisWeek.count ?? 0,
    }
  }

  // Admin/Manager dashboard
  const [
    newLeadsToday,
    newLeadsThisWeek,
    newDirectJobsThisWeek,
    quotesSent,
    quotesAccepted,
    jobsToday,
    jobsThisWeek,
    revenueThisWeek,
    revenueThisMonth,
    unpaidJobs,
    followUpsDue,
    recentLeads,
    recentJobs,
    openTasks,
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd),
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).is('lead_id', null).neq('status', 'cancelled').gte('created_at', weekStart),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', todayDate)
      .neq('status', 'cancelled'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_date', weekStartDate)
      .neq('status', 'cancelled'),
    supabase
      .from('payments')
      .select('amount')
      .eq('payment_status', 'paid')
      .gte('paid_at', weekStart),
    supabase
      .from('payments')
      .select('amount')
      .eq('payment_status', 'paid')
      .gte('paid_at', monthStart),
    supabase
      .from('jobs')
      .select('id, job_number, service_type, address, city, price, scheduled_date, customer_id')
      .eq('status', 'completed')
      .eq('payment_status', 'unpaid')
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .lte('due_date', todayDate),
    supabase
      .from('leads')
      .select('id, name, phone, status, service_requested, created_at, lead_source')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('jobs')
      .select('id, job_number, service_type, address, city, status, payment_status, scheduled_date')
      .neq('status', 'cancelled')
      .order('scheduled_date', { ascending: true })
      .gte('scheduled_date', todayDate)
      .limit(5),
    supabase
      .from('tasks')
      .select('id, title, due_date, priority, task_type, status')
      .eq('status', 'open')
      .order('due_date', { ascending: true })
      .limit(5),
  ])

  const weekRevenue = (revenueThisWeek.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const monthRevenue = (revenueThisMonth.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const unpaidAmount = (unpaidJobs.data ?? []).reduce((sum, j) => sum + (j.price ?? 0), 0)
  const totalNewThisWeek = (newLeadsThisWeek.count ?? 0) + (newDirectJobsThisWeek.count ?? 0)

  return {
    role: profile.role as 'admin' | 'manager',
    newLeadsToday: newLeadsToday.count ?? 0,
    newLeadsThisWeek: totalNewThisWeek,
    quotesSent: quotesSent.count ?? 0,
    quotesAccepted: quotesAccepted.count ?? 0,
    jobsToday: jobsToday.count ?? 0,
    jobsThisWeek: jobsThisWeek.count ?? 0,
    revenueThisWeek: weekRevenue,
    revenueThisMonth: monthRevenue,
    unpaidAmount,
    unpaidJobs: unpaidJobs.data ?? [],
    followUpsDue: followUpsDue.count ?? 0,
    recentLeads: recentLeads.data ?? [],
    recentJobs: recentJobs.data ?? [],
    openTasks: openTasks.data ?? [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const data = await getDashboardData(profile as Profile)

  if (data.role === 'worker') {
    return <WorkerDashboard data={data} profile={profile as Profile} />
  }

  return <AdminManagerDashboard data={data} profile={profile as Profile} />
}

// Worker Dashboard
function WorkerDashboard({
  data,
  profile,
}: {
  data: Awaited<ReturnType<typeof getDashboardData>> & { role: 'worker' }
  profile: Profile
}) {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {profile.full_name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{data.jobsToday.length}</p>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{data.openTasks.length}</p>
            <p className="text-xs text-gray-500 mt-1">Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.completedThisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">Done this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Jobs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Today&apos;s Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.jobsToday.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No jobs scheduled today.</p>
          ) : (
            <div className="space-y-3">
              {data.jobsToday.map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">{job.service_type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {job.address}{job.city ? `, ${job.city}` : ''}
                    </p>
                    {job.start_time && (
                      <p className="text-xs text-blue-600 mt-0.5">{formatTime12(job.start_time)}</p>
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Jobs */}
      {data.upcomingJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Upcoming Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.upcomingJobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{job.service_type}</p>
                  <p className="text-xs text-gray-500">{formatRelativeDate(job.scheduled_date)}</p>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Open Tasks */}
      {data.openTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-600" />
              Open Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.openTasks.map((task: any) => (
              <Link
                key={task.id}
                href={`/tasks`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-gray-500">{formatRelativeDate(task.due_date)}</p>
                  )}
                </div>
                <StatusBadge status={task.priority} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Admin / Manager Dashboard
function AdminManagerDashboard({
  data,
  profile,
}: {
  data: Awaited<ReturnType<typeof getDashboardData>> & { role: 'admin' | 'manager' }
  profile: Profile
}) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Leads Today"
          value={data.newLeadsToday}
          subtitle={`${data.newLeadsThisWeek} this week`}
          icon={<UserPlus className="w-5 h-5 text-blue-600" />}
          color="blue"
          href="/leads"
        />
        <StatCard
          title="Jobs Today"
          value={data.jobsToday}
          subtitle={`${data.jobsThisWeek} this week`}
          icon={<Briefcase className="w-5 h-5 text-purple-600" />}
          color="purple"
          href="/jobs"
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(data.revenueThisMonth)}
          subtitle={`${formatCurrency(data.revenueThisWeek)} this week`}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          color="green"
          href="/payments"
        />
        <StatCard
          title="Unpaid Jobs"
          value={formatCurrency(data.unpaidAmount)}
          subtitle={`${data.unpaidJobs?.length ?? 0} jobs pending`}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          color="red"
          href="/payments"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Quotes Sent"
          value={data.quotesSent}
          subtitle={`${data.quotesAccepted} accepted`}
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          color="indigo"
          href="/quotes"
        />
        <StatCard
          title="Follow-Ups Due"
          value={data.followUpsDue}
          subtitle="tasks overdue"
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          color="orange"
          href="/tasks"
          alert={data.followUpsDue > 0}
        />
        <StatCard
          title="Open Tasks"
          value={data.openTasks?.length ?? 0}
          subtitle="assigned tasks"
          icon={<CheckSquare className="w-5 h-5 text-teal-600" />}
          color="teal"
          href="/tasks"
        />
        <StatCard
          title="Quotes Pending"
          value={data.quotesSent - data.quotesAccepted}
          subtitle="awaiting response"
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
          color="violet"
          href="/quotes"
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Today&apos;s Schedule
              </CardTitle>
              <Link href="/jobs" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentJobs?.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No jobs scheduled today.</p>
            ) : (
              <div className="space-y-2">
                {data.recentJobs?.map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.service_type}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {job.address}{job.city ? `, ${job.city}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <StatusBadge status={job.payment_status} />
                      <StatusBadge status={job.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-600" />
                Recent Leads
              </CardTitle>
              <Link href="/leads" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentLeads?.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                No leads yet.{' '}
                <Link href="/leads/new" className="text-blue-600 hover:underline">
                  Add your first lead
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {data.recentLeads?.map((lead: any) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {lead.service_requested ?? '—'} &bull; {formatDate(lead.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={lead.status} className="flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpaid Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-600" />
                Unpaid Completed Jobs
              </CardTitle>
              <Link href="/payments" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.unpaidJobs?.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No unpaid jobs. All clear!</p>
            ) : (
              <div className="space-y-2">
                {data.unpaidJobs?.map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.service_type}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {job.address}{job.city ? `, ${job.city}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-700 flex-shrink-0 ml-2">
                      {formatCurrency(job.price)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Tasks / Follow-ups */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-orange-600" />
                Open Tasks
              </CardTitle>
              <Link href="/tasks" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.openTasks?.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No open tasks.</p>
            ) : (
              <div className="space-y-2">
                {data.openTasks?.map((task: any) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500">{formatRelativeDate(task.due_date)}</p>
                      )}
                    </div>
                    <StatusBadge status={task.priority} className="flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  href,
  alert,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  href: string
  alert?: boolean
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    orange: 'bg-orange-50',
    indigo: 'bg-indigo-50',
    teal: 'bg-teal-50',
    violet: 'bg-violet-50',
  }

  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${alert ? 'border-orange-300' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${bgColors[color] ?? 'bg-gray-50'}`}>{icon}</div>
            {alert && <span className="w-2 h-2 rounded-full bg-orange-500 mt-1" />}
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          <p className="text-xs font-medium text-gray-600 mt-1">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function formatTime12(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}
