import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { QuoteForm } from '@/components/quotes/quote-form'
import { createQuote } from '@/lib/actions/quotes'

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const db = createServiceClient()
  const params = await searchParams
  const defaultLeadId = params.lead_id ?? ''
  const defaultCustomerId = params.customer_id ?? ''

  const [{ data: leads }, { data: customers }] = await Promise.all([
    db.from('leads').select('id, name, phone, address, city').order('name'),
    db.from('customers').select('id, name, phone, address, city').order('name'),
  ])

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <PageHeader title="New Quote" backHref="/quotes" backLabel="Quotes" />
      <QuoteForm
        defaultLeadId={defaultLeadId}
        defaultCustomerId={defaultCustomerId}
        leads={(leads ?? []) as { id: string; name: string; phone?: string; address?: string; city?: string }[]}
        customers={(customers ?? []) as { id: string; name: string; phone?: string; address?: string; city?: string }[]}
        onSubmit={createQuote}
        submitLabel="Create Quote"
      />
    </div>
  )
}
