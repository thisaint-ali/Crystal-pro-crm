import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/shared/empty-state'
import { ReviewActions } from '@/components/reviews/review-actions'
import { formatDate } from '@/lib/utils'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const db = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  // Jobs paid but review not yet requested
  const { data: eligibleJobs } = await db
    .from('jobs')
    .select('id, job_number, service_type, customer:customers(id, name), completed_at')
    .eq('payment_status', 'paid')
    .eq('review_status', 'not_requested')
    .eq('status', 'completed')
    .not('customer_id', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(50)

  // Reviews already requested
  const { data: reviews } = await db
    .from('reviews')
    .select(`
      *,
      job:jobs(id, job_number, service_type),
      customer:customers(id, name)
    `)
    .order('requested_at', { ascending: false })
    .limit(50)

  const pendingReviews = reviews?.filter((r: any) => r.status === 'requested') ?? []
  const completedReviews = reviews?.filter((r: any) => r.status === 'completed') ?? []

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 text-sm mt-1">{completedReviews.length} reviews collected</p>
      </div>

      {/* Eligible for review request */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">Request Review ({eligibleJobs?.length ?? 0})</h2>
        {!eligibleJobs || eligibleJobs.length === 0 ? (
          <EmptyState title="No jobs ready for review" description="Completed, paid jobs will appear here." />
        ) : (
          <div className="space-y-2">
            {eligibleJobs.map((job: any) => (
              <div key={job.id} className="bg-white rounded-lg border p-4 flex items-center justify-between gap-4">
                <div>
                  <Link href={`/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline">{job.job_number}</Link>
                  <p className="text-sm text-gray-600">{job.customer?.name} · {job.service_type}</p>
                  {job.completed_at && <p className="text-xs text-gray-400">Completed {formatDate(job.completed_at)}</p>}
                </div>
                <ReviewActions jobId={job.id} mode="request" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requested — awaiting */}
      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">Awaiting Review ({pendingReviews.length})</h2>
          <div className="space-y-2">
            {pendingReviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-lg border p-4 flex items-center justify-between gap-4">
                <div>
                  {review.job && (
                    <Link href={`/jobs/${review.job.id}`} className="font-medium text-blue-600 hover:underline">
                      {review.job.job_number}
                    </Link>
                  )}
                  <p className="text-sm text-gray-600">{review.customer?.name} · {review.job?.service_type}</p>
                  <p className="text-xs text-gray-400">Requested {formatDate(review.requested_at)}</p>
                </div>
                <ReviewActions reviewId={review.id} mode="complete" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed reviews */}
      {completedReviews.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Completed ({completedReviews.length})</h2>
          <div className="space-y-2">
            {completedReviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                <div>
                  {review.job && (
                    <Link href={`/jobs/${review.job.id}`} className="font-medium text-blue-600 hover:underline">
                      {review.job.job_number}
                    </Link>
                  )}
                  <p className="text-sm text-gray-600">{review.customer?.name} · {review.job?.service_type}</p>
                  <p className="text-xs text-gray-400">Completed {review.completed_at ? formatDate(review.completed_at) : ''}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Reviewed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
