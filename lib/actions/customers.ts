'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { customerSchema } from '@/lib/validations/customer'
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

export async function createCustomer(formData: FormData): Promise<{ error?: string; id?: string }> {
  const { error: authError, user, supabase } = await requireAdminOrManager()
  if (authError || !user) return { error: authError ?? 'Not authenticated' }

  const raw = Object.fromEntries(formData)
  const parsed = customerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' }
  }

  const data = parsed.data
  const { data: customer, error } = await supabase!
    .from('customers')
    .insert({
      ...data,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      zip_code: data.zip_code || null,
      notes: data.notes || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity('customer', customer.id, 'customer_created', null, { name: data.name })
  revalidatePath('/customers')
  return { id: customer.id }
}

export async function updateCustomer(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await requireAdminOrManager()
  if (authError) return { error: authError }

  const raw = Object.fromEntries(formData)
  const parsed = customerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' }
  }

  const data = parsed.data
  const { error } = await supabase!
    .from('customers')
    .update({
      ...data,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      zip_code: data.zip_code || null,
      notes: data.notes || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/customers/${id}`)
  revalidatePath('/customers')
  return {}
}

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
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

  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/customers')
  redirect('/customers')
}
