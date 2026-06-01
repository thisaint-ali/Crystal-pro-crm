import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { LeadForm } from '@/components/leads/lead-form'
import { createLead } from '@/lib/actions/leads'

export default async function NewLeadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const { data: teamMembers } = await db
    .from('profiles')
    .select('id, full_name')
    .eq('active', true)
    .order('full_name')

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <PageHeader title="New Lead" backHref="/leads" backLabel="Leads" />
      <LeadForm
        teamMembers={teamMembers ?? []}
        onSubmit={createLead}
        submitLabel="Create Lead"
      />
    </div>
  )
}
