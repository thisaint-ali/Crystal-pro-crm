'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from './activity'
import { geocodeAddress } from '@/lib/utils/geocode'

async function getCurrentUser() {
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

  return { user, profile, supabase }
}

export interface CreateJobInput {
  customer_id?: string
  lead_id?: string
  quote_id?: string
  service_type: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  scheduled_date: string
  start_time?: string
  end_time?: string
  assigned_to: string
  price?: number
  crew_notes?: string
  customer_notes?: string
  internal_notes?: string
  payment_status?: string
}

export async function createJob(input: CreateJobInput): Promise<{ error?: string; id?: string }> {
  const { user, profile, supabase } = await getCurrentUser()
  if (!['admin', 'manager'].includes(profile?.role ?? '')) return { error: 'Permission denied' }

  const coords = await geocodeAddress({ address: input.address, city: input.city, state: input.state, zip_code: input.zip_code })

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      ...input,
      customer_id: input.customer_id || null,
      lead_id: input.lead_id || null,
      quote_id: input.quote_id || null,
      city: input.city || null,
      zip_code: input.zip_code || null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      price: input.price ?? null,
      crew_notes: input.crew_notes || null,
      customer_notes: input.customer_notes || null,
      internal_notes: input.internal_notes || null,
      status: 'scheduled',
      payment_status: input.payment_status || 'unpaid',
      review_status: 'not_requested',
      created_by: user.id,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
    .select('id, job_number')
    .single()

  if (error) return { error: error.message }

  await logActivity('job', job.id, 'job_created', null, {
    job_number: job.job_number,
    service_type: input.service_type,
    assigned_to: input.assigned_to,
  })
  revalidatePath('/jobs')
  return { id: job.id }
}

export async function updateJob(
  id: string,
  input: Partial<CreateJobInput>
): Promise<{ error?: string }> {
  const { profile, supabase } = await getCurrentUser()
  if (!['admin', 'manager'].includes(profile?.role ?? '')) return { error: 'Permission denied' }

  const coords = input.address
    ? await geocodeAddress({ address: input.address, city: input.city, state: input.state, zip_code: input.zip_code })
    : null

  const { error } = await supabase
    .from('jobs')
    .update({
      ...input,
      customer_id: input.customer_id || null,
      city: input.city || null,
      zip_code: input.zip_code || null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      price: input.price ?? null,
      crew_notes: input.crew_notes || null,
      customer_notes: input.customer_notes || null,
      internal_notes: input.internal_notes || null,
      ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity('job', id, 'job_updated')
  revalidatePath(`/jobs/${id}`)
  revalidatePath('/jobs')
  return {}
}

export async function updateJobStatus(
  id: string,
  status: string,
  oldStatus: string
): Promise<{ error?: string }> {
  const { user, profile, supabase } = await getCurrentUser()

  // Workers can only update their own assigned jobs
  if (profile?.role === 'worker') {
    const { data: job } = await supabase.from('jobs').select('assigned_to').eq('id', id).single()
    if (job?.assigned_to !== user.id) return { error: 'Permission denied' }
  } else if (!['admin', 'manager'].includes(profile?.role ?? '')) {
    return { error: 'Permission denied' }
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await supabase.from('jobs').update(updates).eq('id', id)
  if (error) return { error: error.message }

  // Auto-create collect payment task when job is completed and unpaid
  if (status === 'completed') {
    const { data: job } = await supabase
      .from('jobs')
      .select('payment_status, customer_id, price')
      .eq('id', id)
      .single()

    if (job?.payment_status === 'unpaid') {
      await supabase.from('tasks').insert({
        title: `Collect payment for job`,
        task_type: 'collect_payment',
        job_id: id,
        customer_id: job.customer_id,
        assigned_to: user.id,
        due_date: new Date().toISOString().split('T')[0],
        priority: 'high',
        created_by: user.id,
      })
    }
  }

  await logActivity('job', id, 'job_status_changed', { status: oldStatus }, { status })
  revalidatePath(`/jobs/${id}`)
  revalidatePath('/jobs')
  revalidatePath('/dashboard')
  return {}
}

export async function markJobPaid(
  id: string,
  paymentMethod: string,
  amount: number
): Promise<{ error?: string }> {
  const { user, profile, supabase } = await getCurrentUser()
  if (!['admin', 'manager'].includes(profile?.role ?? '')) return { error: 'Permission denied' }

  // Update job payment status
  const { error } = await supabase
    .from('jobs')
    .update({ payment_status: 'paid' })
    .eq('id', id)

  if (error) return { error: error.message }

  // Fetch job to update customer totals
  const { data: job } = await supabase
    .from('jobs')
    .select('customer_id, price')
    .eq('id', id)
    .single()

  if (job?.customer_id) {
    // Update customer total_spent and last_service_date
    const { data: customer } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('id', job.customer_id)
      .single()

    const currentSpent = customer?.total_spent ?? 0
    await supabase
      .from('customers')
      .update({
        total_spent: currentSpent + amount,
        last_service_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', job.customer_id)

    // Create review request task
    await supabase.from('tasks').insert({
      title: 'Request Google review',
      task_type: 'request_review',
      job_id: id,
      customer_id: job.customer_id,
      assigned_to: user.id,
      due_date: new Date().toISOString().split('T')[0],
      priority: 'normal',
      created_by: user.id,
    })
  }

  await logActivity('job', id, 'job_marked_paid', { payment_status: 'unpaid' }, { payment_status: 'paid' })
  revalidatePath(`/jobs/${id}`)
  revalidatePath('/jobs')
  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return {}
}

export async function cancelJob(id: string): Promise<{ error?: string }> {
  const { profile, supabase } = await getCurrentUser()
  if (!['admin', 'manager'].includes(profile?.role ?? '')) return { error: 'Permission denied' }

  const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('job', id, 'job_cancelled')
  revalidatePath(`/jobs/${id}`)
  revalidatePath('/jobs')
  return {}
}

export async function deleteJob(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only' }

  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/jobs')
  redirect('/jobs')
}
