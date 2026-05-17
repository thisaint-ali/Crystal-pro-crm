'use server'

import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, distanceMiles } from '@/lib/utils/geocode'

export interface NearbyItem {
  id: string
  type: 'job' | 'lead'
  name: string
  address: string
  status: string
  distance_miles: number
  href: string
}

export async function checkProximity(
  address: string,
  city: string,
  state: string,
  zip_code: string,
  radiusMiles = 5
): Promise<{ nearby: NearbyItem[]; error?: string }> {
  const coords = await geocodeAddress({ address, city, state, zip_code })
  if (!coords) return { nearby: [] }

  const supabase = await createClient()

  const [{ data: jobs }, { data: leads }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, job_number, address, city, state, status, latitude, longitude, customer:customers(name), lead:leads(name)')
      .not('latitude', 'is', null)
      .not('status', 'eq', 'cancelled'),
    supabase
      .from('leads')
      .select('id, name, address, city, state, status, latitude, longitude')
      .not('latitude', 'is', null)
      .not('status', 'in', '("lost","booked")'),
  ])

  const nearby: NearbyItem[] = []

  for (const job of jobs ?? []) {
    if (!job.latitude || !job.longitude) continue
    const d = distanceMiles(coords, { lat: job.latitude, lng: job.longitude })
    if (d <= radiusMiles) {
      nearby.push({
        id: job.id,
        type: 'job',
        name: (job.customer as any)?.name ?? (job.lead as any)?.name ?? job.job_number,
        address: [job.address, job.city].filter(Boolean).join(', '),
        status: job.status,
        distance_miles: Math.round(d * 10) / 10,
        href: `/jobs/${job.id}`,
      })
    }
  }

  for (const lead of leads ?? []) {
    if (!lead.latitude || !lead.longitude) continue
    const d = distanceMiles(coords, { lat: lead.latitude, lng: lead.longitude })
    if (d <= radiusMiles) {
      nearby.push({
        id: lead.id,
        type: 'lead',
        name: lead.name,
        address: [lead.address, lead.city].filter(Boolean).join(', '),
        status: lead.status,
        distance_miles: Math.round(d * 10) / 10,
        href: `/leads/${lead.id}`,
      })
    }
  }

  nearby.sort((a, b) => a.distance_miles - b.distance_miles)
  return { nearby }
}
