import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { AddPaymentDialog } from '@/components/payments/add-payment-dialog'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const params = await searchParams
  const tab = params.tab ?? 'unpaid'

  const db = createServiceClient()

  // Unpaid jobs needing payment collection
  const { data: unpaidJobs } = await db
    .from('jobs')
    .select(`
      *,
      customer:customers(id, name),
      lead:leads(id, name)
    `)
    .eq('payment_status', 'unpaid')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(50)

  // Recent payments
  const { data: payments } = await db
    .from('payments')
    .select(`
      *,
      job:jobs(id, job_number, service_type),
      customer:customers(id, name)
    `)
    .order('paid_at', { ascending: false })
    .limit(50)

  const totalCollected = payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Total collected: {formatCurrency(totalCollected)}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b">
        <Link
          href="/payments?tab=unpaid"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'unpaid' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Needs Collection ({unpaidJobs?.length ?? 0})
        </Link>
        <Link
          href="/payments?tab=history"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Payment History
        </Link>
      </div>

      {tab === 'unpaid' && (
        <>
          {!unpaidJobs || unpaidJobs.length === 0 ? (
            <EmptyState title="All paid up!" description="No completed jobs waiting on payment." />
          ) : (
            <div className="space-y-3">
              {unpaidJobs.map((job: any) => (
                <div key={job.id} className="bg-white rounded-lg border p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline">
                        {job.job_number}
                      </Link>
                      <StatusBadge status={job.payment_status} />
                    </div>
                    <p className="text-sm text-gray-600">{job.customer?.name ?? job.lead?.name ?? '—'} · {job.service_type}</p>
                    {job.completed_at && (
                      <p className="text-xs text-gray-400">Completed {formatDate(job.completed_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-gray-900">{job.price ? formatCurrency(job.price) : '—'}</p>
                    <AddPaymentDialog
                      jobId={job.id}
                      jobNumber={job.job_number}
                      amount={job.price ?? 0}
                      customerId={job.customer_id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {!payments || payments.length === 0 ? (
            <EmptyState title="No payments yet" description="Payments recorded here will appear in history." />
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(payment.paid_at)}</td>
                      <td className="px-4 py-3">
                        {payment.job ? (
                          <Link href={`/jobs/${payment.job.id}`} className="text-blue-600 hover:underline">
                            {payment.job.job_number}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{payment.customer?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">
                        {payment.payment_method?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
