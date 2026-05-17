export interface Coords {
  lat: number
  lng: number
}

export async function geocodeAddress(parts: {
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}): Promise<Coords | null> {
  const query = [parts.address, parts.city, parts.state, parts.zip_code]
    .filter(Boolean)
    .join(', ')
  if (!query || query.trim().length < 5) return null

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`,
      {
        headers: { 'User-Agent': 'CrystalProCRM/1.0 (crystal-pro-crm.vercel.app)' },
        next: { revalidate: 86400 }, // cache for 24h
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.[0]?.lat) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {}
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
