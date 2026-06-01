import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, MapPin, ExternalLink, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { NotesSection } from '@/components/shared/notes-section'
import { ActivityLogSection } from '@/components/shared/activity-log-section'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { JobStatusActions } from '@/components/jobs/job-status-actions'
import { AddPaymentDialog } from '@/components/payments/add-payment-dialog'
import { formatDate, formatCurrency, formatTime, buildGoogleMapsUrl } from '@/lib/utils'
import { isAdmin } from '@/lib/auth/permissions'
import { addNote } from '@/lib/actions/activity'
import { deleteJob } from '@/lib/actions/jobs'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Workers can only access their assigned jobs (RLS enforces this, but also redirect)
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(id, name, phone, email, address, city, state),
      lead:leads(id, name, phone, email, address, city, state),
      assigned_worker:profiles!jobs_assigned_to_fkey(id, full_name),
      quote:quotes(id, quote_number),
      photos:job_photos(*)
    `)
    .eq('id', id)
    .single()

  if (!job) notFound()

  const [{ data: notes }, { data: activities }] = await Promise.all([
    supabase
      .from('notes')
      .select('*, author:profiles!notes_created_by_fkey(id, full_name)')
      .eq('entity_type', 'job')
      .eq('entity_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_log')
      .select('*, user:profiles!activity_log_user_id_fkey(id, full_name)')
      .eq('entity_type', 'job')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const contact = (job.customer as any) ?? (job.lead as any)
  const contactType = job.customer_id ? 'customer' : 'lead'
  const isAdminOrManager = ['admin', 'manager'].includes(profile.role)

  const addNoteAction = async (note: string) => { 'use server'; return addNote('job', id, note) }
  const deleteAction = async () => { 'use server'; await deleteJob(id) }

  const photos = (job.photos as any[]) ?? []
  const beforePhotos = photos.filter((p: any) => p.photo_type === 'before')
  const afterPhotos = photos.filter((p: any) => p.photo_type === 'after')

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <PageHeader
        title={job.job_number}
        subtitle={job.service_type}
        backHref="/jobs"
        backLabel="Jobs"
        actions={
          <div className="flex gap-2">
            {isAdmin(profile.role as any) && (
              <ConfirmDialog
                trigger={<Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>}
                title="Delete Job"
                description={`Delete ${job.job_number}? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={deleteAction}
              />
            )}
            {isAdminOrManager && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/jobs/${id}/edit`}><Edit className="w-4 h-4 mr-1" />Edit</Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Job Details</h2>
              <div className="flex gap-2">
                <StatusBadge status={job.status} />
                <StatusBadge status={job.payment_status} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Service</p>
                <p className="font-medium">{job.service_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-bold text-green-700 text-lg">{job.price ? formatCurrency(job.price) : 'TBD'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="font-medium">{formatDate(job.scheduled_date)}</p>
                {job.start_time && (
                  <p className="text-xs text-gray-500">
                    {formatTime(job.start_time)}
                    {job.end_time ? ` – ${formatTime(job.end_time)}` : ''}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Worker</p>
                <p className="font-medium">
                  {(job.assigned_worker as any)?.full_name || '—'}
                </p>
              </div>
              {job.completed_at && (
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="font-medium text-green-600">{formatDate(job.completed_at)}</p>
                </div>
              )}
              {(job.quote as any) && (
                <div>
                  <p className="text-xs text-gray-500">Quote</p>
                  <Link href={`/quotes/${(job.quote as any).id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    {(job.quote as any).quote_number}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <a
                  href={buildGoogleMapsUrl(job.address, job.city, job.state)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  {job.address}{job.city ? `, ${job.city}` : ''}, {job.state}
                  {job.zip_code ? ` ${job.zip_code}` : ''}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Notes for crew */}
            {(job.crew_notes || job.customer_notes) && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {job.crew_notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Crew Notes</p>
                    <p className="text-sm text-gray-700 bg-yellow-50 rounded p-2">{job.crew_notes}</p>
                  </div>
                )}
                {job.customer_notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Customer Notes</p>
                    <p className="text-sm text-gray-700">{job.customer_notes}</p>
                  </div>
                )}
              </div>
            )}
            {isAdminOrManager && job.internal_notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-1">Internal Notes</p>
                <p className="text-sm text-gray-700">{job.internal_notes}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Photos ({photos.length})</h2>
              <Button asChild variant="outline" size="sm">
                <Link href={`/jobs/${id}/photos`}><Camera className="w-4 h-4 mr-1" />Upload Photos</Link>
              </Button>
            </div>
            {photos.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No photos uploaded yet.</p>
            ) : (
              <div className="space-y-4">
                {beforePhotos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Before ({beforePhotos.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {beforePhotos.slice(0, 6).map((photo: any) => (
                        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                          <img src={photo.url} alt="Before" className="w-full h-24 object-cover rounded border hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {afterPhotos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">After ({afterPhotos.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {afterPhotos.slice(0, 6).map((photo: any) => (
                        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                          <img src={photo.url} alt="After" className="w-full h-24 object-cover rounded border hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border p-5">
            <NotesSection notes={(notes ?? []) as any} entityType="job" entityId={id} onAdd={addNoteAction} />
          </div>

          {/* Activity */}
          <div className="bg-white rounded-lg border p-5">
            <ActivityLogSection activities={(activities ?? []) as any} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Actions */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Update Status</h3>
            <JobStatusActions jobId={id} status={job.status} role={profile.role} />
          </div>

          {/* Contact */}
          {contact && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">
                {contactType === 'customer' ? 'Customer' : 'Lead'}
              </h3>
              <Link
                href={`/${contactType === 'customer' ? 'customers' : 'leads'}/${contact.id}`}
                className="flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline mb-2"
              >
                {contact.name}
                <ExternalLink className="w-3 h-3" />
              </Link>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="block text-sm text-gray-600 hover:text-blue-600">
                  {contact.phone}
                </a>
              )}
            </div>
          )}

          {/* Quick Links (admin/manager only) */}
          {isAdminOrManager && (
            <div className="bg-white rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Links</h3>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/jobs/${id}/edit`}>Edit Job</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/jobs/${id}/photos`}>Upload Photos</Link>
              </Button>
              {job.payment_status !== 'paid' && (
                <AddPaymentDialog
                  jobId={id}
                  jobNumber={job.job_number}
                  amount={job.price ?? 0}
                  customerId={job.customer_id ?? undefined}
                  fullWidth
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
