import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { LeadForm } from '@/components/leads/lead-form'
import { updateLead } from '@/lib/actions/leads'

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
  if (!lead) notFound()

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('active', true)
    .order('full_name')

  const updateAction = async (formData: FormData) => {
    'use server'
    return updateLead(id, formData)
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <PageHeader title="Edit Lead" backHref={`/leads/${id}`} backLabel={lead.name} />
      <LeadForm
        lead={lead as any}
        teamMembers={teamMembers ?? []}
        onSubmit={updateAction}
        submitLabel="Save Changes"
      />
    </div>
  )
}
