'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from './activity'

async function requireAdminOrManager() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active || !['admin', 'manager'].includes(profile.role)) {
    return { error: 'Permission denied', user: null, supabase }
  }
  return { error: null, user, supabase }
}

export interface AddPaymentInput {
  job_id?: string
  customer_id?: string
  amount: number
  payment_method?: string
  notes?: string
  paid_at?: string
}

export async function addPayment(input: AddPaymentInput): Promise<{ error?: string; id?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  const { data: payment, error } = await supabase!
    .from('payments')
    .insert({
      job_id: input.job_id || null,
      customer_id: input.customer_id || null,
      amount: input.amount,
      payment_method: (input.payment_method as any) || null,
      payment_status: 'paid',
      paid_at: input.paid_at || new Date().toISOString(),
      notes: input.notes || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Update job payment status if job_id provided
  if (input.job_id) {
    await supabase!.from('jobs').update({ payment_status: 'paid' }).eq('id', input.job_id)

    // Update customer total_spent
    const { data: job } = await supabase!
      .from('jobs')
      .select('customer_id')
      .eq('id', input.job_id)
      .single()

    if (job?.customer_id) {
      const { data: customer } = await supabase!
        .from('customers')
        .select('total_spent')
        .eq('id', job.customer_id)
        .single()
      const currentSpent = customer?.total_spent ?? 0
      await supabase!
        .from('customers')
        .update({
          total_spent: currentSpent + input.amount,
          last_service_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', job.customer_id)
    }

    // Create review request task
    const { data: jobData } = await supabase!
      .from('jobs')
      .select('customer_id')
      .eq('id', input.job_id)
      .single()

    await supabase!.from('tasks').insert({
      title: 'Request Google review',
      task_type: 'request_review',
      job_id: input.job_id,
      customer_id: jobData?.customer_id,
      assigned_to: user.id,
      due_date: new Date().toISOString().split('T')[0],
      priority: 'normal',
      created_by: user.id,
    })
  }

  await logActivity(
    input.job_id ? 'job' : 'customer',
    (input.job_id || input.customer_id) ?? payment.id,
    'payment_added',
    null,
    { amount: input.amount, method: input.payment_method }
  )
  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { id: payment.id }
}

export async function requestReview(jobId: string): Promise<{ error?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  // Get the job to find customer
  const { data: job } = await supabase!
    .from('jobs')
    .select('customer_id, review_status')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  // Update job review status
  await supabase!
    .from('jobs')
    .update({ review_status: 'requested' })
    .eq('id', jobId)

  // Create review record
  const { data: settings } = await supabase!
    .from('company_settings')
    .select('google_review_link')
    .single()

  await supabase!.from('reviews').insert({
    job_id: jobId,
    customer_id: job.customer_id,
    requested_at: new Date().toISOString(),
    review_platform: 'google',
    review_link: settings?.google_review_link,
    status: 'requested',
  })

  await logActivity('job', jobId, 'review_requested')
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/reviews')
  return {}
}

export async function markReviewCompleted(reviewId: string): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const { data: review, error } = await supabase!
    .from('reviews')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('job_id')
    .single()

  if (error) return { error: error.message }

  if (review?.job_id) {
    await supabase!
      .from('jobs')
      .update({ review_status: 'completed' })
      .eq('id', review.job_id)
  }

  revalidatePath('/reviews')
  return {}
}
