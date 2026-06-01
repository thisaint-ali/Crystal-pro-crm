import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, ExternalLink } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { NotesSection } from '@/components/shared/notes-section'
import { ActivityLogSection } from '@/components/shared/activity-log-section'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { QuoteActions } from '@/components/quotes/quote-actions'
import { formatDate, formatCurrency } from '@/lib/utils'
import { isAdmin } from '@/lib/auth/permissions'
import { addNote } from '@/lib/actions/activity'
import { deleteQuote } from '@/lib/actions/quotes'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const db = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  const { data: quote } = await db
    .from('quotes')
    .select(`
      *,
      customer:customers(id, name, phone, email, address, city, state),
      lead:leads(id, name, phone, email, address, city, state),
      items:quote_items(*)
    `)
    .eq('id', id)
    .single()

  if (!quote) notFound()

  const [{ data: notes }, { data: activities }] = await Promise.all([
    db
      .from('notes')
      .select('*, author:profiles!notes_created_by_fkey(id, full_name)')
      .eq('entity_type', 'quote')
      .eq('entity_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('activity_log')
      .select('*, user:profiles!activity_log_user_id_fkey(id, full_name)')
      .eq('entity_type', 'quote')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const contact = (quote.customer as any) ?? (quote.lead as any)
  const contactType = quote.customer_id ? 'customer' : 'lead'

  const addNoteAction = async (note: string) => { 'use server'; return addNote('quote', id, note) }
  const deleteAction = async () => { 'use server'; await deleteQuote(id) }

  const items = (quote.items as any[]) ?? []

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <PageHeader
        title={quote.quote_number}
        subtitle={quote.service_type}
        backHref="/quotes"
        backLabel="Quotes"
        actions={
          <div className="flex gap-2">
            {isAdmin(profile.role as any) && (
              <ConfirmDialog
                trigger={<Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>}
                title="Delete Quote"
                description={`Delete ${quote.quote_number}? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={deleteAction}
              />
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/quotes/${id}/edit`}><Edit className="w-4 h-4 mr-1" />Edit</Link>
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Summary */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">{quote.quote_number}</h2>
                <p className="text-sm text-gray-500">{quote.service_type}</p>
              </div>
              <StatusBadge status={quote.status} />
            </div>

            {quote.description && (
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                {quote.description}
              </div>
            )}

            {/* Line Items */}
            {items.length > 0 && (
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="pb-2 font-medium">Service</th>
                      <th className="pb-2 font-medium text-right">Qty</th>
                      <th className="pb-2 font-medium text-right">Unit</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items
                      .sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-2">
                            <p className="font-medium">{item.service_name}</p>
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </td>
                          <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="border-t pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(quote.quote_amount)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(quote.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(quote.final_amount)}</span>
              </div>
            </div>

            {/* Dates */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium">{formatDate(quote.created_at)}</p>
              </div>
              {quote.valid_until && (
                <div>
                  <p className="text-xs text-gray-500">Valid Until</p>
                  <p className={`font-medium ${new Date(quote.valid_until) < new Date() && quote.status === 'sent' ? 'text-red-600' : ''}`}>
                    {formatDate(quote.valid_until)}
                  </p>
                </div>
              )}
              {quote.date_sent && (
                <div>
                  <p className="text-xs text-gray-500">Sent</p>
                  <p className="font-medium">{formatDate(quote.date_sent)}</p>
                </div>
              )}
              {quote.accepted_at && (
                <div>
                  <p className="text-xs text-gray-500">Accepted</p>
                  <p className="font-medium text-green-600">{formatDate(quote.accepted_at)}</p>
                </div>
              )}
              {quote.declined_at && (
                <div>
                  <p className="text-xs text-gray-500">Declined</p>
                  <p className="font-medium text-red-600">{formatDate(quote.declined_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border p-5">
            <NotesSection notes={(notes ?? []) as any} entityType="quote" entityId={id} onAdd={addNoteAction} />
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
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Actions</h3>
            <QuoteActions quoteId={id} status={quote.status} />
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
                <a href={`tel:${contact.phone}`} className="block text-sm text-gray-600 hover:text-blue-600">{contact.phone}</a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="block text-sm text-gray-600 hover:text-blue-600 truncate">{contact.email}</a>
              )}
              {contact.address && (
                <p className="text-xs text-gray-500 mt-2">{contact.address}{contact.city ? `, ${contact.city}` : ''}, {contact.state}</p>
              )}
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Links</h3>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href={`/quotes/${id}/edit`}>Edit Quote</Link>
            </Button>
            {contact && (
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/${contactType === 'customer' ? 'customers' : 'leads'}/${contact.id}`}>
                  View {contactType === 'customer' ? 'Customer' : 'Lead'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
