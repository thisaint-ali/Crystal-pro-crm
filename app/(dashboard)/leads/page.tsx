import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Phone, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LeadsFilters } from '@/components/leads/leads-filters'
import { formatDate, formatPhone, formatCurrency, buildCallUrl } from '@/lib/utils'
import { isAdmin, isManager } from '@/lib/auth/permissions'
import type { Lead, Profile } from '@/types/crm'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const source = params.source ?? ''
  const assigned = params.assigned ?? ''
  const sort = params.sort ?? 'created_at'

  // Build query
  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id, full_name)')
    .order(sort === 'follow_up' ? 'next_follow_up_at' : sort === 'priority' ? 'priority' : 'created_at', {
      ascending: false,
    })

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%,service_requested.ilike.%${search}%`
    )
  }
  if (status) query = query.eq('status', status)
  if (source) query = query.eq('lead_source', source)
  if (assigned) query = query.eq('assigned_to', assigned)

  const { data: leads } = await query.limit(100)

  // Fetch team members for assign filter
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('active', true)
    .order('full_name')

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            {leads?.length ?? 0} lead{leads?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {(isAdmin(profile.role as any) || isManager(profile.role as any)) && (
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <LeadsFilters
        teamMembers={(teamMembers ?? []) as Pick<Profile, 'id' | 'full_name' | 'role'>[]}
        currentSearch={search}
        currentStatus={status}
        currentSource={source}
        currentAssigned={assigned}
        currentSort={sort}
      />

      {/* Table (desktop) / Cards (mobile) */}
      {!leads || leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Add your first lead to get started."
          action={
            <Button asChild>
              <Link href="/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Est. Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <a href={buildCallUrl(lead.phone)} className="hover:underline text-gray-700">
                          {formatPhone(lead.phone)}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.service_requested ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.city ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {lead.assignee?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {leads.map((lead: any) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {lead.service_requested ?? 'Service not specified'}
                    </p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {formatPhone(lead.phone)}
                  </span>
                  {lead.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lead.city}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{formatDate(lead.created_at)}</span>
                  {lead.estimated_value && (
                    <span className="font-medium text-gray-600">
                      {formatCurrency(lead.estimated_value)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
