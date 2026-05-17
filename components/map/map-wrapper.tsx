'use client'

import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import type { MapPin } from './crm-map'

const CrmMap = dynamic(() => import('./crm-map'), { ssr: false })

export function MapWrapper({ pins }: { pins: MapPin[] }) {
  return <CrmMap pins={pins} />
}
