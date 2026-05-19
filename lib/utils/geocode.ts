export interface Coords {
  lat: number
  lng: number
}

async function nominatim(query: string): Promise<Coords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`,
      {
        headers: { 'User-Agent': 'CrystalProCRM/1.0 (crystal-pro-crm.vercel.app)' },
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.[0]?.lat) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export async function geocodeAddress(parts: {
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}): Promise<Coords | null> {
  const { address, city, state, zip_code } = parts

  // Try most-specific first, fall back to progressively coarser queries
  const attempts = [
    [address, city, state, zip_code].filter(Boolean).join(', '),
    [address, city, state].filter(Boolean).join(', '),
    [zip_code, state].filter(Boolean).join(', '),
    [city, state].filter(Boolean).join(', '),
  ].filter(q => q.trim().length >= 3)

  for (const query of attempts) {
    const coords = await nominatim(query)
    if (coords) return coords
  }
  return null
}

// Haversine formula — returns distance in miles
export function distanceMiles(a: Coords, b: Coords): number {
  const R = 3958.8
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng
  return R * 2 * Math.asin(Math.sqrt(h))
}
