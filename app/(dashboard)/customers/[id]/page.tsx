import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, MapPin, Mail, Edit, Plus, ExternalLink, Building2, Home, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { NotesSection } from '@/components/shared/notes-section'
import { ActivityLogSection } from '@/components/shared/activity-log-section'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatDate, formatPhone, formatCurrency, buildCallUrl, buildSmsUrl, buildEmailUrl, buildGoogleMapsUrl } from '@/lib/utils'
import { isAdmin } from '@/lib/auth/permissions'
import { addNote } from '@/lib/actions/activity'
import { deleteCustomer } from '@/lib/actions/customers'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()

  const [{ data: jobs }, { data: quotes }, { data: notes }, { data: activities }] = await Promise.all([
    supabase.from('jobs').select('id, job_number, service_type, scheduled_date, status, payment_status, price').eq('customer_id', id).order('scheduled_date', { ascending: false }).limit(10),
    supabase.from('quotes').select('id, quote_number, service_type, final_amount, status, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('notes').select('*, author:profiles!notes_created_by_fkey(id, full_name)').eq('entity_type', 'customer').eq('entity_id', id).order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*, user:profiles!activity_log_user_id_fkey(id, full_name)').eq('entity_type', 'customer').eq('entity_id', id).order('created_at', { ascending: false }).limit(15),
  ])

  const addNoteAction = async (note: string) => { 'use server'; return addNote('customer', id, note) }
  const deleteAction = async () => { 'use server'; await deleteCustomer(id) }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <PageHeader
        title={customer.name}
        subtitle={customer.customer_type === 'commercial' ? 'Commercial' : 'Residential'}
        backHref="/customers"
        backLabel="Customers"
        actions={
          <div className="flex gap-2">
            {isAdmin(profile.role as any) && (
              <ConfirmDialog
                trigger={<Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>}
                title="Delete Customer"
                description={`Delete ${customer.name}? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={deleteAction}
              />
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/customers/${id}/edit`}><Edit className="w-4 h-4 mr-1" />Edit</Link>
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Contact Information</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {customer.customer_type === 'commercial' ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                <span className="capitalize">{customer.customer_type}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-3">
                  <a href={buildCallUrl(customer.phone)} className="text-blue-600 font-medium hover:underline">{formatPhone(customer.phone)}</a>
                  <a href={buildSmsUrl(customer.phone)} className="text-xs text-gray-500 hover:text-blue-600 border rounded px-2 py-0.5">Text</a>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={buildEmailUrl(customer.email)} className="text-blue-600 hover:underline">{customer.email}</a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <a href={buildGoogleMapsUrl(customer.address, customer.city, customer.state)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    {customer.address}{customer.city ? `, ${customer.city}` : ''}, {customer.state}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Lifetime Value</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(customer.total_spent)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Last Service</p>
                <p className="font-medium">{customer.last_service_date ? formatDate(customer.last_service_date) : 'Never'}</p>
              </div>
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Job History */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Job History ({jobs?.length ?? 0})</h2>
              <Button asChild variant="outline" size="sm">
                <Link href={`/jobs/new?customer_id=${id}`}><Plus className="w-4 h-4 mr-1" />New Job</Link>
              </Button>
            </div>
            {!jobs || jobs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{job.job_number}</p>
                      <p className="text-xs text-gray-500">{job.service_type} &bull; {formatDate(job.scheduled_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(job.price)}</span>
                      <StatusBadge status={job.payment_status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border p-5">
            <NotesSection notes={(notes ?? []) as any} entityType="customer" entityId={id} onAdd={addNoteAction} />
          </div>

          {/* Activity */}
          <div className="bg-white rounded-lg border p-5">
            <ActivityLogSection activities={(activities ?? []) as any} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Actions</h3>
            <a href={buildCallUrl(customer.phone)} className="block">
              <Button variant="outline" size="sm" className="w-full justify-start"><Phone className="w-4 h-4 mr-2 text-green-600" />Call</Button>
            </a>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href={`/quotes/new?customer_id=${id}`}>New Quote</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href={`/jobs/new?customer_id=${id}`}>Book Job</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
