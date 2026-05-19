import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { QuoteForm } from '@/components/quotes/quote-form'
import { updateQuote } from '@/lib/actions/quotes'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, items:quote_items(*)')
    .eq('id', id)
    .single()

  if (!quote) notFound()

  const [{ data: leads }, { data: customers }] = await Promise.all([
    supabase.from('leads').select('id, name, phone, address, city').order('name'),
    supabase.from('customers').select('id, name, phone, address, city').order('name'),
  ])

  const updateAction = async (input: Parameters<typeof updateQuote>[1]) => {
    'use server'
    return updateQuote(id, input)
  }

  const items = ((quote.items as any[]) ?? []).map((item: any) => ({
    id: item.id,
    service_name: item.service_name,
    description: item.description ?? '',
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }))

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <PageHeader title="Edit Quote" backHref={`/quotes/${id}`} backLabel={quote.quote_number} />
      <QuoteForm
        leads={(leads ?? []) as { id: string; name: string; phone?: string; address?: string; city?: string }[]}
        customers={(customers ?? []) as { id: string; name: string; phone?: string; address?: string; city?: string }[]}
        onSubmit={updateAction as any}
        initialData={{
          lead_id: quote.lead_id ?? '',
          customer_id: quote.customer_id ?? '',
          service_type: quote.service_type,
          description: quote.description ?? '',
          quote_amount: quote.quote_amount,
          discount_amount: quote.discount_amount ?? 0,
          final_amount: quote.final_amount,
          valid_until: quote.valid_until ?? '',
          follow_up_date: quote.follow_up_date ?? '',
          items,
        }}
        submitLabel="Save Changes"
        redirectTo={`/quotes/${id}`}
      />
    </div>
  )
}
