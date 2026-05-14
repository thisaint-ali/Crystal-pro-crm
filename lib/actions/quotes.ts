'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays } from 'date-fns'
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

export interface QuoteItemInput {
  service_name: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface CreateQuoteInput {
  lead_id?: string
  customer_id?: string
  service_type: string
  description?: string
  quote_amount: number
  discount_amount: number
  final_amount: number
  valid_until?: string
  follow_up_date?: string
  items?: QuoteItemInput[]
}

export async function createQuote(
  input: CreateQuoteInput
): Promise<{ error?: string; id?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  // Get default expiration from company settings
  const { data: settings } = await supabase!
    .from('company_settings')
    .select('default_quote_expiration_days')
    .single()
  const expirationDays = settings?.default_quote_expiration_days ?? 14

  const validUntil = input.valid_until || addDays(new Date(), expirationDays).toISOString().split('T')[0]

  const { data: quote, error } = await supabase!
    .from('quotes')
    .insert({
      lead_id: input.lead_id || null,
      customer_id: input.customer_id || null,
      service_type: input.service_type,
      description: input.description || null,
      quote_amount: input.quote_amount,
      discount_amount: input.discount_amount,
      final_amount: input.final_amount,
      status: 'draft',
      valid_until: validUntil,
      follow_up_date: input.follow_up_date || null,
      created_by: user.id,
    })
    .select('id, quote_number')
    .single()

  if (error) return { error: error.message }

  // Insert quote items if provided
  if (input.items && input.items.length > 0) {
    await supabase!.from('quote_items').insert(
      input.items.map((item) => ({
        quote_id: quote.id,
        ...item,
      }))
    )
  }

  await logActivity('quote', quote.id, 'quote_created', null, {
    quote_number: quote.quote_number,
    service_type: input.service_type,
  })
  revalidatePath('/quotes')
  return { id: quote.id }
}

export async function updateQuote(
  id: string,
  input: Partial<CreateQuoteInput>
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('quotes')
    .update({
      lead_id: input.lead_id || null,
      customer_id: input.customer_id || null,
      service_type: input.service_type,
      description: input.description || null,
      quote_amount: input.quote_amount,
      discount_amount: input.discount_amount,
      final_amount: input.final_amount,
      valid_until: input.valid_until || null,
      follow_up_date: input.follow_up_date || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace items if provided
  if (input.items !== undefined) {
    await supabase!.from('quote_items').delete().eq('quote_id', id)
    if (input.items.length > 0) {
      await supabase!.from('quote_items').insert(
        input.items.map((item) => ({ quote_id: id, ...item }))
      )
    }
  }

  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
  return {}
}

export async function markQuoteSent(id: string): Promise<{ error?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  const { error } = await supabase!
    .from('quotes')
    .update({ status: 'sent', date_sent: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  // Auto-create follow-up task for next day
  const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0]
  await supabase!.from('tasks').insert({
    title: 'Follow up on sent quote',
    task_type: 'follow_up',
    quote_id: id,
    assigned_to: user.id,
    due_date: tomorrow,
    priority: 'normal',
    created_by: user.id,
  })

  await logActivity('quote', id, 'quote_sent', { status: 'draft' }, { status: 'sent' })
  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
  return {}
}

export async function markQuoteAccepted(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('quotes')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity('quote', id, 'quote_accepted', { status: 'sent' }, { status: 'accepted' })
  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
  return {}
}

export async function markQuoteDeclined(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('quotes')
    .update({ status: 'declined', declined_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity('quote', id, 'quote_declined', { status: 'sent' }, { status: 'declined' })
  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
  return {}
}

export async function convertQuoteToJob(
  quoteId: string
): Promise<{ error?: string; jobId?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  const { data: quote, error: fetchError } = await supabase!
    .from('quotes')
    .select('*, customer:customers(*), lead:leads(*)')
    .eq('id', quoteId)
    .single()

  if (fetchError || !quote) return { error: 'Quote not found' }
  if (quote.status !== 'accepted') return { error: 'Quote must be accepted before converting to job' }

  const address =
    (quote.customer as any)?.address ??
    (quote.lead as any)?.address ??
    'Address not specified'
  const city =
    (quote.customer as any)?.city ?? (quote.lead as any)?.city ?? null

  const { data: job, error } = await supabase!
    .from('jobs')
    .insert({
      customer_id: quote.customer_id,
      lead_id: quote.lead_id,
      quote_id: quoteId,
      service_type: quote.service_type,
      address,
      city,
      state: 'VA',
      price: quote.final_amount,
      status: 'scheduled',
      payment_status: 'unpaid',
      review_status: 'not_requested',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity('quote', quoteId, 'quote_converted_to_job', null, { job_id: job.id })
  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/jobs')
  return { jobId: job.id }
}

export async function deleteQuote(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only' }

  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/quotes')
  redirect('/quotes')
}
