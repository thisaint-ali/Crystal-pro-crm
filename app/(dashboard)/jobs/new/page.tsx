import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { JobForm } from '@/components/jobs/job-form'
import { createJob } from '@/lib/actions/jobs'

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const params = await searchParams
  const defaultCustomerId = params.customer_id ?? ''
  const defaultLeadId = params.lead_id ?? ''
  const defaultQuoteId = params.quote_id ?? ''

  const [{ data: workers }, { data: customers }, { data: leads }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    supabase.from('customers').select('id, name').order('name'),
    supabase.from('leads').select('id, name').order('name'),
  ])

  // Pre-fill address from customer or lead if available
  let defaultAddress = ''
  let defaultCity = ''
  if (defaultCustomerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('address, city')
      .eq('id', defaultCustomerId)
      .single()
    defaultAddress = customer?.address ?? ''
    defaultCity = customer?.city ?? ''
  } else if (defaultLeadId) {
    const { data: lead } = await supabase
      .from('leads')
      .select('address, city')
      .eq('id', defaultLeadId)
      .single()
    defaultAddress = lead?.address ?? ''
    defaultCity = lead?.city ?? ''
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <PageHeader title="New Job" backHref="/jobs" backLabel="Jobs" />
      <JobForm
        workers={(workers ?? []) as { id: string; full_name: string }[]}
        customers={(customers ?? []) as { id: string; name: string }[]}
        leads={(leads ?? []) as { id: string; name: string }[]}
        defaultCustomerId={defaultCustomerId}
        defaultLeadId={defaultLeadId}
        defaultQuoteId={defaultQuoteId}
        initialData={{ address: defaultAddress, city: defaultCity }}
        onSubmit={createJob}
        submitLabel="Create Job"
      />
    </div>
  )
}
