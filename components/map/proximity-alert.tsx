'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { MapPin, AlertTriangle, X } from 'lucide-react'
import { checkProximity, type NearbyItem } from '@/lib/actions/map'

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#f59e0b',
  in_progress: '#3b82f6',
  on_the_way: '#3b82f6',
  completed: '#22c55e',
  new: '#f97316',
  contacted: '#fb923c',
  quoted: '#8b5cf6',
  booked: '#f59e0b',
}

interface ProximityAlertProps {
  address: string
  city: string
  state: string
  zip_code: string
}

export function ProximityAlert({ address, city, state, zip_code }: ProximityAlertProps) {
  const [nearby, setNearby] = useState<NearbyItem[]>([])
  const [checked, setChecked] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fullAddress = [address, city, state, zip_code].filter(Boolean).join(', ')

  useEffect(() => {
    if (!address || !city) return
    setChecked(false)
    setDismissed(false)

    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await checkProximity(address, city, state, zip_code)
        setNearby(result.nearby)
        setChecked(true)
      })
    }, 1200)

    return () => clearTimeout(timer)
  }, [address, city, state, zip_code])

  if (!checked || dismissed || nearby.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {nearby.length} nearby {nearby.length === 1 ? 'item' : 'items'} within 5 miles
            </p>
            <p className="text-xs text-amber-600 mt-0.5 mb-3">Consider bundling these on the same trip</p>
            <div className="space-y-2">
              {nearby.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  className="flex items-center gap-2 text-xs text-amber-900 hover:text-amber-700"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLOR[item.status] ?? '#9ca3af' }}
                  />
                  <span className="font-medium">{item.name}</span>
                  <span className="text-amber-500">·</span>
                  <span className="text-amber-600">{item.distance_miles} mi away</span>
                  <span className="text-amber-500">·</span>
                  <span className="text-amber-600 capitalize">{item.status}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
