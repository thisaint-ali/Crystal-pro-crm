export interface Coords {
  lat: number
  lng: number
}

// ArcGIS World Geocoder — highest accuracy for US addresses
async function arcgis(parts: {
  address: string
  city?: string | null
  state?: string | null
  zip_code?: string | null
}): Promise<Coords | null> {
  try {
    const params = new URLSearchParams({
      Address: parts.address,
      ...(parts.city ? { City: parts.city } : {}),
      ...(parts.state ? { Region: parts.state } : {}),
      ...(parts.zip_code ? { Postal: parts.zip_code } : {}),
      CountryCode: 'US',
      maxLocations: '1',
      f: 'json',
    })
    const res = await fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const c = data?.candidates?.[0]
    if (c?.location?.x && c?.location?.y && c?.score >= 80) {
      return { lat: c.location.y, lng: c.location.x }
    }
  } catch {}
  return null
}

// US Census Bureau — fallback exact match
async function censusBureau(parts: {
  address: string
  city?: string | null
  state?: string | null
  zip_code?: string | null
}): Promise<Coords | null> {
  try {
    const params = new URLSearchParams({
      street: parts.address,
      ...(parts.city ? { city: parts.city } : {}),
      ...(parts.state ? { state: parts.state } : {}),
      ...(parts.zip_code ? { zip: parts.zip_code } : {}),
      benchmark: 'Public_AR_Current',
      format: 'json',
    })
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/address?${params}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const match = data?.result?.addressMatches?.[0]?.coordinates
    if (match?.x && match?.y) return { lat: match.y, lng: match.x }
  } catch {}
  return null
}

// Nominatim fallback for when Census Bureau has no match
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
  if (!address) return null

  // ArcGIS first (highest accuracy), Census Bureau second
  const esri = await arcgis({ address, city, state, zip_code })
  if (esri) return esri

  const census = await censusBureau({ address, city, state, zip_code })
  if (census) return census

  // Nominatim fallback chain — coarsen query until something matches
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
