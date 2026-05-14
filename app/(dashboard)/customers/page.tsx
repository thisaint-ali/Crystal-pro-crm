import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Phone, MapPin, Building2, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate, formatPhone, formatCurrency, buildCallUrl } from '@/lib/utils'
import { CustomersFilters } from '@/components/customers/customers-filters'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  const params = await searchParams
  const search = params.search ?? ''
  const type = params.type ?? ''
  const city = params.city ?? ''

  let query = supabase.from('customers').select('*').order('name', { ascending: true })

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`
    )
  }
  if (type) query = query.eq('customer_type', type)
  if (city) query = query.ilike('city', `%${city}%`)

  const { data: customers } = await query.limit(200)

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {customers?.length ?? 0} customer{customers?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="w-4 h-4 mr-2" />
            New Customer
          </Link>
        </Button>
      </div>

      <CustomersFilters
        currentSearch={search}
        currentType={type}
        currentCity={city}
      />

      {!customers || customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer or convert a lead."
          action={
            <Button asChild>
              <Link href="/customers/new">Add Customer</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total Spent</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <a href={buildCallUrl(c.phone)} className="hover:underline text-gray-700">
                        {formatPhone(c.phone)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        {c.customer_type === 'commercial' ? (
                          <><Building2 className="w-3 h-3" /> Commercial</>
                        ) : (
                          <><Home className="w-3 h-3" /> Residential</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.last_service_date ? formatDate(c.last_service_date) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {customers.map((c: any) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <span className="text-xs text-gray-500 capitalize">{c.customer_type}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {formatPhone(c.phone)}
                  </span>
                  {c.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {c.city}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    Last service: {c.last_service_date ? formatDate(c.last_service_date) : 'Never'}
                  </span>
                  <span className="text-sm font-medium text-green-700">
                    {formatCurrency(c.total_spent)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
