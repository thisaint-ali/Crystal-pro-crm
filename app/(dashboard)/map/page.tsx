import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { MapPin } from '@/components/map/crm-map'
import { MapWrapper } from '@/components/map/map-wrapper'

const LEGEND = [
  { color: '#f97316', label: 'Lead – New/Contacted' },
  { color: '#8b5cf6', label: 'Lead – Quoted' },
  { color: '#f59e0b', label: 'Scheduled / Booked' },
  { color: '#3b82f6', label: 'In Progress' },
  { color: '#22c55e', label: 'Completed' },
  { color: '#9ca3af', label: 'Cancelled / Lost' },
]

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (!profile || profile.role === 'worker') redirect('/dashboard')

  const db = createServiceClient()
  const [{ data: jobs }, { data: leads }] = await Promise.all([
    db
      .from('jobs')
      .select('id, job_number, service_type, address, city, state, status, scheduled_date, latitude, longitude, customer:customers(name), lead:leads(name)')
      .not('latitude', 'is', null)
      .not('status', 'eq', 'cancelled')
      .order('scheduled_date', { ascending: false })
      .limit(500),
    db
      .from('leads')
      .select('id, name, service_requested, address, city, state, status, latitude, longitude')
      .not('latitude', 'is', null)
      .not('status', 'in', '("lost")')
      .limit(500),
  ])

  const pins: MapPin[] = []

  for (const job of jobs ?? []) {
    if (!job.latitude || !job.longitude) continue
    pins.push({
      id: job.id,
      type: 'job',
      lat: job.latitude,
      lng: job.longitude,
      label: (job.customer as any)?.name ?? (job.lead as any)?.name ?? job.job_number,
      sublabel: job.service_type,
      status: job.status,
      address: [job.address, job.city, job.state].filter(Boolean).join(', '),
      href: `/jobs/${job.id}`,
      date: job.scheduled_date ? formatDate(job.scheduled_date) : undefined,
    })
  }

  for (const lead of leads ?? []) {
    if (!lead.latitude || !lead.longitude) continue
    pins.push({
      id: lead.id,
      type: 'lead',
      lat: lead.latitude,
      lng: lead.longitude,
      label: lead.name,
      sublabel: lead.service_requested ?? 'Lead',
      status: lead.status,
      address: [lead.address, lead.city, lead.state].filter(Boolean).join(', '),
      href: `/leads/${lead.id}`,
    })
  }

  const jobCount = pins.filter(p => p.type === 'job').length
  const leadCount = pins.filter(p => p.type === 'lead').length

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-3 border-b bg-white flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {jobCount} job{jobCount !== 1 ? 's' : ''} · {leadCount} lead{leadCount !== 1 ? 's' : ''} · Northern Virginia
          </p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full border-2 border-white flex-shrink-0"
                style={{ background: color, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map — always rendered so you can pan/zoom freely */}
      <div className="flex-1 relative">
        <MapWrapper pins={pins} />
        {pins.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm border rounded-lg px-4 py-2 text-sm text-gray-500 shadow">
            No pinned locations yet — add addresses to jobs and leads to see them here
          </div>
        )}
      </div>
    </div>
  )
}
