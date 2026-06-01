import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// CORS headers so Landingsite's iframe form can POST from any origin
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Secret',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    // --- Auth ---
    // Requests from our own domain (embed form) skip secret check.
    // External requests (Landingsite webhook) must supply the secret.
    const origin = req.headers.get('origin') ?? ''
    const host = req.headers.get('host') ?? ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    const isSameOrigin =
      !origin ||
      origin.includes('localhost') ||
      (appUrl && origin === appUrl) ||
      (appUrl && origin.replace(/^https?:\/\//, '') === appUrl.replace(/^https?:\/\//, '')) ||
      origin.includes(host) ||
      // Allow all Vercel preview deployments of this project
      (origin.includes('vercel.app') && host.includes('vercel.app'))

    if (!isSameOrigin) {
      const secret = process.env.LEAD_WEBHOOK_SECRET
      const headerSecret = req.headers.get('x-webhook-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
      const urlSecret = req.nextUrl.searchParams.get('secret')
      const providedSecret = headerSecret ?? urlSecret

      if (secret && providedSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
      }
    }

    // --- Parse body: JSON or form-encoded ---
    let raw: Record<string, string> = {}
    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      raw = await req.json()
    } else {
      const text = await req.text()
      for (const pair of text.split('&')) {
        const [k, v] = pair.split('=')
        if (k) raw[decodeURIComponent(k)] = decodeURIComponent(v ?? '').replace(/\+/g, ' ')
      }
    }

    // --- Field mapping: accept common naming variations ---
    const name = raw.name ?? raw.full_name ?? [raw.first_name, raw.last_name].filter(Boolean).join(' ') ?? ''
    const phone = raw.phone ?? raw.telephone ?? raw.mobile ?? raw.phone_number ?? ''
    const email = raw.email ?? raw.email_address ?? ''
    const address = raw.address ?? raw.street ?? ''
    const city = raw.city ?? ''
    const state = raw.state ?? 'VA'
    const zip_code = raw.zip ?? raw.zip_code ?? raw.postal_code ?? ''
    const service_requested = raw.service ?? raw.service_requested ?? raw.service_type ?? raw.message ?? ''
    const notes = raw.notes ?? raw.comments ?? raw.message ?? ''
    const lead_source = normalizeSource(raw.source ?? raw.lead_source ?? 'website')

    if (!name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400, headers: CORS })
    }
    if (!phone.trim() && !email.trim()) {
      return NextResponse.json({ error: 'phone or email is required' }, { status: 400, headers: CORS })
    }

    const db = createServiceClient()

    // Insert lead
    const { data: lead, error } = await db
      .from('leads')
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || 'VA',
        zip_code: zip_code.trim() || null,
        service_requested: service_requested.trim() || null,
        notes: notes.trim() || null,
        lead_source,
        status: 'new',
        priority: 'normal',
      })
      .select('id, name')
      .single()

    if (error) {
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500, headers: CORS })
    }

    // Log activity
    await db.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: lead.id,
      action: 'created',
      description: `Lead created via website form`,
      metadata: { source: 'website_webhook', lead_source },
    })

    return NextResponse.json(
      { success: true, id: lead.id, message: `Lead "${lead.name}" added to CRM` },
      { status: 201, headers: CORS }
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}

function normalizeSource(raw: string): string {
  const valid = [
    'website', 'google_business_profile', 'google_ads', 'facebook', 'instagram',
    'referral', 'yard_sign', 'door_hanger', 'repeat_customer', 'phone_call', 'other',
  ]
  const lower = (raw ?? '').toLowerCase().replace(/[\s-]/g, '_')
  if (valid.includes(lower)) return lower
  if (lower.includes('google')) return 'google_ads'
  if (lower.includes('facebook') || lower.includes('fb')) return 'facebook'
  if (lower.includes('instagram') || lower.includes('ig')) return 'instagram'
  return 'website'
}
