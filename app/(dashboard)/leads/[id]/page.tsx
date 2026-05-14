import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  MapPin,
  Mail,
  Calendar,
  Edit,
  UserCheck,
  FileText,
  Briefcase,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { NotesSection } from '@/components/shared/notes-section'
import { ActivityLogSection } from '@/components/shared/activity-log-section'
import { LeadStatusUpdater } from '@/components/leads/lead-status-updater'
import { LeadQuickActions } from '@/components/leads/lead-quick-actions'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  formatDate,
  formatPhone,
  formatCurrency,
  formatRelativeDate,
  buildCallUrl,
  buildSmsUrl,
  buildEmailUrl,
  buildGoogleMapsUrl,
} from '@/lib/utils'
import { isAdmin } from '@/lib/auth/permissions'
import { addNote, logActivity } from '@/lib/actions/activity'
import { deleteLead } from '@/lib/actions/leads'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  // Fetch lead with related data
  const { data: lead } = await supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id, full_name, phone)')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  // Fetch related quotes
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, service_type, final_amount, status, created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  // Fetch notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*, author:profiles!notes_created_by_fkey(id, full_name)')
    .eq('entity_type', 'lead')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })

  // Fetch activity
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*, user:profiles!activity_log_user_id_fkey(id, full_name)')
    .eq('entity_type', 'lead')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Check if a customer was already created from this lead
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('created_from_lead_id', id)
    .single()

  const addNoteAction = async (note: string) => {
    'use server'
    return addNote('lead', id, note)
  }

  const deleteAction = async () => {
    'use server'
    await deleteLead(id)
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <PageHeader
        title={lead.name}
        subtitle={lead.service_requested ?? 'No service specified'}
        backHref="/leads"
        backLabel="Leads"
        actions={
          <div className="flex gap-2">
            {isAdmin(profile.role as any) && (
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                }
                title="Delete Lead"
                description={`Are you sure you want to delete ${lead.name}? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={deleteAction}
              />
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/leads/${id}/edit`}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info card */}
          <div className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-3">
                  <a href={buildCallUrl(lead.phone)} className="text-blue-600 font-medium hover:underline">
                    {formatPhone(lead.phone)}
                  </a>
                  <a
                    href={buildSmsUrl(lead.phone)}
                    className="text-xs text-gray-500 hover:text-blue-600 border rounded px-2 py-0.5"
                  >
                    Text
                  </a>
                </div>
              </div>
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={buildEmailUrl(lead.email)} className="text-blue-600 hover:underline">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={buildGoogleMapsUrl(lead.address, lead.city, lead.state)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {lead.address}{lead.city ? `, ${lead.city}` : ''}, {lead.state} {lead.zip_code}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {lead.next_follow_up_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">
                    Follow-up: <strong>{formatRelativeDate(lead.next_follow_up_at)}</strong>
                    <span className="text-gray-400 ml-1">({formatDate(lead.next_follow_up_at)})</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lead details */}
          <div className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Lead Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Status</p>
                <StatusBadge status={lead.status} />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Priority</p>
                <StatusBadge status={lead.priority} />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Source</p>
                <p className="font-medium capitalize">
                  {lead.lead_source?.replace(/_/g, ' ') ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Service</p>
                <p className="font-medium">{lead.service_requested ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Est. Value</p>
                <p className="font-medium text-green-700">
                  {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Assigned To</p>
                <p className="font-medium">{(lead.assignee as any)?.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Created</p>
                <p className="font-medium">{formatDate(lead.created_at)}</p>
              </div>
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 text-xs mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Related Quotes */}
          {quotes && quotes.length > 0 && (
            <div className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Quotes ({quotes.length})
                </h2>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/quotes/new?lead_id=${id}`}>New Quote</Link>
                </Button>
              </div>
              <div className="space-y-2">
                {quotes.map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{q.quote_number}</p>
                      <p className="text-xs text-gray-500">{q.service_type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatCurrency(q.final_amount)}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-lg border p-5">
            <NotesSection
              notes={(notes ?? []) as any}
              entityType="lead"
              entityId={id}
              onAdd={addNoteAction}
            />
          </div>

          {/* Activity */}
          <div className="bg-white rounded-lg border p-5">
            <ActivityLogSection activities={(activities ?? []) as any} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick status update */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Update Status</h3>
            <LeadStatusUpdater leadId={id} currentStatus={lead.status} />
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Actions</h3>
            <LeadQuickActions
              lead={lead as any}
              existingCustomerId={existingCustomer?.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
