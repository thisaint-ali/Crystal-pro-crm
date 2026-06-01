import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { JobForm } from '@/components/jobs/job-form'
import { updateJob } from '@/lib/actions/jobs'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const { data: job } = await db.from('jobs').select('*').eq('id', id).single()
  if (!job) notFound()

  const db = createServiceClient()
  const [{ data: workers }, { data: customers }, { data: leads }, { data: jobWorkers }] = await Promise.all([
    db.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    db.from('customers').select('id, name, phone').order('name'),
    db.from('leads').select('id, name, phone').order('name'),
    db.from('job_workers').select('worker_id').eq('job_id', id),
  ])

  const updateAction = async (input: Parameters<typeof updateJob>[1]) => {
    'use server'
    return updateJob(id, input)
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <PageHeader title="Edit Job" backHref={`/jobs/${id}`} backLabel={job.job_number} />
      <JobForm
        workers={(workers ?? []) as { id: string; full_name: string }[]}
        customers={(customers ?? []) as { id: string; name: string; phone?: string }[]}
        leads={(leads ?? []) as { id: string; name: string; phone?: string }[]}
        initialData={{
          customer_id: job.customer_id ?? '',
          lead_id: job.lead_id ?? '',
          quote_id: job.quote_id ?? '',
          service_type: job.service_type,
          address: job.address,
          city: job.city ?? '',
          state: job.state ?? 'VA',
          zip_code: job.zip_code ?? '',
          scheduled_date: job.scheduled_date,
          start_time: job.start_time ?? '',
          end_time: job.end_time ?? '',
          assigned_to: job.assigned_to ?? '',
          price: job.price ?? undefined,
          crew_notes: job.crew_notes ?? '',
          customer_notes: job.customer_notes ?? '',
          internal_notes: job.internal_notes ?? '',
          status: job.status as any,
          payment_status: job.payment_status as any,
          homeowner_name: job.homeowner_name ?? '',
          homeowner_phone: job.homeowner_phone ?? '',
          worker_ids: (jobWorkers ?? []).map((jw: any) => jw.worker_id),
        } as any}
        onSubmit={updateAction as any}
        submitLabel="Save Changes"
        redirectTo={`/jobs/${id}`}
      />
    </div>
  )
}
