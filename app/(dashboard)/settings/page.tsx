import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import { updateSettings } from '@/lib/actions/settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const db = createServiceClient()
  const { data: settings } = await db.from('company_settings').select('*').single()

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Company information and defaults</p>
      </div>
      <SettingsForm settings={settings as any} onSubmit={updateSettings} />
    </div>
  )
}
