import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { JobForm } from '@/components/jobs/job-form'
import { createJob } from '@/lib/actions/jobs'

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const db = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const params = await searchParams
  const defaultCustomerId = params.customer_id ?? ''
  const defaultLeadId = params.lead_id ?? ''
  const defaultQuoteId = params.quote_id ?? ''

  const [{ data: workers }, { data: customers }, { data: leads }] = await Promise.all([
    db.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    db.from('customers').select('id, name, phone').order('name'),
    db.from('leads').select('id, name, phone').order('name'),
  ])

  // Pre-fill address + homeowner info from customer or lead if available
  let defaultAddress = ''
  let defaultCity = ''
  let defaultHomeownerName = ''
  let defaultHomeownerPhone = ''
  if (defaultCustomerId) {
    const { data: customer } = await db
      .from('customers')
      .select('address, city, name, phone')
      .eq('id', defaultCustomerId)
      .single()
    defaultAddress = customer?.address ?? ''
    defaultCity = customer?.city ?? ''
    defaultHomeownerName = customer?.name ?? ''
    defaultHomeownerPhone = customer?.phone ?? ''
  } else if (defaultLeadId) {
    const { data: lead } = await db
      .from('leads')
      .select('address, city, name, phone')
      .eq('id', defaultLeadId)
      .single()
    defaultAddress = lead?.address ?? ''
    defaultCity = lead?.city ?? ''
    defaultHomeownerName = lead?.name ?? ''
    defaultHomeownerPhone = lead?.phone ?? ''
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <PageHeader title="New Job" backHref="/jobs" backLabel="Jobs" />
      <JobForm
        workers={(workers ?? []) as { id: string; full_name: string }[]}
        customers={(customers ?? []) as { id: string; name: string; phone?: string }[]}
        leads={(leads ?? []) as { id: string; name: string; phone?: string }[]}
        defaultCustomerId={defaultCustomerId}
        defaultLeadId={defaultLeadId}
        defaultQuoteId={defaultQuoteId}
        initialData={{ address: defaultAddress, city: defaultCity, homeowner_name: defaultHomeownerName, homeowner_phone: defaultHomeownerPhone }}
        onSubmit={createJob}
        submitLabel="Create Job"
      />
    </div>
  )
}
