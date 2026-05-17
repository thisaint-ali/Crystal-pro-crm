'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/validations/lead'
import { logActivity } from './activity'
import { geocodeAddress } from '@/lib/utils/geocode'

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
    return { error: 'Permission denied', user: null, profile: null, supabase }
  }
  return { error: null, user, profile, supabase }
}

export async function createLead(formData: FormData): Promise<{ error?: string; id?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  const raw = Object.fromEntries(formData)
  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' }
  }

  const data = parsed.data
  const coords = await geocodeAddress({ address: data.address, city: data.city, state: data.state, zip_code: data.zip_code })

  const { data: lead, error } = await supabase!
    .from('leads')
    .insert({
      ...data,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      zip_code: data.zip_code || null,
      service_requested: data.service_requested || null,
      lead_source: (data.lead_source as any) || null,
      assigned_to: data.assigned_to || null,
      estimated_value: data.estimated_value ? Number(data.estimated_value) : null,
      notes: data.notes || null,
      next_follow_up_at: data.next_follow_up_at || null,
      created_by: user.id,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity('lead', lead.id, 'lead_created', null, { name: data.name, status: data.status })
  revalidatePath('/leads')
  return { id: lead.id }
}

export async function updateLead(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const raw = Object.fromEntries(formData)
  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' }
  }

  const data = parsed.data
  const coords = await geocodeAddress({ address: data.address, city: data.city, state: data.state, zip_code: data.zip_code })

  const { error } = await supabase!
    .from('leads')
    .update({
      ...data,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      zip_code: data.zip_code || null,
      service_requested: data.service_requested || null,
      lead_source: (data.lead_source as any) || null,
      assigned_to: data.assigned_to || null,
      estimated_value: data.estimated_value ? Number(data.estimated_value) : null,
      notes: data.notes || null,
      next_follow_up_at: data.next_follow_up_at || null,
      ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity('lead', id, 'lead_updated', null, { status: data.status })
  revalidatePath(`/leads/${id}`)
  revalidatePath('/leads')
  return {}
}

export async function updateLeadStatus(
  id: string,
  status: string,
  oldStatus: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const { error } = await supabase!.from('leads').update({ status }).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('lead', id, 'lead_status_changed', { status: oldStatus }, { status })
  revalidatePath(`/leads/${id}`)
  revalidatePath('/leads')
  return {}
}

export async function deleteLead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Admin only' }

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/leads')
  redirect('/leads')
}

export async function convertLeadToCustomer(
  leadId: string
): Promise<{ error?: string; customerId?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  // Fetch the lead
  const { data: lead, error: fetchError } = await supabase!
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()
  if (fetchError || !lead) return { error: 'Lead not found' }

  // Check if customer already exists from this lead
  const { data: existing } = await supabase!
    .from('customers')
    .select('id')
    .eq('created_from_lead_id', leadId)
    .single()
  if (existing) return { error: 'A customer was already created from this lead', customerId: existing.id }

  // Create customer from lead data
  const { data: customer, error: createError } = await supabase!
    .from('customers')
    .insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      customer_type: 'residential',
      notes: lead.notes,
      created_from_lead_id: leadId,
    })
    .select('id')
    .single()

  if (createError) return { error: createError.message }

  // Update lead status to booked
  await supabase!.from('leads').update({ status: 'booked' }).eq('id', leadId)

  await logActivity('lead', leadId, 'lead_converted', null, { customer_id: customer.id })
  await logActivity('customer', customer.id, 'customer_created', null, { from_lead: leadId })

  revalidatePath('/leads')
  revalidatePath('/customers')
  return { customerId: customer.id }
}
