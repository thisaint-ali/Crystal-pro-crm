import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { JobsFilters } from "@/components/jobs/jobs-filters"
import { formatDate, formatCurrency, formatTime } from "@/lib/utils"
import { PaymentStatusSelect } from "@/components/jobs/payment-status-select"
import { JobStatusSelect } from "@/components/jobs/job-status-select"

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

  // Use service role client for data queries — auth already verified above
  // Workers see only their own jobs; admins/managers see all
  const db = createServiceClient()
  let baseQuery = db
    .from("jobs")
    .select(`
      id, job_number, service_type, address, city, state, scheduled_date, start_time,
      status, payment_status, price, customer_id, lead_id, assigned_to,
      customer:customers(id, name),
      lead:leads(id, name),
      assigned_worker:profiles!jobs_assigned_to_fkey(id, full_name)
    `)
    .order("scheduled_date", { ascending: false })

  // Workers only see their own jobs
  if (profile.role === "worker") {
    baseQuery = baseQuery.eq("assigned_to", profile.id)
  }

  if (status) baseQuery = baseQuery.eq("status", status)
  if (paymentStatus) baseQuery = baseQuery.eq("payment_status", paymentStatus)
  if (dateFilter) baseQuery = baseQuery.eq("scheduled_date", dateFilter)
  if (search) baseQuery = baseQuery.or(`service_type.ilike.%${search}%,job_number.ilike.%${search}%,address.ilike.%${search}%`)

  const { data: jobs, error: jobsError } = await baseQuery.limit(100)

  const isAdminOrManager = ["admin", "d2d_rep"].includes(profile.role)
  const canSeeMoney = isAdminOrManager   // price + payment status on jobs
  const canSeeRevenue = profile.role === "admin"  // aggregate revenue, payments page

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
                  {profile.role !== "technician" && (
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Technician</th>
                  )}
                  {canSeeMoney && <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  {canSeeMoney && <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>}

                  {isAdminOrManager && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline">{job.job_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{(job.customer as any)?.name ?? (job.lead as any)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{job.service_type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(job.scheduled_date)}
                      {job.start_time && <span className="block">{formatTime(job.start_time)}</span>}
                    </td>
                    {profile.role !== "technician" && (
                      <td className="px-4 py-3 text-gray-600 text-xs">{(job.assigned_worker as any)?.full_name ?? "—"}</td>
                    )}
                    {canSeeMoney && <td className="px-4 py-3 font-medium">{job.price ? formatCurrency(job.price) : "—"}</td>}
                    <td className="px-4 py-3">
                      <JobStatusSelect jobId={job.id} currentStatus={job.status} />
                    </td>
                    {canSeeMoney && (
                      <td className="px-4 py-3">
                        {canSeeRevenue
                          ? <PaymentStatusSelect jobId={job.id} currentStatus={job.payment_status} />
                          : <StatusBadge status={job.payment_status} />}
                      </td>
                    )}
                    {isAdminOrManager && (
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="bg-white rounded-lg border p-4 hover:shadow-md">
                <div className="flex items-start justify-between mb-2">
                  <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                    <p className="font-medium text-blue-600">{job.job_number}</p>
                    <p className="text-sm text-gray-600">{job.customer?.name ?? job.lead?.name ?? "—"}</p>
                  </Link>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <JobStatusSelect jobId={job.id} currentStatus={job.status} />
                    {canSeeMoney && (canSeeRevenue
                      ? <PaymentStatusSelect jobId={job.id} currentStatus={job.payment_status} />
                      : <StatusBadge status={job.payment_status} />)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{job.service_type}</span>
                  {canSeeMoney && <span className="font-semibold text-gray-900">{job.price ? formatCurrency(job.price) : "—"}</span>}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    {formatDate(job.scheduled_date)}
                    {(job.assigned_worker as any)?.full_name && ` · ${(job.assigned_worker as any).full_name}`}
                  </p>
                  {isAdminOrManager && (
                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
