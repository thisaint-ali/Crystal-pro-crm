'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface SettingsInput {
  company_name?: string
  company_phone?: string
  company_email?: string
  company_address?: string
  service_area?: string
  google_review_link?: string
  default_quote_expiration_days?: number
  default_follow_up_days?: number
}

export async function updateSettings(input: SettingsInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only' }

  const { data: existing } = await supabase.from('company_settings').select('id').single()
  if (!existing) {
    return { error: 'Company settings not found. Run the database migration first.' }
  }

  const { error } = await supabase
    .from('company_settings')
    .update({
      company_name: input.company_name,
      company_phone: input.company_phone,
      company_email: input.company_email,
      company_address: input.company_address,
      service_area: input.service_area,
      google_review_link: input.google_review_link,
      default_quote_expiration_days: input.default_quote_expiration_days,
      default_follow_up_days: input.default_follow_up_days,
    })
    .eq('id', existing.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}
