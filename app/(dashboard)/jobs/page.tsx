import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { JobsFilters } from "@/components/jobs/jobs-filters"
import { formatDate, formatCurrency, formatTime } from "@/lib/utils"

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) redirect("/login")

  const params = await searchParams
  const search = params.search ?? ""
  const status = params.status ?? ""
  const paymentStatus = params.payment ?? ""
  const dateFilter = params.date ?? ""

  let query = supabase
    .from("jobs")
    .select(`
      *,
      customer:customers(id, name),
      lead:leads(id, name),
      assigned_worker:profiles!jobs_assigned_to_fkey(id, full_name)
    `)
    .order("scheduled_date", { ascending: false })

  // Workers are filtered by RLS (job_workers policy) — no extra filter needed here

  if (status) query = query.eq("status", status)
  if (paymentStatus) query = query.eq("payment_status", paymentStatus)
  if (dateFilter) query = query.eq("scheduled_date", dateFilter)
  if (search) query = query.or(`service_type.ilike.%${search}%,job_number.ilike.%${search}%,address.ilike.%${search}%`)

  const { data: jobs, error: jobsError } = await query.limit(100)

  const isAdminOrManager = ["admin", "manager"].includes(profile.role)

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">{jobs?.length ?? 0} jobs</p>
        </div>
        {isAdminOrManager && (
          <Button asChild>
            <Link href="/jobs/new"><Plus className="w-4 h-4 mr-2" />New Job</Link>
          </Button>
        )}
      </div>

      <JobsFilters currentSearch={search} currentStatus={status} currentPayment={paymentStatus} currentDate={dateFilter} />

      {jobsError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-xs text-red-700">
          Query error: {jobsError.message} (code: {jobsError.code})
        </div>
      )}
      {!jobs || jobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description={profile.role === "worker" ? "You have no assigned jobs." : "Create your first job."}
          action={isAdminOrManager ? <Button asChild><Link href="/jobs/new">Create Job</Link></Button> : undefined}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Job #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  {profile.role !== "worker" && (
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Worker</th>
                  )}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline">{job.job_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{job.customer?.name ?? job.lead?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{job.service_type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(job.scheduled_date)}
                      {job.start_time && <span className="block">{formatTime(job.start_time)}</span>}
                    </td>
                    {profile.role !== "worker" && (
                      <td className="px-4 py-3 text-gray-600 text-xs">{(job.assigned_worker as any)?.full_name || "—"}</td>
                    )}
                    <td className="px-4 py-3 font-medium">{job.price ? formatCurrency(job.price) : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={job.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {jobs.map((job: any) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block bg-white rounded-lg border p-4 hover:shadow-md">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-blue-600">{job.job_number}</p>
                    <p className="text-sm text-gray-600">{job.customer?.name ?? job.lead?.name ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={job.status} />
                    <StatusBadge status={job.payment_status} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{job.service_type}</span>
                  <span className="font-semibold text-gray-900">{job.price ? formatCurrency(job.price) : "—"}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(job.scheduled_date)}
                  {(job.assigned_worker as any)?.full_name && ` · ${(job.assigned_worker as any).full_name}`}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
