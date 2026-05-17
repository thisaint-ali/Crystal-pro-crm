'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// Northern Virginia center
const NOVA_CENTER: [number, number] = [38.85, -77.2]
const NOVA_ZOOM = 11

export interface MapPin {
  id: string
  type: 'job' | 'lead'
  lat: number
  lng: number
  label: string
  sublabel: string
  status: string
  address: string
  href: string
  date?: string
}

const STATUS_COLOR: Record<string, string> = {
  // Jobs
  scheduled:   '#f59e0b',
  on_the_way:  '#3b82f6',
  in_progress: '#3b82f6',
  completed:   '#22c55e',
  cancelled:   '#9ca3af',
  // Leads
  new:         '#f97316',
  contacted:   '#fb923c',
  quoted:      '#8b5cf6',
  booked:      '#f59e0b',
  lost:        '#9ca3af',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled:   'Scheduled',
  on_the_way:  'On the Way',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  new:         'New Lead',
  contacted:   'Contacted',
  quoted:      'Quoted',
  booked:      'Booked',
  lost:        'Lost',
}

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a> — Source: Esri, Maxar, GeoEye, Earthstar Geographics',
    maxZoom: 19,
  },
}

export default function CrmMap({ pins }: { pins: MapPin[] }) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const streetLayerRef = useRef<any>(null)
  const satelliteLayerRef = useRef<any>(null)
  const [isSatellite, setIsSatellite] = useState(false)

  function toggleView() {
    const map = mapRef.current
    if (!map) return
    if (isSatellite) {
      map.removeLayer(satelliteLayerRef.current)
      streetLayerRef.current.addTo(map)
    } else {
      map.removeLayer(streetLayerRef.current)
      satelliteLayerRef.current.addTo(map)
    }
    setIsSatellite((v) => !v)
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    if (mapRef.current) return // already initialised

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center: NOVA_CENTER,
        zoom: NOVA_ZOOM,
        zoomControl: true,
      })

      const streetLayer = L.tileLayer(TILE_LAYERS.street.url, {
        attribution: TILE_LAYERS.street.attribution,
        maxZoom: TILE_LAYERS.street.maxZoom,
      }).addTo(map)

      const satelliteLayer = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxZoom: TILE_LAYERS.satellite.maxZoom,
      })

      streetLayerRef.current = streetLayer
      satelliteLayerRef.current = satelliteLayer

      pins.forEach((pin) => {
        const color = STATUS_COLOR[pin.status] ?? '#6b7280'

        const icon = L.divIcon({
          html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:${color};
            border:2.5px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);
            cursor:pointer;
          "></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          popupAnchor: [0, -10],
        })

        const popup = L.popup({ maxWidth: 240 }).setContent(`
          <div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.5">
            <div style="font-weight:700;font-size:14px;margin-bottom:2px">${pin.label}</div>
            <div style="color:#6b7280;margin-bottom:4px">${pin.sublabel}</div>
            <div style="margin-bottom:4px">${pin.address}</div>
            ${pin.date ? `<div style="color:#9ca3af;font-size:11px;margin-bottom:6px">${pin.date}</div>` : ''}
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="
                display:inline-block;width:10px;height:10px;border-radius:50%;
                background:${color};flex-shrink:0;
              "></span>
              <span style="font-weight:600;color:${color}">${STATUS_LABEL[pin.status] ?? pin.status}</span>
            </div>
            <a href="${pin.href}" style="
              display:block;text-align:center;padding:5px 10px;
              background:#1e293b;color:white;border-radius:6px;
              text-decoration:none;font-size:12px;font-weight:600;
            ">View ${pin.type === 'job' ? 'Job' : 'Lead'} →</a>
          </div>
        `)

        L.marker([pin.lat, pin.lng], { icon }).addTo(map).bindPopup(popup)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
      <button
        onClick={toggleView}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 12,
          zIndex: 1000,
          background: 'white',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'system-ui,sans-serif',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: '#1e293b',
        }}
        title={isSatellite ? 'Switch to street view' : 'Switch to satellite view'}
      >
        {isSatellite ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Street
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Satellite
          </>
        )}
      </button>
    </div>
  )
}
