import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { QuotesFilters } from '@/components/quotes/quotes-filters'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  const db = createServiceClient()
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''

  let query = db
    .from('quotes')
    .select(`
      *,
      customer:customers(id, name),
      lead:leads(id, name)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`service_type.ilike.%${search}%,quote_number.ilike.%${search}%`)

  const { data: quotes } = await query.limit(100)

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-500 text-sm mt-1">{quotes?.length ?? 0} quotes</p>
        </div>
        <Button asChild>
          <Link href="/quotes/new"><Plus className="w-4 h-4 mr-2" />New Quote</Link>
        </Button>
      </div>

      <QuotesFilters currentSearch={search} currentStatus={status} />

      {!quotes || quotes.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          description="Create your first quote for a lead or customer."
          action={<Button asChild><Link href="/quotes/new">Create Quote</Link></Button>}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Quote #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer / Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/quotes/${q.id}`} className="font-medium text-blue-600 hover:underline">{q.quote_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{q.customer?.name ?? q.lead?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{q.service_type}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(q.final_amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(q.created_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{q.valid_until ? formatDate(q.valid_until) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {quotes.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="block bg-white rounded-lg border p-4 hover:shadow-md">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-blue-600">{q.quote_number}</p>
                    <p className="text-sm text-gray-600">{q.customer?.name ?? q.lead?.name ?? '—'}</p>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{q.service_type}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(q.final_amount)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDate(q.created_at)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
